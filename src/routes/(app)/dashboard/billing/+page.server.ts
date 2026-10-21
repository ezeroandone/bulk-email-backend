import { fail, redirect } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { privateEnv } from '$lib/server/env';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = requireSession(locals);
  const userId = session.user.id;

  const ledgerPage = Number(url.searchParams.get('ledger_page') ?? '1');
  const historyPage = Number(url.searchParams.get('history_page') ?? '1');
  const ledgerOffset = (ledgerPage - 1) * PAGE_SIZE;
  const historyOffset = (historyPage - 1) * PAGE_SIZE;

  // Credit packages (active)
  const { data: packages } = await locals.supabase
    .from('credit_packages')
    .select('id, name, credits, price_kobo, currency, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Purchase history
  const { data: purchases, count: totalPurchases } = await locals.supabase
    .from('payment_orders')
    .select(
      'id, created_at, package_name, credits, amount_kobo, currency, status, paystack_reference',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(historyOffset, historyOffset + PAGE_SIZE - 1);

  // Ledger
  const { data: ledger, count: totalLedger } = await locals.supabase
    .from('credit_ledger')
    .select('id, created_at, type, amount, balance_after, description', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(ledgerOffset, ledgerOffset + PAGE_SIZE - 1);

  return {
    packages: packages ?? [],
    purchases: purchases ?? [],
    totalPurchases: totalPurchases ?? 0,
    historyPage,
    ledger: ledger ?? [],
    totalLedger: totalLedger ?? 0,
    ledgerPage
  };
};

export const actions: Actions = {
  buyCredits: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const packageId = fd.get('package_id') as string;

    if (!packageId) return fail(400, { message: 'Missing package ID.' });

    // Verify package exists and is active (never trust client price)
    const { data: pkg } = await locals.supabase
      .from('credit_packages')
      .select('id, name, credits, price_kobo, currency')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (!pkg) return fail(404, { message: 'Credit package not found or no longer available.' });

    const email = session.user.email ?? locals.profile?.email ?? '';
    const reference = `mm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Initialize Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${privateEnv.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: pkg.price_kobo, // already in kobo
        currency: pkg.currency ?? 'NGN',
        reference,
        metadata: {
          user_id: session.user.id,
          package_id: pkg.id,
          credits: pkg.credits
        },
        callback_url: `${process.env.PUBLIC_APP_URL ?? 'https://mergemail.app'}/dashboard/billing/verify`
      })
    });

    if (!paystackRes.ok) {
      return fail(502, { message: 'Payment provider unavailable. Please try again.' });
    }

    const paystackData = await paystackRes.json() as {
      status: boolean;
      data?: { authorization_url: string; access_code: string };
      message?: string;
    };

    if (!paystackData.status || !paystackData.data?.authorization_url) {
      return fail(502, { message: paystackData.message ?? 'Failed to initialize payment.' });
    }

    // Create order record
    await locals.supabase.from('payment_orders').insert({
      user_id: session.user.id,
      package_id: pkg.id,
      package_name: pkg.name,
      credits: pkg.credits,
      amount_kobo: pkg.price_kobo,
      currency: pkg.currency ?? 'NGN',
      status: 'pending',
      paystack_reference: reference,
      paystack_access_code: paystackData.data.access_code,
      paystack_authorization_url: paystackData.data.authorization_url
    });

    redirect(302, paystackData.data.authorization_url);
  }
};
