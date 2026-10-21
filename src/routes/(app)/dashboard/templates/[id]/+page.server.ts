import { error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = requireSession(locals);

  const { data: template, error: dbError } = await locals.supabase
    .from('document_templates')
    .select('id, name, description, format, type, mime_type, storage_path, file_size, placeholders, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (dbError || !template) {
    error(404, 'Template not found');
  }

  // Load field mappings if they exist (for PDF/image templates)
  const { data: mappings } = await locals.supabase
    .from('document_template_fields')
    .select('id, variable, x, y, font_size, font_family, color, alignment, page_index')
    .eq('template_id', params.id)
    .order('page_index')
    .order('id');

  // Load the user's datasets so they can pick column names
  const { data: datasets } = await locals.supabase
    .from('datasets')
    .select('id, name, columns')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    template,
    mappings: mappings ?? [],
    datasets: datasets ?? []
  };
};
