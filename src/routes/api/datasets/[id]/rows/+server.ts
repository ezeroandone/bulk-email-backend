import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const BulkInsertSchema = z.object({
  rows: z
    .array(z.record(z.unknown()))
    .min(1, 'At least one row is required')
    .max(10_000, 'Cannot insert more than 10,000 rows at once')
});

// ── GET /api/datasets/[id]/rows ───────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, params, url }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Verify the dataset belongs to this user
  const { data: dataset, error: datasetErr } = await locals.supabase
    .from('datasets')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (datasetErr || !dataset) {
    return json({ success: false, error: 'Dataset not found.' }, { status: 404 });
  }

  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get('page_size') ?? 50)));
  const search = url.searchParams.get('search') ?? '';
  const offset = (page - 1) * pageSize;

  let query = locals.supabase
    .from('dataset_rows')
    .select('id, row_index, data', { count: 'exact' })
    .eq('dataset_id', id)
    .order('row_index', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (search.trim()) {
    // Full-text search on the JSON data column (cast to text)
    query = query.ilike('data::text', `%${search.replace(/[%_]/g, '\\$&')}%`);
  }

  const { data: rows, count, error } = await query;

  if (error) {
    return json({ success: false, error: 'Failed to load rows.' }, { status: 500 });
  }

  return json({
    success: true,
    data: {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize)
    }
  });
};

// ── POST /api/datasets/[id]/rows ──────────────────────────────────────────────

export const POST: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Verify ownership
  const { data: dataset, error: datasetErr } = await locals.supabase
    .from('datasets')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (datasetErr || !dataset) {
    return json({ success: false, error: 'Dataset not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = BulkInsertSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  const records = parsed.data.rows.map((data, i) => ({
    dataset_id: id,
    row_index: i,
    data
  }));

  // Insert in chunks of 1000 to stay within Supabase limits
  const CHUNK = 1000;
  for (let start = 0; start < records.length; start += CHUNK) {
    const chunk = records.slice(start, start + CHUNK);
    const { error } = await locals.supabase.from('dataset_rows').insert(chunk);
    if (error) {
      return json({ success: false, error: 'Failed to insert rows.' }, { status: 500 });
    }
  }

  // Update row_count on the parent dataset
  await locals.supabase
    .from('datasets')
    .update({ row_count: records.length })
    .eq('id', id);

  return json(
    { success: true, data: { inserted: records.length } },
    { status: 201 }
  );
};
