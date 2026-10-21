// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
      profile: {
        id: string;
        email: string;
        full_name: string | null;
        role: string;
        avatar_url: string | null;
      } | null;
      isAdmin: boolean;
    }

    interface PageData {
      session?: Session | null;
      profile?: App.Locals['profile'];
      wallet?: {
        available_credits: number;
        reserved_credits: number;
        total_purchased: number;
        total_consumed: number;
      } | null;
    }

    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
