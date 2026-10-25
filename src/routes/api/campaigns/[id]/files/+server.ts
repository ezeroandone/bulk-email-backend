/**
 * POST /api/campaigns/[id]/files — upload individual files or ZIPs to the documents bucket,
 * register each as a document_asset, and associate with the campaign via metadata.
 */
import { json } from '@sveltejs/kit';
import JSZip from 'jszip';
import { requireSession } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

// Map common extensions to MIME types for extracted/unnamed files
const EXT_MIME: Record<string, string> = {
  pdf:  'application/pdf',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

// Extensions/MIME types blocked by the documents bucket policy
const BLOCKED_EXTS = new Set(['gif', 'tif', 'tiff']);
const BLOCKED_MIMES = new Set(['image/gif', 'image/tiff']);

function extOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function mimeForFilename(filename: string, fallback: string): string {
  const ext = extOf(filename);
  return EXT_MIME[ext] ?? fallback;
}

/** Process a single extracted buffer+name pair: validate, upload, insert asset row */
async function processFile(
  buffer: Uint8Array,
  filename: string,
  detectedMime: string,
  userId: string,
  campaignId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
): Promise<
  | { ok: true; asset: { id: string; name: string; storage_path: string } }
  | { ok: false; error: string }
> {
  const ext = extOf(filename);
  const mimeType = mimeForFilename(filename, detectedMime);

  // Reject blocked types
  if (BLOCKED_EXTS.has(ext) || BLOCKED_MIMES.has(mimeType)) {
    return {
      ok: false,
      error: `"${filename}" was rejected — GIF and TIFF files are not supported. Upload PDF, PNG, JPEG, WEBP, or DOCX instead.`
    };
  }

  const uploadPath = `${userId}/${campaignId}/${filename}`;

  const { error: storageErr } = await admin.storage
    .from('documents')
    .upload(uploadPath, buffer, { contentType: mimeType, upsert: true });

  if (storageErr) {
    return { ok: false, error: `"${filename}": storage upload failed — ${storageErr.message}` };
  }

  // Check for existing asset at this path (retry-safe)
  const { data: existing } = await admin
    .from('document_assets')
    .select('id, name, storage_path')
    .eq('storage_path', uploadPath)
    .maybeSingle();

  if (existing) {
    // Already uploaded — return the existing asset (idempotent retry)
    return { ok: true, asset: existing as { id: string; name: string; storage_path: string } };
  }

  const { data: asset, error: dbErr } = await admin
    .from('document_assets')
    .insert({
      user_id:      userId,
      workspace_id: null,
      name:         filename,
      storage_path: uploadPath,
      file_size:    buffer.byteLength,
      mime_type:    mimeType,
      metadata:     { campaign_id: campaignId }
    })
    .select('id, name, storage_path')
    .single();

  if (dbErr || !asset) {
    return { ok: false, error: `"${filename}": failed to register asset — ${dbErr?.message ?? 'unknown error'}` };
  }

  return { ok: true, asset: asset as { id: string; name: string; storage_path: string } };
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

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
    return json({ success: false, error: 'File upload is only available for Mode A campaigns.' }, { status: 422 });
  }

  if ((campaign.status as string) !== 'draft') {
    return json({ success: false, error: 'Files can only be uploaded to draft campaigns.' }, { status: 422 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: 'Could not parse multipart form data.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const successfulAssets: { id: string; name: string; storage_path: string }[] = [];
  const errorList: string[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const fileBuffer = await value.arrayBuffer();
    const isZip =
      value.type === 'application/zip' ||
      value.type === 'application/x-zip-compressed' ||
      extOf(value.name) === 'zip';

    if (isZip) {
      // Expand ZIP and process each entry individually
      let zip: JSZip;
      try {
        zip = await JSZip.loadAsync(fileBuffer);
      } catch {
        errorList.push(`"${value.name}": could not read ZIP archive.`);
        continue;
      }

      for (const [zipPath, zipFile] of Object.entries(zip.files)) {
        if (zipFile.dir) continue;

        // Use only the basename, not the full ZIP path
        const basename = zipPath.split('/').pop() ?? zipPath;

        let entryBuffer: Uint8Array;
        try {
          entryBuffer = await zipFile.async('uint8array');
        } catch {
          errorList.push(`"${basename}" (from "${value.name}"): could not extract file from ZIP.`);
          continue;
        }

        const result = await processFile(
          entryBuffer,
          basename,
          'application/octet-stream',
          session.user.id,
          id,
          admin
        );

        if (result.ok) {
          successfulAssets.push(result.asset);
        } else {
          errorList.push(result.error);
        }
      }
    } else {
      // Plain file
      const result = await processFile(
        new Uint8Array(fileBuffer),
        value.name,
        value.type || 'application/octet-stream',
        session.user.id,
        id,
        admin
      );

      if (result.ok) {
        successfulAssets.push(result.asset);
      } else {
        errorList.push(result.error);
      }
    }
  }

  if (successfulAssets.length === 0 && errorList.length > 0) {
    return json(
      { success: false, error: 'All files failed to upload.', data: { assets: [], errors: errorList } },
      { status: 422 }
    );
  }

  return json({
    success: true,
    data: { assets: successfulAssets, errors: errorList }
  });
};
