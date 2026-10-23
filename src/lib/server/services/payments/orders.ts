import crypto from 'crypto';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { initializeTransaction, verifyTransaction as _verifyTransaction } from './paystack';
import type { PaystackVerifyData } from './paystack';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentOrder {
  id: string;
  user_id: string;
  package_id: string;
  reference: string;
  amount_kobo: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

/**
 * Create a payment order for the given user and package.
 * 1. Load credit_package from DB, verify enabled=true.
 * 2. Generate a unique reference.
 * 3. Insert payment_order row with amount/credits taken from DB (never client).
 * 4. Initialize a Paystack transaction.
 * 5. Return {order, checkoutUrl}.
 */
export async function createOrder(
  userId: string,
  packageId: string
): Promise<{ order: PaymentOrder; checkoutUrl: string }> {
  const supabase = createSupabaseAdminClient();

  // Step 1: Load and verify package
  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('id, name, credits, price_kobo, currency')
    .eq('id', packageId)
    .eq('enabled', true)
    .maybeSingle();

  if (pkgError) {
    throw new Error(`Failed to load credit package: ${pkgError.message}`);
  }
  if (!pkg) {
    throw new Error('Credit package not found or is not available.');
  }

  // Step 2: Load user email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile?.email) {
    throw new Error('User profile not found.');
  }

  // Step 3: Generate reference
  const reference = `MM-${userId.slice(0, 8)}-${Date.now()}-${randomHex(4)}`;

  // Step 4: Insert order (amount_kobo comes from DB, never from client)
  const { data: order, error: insertError } = await supabase
    .from('payment_orders')
    .insert({
      user_id: userId,
      package_id: pkg.id,
      reference,
      amount_kobo: pkg.price_kobo,
      currency: pkg.currency ?? 'NGN',
      status: 'pending'
    })
    .select()
    .single();

  if (insertError || !order) {
    throw new Error(`Failed to create payment order: ${insertError?.message ?? 'unknown'}`);
  }

  // Step 5: Initialize Paystack transaction
  const { authorization_url } = await initializeTransaction({
    email: profile.email,
    amount: pkg.price_kobo,
    reference,
    metadata: {
      user_id: userId,
      package_id: pkg.id,
      credits: pkg.credits,
      order_id: order.id
    }
  });

  return {
    order: order as PaymentOrder,
    checkoutUrl: authorization_url
  };
}

// ---------------------------------------------------------------------------
// fulfillOrder
// ---------------------------------------------------------------------------

/**
 * Fulfill a payment order after Paystack confirms success.
 * 1. Load payment_order by reference.
 * 2. Verify amount_kobo matches Paystack data.
 * 3. Verify currency is NGN.
 * 4. Call the apply_payment DB RPC (idempotent).
 * 5. Update order status to 'successful'.
 */
export async function fulfillOrder(
  reference: string,
  paystackData: PaystackVerifyData
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Step 1: Load order
  const { data: order, error: loadError } = await supabase
    .from('payment_orders')
    .select('id, user_id, reference, amount_kobo, currency, status')
    .eq('reference', reference)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Failed to load payment order: ${loadError.message}`);
  }
  if (!order) {
    throw new Error(`Payment order not found for reference: ${reference}`);
  }

  // Step 2: Verify amount
  if (order.amount_kobo !== paystackData.amount) {
    throw new Error(
      `Amount mismatch: order=${order.amount_kobo} kobo, Paystack=${paystackData.amount} kobo`
    );
  }

  // Step 3: Verify currency
  if (paystackData.currency !== 'NGN') {
    throw new Error(`Invalid currency: expected NGN, got ${paystackData.currency}`);
  }

  // Step 4: Apply payment via idempotent DB RPC
  const { error: rpcError } = await supabase.rpc('apply_payment', {
    p_payment_order_id: order.id,
    p_paystack_ref: reference
  });

  if (rpcError) {
    throw new Error(`apply_payment RPC failed: ${rpcError.message}`);
  }

  // Step 5 is handled by the DB function (status updated to 'successful' inside apply_payment)
  // but we also update updated_at for consistency
  await supabase
    .from('payment_orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', order.id);
}

// Re-export for convenience
export { verifyTransaction } from './paystack';
export type { PaystackVerifyData };
