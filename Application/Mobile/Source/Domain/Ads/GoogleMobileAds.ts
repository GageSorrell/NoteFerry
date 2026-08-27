/**
 * Lazy boundary around the native Google Mobile Ads package. Keeping this
 * import behind a shared promise prevents the SDK's JavaScript module graph
 * from being evaluated during the app's synchronous startup path.
 *
 * @module noteferry/Domain/Ads/GoogleMobileAds
 *
 * @file      GoogleMobileAds.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export type GoogleMobileAdsModule = typeof import("react-native-google-mobile-ads");

let ModulePromise: Promise<GoogleMobileAdsModule> | null = null;

export const LoadGoogleMobileAds = (): Promise<GoogleMobileAdsModule> =>
{
    ModulePromise ??= import("react-native-google-mobile-ads");
    return ModulePromise;
};
