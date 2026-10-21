import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /logout
 * Signs the user out, clears the Supabase auth cookies, and redirects to /.
 */
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
  await supabase.auth.signOut();
  redirect(302, '/');
};
