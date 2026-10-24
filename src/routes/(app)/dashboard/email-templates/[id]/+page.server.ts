import { error, redirect } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = requireSession(locals);

  const { data: template, error: dbError } = await locals.supabase
    .from('email_templates')
    .select('id, name, subject, body_html, body_text, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (dbError || !template) {
    error(404, 'Email template not found');
  }

  const { data: datasets } = await locals.supabase
    .from('datasets')
    .select('id, name, column_count, email_column, dataset_columns(id, name, normalized_name)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return {
    template,
    datasets: datasets ?? []
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const session = requireSession(locals);
    const fd = await request.formData();

    const name = (fd.get('name') as string)?.trim();
    const subject = (fd.get('subject') as string)?.trim();
    const body_html = (fd.get('body_html') as string)?.trim();

    if (!name || !subject || !body_html) {
      return { error: 'Name, subject, and body are required.' };
    }

    const { error: dbError } = await locals.supabase
      .from('email_templates')
      .update({ name, subject, body_html })
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (dbError) {
      return { error: 'Failed to update template.' };
    }

    return { success: true };
  },

  duplicate: async ({ locals, params }) => {
    const session = requireSession(locals);

    const { data: original } = await locals.supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!original) {
      return { error: 'Template not found.' };
    }

    const { data: copy, error: copyErr } = await locals.supabase
      .from('email_templates')
      .insert({
        user_id: session.user.id,
        name: `${original.name} (copy)`,
        subject: original.subject,
        body_html: original.body_html,
        body_text: original.body_text ?? null
      })
      .select('id')
      .single();

    if (copyErr || !copy) {
      return { error: 'Failed to duplicate template.' };
    }

    redirect(303, `/dashboard/email-templates/${copy.id}`);
  },

  delete: async ({ locals, params }) => {
    const session = requireSession(locals);

    const { error: dbError } = await locals.supabase
      .from('email_templates')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (dbError) {
      return { error: 'Failed to delete template.' };
    }

    redirect(303, '/dashboard/email-templates');
  }
};
