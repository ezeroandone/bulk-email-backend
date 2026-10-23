import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const SETTING_KEYS = [
  'max_recipients_per_campaign',
  'default_sending_rate_per_minute',
  'max_attachment_size_mb',
  'max_upload_size_mb',
  'maintenance_mode'
] as const;

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();

  const { data: rows } = await admin
    .from('platform_settings')
    .select('key, value')
    .in('key', [...SETTING_KEYS]);

  const settings: Record<string, string> = {};
  for (const row of rows ?? []) {
    settings[row.key as string] = row.value as string;
  }

  return { settings };
};

export const actions: Actions = {
  saveSettings: async ({ locals, request }) => {
    const session = requireAdmin(locals);
    const form = await request.formData();

    const max_recipients = form.get('max_recipients_per_campaign') as string;
    const default_rate = form.get('default_sending_rate_per_minute') as string;
    const max_attachment = form.get('max_attachment_size_mb') as string;
    const max_upload = form.get('max_upload_size_mb') as string;
    const maintenance_mode = form.get('maintenance_mode') === 'on' ? 'true' : 'false';

    const upserts = [
      { key: 'max_recipients_per_campaign', value: max_recipients },
      { key: 'default_sending_rate_per_minute', value: default_rate },
      { key: 'max_attachment_size_mb', value: max_attachment },
      { key: 'max_upload_size_mb', value: max_upload },
      { key: 'maintenance_mode', value: maintenance_mode }
    ];

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('platform_settings')
      .upsert(upserts, { onConflict: 'key' });

    if (error) return fail(500, { error: error.message });

    // Audit log
    await admin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'platform_settings_updated',
      details: Object.fromEntries(upserts.map((u) => [u.key, u.value]))
    });

    return { success: true };
  }
};
