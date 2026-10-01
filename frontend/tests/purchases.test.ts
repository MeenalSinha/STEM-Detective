import { describe, it, expect, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' } }))
vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {}, LOG_LEVEL: { DEBUG: 'DEBUG' },
  PACKAGE_TYPE: { ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY', CUSTOM: 'CUSTOM' },
}))

import { mapOffering, hasProEntitlement, initPurchases } from '../lib/purchases'
import { toGameError } from '../lib/game/errors'

const pkg = (id: string, type: string, price: number, str: string, perMonth?: string, intro?: unknown) => ({
  identifier: id, packageType: type, offeringIdentifier: 'default',
  product: { title: id, price, priceString: str, pricePerMonthString: perMonth ?? null, introPrice: intro ?? null },
})

describe('mapOffering', () => {
  it('maps store prices as given and never invents prices', () => {
    const o = mapOffering({ availablePackages: [pkg('m', 'MONTHLY', 4.99, '$4.99'), pkg('a', 'ANNUAL', 29.99, '$29.99', '$2.50')] } as never)!
    expect(o.packages.map((p) => p.priceString)).toEqual(['$29.99', '$4.99'])
    expect(o.packages[0].kind).toBe('annual')
  })
  it('computes annual saving from real prices', () => {
    const o = mapOffering({ availablePackages: [pkg('m', 'MONTHLY', 5, '$5'), pkg('a', 'ANNUAL', 30, '$30')] } as never)!
    expect(o.annualSavingsPct).toBe(50)
  })
  it('hides the saving badge when annual is not cheaper', () => {
    const o = mapOffering({ availablePackages: [pkg('m', 'MONTHLY', 5, '$5'), pkg('a', 'ANNUAL', 61, '$61')] } as never)!
    expect(o.annualSavingsPct).toBeNull()
  })
  it('returns null for missing or empty offerings', () => {
    expect(mapOffering(null)).toBeNull()
    expect(mapOffering({ availablePackages: [] } as never)).toBeNull()
  })
  it('describes free trials from store intro pricing', () => {
    const o = mapOffering({ availablePackages: [pkg('a', 'ANNUAL', 30, '$30', undefined, { price: 0, periodNumberOfUnits: 7, periodUnit: 'DAY' })] } as never)!
    expect(o.packages[0].introText).toBe('7 day free trial')
  })
})

describe('entitlement + platform', () => {
  it('detects the pro entitlement only when active', () => {
    expect(hasProEntitlement({ entitlements: { active: { pro: {} } } } as never)).toBe(true)
    expect(hasProEntitlement({ entitlements: { active: {} } } as never)).toBe(false)
  })
  it('reports unavailable on web instead of faking a purchase', async () => {
    expect(await initPurchases('u1')).toBe('unavailable_web')
  })
})

describe('toGameError', () => {
  const ax = (status?: number, data?: unknown, code?: string) => ({ isAxiosError: true, code, response: status ? { status, data } : undefined })
  it('classifies offline and timeout', () => {
    expect(toGameError(ax()).kind).toBe('offline')
    expect(toGameError(ax(undefined, undefined, 'ECONNABORTED')).kind).toBe('timeout')
  })
  it('extracts PRO_REQUIRED with its feature', () => {
    const e = toGameError(ax(403, { detail: { code: 'PRO_REQUIRED', feature: 'advanced_lab', message: 'x' } }))
    expect(e).toMatchObject({ kind: 'pro', feature: 'advanced_lab', retryable: false })
  })
  it('maps AI outage and server errors to retryable states', () => {
    expect(toGameError(ax(503, { code: 'AI_UNAVAILABLE' })).kind).toBe('ai')
    expect(toGameError(ax(500, {})).retryable).toBe(true)
  })
})
