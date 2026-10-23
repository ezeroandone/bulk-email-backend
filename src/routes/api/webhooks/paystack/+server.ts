import { json } from '@sveltejs/kit';
import { verifyWebhookSignature, verifyTransaction } from '$lib/server/services/payments/paystack';
import { fulfillOrder } from '$lib/server/services/payments/orders';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // Step 1: Read raw body as Buffer
  const arrayBuffer = await request.arrayBuffer();
  const rawBody = Buffer.from(arrayBuffer);

  // Step 2: Get signature header
  const signature = request.headers.get('x-paystack-signature') ?? '';

  // Step 3: Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Step 4: Parse event
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody.toString('utf8')) as typeof event;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Step 5: Only handle charge.success
  if (event.event !== 'charge.success') {
    return json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return json({ received: true });
  }

  const supabase = createSupabaseAdminClient();
  const idempotencyKey = `charge.success:${reference}`;

  try {
    // Step 6: Check payment_events for idempotency
    const { data: existing } = await supabase
      .from('payment_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      // Already processed — return 200 immediately
      return json({ received: true });
    }

    // Step 7: Re-verify with Paystack
    const verifyData = await verifyTransaction(reference);

    if (verifyData.status !== 'success') {
      // Not actually successful — log and ignore
      console.error(`[webhook] Transaction ${reference} status is ${verifyData.status}, not success`);
      return json({ received: true });
    }

    // Step 8: Fulfill the order
    await fulfillOrder(reference, verifyData);

    // Step 9: Record the event (idempotency guard)
    await supabase.from('payment_events').insert({
      reference,
      event_type: 'charge.success',
      raw_payload: event as Record<string, unknown>,
      processed: true,
      processed_at: new Date().toISOString(),
      idempotency_key: idempotencyKey
    });
  } catch (err) {
    // Step 11: Return 200 on unexpected error so Paystack doesn't retry indefinitely.
    // Log without sensitive data.
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error(`[webhook] Error processing charge.success for reference ${reference}: ${message}`);
    return json({ received: true });
  }

  // Step 10: Success
  return json({ received: true });
};
