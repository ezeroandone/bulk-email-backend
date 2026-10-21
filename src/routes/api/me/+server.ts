import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .eq('id', session.user.id)
    .maybeSingle();

  const { data: workspace } = await locals.supabase
    .from('workspaces')
    .select('id, name, slug, logo_url')
    .eq('owner_id', session.user.id)
    .maybeSingle();

  return json({
    success: true,
    data: {
      profile: profile ?? null,
      workspace: workspace ?? null
    }
  });
};
