/**
 * POST /api/campaigns/[id]/match — match uploaded document_assets to campaign_recipients
 * by comparing (filename-without-extension, trimmed, lowercase) against a chosen
 * recipient variable column.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

const MatchBodySchema = z.object({
  match_column: z.string().min(1)
});

export const POST: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = MatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        success: false,
        error: 'Validation failed.',
        details: parsed.error.flatten().fieldErrors
      },
      { status: 422 }
    );
  }

  const { match_column } = parsed.data;

  // Verify campaign ownership, mode, and status
  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select('id, mode, status')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    return json({ success: false, error: 'Campaign not found.' }, { status: 404 });
  }

  if ((campaign.mode as string) !== 'A' && (campaign.mode as string) !== 'existing') {
    return json({ success: false, error: 'File matching is only available for Mode A campaigns.' }, { status: 422 });
  }

  if ((campaign.status as string) !== 'draft') {
    return json({ success: false, error: 'Cannot rematch a campaign that is no longer a draft.' }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();

  // Load all campaign recipients
  const { data: recipients, error: recErr } = await locals.supabase
    .from('campaign_recipients')
    .select('id, row_data')
    .eq('campaign_id', id);

  if (recErr) {
    return json({ success: false, error: 'Failed to load campaign recipients.' }, { status: 500 });
  }

  // Load all document_assets for this campaign via metadata filter (admin client bypasses RLS)
  const { data: assets, error: assetErr } = await admin
    .from('document_assets')
    .select('id, name')
    .filter('metadata->>campaign_id', 'eq', id);

  if (assetErr) {
    return json({ success: false, error: 'Failed to load document assets.' }, { status: 500 });
  }

  // Build map: normalized key → { asset id, original filename }
  const assetMap = new Map<string, { id: string; originalName: string }>();
  for (const asset of assets ?? []) {
    const nameWithoutExt = (asset.name as string).replace(/\.[^.]+$/, '').trim().toLowerCase();
    assetMap.set(nameWithoutExt, { id: asset.id as string, originalName: asset.name as string });
  }

  // Build upsert rows
  const matches: {
    campaign_id: string;
    campaign_recipient_id: string;
    document_asset_id: string;
    match_method: string;
    confidence: number;
  }[] = [];

  const matchedAssetKeys = new Set<string>();

  for (const recipient of recipients ?? []) {
    const variables = (recipient.row_data ?? {}) as Record<string, unknown>;
    const rawValue = String(variables[match_column] ?? '').trim();
    const recipientKey = rawValue.toLowerCase();

    // Try direct match first, then numeric normalisation (handles leading-zero
    // mismatches, e.g. spreadsheet "1" matching filename "01", or vice versa)
    let matchKey: string | undefined;
    if (assetMap.has(recipientKey)) {
      matchKey = recipientKey;
    } else {
      // If the recipient value looks like a number, try zero-padded variants
      const num = Number(rawValue);
      if (!isNaN(num) && isFinite(num)) {
        // Try widths 1–4 (e.g. "1" → "01", "001", "0001")
        for (let pad = 1; pad <= 4; pad++) {
          const padded = String(num).padStart(pad + 1, '0').toLowerCase();
          if (assetMap.has(padded)) { matchKey = padded; break; }
        }
        // Also try the plain number as string (filename "1" against value "01")
        if (!matchKey && assetMap.has(String(num))) {
          matchKey = String(num);
        }
      }
      // If the filename key looks numeric, try stripping its leading zeros
      if (!matchKey) {
        for (const [key] of assetMap) {
          const keyNum = Number(key);
          if (!isNaN(keyNum) && isFinite(keyNum) && keyNum === num) {
            matchKey = key; break;
          }
        }
      }
    }

    if (matchKey && assetMap.has(matchKey)) {
      const entry = assetMap.get(matchKey)!;
      matches.push({
        campaign_id:           id,
        campaign_recipient_id: recipient.id as string,
        document_asset_id:     entry.id,
        match_method:          'filename_column',
        confidence:            1.0
      });
      matchedAssetKeys.add(matchKey);
    }
  }

  // Upsert matches into file_matches
  if (matches.length > 0) {
    const { error: upsertErr } = await admin
      .from('file_matches')
      .upsert(matches, { onConflict: 'campaign_id,campaign_recipient_id' });

    if (upsertErr) {
      return json({ success: false, error: `Failed to save file matches: ${upsertErr.message}` }, { status: 500 });
    }
  }

  // Compute unmatched asset names (original filenames of assets with no matching recipient)
  const unmatchedFiles: string[] = [];
  for (const [key, entry] of assetMap) {
    if (!matchedAssetKeys.has(key)) {
      unmatchedFiles.push(entry.originalName);
    }
  }

  return json({
    success: true,
    data: {
      total_assets:    assetMap.size,
      matched:         matches.length,
      unmatched:       unmatchedFiles.length,
      unmatched_files: unmatchedFiles,
      debug: {
        match_column,
        sample_asset_keys: [...assetMap.keys()].slice(0, 3),
        sample_recipient_value: recipients && recipients.length > 0
          ? String((recipients[0].row_data as Record<string, unknown>)[match_column] ?? '(key not found)')
          : '(no recipients)',
        sample_row_data_keys: recipients && recipients.length > 0
          ? Object.keys(recipients[0].row_data as Record<string, unknown>).slice(0, 5)
          : []
      }
    }
  });
};
