import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// RevenueCat public SDK keys — safe to ship in the app bundle (these are not secret,
// same as a Stripe publishable key). Get them from RevenueCat dashboard → Project → API keys,
// after linking your App Store Connect and Google Play Console apps.
const REVENUECAT_API_KEYS = {
  ios: 'appl_REPLACE_WITH_IOS_KEY',
  android: 'goog_REPLACE_WITH_ANDROID_KEY',
};

// The entitlement identifier configured in RevenueCat dashboard → Entitlements.
// This should map to both the iOS and Android "$9.99/month Pro" products.
export const PRO_ENTITLEMENT_ID = 'pro';

let configured = false;

/**
 * Call once, as early as possible (e.g. in App.tsx on mount), before checking
 * entitlements or showing the paywall.
 */
export function configurePurchases(appUserId?: string) {
  if (configured) return;
  const apiKey = Platform.select({ ios: REVENUECAT_API_KEYS.ios, android: REVENUECAT_API_KEYS.android });
  if (!apiKey || apiKey.includes('REPLACE_WITH')) {
    console.warn('[purchases] RevenueCat API key not configured yet — purchases are disabled.');
    return;
  }
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

/**
 * Link the RevenueCat anonymous user to the person's email once we know it
 * (right after the free-estimate email gate), so purchases survive reinstalls
 * and can be cross-referenced with the Supabase `users` table by email.
 */
export async function identifyPurchaser(email: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(email);
    return customerInfo;
  } catch (e) {
    console.warn('[purchases] logIn failed', e);
    return null;
  }
}

export async function getProOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return null;
  }
}

export async function purchasePro(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string; userCancelled?: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: isProActive(customerInfo), customerInfo };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    return { success: false, error: e?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: isProActive(customerInfo), customerInfo };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Restore failed' };
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[purchases] getCustomerInfo failed', e);
    return null;
  }
}

export function isProActive(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo) return false;
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

/**
 * Deep link into the native subscription-management screen. Cancellation itself
 * must happen through Apple/Google (StoreKit doesn't allow cancelling via API),
 * so "Manage / Cancel Subscription" in the app should open this, not a Stripe portal.
 */
export function manageSubscriptionUrl(): string {
  return Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
}
