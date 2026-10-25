import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Redirect /dashboard/settings to /dashboard/settings/smtp
  redirect(302, '/dashboard/settings/smtp');
};
