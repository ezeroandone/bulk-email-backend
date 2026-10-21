import { requireAdmin } from '$lib/server/auth/session';
import type { LayoutServerLoad } from './$types';

/**
 * Guard every route inside /admin.
 * Requires an active session AND the user's profile.role must be 'admin'.
 * - Not authenticated → redirect to /login
 * - Authenticated but not admin → redirect to /dashboard
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const session = requireAdmin(locals);

  return {
    session,
    profile: locals.profile
  };
};
