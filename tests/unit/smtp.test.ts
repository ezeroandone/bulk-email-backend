import { describe, it, expect, vi } from 'vitest'

// Mock DNS resolution so the SSRF check can be tested deterministically without
// real network access. Any hostname that reaches DNS resolves to a public IP.
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '8.8.8.8', family: 4 }])
}))

// $app/env/private is aliased to tests/__mocks__/app-env-private.ts in vitest.config.ts
// The mock already sets SMTP_ENCRYPTION_KEY to '0'.repeat(64).

import { validateSmtpHost } from '$lib/server/security/ssrf'
import { encryptPassword, decryptPassword } from '$lib/server/services/smtp/encryption'

describe('validateSmtpHost', () => {
  it('throws for 192.168.1.1', async () => {
    await expect(validateSmtpHost('192.168.1.1')).rejects.toThrow()
  })
  it('throws for 10.0.0.1', async () => {
    await expect(validateSmtpHost('10.0.0.1')).rejects.toThrow()
  })
  it('throws for 127.0.0.1', async () => {
    await expect(validateSmtpHost('127.0.0.1')).rejects.toThrow()
  })
  it('throws for 169.254.169.254', async () => {
    await expect(validateSmtpHost('169.254.169.254')).rejects.toThrow()
  })
  it('throws for localhost', async () => {
    await expect(validateSmtpHost('localhost')).rejects.toThrow()
  })
  it('does NOT throw for smtp.gmail.com (public host)', async () => {
    await expect(validateSmtpHost('smtp.gmail.com')).resolves.toBeUndefined()
  })
})

describe('encryption', () => {
  it('encrypt then decrypt returns original password', () => {
    const password = 'my-secure-password-123!'
    const encrypted = encryptPassword(password)
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(password)
  })
  it('produces different ciphertext each time (random IV)', () => {
    const password = 'same-password'
    const enc1 = encryptPassword(password)
    const enc2 = encryptPassword(password)
    expect(enc1).not.toBe(enc2)
  })
})
