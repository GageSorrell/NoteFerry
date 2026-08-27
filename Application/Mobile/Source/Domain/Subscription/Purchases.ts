/**
 * Shared lazy boundary for RevenueCat. The subscription provider is mounted
 * at the root, but the native purchases SDK does not need to evaluate until
 * a signed-in session is being synchronized or the user invokes a store
 * action.
 *
 * @module noteferry/Domain/Subscription/Purchases
 *
 * @file      Purchases.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export type PurchasesModule = typeof import("react-native-purchases");

let ModulePromise: Promise<PurchasesModule> | null = null;

export const LoadPurchases = (): Promise<PurchasesModule> =>
{
    ModulePromise ??= import("react-native-purchases");
    return ModulePromise;
};
