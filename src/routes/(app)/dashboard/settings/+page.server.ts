import { fail, redirect } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { ProfileUpdateSchema } from '$lib/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const userId = session.user.id;

  // Onboarding steps
  const { data: smtp } = await locals.supabase
    .from('smtp_configurations')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  const { count: datasetCount } = await locals.supabase
    .from('datasets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: campaignCount } = await locals.supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const steps = {
    profileComplete: !!(locals.profile?.full_name),
    smtpConfigured: !!smtp,
    datasetUploaded: (datasetCount ?? 0) > 0,
    campaignCreated: (campaignCount ?? 0) > 0
  };

  return { steps };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const session = requireSession(locals);
    const formData = await request.formData();
    const raw = {
      displayName: formData.get('displayName') as string
    };

    const parsed = ProfileUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(422, {
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({ full_name: parsed.data.displayName })
      .eq('id', session.user.id);

    if (error) {
      return fail(500, { message: 'Failed to update profile. Please try again.' });
    }

    return { success: true };
  },

  deleteAccount: async ({ locals }) => {
    const session = requireSession(locals);

    // Delete the profile row — DB cascade handles the rest
    const { error } = await locals.supabase
      .from('profiles')
      .delete()
      .eq('id', session.user.id);

    if (error) {
      return fail(500, { message: 'Failed to delete account. Please contact support.' });
    }

    // Sign the user out
    await locals.supabase.auth.signOut();
    redirect(302, '/');
  }
};
