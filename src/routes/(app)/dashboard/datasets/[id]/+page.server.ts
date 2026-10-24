import { fail, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const session = requireSession(locals);
  const { id } = params;
  const page = Number(url.searchParams.get('page') ?? '1');
  const search = url.searchParams.get('q') ?? '';
  const offset = (page - 1) * PAGE_SIZE;

  // Fetch dataset header
  const { data: dataset } = await locals.supabase
    .from('datasets')
    .select('id, name, row_count, column_count, email_column, original_filename, created_at, dataset_columns(id, name, normalized_name, position)')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!dataset) {
    error(404, { message: 'Dataset not found.' });
  }

  // Fetch rows
  let query = locals.supabase
    .from('dataset_rows')
    .select('id, row_index, data', { count: 'exact' })
    .eq('dataset_id', id)
    .order('row_index', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.textSearch('data', search, { type: 'plain', config: 'english' });
  }

  const { data: rows, count } = await query;

  return {
    dataset,
    rows: rows ?? [],
    totalRows: count ?? dataset.row_count ?? 0,
    page,
    search
  };
};

export const actions: Actions = {
  deleteRow: async ({ request, locals, params }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const rowId = fd.get('row_id') as string;

    if (!rowId) return fail(400, { message: 'Missing row ID.' });

    // Ensure ownership via dataset
    const { data: row } = await locals.supabase
      .from('dataset_rows')
      .select('dataset_id, datasets!inner(user_id)')
      .eq('id', rowId)
      .maybeSingle();

    const ownership = (row?.datasets as unknown as { user_id: string } | null)?.user_id;
    if (!row || ownership !== session.user.id) {
      return fail(403, { message: 'Not authorized.' });
    }

    const { error: delErr } = await locals.supabase
      .from('dataset_rows')
      .delete()
      .eq('id', rowId);

    if (delErr) return fail(500, { message: 'Failed to delete row.' });

    // Decrement row count
    await locals.supabase.rpc('decrement_dataset_row_count', { p_dataset_id: params.id });

    return { success: true };
  },

  updateRow: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const rowId = fd.get('row_id') as string;
    const dataJson = fd.get('data') as string;

    if (!rowId || !dataJson) return fail(400, { message: 'Missing required fields.' });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(dataJson) as Record<string, unknown>;
    } catch {
      return fail(400, { message: 'Invalid row data.' });
    }

    // Ownership check
    const { data: row } = await locals.supabase
      .from('dataset_rows')
      .select('dataset_id, datasets!inner(user_id)')
      .eq('id', rowId)
      .maybeSingle();

    const ownership = (row?.datasets as unknown as { user_id: string } | null)?.user_id;
    if (!row || ownership !== session.user.id) {
      return fail(403, { message: 'Not authorized.' });
    }

    const { error: updErr } = await locals.supabase
      .from('dataset_rows')
      .update({ data: parsed })
      .eq('id', rowId);

    if (updErr) return fail(500, { message: 'Failed to update row.' });

    return { success: true };
  }
};
