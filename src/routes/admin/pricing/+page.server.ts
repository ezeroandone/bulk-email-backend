import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();

  const { data: packages } = await admin
    .from('credit_packages')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: settingRow } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', 'default_signup_credits')
    .maybeSingle();

  return {
    packages: packages ?? [],
    default_signup_credits: settingRow?.value ?? '0'
  };
};

export const actions: Actions = {
  upsertPackage: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();

    const id = form.get('id') as string | null;
    const name = (form.get('name') as string)?.trim();
    const credits = parseInt(form.get('credits') as string, 10);
    const price_kobo = parseInt(form.get('price_kobo') as string, 10);
    const enabled = form.get('enabled') === 'true';
    const sort_order = parseInt(form.get('sort_order') as string, 10) || 0;

    if (!name) return fail(400, { error: 'Package name is required' });
    if (isNaN(credits) || credits <= 0) return fail(400, { error: 'Credits must be a positive number' });
    if (isNaN(price_kobo) || price_kobo < 0) return fail(400, { error: 'Price must be a non-negative number' });

    const admin = createSupabaseAdminClient();

    const payload = { name, credits, price_kobo, enabled, sort_order };

    if (id) {
      const { error } = await admin
        .from('credit_packages')
        .update(payload)
        .eq('id', id);
      if (error) return fail(500, { error: error.message });
    } else {
      const { error } = await admin
        .from('credit_packages')
        .insert(payload);
      if (error) return fail(500, { error: error.message });
    }

    return { success: true, action: 'upsertPackage' };
  },

  togglePackage: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const id = form.get('id') as string;
    const enabled = form.get('enabled') === 'true';

    if (!id) return fail(400, { error: 'Missing package id' });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('credit_packages')
      .update({ enabled })
      .eq('id', id);

    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'togglePackage' };
  },

  updateDefaultCredits: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const value = (form.get('value') as string)?.trim();

    const credits = parseInt(value, 10);
    if (isNaN(credits) || credits < 0) return fail(400, { error: 'Invalid credit value' });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('platform_settings')
      .upsert({ key: 'default_signup_credits', value: String(credits) }, { onConflict: 'key' });

    if (error) return fail(500, { error: error.message });
    return { success: true, action: 'updateDefaultCredits' };
  }
};
