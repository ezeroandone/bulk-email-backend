/**
 * GET  /api/email-templates — list templates for the authenticated user
 * POST /api/email-templates — create a new email template
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(998),
  body_html: z.string().min(1),
  body_text: z.string().optional()
});

export const GET: RequestHandler = async ({ locals }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await locals.supabase
    .from('email_templates')
    .select('id, name, subject, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return json({ success: false, error: 'Failed to load templates.' }, { status: 500 });
  }

  return json({ success: true, data: data ?? [] });
};

export const POST: RequestHandler = async ({ locals, request }) => {
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

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  const d = parsed.data;

  const { data: tmpl, error } = await locals.supabase
    .from('email_templates')
    .insert({
      user_id: session.user.id,
      name: d.name,
      subject: d.subject,
      body_html: d.body_html,
      body_text: d.body_text ?? null
    })
    .select('id, name, subject, created_at')
    .single();

  if (error || !tmpl) {
    return json({ success: false, error: 'Failed to create template.' }, { status: 500 });
  }

  return json({ success: true, data: tmpl }, { status: 201 });
};
