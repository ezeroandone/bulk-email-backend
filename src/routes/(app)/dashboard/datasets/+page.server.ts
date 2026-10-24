import { fail } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const { data: datasets } = await locals.supabase
    .from('datasets')
    .select('id, name, row_count, column_count, original_filename, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return { datasets: datasets ?? [] };
};

export const actions: Actions = {
  rename: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const name = (fd.get('name') as string)?.trim();

    if (!id || !name) return fail(400, { message: 'ID and name are required.' });
    if (name.length > 200) return fail(422, { message: 'Name must be 200 characters or fewer.' });

    const { error } = await locals.supabase
      .from('datasets')
      .update({ name })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) return fail(500, { message: 'Failed to rename dataset.' });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const id = fd.get('id') as string;

    if (!id) return fail(400, { message: 'Missing dataset ID.' });

    const { error } = await locals.supabase
      .from('datasets')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) return fail(500, { message: 'Failed to delete dataset.' });

    return { success: true };
  },

  duplicate: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const id = fd.get('id') as string;

    if (!id) return fail(400, { message: 'Missing dataset ID.' });

    const { data: original } = await locals.supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!original) return fail(404, { message: 'Dataset not found.' });

    const { error } = await locals.supabase.from('datasets').insert({
      user_id: session.user.id,
      name: `${original.name} (copy)`,
      original_filename: original.original_filename,
      row_count: original.row_count,
      column_count: original.column_count,
      status: 'ready'
    });

    if (error) return fail(500, { message: 'Failed to duplicate dataset.' });

    return { success: true };
  }
};
