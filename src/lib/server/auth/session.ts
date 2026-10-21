import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';

type Locals = App.Locals;

/**
 * Return the session from locals, or null if there is none.
 */
export function getSession(locals: Locals): Session | null {
  return locals.session ?? null;
}

/**
 * Return the session, or throw a 302 redirect to /login when not authenticated.
 */
export function requireSession(locals: Locals): Session {
  const session = locals.session;
  if (!session) {
    redirect(302, '/login');
  }
  return session;
}

/**
 * Return the session for an admin user, or throw:
 * - 302 → /login  if not authenticated
 * - 302 → /dashboard if authenticated but not admin
 */
export function requireAdmin(locals: Locals): Session {
  const session = locals.session;
  if (!session) {
    redirect(302, '/login');
  }
  if (locals.profile?.role !== 'admin') {
    redirect(302, '/dashboard');
  }
  return session;
}
