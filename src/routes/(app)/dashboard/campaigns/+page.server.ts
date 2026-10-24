import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = requireSession(locals);

  const status = url.searchParams.get('status') ?? '';
  const search = url.searchParams.get('q') ?? '';

  let query = locals.supabase
    .from('campaigns')
    .select(
      'id, name, status, mode, recipient_count, created_at'
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: campaigns } = await query;

  return { campaigns: campaigns ?? [], status, search };
};
