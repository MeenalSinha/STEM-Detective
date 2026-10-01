/**
 * RevenueCat integration (Capacitor).
 *
 * Responsibilities
 *  - configure the SDK once, then logIn(<backend user id>) so RevenueCat's app_user_id == users.id
 *    (this is what lets the backend verify entitlements and receive webhooks for the same user)
 *  - load the current Offering and map it to UI-ready packages. Prices are ALWAYS taken from
 *    the store via RevenueCat, never hardcoded.
 *  - purchase / restore with explicit success | cancelled | error outcomes
 *
 * The SDK only works on iOS/Android. On the web we report `unavailable_web` and never fake
 * a purchase: entitlement on web still comes from the server.
 *
 * Pricing strategy and entitlement model: see docs/MONETIZATION.md.
 */
import { Capacitor } from '@capacitor/core'
import {
  Purchases, LOG_LEVEL, PACKAGE_TYPE,
  type CustomerInfo, type PurchasesOffering, type PurchasesPackage,
} from '@revenuecat/purchases-capacitor'

export const ENTITLEMENT_ID = process.env.NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'pro'
const OFFERING_ID = process.env.NEXT_PUBLIC_REVENUECAT_OFFERING_ID || ''

export type BillingStatus = 'unavailable_web' | 'not_configured' | 'ready' | 'error'

export interface PaywallPackage {
  id: string
  kind: 'annual' | 'monthly' | 'other'
  title: string
  priceString: string
  perMonthString: string | null
  price: number
  introText: string | null
  pkg: PurchasesPackage
}

export interface LoadedOffering {
  packages: PaywallPackage[]
  /** Real annual saving vs 12x monthly, computed from store prices; null if not derivable */
  annualSavingsPct: number | null
}

let configuredFor: string | null = null

export function isNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

function sdkKey(): string {
  const platform = Capacitor.getPlatform()
  return (platform === 'ios'
    ? process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_IOS
    : process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_ANDROID) || ''
}

/** Configure RevenueCat and identify the user. Safe to call repeatedly. */
export async function initPurchases(appUserId: string): Promise<BillingStatus> {
  if (!isNative()) return 'unavailable_web'
  const apiKey = sdkKey()
  if (!apiKey) return 'not_configured'
  try {
    if (configuredFor === null) {
      if (process.env.NODE_ENV !== 'production') await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
      await Purchases.configure({ apiKey, appUserID: appUserId })
    } else if (configuredFor !== appUserId) {
      await Purchases.logIn({ appUserID: appUserId })
    }
    configuredFor = appUserId
    return 'ready'
  } catch {
    return 'error'
  }
}

export async function signOutPurchases(): Promise<void> {
  if (!isNative() || configuredFor === null) return
  try { await Purchases.logOut() } catch { /* anonymous already */ }
  configuredFor = null
}

export function hasProEntitlement(info: CustomerInfo): boolean {
  return Boolean(info.entitlements?.active?.[ENTITLEMENT_ID])
}

function kindOf(t: PACKAGE_TYPE): PaywallPackage['kind'] {
  return t === PACKAGE_TYPE.ANNUAL ? 'annual' : t === PACKAGE_TYPE.MONTHLY ? 'monthly' : 'other'
}

/** Pure mapping, unit-tested without the native plugin. */
export function mapOffering(offering: PurchasesOffering | null | undefined): LoadedOffering | null {
  if (!offering || !offering.availablePackages?.length) return null
  const packages: PaywallPackage[] = offering.availablePackages.map((p) => {
    const kind = kindOf(p.packageType)
    const intro = p.product.introPrice
    return {
      id: p.identifier,
      kind,
      title: kind === 'annual' ? 'Annual' : kind === 'monthly' ? 'Monthly' : p.product.title,
      priceString: p.product.priceString,
      perMonthString: p.product.pricePerMonthString ?? null,
      price: p.product.price,
      introText: intro ? `${intro.periodNumberOfUnits} ${String(intro.periodUnit).toLowerCase()} ${intro.price === 0 ? 'free trial' : 'intro offer'}` : null,
      pkg: p,
    }
  })
  packages.sort((a, b) => (a.kind === 'annual' ? -1 : 0) - (b.kind === 'annual' ? -1 : 0))
  const annual = packages.find((p) => p.kind === 'annual')
  const monthly = packages.find((p) => p.kind === 'monthly')
  const annualSavingsPct =
    annual && monthly && monthly.price > 0
      ? Math.round((1 - annual.price / (monthly.price * 12)) * 100)
      : null
  return { packages, annualSavingsPct: annualSavingsPct && annualSavingsPct > 0 ? annualSavingsPct : null }
}

export async function loadOffering(): Promise<LoadedOffering | null> {
  const offerings = await Purchases.getOfferings()
  const chosen = OFFERING_ID ? offerings.all?.[OFFERING_ID] : offerings.current
  return mapOffering(chosen ?? offerings.current)
}

export type PurchaseOutcome =
  | { outcome: 'success'; isPro: boolean }
  | { outcome: 'cancelled' }
  | { outcome: 'error'; message: string }

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return { outcome: 'success', isPro: hasProEntitlement(customerInfo) }
  } catch (err) {
    const e = err as { userCancelled?: boolean | null; message?: string }
    if (e?.userCancelled) return { outcome: 'cancelled' }
    return { outcome: 'error', message: e?.message || 'The purchase could not be completed. You have not been charged.' }
  }
}

export async function restore(): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    return { outcome: 'success', isPro: hasProEntitlement(customerInfo) }
  } catch (err) {
    return { outcome: 'error', message: (err as Error)?.message || 'Restore failed. Check your connection and try again.' }
  }
}
