import { writable } from 'svelte/store';

/** The authenticated Supabase user object, or null when signed out. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const user = writable<any>(null);

/** The application-level profile row for the current user, or null. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const profile = writable<any>(null);
