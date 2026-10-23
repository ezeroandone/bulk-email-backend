import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// $app/env/private is aliased to tests/__mocks__/app-env-private.ts in vitest.config.ts
// The mock sets PAYSTACK_SECRET_KEY to 'test_webhook_secret'.

import { verifyWebhookSignature } from '$lib/server/services/payments/paystack'

describe('verifyWebhookSignature', () => {
  const secret = 'test_webhook_secret'
  const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'test-ref' } }))
  const validSig = crypto.createHmac('sha512', secret).update(body).digest('hex')

  it('returns true for valid signature', () => {
    expect(verifyWebhookSignature(body, validSig)).toBe(true)
  })
  it('returns false for tampered signature', () => {
    expect(verifyWebhookSignature(body, 'tampered_signature')).toBe(false)
  })
  it('returns false for tampered body', () => {
    const tamperedBody = Buffer.from('tampered body')
    expect(verifyWebhookSignature(tamperedBody, validSig)).toBe(false)
  })
})
