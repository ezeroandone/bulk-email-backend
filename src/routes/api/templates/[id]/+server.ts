import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: template, error } = await locals.supabase
    .from('document_templates')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !template) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  return json({ success: true, data: { template } });
};

// ── PATCH ─────────────────────────────────────────────────────────────────────

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional()
});

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

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

  const { data: updated, error } = await locals.supabase
    .from('document_templates')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .select('*')
    .single();

  if (error || !updated) {
    return json({ success: false, error: 'Template not found or update failed.' }, { status: 404 });
  }

  return json({ success: true, data: { template: updated } });
};

// ── DELETE ────────────────────────────────────────────────────────────────────

export const DELETE: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch template first to get storage path for cleanup
  const { data: template } = await locals.supabase
    .from('document_templates')
    .select('storage_path')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!template) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  // Delete from storage
  if (template.storage_path) {
    await locals.supabase.storage
      .from('documents')
      .remove([template.storage_path]);
  }

  // Delete DB record
  const { error } = await locals.supabase
    .from('document_templates')
    .delete()
    .eq('id', params.id)
    .eq('user_id', session.user.id);

  if (error) {
    return json({ success: false, error: 'Failed to delete template.' }, { status: 500 });
  }

  return json({ success: true });
};
