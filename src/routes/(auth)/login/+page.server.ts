import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Already signed in — send to dashboard
  if (locals.session) {
    redirect(302, '/dashboard');
  }

  return {};
};
