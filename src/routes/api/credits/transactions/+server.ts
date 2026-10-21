import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20)
});

export const GET: RequestHandler = async ({ locals, url }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const params = QuerySchema.safeParse({
    page: url.searchParams.get('page'),
    page_size: url.searchParams.get('page_size')
  });

  if (!params.success) {
    return json({ success: false, error: 'Invalid query parameters.' }, { status: 400 });
  }

  const { page, page_size } = params.data;
  const offset = (page - 1) * page_size;

  const { data, count, error } = await locals.supabase
    .from('credit_ledger')
    .select('id, created_at, type, amount, balance_after, description', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + page_size - 1);

  if (error) {
    return json({ success: false, error: 'Failed to load transactions.' }, { status: 500 });
  }

  return json({
    success: true,
    data: {
      transactions: data ?? [],
      total: count ?? 0,
      page,
      page_size,
      total_pages: Math.ceil((count ?? 0) / page_size)
    }
  });
};
