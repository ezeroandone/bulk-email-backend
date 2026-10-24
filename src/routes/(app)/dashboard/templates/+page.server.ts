import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const { data: templates } = await locals.supabase
    .from('document_templates')
    .select('id, name, type, storage_path, placeholders, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return { templates: templates ?? [] };
};
