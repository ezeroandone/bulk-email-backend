import { describe, it, expect } from 'vitest'
import {
  normalizeForMatch,
  matchDocumentsToRecipients
} from '$lib/server/services/documents/matcher'
import type { FileEntry, RecipientRow, MatchRule } from '$lib/server/services/documents/matcher'
import { extractZip } from '$lib/server/services/documents/zipExtractor'
import JSZip from 'jszip'

// ── Minimal stored-ZIP builder ──────────────────────────────────────────────
// JSZip normalizes `../` path components on load, which would mask the path
// traversal guard in extractZip. To exercise the guard we build a raw stored
// (method = 0) ZIP archive whose entry name is a literal traversal path.
// @types/node has no `crc32` declaration, so we compute CRC32 ourselves.

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function u16(n: number): Buffer {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(n, 0)
  return b
}

function u32(n: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n, 0)
  return b
}

/** Build a valid stored (uncompressed) ZIP archive from the given entries. */
function buildStoredZip(entries: { name: string; data: string }[]): Buffer {
  const locals: Buffer[] = []
  const cds: Buffer[] = []
  let offset = 0

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8')
    const data = Buffer.from(e.data, 'utf8')
    const crc = crc32(data)

    const lh = Buffer.concat([
      u32(0x04034b50), // local file header signature
      u16(20), // version needed
      u16(0), // flags
      u16(0), // method (stored)
      u16(0), // mod time
      u16(0), // mod date
      u32(crc),
      u32(data.length), // compressed size
      u32(data.length), // uncompressed size
      u16(nameBuf.length),
      u16(0), // extra field length
      nameBuf,
      data
    ])
    locals.push(lh)

    const cd = Buffer.concat([
      u32(0x02014b50), // central directory signature
      u16(20), // version made by
      u16(20), // version needed
      u16(0), // flags
      u16(0), // method
      u16(0), // mod time
      u16(0), // mod date
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk number start
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(offset), // local header offset
      nameBuf
    ])
    cds.push(cd)

    offset += lh.length
  }

  const cdBuf = Buffer.concat(cds)
  const eocd = Buffer.concat([
    u32(0x06054b50), // EOCD signature
    u16(0), // disk number
    u16(0), // disk with cd
    u16(entries.length), // entries on this disk
    u16(entries.length), // total entries
    u32(cdBuf.length), // cd size
    u32(offset), // cd offset
    u16(0) // comment length
  ])

  return Buffer.concat([...locals, cdBuf, eocd])
}

describe('normalizeForMatch', () => {
  it('Adeola_Bello.pdf matches Adeola Bello', () => {
    const norm = normalizeForMatch('Adeola_Bello.pdf')
    expect(norm).toBe(normalizeForMatch('Adeola Bello'))
  })
  it('CERT-001.pdf matches CERT-001', () => {
    const norm = normalizeForMatch('CERT-001.pdf')
    expect(norm).toBe(normalizeForMatch('CERT-001'))
  })
})

describe('matchDocumentsToRecipients', () => {
  const rule: MatchRule = { type: 'full_name', column: 'name' }

  it('returns matched for correct pairs', () => {
    const files: FileEntry[] = [
      { name: 'John_Doe.pdf', storagePath: 'John_Doe.pdf' },
      { name: 'Jane_Smith.pdf', storagePath: 'Jane_Smith.pdf' }
    ]
    const recipients: RecipientRow[] = [
      { id: '1', data: { name: 'John Doe' }, email: 'john@example.com' },
      { id: '2', data: { name: 'Jane Smith' }, email: 'jane@example.com' }
    ]
    const results = matchDocumentsToRecipients(files, recipients, rule)
    const matched = results.filter((r) => r.status === 'matched')
    const unmatched = results.filter((r) => r.status === 'unmatched')
    expect(matched.length).toBe(2)
    expect(unmatched.length).toBe(0)
  })

  it('returns unmatched for missing files', () => {
    const files: FileEntry[] = [{ name: 'John_Doe.pdf', storagePath: 'John_Doe.pdf' }]
    const recipients: RecipientRow[] = [
      { id: '1', data: { name: 'John Doe' }, email: 'john@example.com' },
      { id: '2', data: { name: 'Jane Smith' }, email: 'jane@example.com' }
    ]
    const results = matchDocumentsToRecipients(files, recipients, rule)
    const matched = results.filter((r) => r.status === 'matched')
    const unmatched = results.filter((r) => r.status === 'unmatched')
    expect(matched.length).toBe(1)
    expect(unmatched.length).toBe(1)
  })
})

describe('extractZip security', () => {
  it('rejects path traversal entry containing .. in path', async () => {
    // A raw stored ZIP with a Windows-style traversal entry. JSZip preserves
    // backslash names on load, so the entry key contains '..' and extractZip's
    // guard skips it.
    const buffer = buildStoredZip([
      { name: 'safe.pdf', data: 'safe content' },
      { name: '..\\..\\secret.pdf', data: 'EVIL_TRAVERSAL_CONTENT' }
    ])

    const files = await extractZip(buffer, {
      maxFiles: 50,
      maxTotalBytes: 10_000_000,
      allowedExts: ['.pdf']
    })

    // Only the safe file is extracted.
    expect(files.length).toBe(1)
    expect(files[0].name).toBe('safe.pdf')

    // No extracted path escapes the target directory.
    for (const f of files) {
      expect(f.name).not.toContain('..')
      expect(f.originalPath).not.toContain('..')
    }

    // The traversal entry's content is never returned.
    const leakedEvil = files.find((f) => f.buffer.toString('utf8').includes('EVIL_TRAVERSAL_CONTENT'))
    expect(leakedEvil).toBeUndefined()
  })

  it('rejects a ZIP bomb when uncompressed size exceeds the limit', async () => {
    const zip = new JSZip()
    // A single 50,000-byte file — far above the tiny byte budget below.
    zip.file('big.pdf', Buffer.alloc(50_000, 0x78))
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    await expect(
      extractZip(buffer, {
        maxFiles: 50,
        maxTotalBytes: 1_000,
        allowedExts: ['.pdf']
      })
    ).rejects.toThrow(/exceeds|ZIP bomb/i)
  })
})
