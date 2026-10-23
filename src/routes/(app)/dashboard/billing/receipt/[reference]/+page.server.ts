import { error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = requireSession(locals);
  const { reference } = params;

  // Load order and verify user owns it
  const { data: order, error: orderError } = await locals.supabase
    .from('payment_orders')
    .select('id, reference, amount_kobo, currency, status, created_at, fulfilled_at, package_id')
    .eq('reference', reference)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (orderError) {
    error(500, 'Failed to load receipt.');
  }
  if (!order) {
    error(404, 'Receipt not found.');
  }

  // Load package details
  const { data: pkg } = await locals.supabase
    .from('credit_packages')
    .select('name, credits')
    .eq('id', order.package_id)
    .maybeSingle();

  return {
    reference: order.reference as string,
    packageName: (pkg?.name ?? 'Credit Package') as string,
    credits: (pkg?.credits ?? 0) as number,
    amountKobo: order.amount_kobo as number,
    currency: (order.currency ?? 'NGN') as string,
    status: order.status as string,
    createdAt: order.created_at as string,
    fulfilledAt: (order.fulfilled_at ?? null) as string | null
  };
};
