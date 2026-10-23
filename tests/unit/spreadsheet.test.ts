import { describe, it, expect } from 'vitest'
import { normalizeColumnName, detectColumns } from '$lib/server/services/spreadsheets/normalizer'
import { validateRows } from '$lib/server/services/spreadsheets/validator'

describe('normalizeColumnName', () => {
  it('normalizes "First Name" to "first_name"', () => {
    expect(normalizeColumnName('First Name')).toBe('first_name')
  })
  it('normalizes "Mem. No." to "mem_no"', () => {
    expect(normalizeColumnName('Mem. No.')).toBe('mem_no')
  })
  it('normalizes "Certificate ID" to "certificate_id"', () => {
    expect(normalizeColumnName('Certificate ID')).toBe('certificate_id')
  })
  it('normalizes "  Full  Name  " to "full_name"', () => {
    expect(normalizeColumnName('  Full  Name  ')).toBe('full_name')
  })
  it('deduplicates: two "Name" columns become "name" and "name_2"', () => {
    const cols = detectColumns(['Name', 'Name'])
    expect(cols[0].normalized).toBe('name')
    expect(cols[1].normalized).toBe('name_2')
  })
})

describe('validateRows', () => {
  // validateRows(rows, columns, emailCol) — columns can be empty [] when not
  // testing identifier-column warnings; emailCol is the normalized column name.

  it('flags invalid email', () => {
    const result = validateRows([{ email: 'not-an-email', name: 'Test' }], [], 'email')
    expect(result.invalid.length).toBeGreaterThan(0)
  })
  it('flags empty email', () => {
    const result = validateRows([{ email: '', name: 'Test' }], [], 'email')
    expect(result.invalid.length).toBeGreaterThan(0)
  })
  it('flags duplicate emails', () => {
    const result = validateRows(
      [
        { email: 'test@example.com', name: 'A' },
        { email: 'test@example.com', name: 'B' }
      ],
      [],
      'email'
    )
    expect(result.duplicateEmails.length).toBeGreaterThan(0)
  })
  it('preserves leading zeros in membership numbers', () => {
    const result = validateRows(
      [{ email: 'test@example.com', mem_no: '001234' }],
      [],
      'email'
    )
    const row = result.valid[0]
    expect(row.data['mem_no']).toBe('001234')
  })
})
