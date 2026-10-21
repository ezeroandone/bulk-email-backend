import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import { encryptPassword } from '$lib/server/services/smtp/encryption';
import { validateSmtpHost } from '$lib/server/security/ssrf';
import type { Actions, PageServerLoad } from './$types';

const SmtpSaveSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  host: z.string().min(1, 'Host is required').max(255).regex(/^[a-zA-Z0-9.\-]+$/, 'Invalid hostname'),
  port: z.coerce.number().int().min(1).max(65535),
  tls: z.enum(['ssl', 'starttls', 'none']),
  username: z.string().min(1, 'Username is required').max(320),
  password: z.string().min(1, 'Password is required').max(512),
  from_name: z.string().min(1, 'Sender name is required').max(100),
  from_email: z.string().email('Invalid sender email').max(320),
  reply_to: z.string().email('Invalid reply-to email').max(320).optional().or(z.literal('')),
  timeout_ms: z.coerce.number().int().min(1000).max(60000).default(10000),
  rate_per_minute: z.coerce.number().int().min(1).max(10000).default(60)
});

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const { data: configs } = await locals.supabase
    .from('smtp_configurations')
    .select(
      'id, name, host, port, tls, from_name, from_email, reply_to, is_default, last_tested_at, is_verified, timeout_ms, rate_per_minute, created_at'
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return { configs: configs ?? [] };
};

export const actions: Actions = {
  save: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();

    const raw = {
      name: fd.get('name'),
      host: fd.get('host'),
      port: fd.get('port'),
      tls: fd.get('tls'),
      username: fd.get('username'),
      password: fd.get('password'),
      from_name: fd.get('from_name'),
      from_email: fd.get('from_email'),
      reply_to: fd.get('reply_to') ?? '',
      timeout_ms: fd.get('timeout_ms') ?? 10000,
      rate_per_minute: fd.get('rate_per_minute') ?? 60
    };

    const parsed = SmtpSaveSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(422, { errors: parsed.error.flatten().fieldErrors });
    }

    const d = parsed.data;

    // SSRF guard
    try {
      await validateSmtpHost(d.host);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid SMTP host.';
      return fail(422, { errors: { host: [msg] } });
    }

    const encryptedPassword = encryptPassword(d.password);
    const encryptedUsername = encryptPassword(d.username);

    const editId = fd.get('edit_id') as string | null;

    if (editId) {
      // Update existing — never touch the password unless a new one was supplied
      const updatePayload: Record<string, unknown> = {
        name: d.name,
        host: d.host,
        port: d.port,
        tls: d.tls,
        from_name: d.from_name,
        from_email: d.from_email,
        reply_to: d.reply_to || null,
        timeout_ms: d.timeout_ms,
        rate_per_minute: d.rate_per_minute,
        // Re-encrypt credentials on every edit
        username_encrypted: encryptedUsername,
        password_encrypted: encryptedPassword
      };

      const { error } = await locals.supabase
        .from('smtp_configurations')
        .update(updatePayload)
        .eq('id', editId)
        .eq('user_id', session.user.id);

      if (error) return fail(500, { message: 'Failed to update SMTP configuration.' });
    } else {
      const { error } = await locals.supabase.from('smtp_configurations').insert({
        user_id: session.user.id,
        name: d.name,
        host: d.host,
        port: d.port,
        tls: d.tls,
        username_encrypted: encryptedUsername,
        password_encrypted: encryptedPassword,
        from_name: d.from_name,
        from_email: d.from_email,
        reply_to: d.reply_to || null,
        timeout_ms: d.timeout_ms,
        rate_per_minute: d.rate_per_minute,
        is_default: false,
        is_verified: false
      });

      if (error) return fail(500, { message: 'Failed to save SMTP configuration.' });
    }

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const id = fd.get('id') as string;

    if (!id) return fail(400, { message: 'Missing config ID.' });

    const { error } = await locals.supabase
      .from('smtp_configurations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) return fail(500, { message: 'Failed to delete configuration.' });

    return { success: true };
  },

  setDefault: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const id = fd.get('id') as string;

    if (!id) return fail(400, { message: 'Missing config ID.' });

    // Unset all defaults first
    await locals.supabase
      .from('smtp_configurations')
      .update({ is_default: false })
      .eq('user_id', session.user.id);

    const { error } = await locals.supabase
      .from('smtp_configurations')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) return fail(500, { message: 'Failed to set default.' });

    return { success: true };
  }
};
