import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subject_template: z.string().min(1, 'Subject is required').max(998),
  body_template: z.string().min(1, 'Body is required').max(1_000_000),
  is_html: z.boolean().default(false)
});

export const GET: RequestHandler = async ({ locals, url }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size') ?? 20)));
  const offset = (page - 1) * pageSize;

  const { data, count, error } = await locals.supabase
    .from('email_templates')
    .select('id, name, subject_template, is_html, created_at', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return json({ success: false, error: 'Failed to load templates.' }, { status: 500 });
  }

  return json({
    success: true,
    data: {
      templates: data ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize)
    }
  });
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

  const { data: template, error } = await locals.supabase
    .from('email_templates')
    .insert({
      user_id: session.user.id,
      name: d.name,
      subject_template: d.subject_template,
      body_template: d.body_template,
      is_html: d.is_html
    })
    .select('id, name, subject_template, is_html, created_at')
    .single();

  if (error) {
    return json({ success: false, error: 'Failed to create template.' }, { status: 500 });
  }

  return json({ success: true, data: { template } }, { status: 201 });
};
