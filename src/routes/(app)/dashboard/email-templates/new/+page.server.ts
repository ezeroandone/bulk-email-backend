import { redirect } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const { data: datasets } = await locals.supabase
    .from('datasets')
    .select('id, name, column_count, email_column, dataset_columns(id, name, normalized_name)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return {
    datasets: datasets ?? []
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();

    const name = (fd.get('name') as string)?.trim();
    const subject = (fd.get('subject') as string)?.trim();
    const body_html = (fd.get('body_html') as string)?.trim();

    if (!name || !subject || !body_html) {
      return { error: 'Name, subject, and body are required.' };
    }

    const { data: tmpl, error } = await locals.supabase
      .from('email_templates')
      .insert({
        user_id: session.user.id,
        name,
        subject,
        body_html,
        body_text: null
      })
      .select('id')
      .single();

    if (error || !tmpl) {
      return { error: 'Failed to create template.' };
    }

    redirect(303, `/dashboard/email-templates/${tmpl.id}`);
  }
};
