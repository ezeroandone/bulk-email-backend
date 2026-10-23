import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals, getClientAddress }) => {
    const form = await request.formData();

    const name = (form.get('name') as string | null)?.trim() ?? '';
    const email = (form.get('email') as string | null)?.trim() ?? '';
    const subject = (form.get('subject') as string | null)?.trim() ?? '';
    const message = (form.get('message') as string | null)?.trim() ?? '';

    // Basic validation
    if (!name || !email || !subject || !message) {
      return fail(400, { error: 'All fields are required.', name, email, subject, message });
    }

    if (message.length < 10) {
      return fail(400, { error: 'Message is too short.', name, email, subject, message });
    }

    const validSubjects = ['general', 'support', 'sales', 'report_abuse'];
    if (!validSubjects.includes(subject)) {
      return fail(400, { error: 'Invalid subject.', name, email, subject, message });
    }

    // Rate limit: basic check — not more than 3 submissions per IP per day (best-effort)
    const ip = getClientAddress();

    const { error } = await locals.supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: ip ?? null
      });

    if (error) {
      console.error('contact_submissions insert error:', error);
      return fail(500, { error: 'Failed to submit your message. Please try again.', name, email, subject, message });
    }

    return { success: true };
  }
};
