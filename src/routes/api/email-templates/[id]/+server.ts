/**
 * GET    /api/email-templates/[id] — get a single template
 * PATCH  /api/email-templates/[id] — update template
 * DELETE /api/email-templates/[id] — delete template
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(998).optional(),
  body_html: z.string().min(1).optional(),
  body_text: z.string().optional()
});

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await locals.supabase
    .from('email_templates')
    .select('id, name, subject, body_html, body_text, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  return json({ success: true, data });
};

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

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  // Verify ownership
  const { data: existing } = await locals.supabase
    .from('email_templates')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!existing) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  const { data: updated, error } = await locals.supabase
    .from('email_templates')
    .update({ ...parsed.data })
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .select('id, name, subject, body_html, body_text, updated_at')
    .single();

  if (error || !updated) {
    return json({ success: false, error: 'Failed to update template.' }, { status: 500 });
  }

  return json({ success: true, data: updated });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await locals.supabase
    .from('email_templates')
    .delete()
    .eq('id', params.id)
    .eq('user_id', session.user.id);

  if (error) {
    return json({ success: false, error: 'Failed to delete template.' }, { status: 500 });
  }

  return json({ success: true });
};
