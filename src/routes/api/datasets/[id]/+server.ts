import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const PatchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long')
});

// ── GET /api/datasets/[id] ────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const { data, error } = await locals.supabase
    .from('datasets')
    .select('id, name, original_filename, mime_type, row_count, column_count, columns, preview_rows, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) {
    return json({ success: false, error: 'Dataset not found.' }, { status: 404 });
  }

  return json({ success: true, data: { dataset: data } });
};

// ── DELETE /api/datasets/[id] ─────────────────────────────────────────────────

export const DELETE: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Fetch dataset first to get storage path for cleanup
  const { data: existing, error: fetchErr } = await locals.supabase
    .from('datasets')
    .select('id, storage_path, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchErr || !existing) {
    return json({ success: false, error: 'Dataset not found.' }, { status: 404 });
  }

  // Remove stored file if present
  if (existing.storage_path) {
    await locals.supabase.storage
      .from('datasets')
      .remove([existing.storage_path]);
  }

  const { error } = await locals.supabase
    .from('datasets')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return json({ success: false, error: 'Failed to delete dataset.' }, { status: 500 });
  }

  return json({ success: true });
};

// ── PATCH /api/datasets/[id] ──────────────────────────────────────────────────

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  const { data, error } = await locals.supabase
    .from('datasets')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select('id, name, updated_at')
    .single();

  if (error || !data) {
    return json({ success: false, error: 'Failed to update dataset.' }, { status: 500 });
  }

  return json({ success: true, data: { dataset: data } });
};
