import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { createOrder } from '$lib/server/services/payments/orders';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Require authentication
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let packageId: string;
  try {
    const body = (await request.json()) as { packageId?: unknown };
    if (!body.packageId || typeof body.packageId !== 'string') {
      return json({ error: 'packageId is required' }, { status: 400 });
    }
    packageId = body.packageId;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Create order and get Paystack checkout URL
  try {
    const { order, checkoutUrl } = await createOrder(session.user.id, packageId);
    return json({ checkoutUrl, reference: order.reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initialize payment';
    // Return 400 for user-facing errors (package not found, etc), 500 for unexpected
    const status = message.includes('not found') || message.includes('not available') ? 400 : 500;
    return json({ error: message }, { status });
  }
};
