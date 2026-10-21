import { writable } from 'svelte/store';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

/** The authenticated Supabase user, or null when signed out. */
export const user = writable<SupabaseUser | null>(null);

/** The application-level profile row for the current user. */
export const profile = writable<Profile | null>(null);
