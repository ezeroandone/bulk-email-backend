import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CreditBalance {
  available: number;
  reserved: number;
  total_purchased: number;
  total_consumed: number;
}

/** The current user's credit balance. */
export const creditBalance = writable<CreditBalance>({
  available: 0,
  reserved: 0,
  total_purchased: 0,
  total_consumed: 0
});

/**
 * Subscribe to real-time changes on the `credit_wallets` table for a given user.
 * Updates `creditBalance` whenever the row changes.
 *
 * @returns An unsubscribe function that removes the Realtime channel.
 */
export function subscribeToCredits(supabase: SupabaseClient, userId: string): () => void {
  const channel = supabase
    .channel(`credit_wallets:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'credit_wallets',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const row = payload.new as Partial<CreditBalance> | null;
        if (row) {
          creditBalance.set({
            available: row.available ?? 0,
            reserved: row.reserved ?? 0,
            total_purchased: row.total_purchased ?? 0,
            total_consumed: row.total_consumed ?? 0
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
