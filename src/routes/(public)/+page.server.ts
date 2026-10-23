import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: packages } = await locals.supabase
    .from('credit_packages')
    .select('id, name, credits, price_kobo, currency, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return {
    packages: packages ?? []
  };
};
