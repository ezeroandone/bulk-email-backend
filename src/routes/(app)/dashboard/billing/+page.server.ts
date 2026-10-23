import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = requireSession(locals);
  const userId = session.user.id;

  const ledgerPage = Math.max(1, Number(url.searchParams.get('ledger_page') ?? '1'));
  const historyPage = Math.max(1, Number(url.searchParams.get('history_page') ?? '1'));
  const ledgerOffset = (ledgerPage - 1) * PAGE_SIZE;
  const historyOffset = (historyPage - 1) * PAGE_SIZE;

  // Credit packages (enabled only; use 'enabled' column per schema)
  const { data: packages } = await locals.supabase
    .from('credit_packages')
    .select('id, name, credits, price_kobo, currency, sort_order')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  // Purchase history (use 'reference' column per schema)
  const { data: purchases, count: totalPurchases } = await locals.supabase
    .from('payment_orders')
    .select(
      'id, created_at, package_id, reference, amount_kobo, currency, status',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(historyOffset, historyOffset + PAGE_SIZE - 1);

  // Fetch package names for purchases
  const packageIds = [...new Set((purchases ?? []).map((p) => p.package_id as string))];
  let packageNameMap: Record<string, string> = {};
  let packageCreditsMap: Record<string, number> = {};
  if (packageIds.length > 0) {
    const { data: pkgs } = await locals.supabase
      .from('credit_packages')
      .select('id, name, credits')
      .in('id', packageIds);
    if (pkgs) {
      packageNameMap = Object.fromEntries(pkgs.map((p) => [p.id as string, p.name as string]));
      packageCreditsMap = Object.fromEntries(pkgs.map((p) => [p.id as string, p.credits as number]));
    }
  }

  const enrichedPurchases = (purchases ?? []).map((p) => ({
    ...p,
    package_name: packageNameMap[p.package_id as string] ?? null,
    credits: packageCreditsMap[p.package_id as string] ?? null
  }));

  // Ledger (use 'delta' and 'note' per schema)
  const { data: ledger, count: totalLedger } = await locals.supabase
    .from('credit_ledger')
    .select('id, created_at, type, delta, balance_after, note', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(ledgerOffset, ledgerOffset + PAGE_SIZE - 1);

  return {
    packages: packages ?? [],
    purchases: enrichedPurchases,
    totalPurchases: totalPurchases ?? 0,
    historyPage,
    ledger: ledger ?? [],
    totalLedger: totalLedger ?? 0,
    ledgerPage
  };
};
