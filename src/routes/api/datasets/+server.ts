import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  original_filename: z.string().max(500).optional(),
  storage_path: z.string().min(1, 'Storage path is required').max(1000),
  row_count: z.number().int().min(0).default(0),
  column_count: z.number().int().min(0).default(0),
  columns: z.array(z.object({
    index: z.number().int().min(0),
    name: z.string().min(1).max(255),
    sample: z.array(z.string()).optional()
  })).default([]),
  preview_rows: z.array(z.record(z.unknown())).default([])
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
    .from('datasets')
    .select('id, name, row_count, column_count, original_filename, created_at', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return json({ success: false, error: 'Failed to load datasets.' }, { status: 500 });
  }

  return json({
    success: true,
    data: {
      datasets: data ?? [],
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

  const { data: dataset, error } = await locals.supabase
    .from('datasets')
    .insert({
      user_id: session.user.id,
      name: d.name,
      original_filename: d.original_filename ?? d.name,
      row_count: d.row_count,
      column_count: d.column_count,
      status: 'ready'
    })
    .select('id, name, row_count, column_count, created_at')
    .single();

  if (error) {
    return json({ success: false, error: 'Failed to create dataset.' }, { status: 500 });
  }

  return json({ success: true, data: { dataset } }, { status: 201 });
};
