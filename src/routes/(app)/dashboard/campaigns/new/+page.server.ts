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

  // Load up to 5 preview rows for each dataset so the match preview works
  const datasetsWithRows = await Promise.all(
    (datasets ?? []).map(async (ds) => {
      const { data: rows } = await locals.supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', ds.id)
        .order('row_index', { ascending: true })
        .limit(5);
      return { ...ds, preview_rows: (rows ?? []).map(r => r.data) };
    })
  );

  return {
    datasets: datasetsWithRows,
    smtpConfigs: smtpConfigs ?? [],
    templates: templates ?? []
  };
};
