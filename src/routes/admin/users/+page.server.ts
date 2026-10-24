import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  requireAdmin(locals);

  const search = url.searchParams.get('search') ?? '';
  const admin = createSupabaseAdminClient();

  let query = admin
    .from('profiles')
    .select(
      `id, email, full_name, role, status, created_at,
       credit_wallets(available_credits)`
    )
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users } = await query;

  // Count campaigns per user
  const userIds = (users ?? []).map((u: { id: string }) => u.id);
  let campaignCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: counts } = await admin
      .from('campaigns')
      .select('user_id')
      .in('user_id', userIds);

    for (const row of counts ?? []) {
      const uid = row.user_id as string;
      campaignCounts[uid] = (campaignCounts[uid] ?? 0) + 1;
    }
  }

  return {
    users: (users ?? []).map((u: {
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      status: string | null;
      created_at: string;
      credit_wallets: { available_credits: number } | { available_credits: number }[] | null;
    }) => ({
      ...u,
      available_credits: Array.isArray(u.credit_wallets)
        ? (u.credit_wallets[0]?.available_credits ?? 0)
        : (u.credit_wallets?.available_credits ?? 0),
      campaign_count: campaignCounts[u.id] ?? 0
    })),
    search
  };
};
