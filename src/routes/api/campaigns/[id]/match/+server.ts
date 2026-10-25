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

  if ((campaign.mode as string) !== 'A') {
    return json({ success: false, error: 'File matching is only available for Mode A campaigns.' }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();

  // Load all campaign recipients
  const { data: recipients, error: recErr } = await locals.supabase
    .from('campaign_recipients')
    .select('id, variables')
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

  // Build map: (filename without extension, trimmed, lowercase) → asset id
  const assetMap = new Map<string, string>();
  for (const asset of assets ?? []) {
    const nameWithoutExt = (asset.name as string).replace(/\.[^.]+$/, '').trim().toLowerCase();
    assetMap.set(nameWithoutExt, asset.id as string);
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
    const variables = (recipient.variables ?? {}) as Record<string, unknown>;
    const recipientKey = String(variables[match_column] ?? '').trim().toLowerCase();

    if (recipientKey && assetMap.has(recipientKey)) {
      const assetId = assetMap.get(recipientKey)!;
      matches.push({
        campaign_id:           id,
        campaign_recipient_id: recipient.id as string,
        document_asset_id:     assetId,
        match_method:          'filename_column',
        confidence:            1.0
      });
      matchedAssetKeys.add(recipientKey);
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

  // Compute unmatched asset names (assets that had no matching recipient)
  const unmatchedFiles: string[] = [];
  for (const [key] of assetMap) {
    if (!matchedAssetKeys.has(key)) {
      unmatchedFiles.push(key);
    }
  }

  return json({
    success: true,
    data: {
      total_assets:    assetMap.size,
      matched:         matches.length,
      unmatched:       unmatchedFiles.length,
      unmatched_files: unmatchedFiles
    }
  });
};
