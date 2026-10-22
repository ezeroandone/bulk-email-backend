import { requireSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('onboarding_step, onboarding_done')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    onboardingStep: (profile?.onboarding_step as number) ?? 0,
    onboardingDone: (profile?.onboarding_done as boolean) ?? false
  };
};

export const actions: Actions = {
  saveStep: async ({ request, locals }) => {
    const session = requireSession(locals);
    const fd = await request.formData();
    const step = parseInt(fd.get('step') as string, 10);
    const done = fd.get('done') === 'true';

    if (isNaN(step) || step < 0 || step > 5) {
      return { error: 'Invalid step.' };
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({
        onboarding_step: step,
        onboarding_done: done
      })
      .eq('id', session.user.id);

    if (error) {
      return { error: 'Failed to save progress.' };
    }

    return { success: true };
  }
};
