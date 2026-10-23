import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  // Require authentication
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reference } = params;
  if (!reference) {
    return json({ error: 'Reference is required' }, { status: 400 });
  }

  // Load order, verifying ownership (user_id must match)
  const { data: order, error } = await locals.supabase
    .from('payment_orders')
    .select(
      'reference, status, amount_kobo, currency, created_at, package_id, paystack_data'
    )
    .eq('reference', reference)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    return json({ error: 'Failed to load order' }, { status: 500 });
  }
  if (!order) {
    return json({ error: 'Order not found' }, { status: 404 });
  }

  // Load the credit count from the package (avoid returning PII from paystack_data)
  const { data: pkg } = await locals.supabase
    .from('credit_packages')
    .select('credits')
    .eq('id', order.package_id)
    .maybeSingle();

  return json({
    reference: order.reference,
    status: order.status,
    credits: pkg?.credits ?? null,
    amount_kobo: order.amount_kobo,
    created_at: order.created_at
  });
};
