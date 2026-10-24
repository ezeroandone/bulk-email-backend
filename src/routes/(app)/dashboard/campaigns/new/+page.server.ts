import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const [{ data: datasets }, { data: smtpConfigs }, { data: templates }] = await Promise.all([
    locals.supabase
      .from('datasets')
      .select('id, name, row_count, column_count, email_column, dataset_columns(id, name, normalized_name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),

    locals.supabase
      .from('smtp_configurations')
      .select('id, name, from_email, from_name, is_default')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),

    locals.supabase
      .from('document_templates')
      .select('id, name, storage_path, placeholders, metadata, type')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
  ]);

  return {
    datasets: datasets ?? [],
    smtpConfigs: smtpConfigs ?? [],
    templates: templates ?? []
  };
};
