import { describe, it, expect } from 'vitest'
import { substituteVariables } from '$lib/server/services/campaigns/variableSubstitution'

describe('substituteVariables', () => {
  const data = { first_name: 'Alice', last_name: 'Smith', role: 'member' }

  it('substitutes {{first_name}}', () => {
    expect(substituteVariables('Hello {{first_name}}', data)).toBe('Hello Alice')
  })
  it('applies |upper formatter', () => {
    expect(substituteVariables('{{first_name|upper}}', data)).toBe('ALICE')
  })
  it('applies |title formatter', () => {
    expect(substituteVariables('{{first_name|title}}', data)).toMatch(/^Alice$/)
  })
  it('applies |lower formatter', () => {
    expect(substituteVariables('{{first_name|lower}}', data)).toBe('alice')
  })
  it('applies |default:Guest when variable missing', () => {
    expect(substituteVariables('{{unknown|default:Guest}}', data)).toBe('Guest')
  })
  it('returns empty string for unknown variable with no default', () => {
    expect(substituteVariables('{{unknown_var}}', data)).toBe('')
  })
})
