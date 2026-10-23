import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();

  const { data: orders } = await admin
    .from('payment_orders')
    .select(`
      id, reference, amount_kobo, status, admin_notes, created_at,
      user_id, profiles(full_name, email),
      credit_packages(name)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  return {
    orders: orders ?? []
  };
};

export const actions: Actions = {
  saveAdminNotes: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const id = form.get('id') as string;
    const admin_notes = (form.get('admin_notes') as string) ?? '';

    if (!id) return fail(400, { error: 'Missing order id' });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('payment_orders')
      .update({ admin_notes })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true, savedId: id };
  }
};
