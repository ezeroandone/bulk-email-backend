/**
 * AES-256-GCM encryption/decryption for SMTP passwords.
 * Key must be a 32-byte hex string stored in SMTP_ENCRYPTION_KEY env var.
 * Ciphertext is stored as: base64(iv || authTag || ciphertext)
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { privateEnv } from '$lib/server/env';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const TAG_BYTES = 16;

function getKey(): Uint8Array {
  const hex = privateEnv.SMTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'SMTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/**
 * Encrypt a plaintext string.
 * @returns Base64-encoded blob: iv (12 bytes) + authTag (16 bytes) + ciphertext
 */
export function encryptPassword(plaintext: string): string {
  const key = getKey();
  const ivBuf = randomBytes(IV_BYTES);
  const iv = new Uint8Array(ivBuf);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encBufs: Uint8Array[] = [
    new Uint8Array(cipher.update(plaintext, 'utf8')),
    new Uint8Array(cipher.final())
  ];
  const tag = new Uint8Array(cipher.getAuthTag());

  // Pack: iv | tag | ciphertext
  const totalLen = IV_BYTES + TAG_BYTES + encBufs[0].length + encBufs[1].length;
  const packed = new Uint8Array(totalLen);
  let offset = 0;
  packed.set(iv, offset);          offset += IV_BYTES;
  packed.set(tag, offset);         offset += TAG_BYTES;
  packed.set(encBufs[0], offset);  offset += encBufs[0].length;
  packed.set(encBufs[1], offset);

  return Buffer.from(packed).toString('base64');
}

/**
 * Decrypt a base64-encoded blob produced by {@link encryptPassword}.
 * Throws if the ciphertext is tampered (authTag mismatch).
 */
export function decryptPassword(blob: string): string {
  const key = getKey();
  const packedBuf = Buffer.from(blob, 'base64');
  const packed = new Uint8Array(packedBuf);

  if (packed.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error('Invalid encrypted credential: payload too short.');
  }

  const iv         = new Uint8Array(packed.subarray(0, IV_BYTES));
  const tag        = new Uint8Array(packed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  const ciphertext = new Uint8Array(packed.subarray(IV_BYTES + TAG_BYTES));

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const dec1 = new Uint8Array(decipher.update(ciphertext));
  const dec2 = new Uint8Array(decipher.final());

  const result = new Uint8Array(dec1.length + dec2.length);
  result.set(dec1, 0);
  result.set(dec2, dec1.length);

  return Buffer.from(result).toString('utf8');
}
