/**
 * Sequencing for Google's UMP (User Messaging Platform) consent flow and iOS
 * App Tracking Transparency. Both must resolve before the Mobile Ads SDK
 * initializes ({@link InitializeAdsRuntime}) so ads are requested with the
 * user's actual consent/tracking choice from the first request onward.
 *
 * @module noteferry/Domain/Ads/AdConsent
 *
 * @file      AdConsent.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AdsConsent, AdsConsentDebugGeography } from "react-native-google-mobile-ads";
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from
    "expo-tracking-transparency";
import { Platform } from "react-native";

/** {@inheritDoc GatherConsent} */
export interface ConsentResult
{
    readonly CanRequestAds: boolean;
}

export/**
       * Requests a consent-info update and shows the UMP form if the user's
       * region requires one. A failure here must never block ad requests --
       * per Google's own guidance, the SDK falls back to whatever consent
       * state it already has, so this always resolves rather than rejecting.
       *
       * @category Ads
       * @since 1.0.0
       */
const GatherConsent = async (): Promise<ConsentResult> =>
{
    try
    {
        await AdsConsent.requestInfoUpdate({
            /* Only exercises the EEA consent-form path in development, so it
             * can be tested without a VPN. Production always uses the real
             * geography Google detects from the device. */
            debugGeography: __DEV__
                ? AdsConsentDebugGeography.EEA
                : AdsConsentDebugGeography.DISABLED
        });
        await AdsConsent.gatherConsent();
    }
    catch (Error)
    {
        /* eslint-disable-next-line no-console */
        console.error("Failed to gather AdMob consent", Error);
    }

    try
    {
        const { canRequestAds: CanRequestAds } = await AdsConsent.getConsentInfo();

        return { CanRequestAds };
    }
    catch
    {
        /* No consent info at all (e.g. first run before any network call
         * succeeded) -- default to allowing ad requests rather than blocking
         * ads entirely; the SDK still serves non-personalized ads under UMP
         * when personalized consent was never obtained. */
        return { CanRequestAds: true };
    }
};

export/**
       * Requests iOS App Tracking Transparency permission if the user has not
       * already been asked. No-op on Android, which has no ATT concept, and
       * on a user who is already `granted`/`denied` (never re-prompts).
       *
       * @category Ads
       * @since 1.0.0
       */
const RequestTrackingIfNeeded = async (): Promise<void> =>
{
    if (Platform.OS !== "ios")
    {
        return;
    }

    try
    {
        const Current = await getTrackingPermissionsAsync();

        if (Current.status === "undetermined")
        {
            await requestTrackingPermissionsAsync();
        }
    }
    catch (Error)
    {
        /* eslint-disable-next-line no-console */
        console.error("Failed to request tracking permission", Error);
    }
};
