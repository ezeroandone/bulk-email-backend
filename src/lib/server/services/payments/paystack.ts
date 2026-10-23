import crypto from 'crypto';
import { privateEnv } from '$lib/server/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  id: number;
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  reference: string;
  amount: number; // in kobo
  currency: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  customer: {
    email: string;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: PaystackInitData;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackVerifyData;
}

// ---------------------------------------------------------------------------
// initializeTransaction
// ---------------------------------------------------------------------------

/**
 * Create a Paystack payment session.
 * Returns {authorization_url, reference} from the Paystack API.
 * Never logs the secret key.
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string }> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${privateEnv.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      currency: 'NGN',
      ...(params.metadata ? { metadata: params.metadata } : {})
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Paystack initialize failed: HTTP ${response.status} — ${text.slice(0, 200)}`);
  }

  const body = (await response.json()) as PaystackInitResponse;

  if (!body.status || !body.data?.authorization_url) {
    throw new Error(`Paystack initialize error: ${body.message ?? 'unknown error'}`);
  }

  return {
    authorization_url: body.data.authorization_url,
    reference: body.data.reference
  };
}

// ---------------------------------------------------------------------------
// verifyTransaction
// ---------------------------------------------------------------------------

/**
 * Re-confirm a transaction with Paystack.
 * Returns the full data object from the Paystack verify endpoint.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  const encodedRef = encodeURIComponent(reference);
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodedRef}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${privateEnv.PAYSTACK_SECRET_KEY}`
      }
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Paystack verify failed: HTTP ${response.status} — ${text.slice(0, 200)}`);
  }

  const body = (await response.json()) as PaystackVerifyResponse;

  if (!body.status || !body.data) {
    throw new Error(`Paystack verify error: ${body.message ?? 'unknown error'}`);
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature
// ---------------------------------------------------------------------------

/**
 * Verify a Paystack webhook signature using HMAC-SHA512.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * Never logs the secret key.
 * Returns true if the signature matches, false otherwise.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!signature) return false;

  const secret = privateEnv.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
