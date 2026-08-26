/**
 * Session-only record of the last time any full-screen ad (interstitial or
 * app open) was shown. Both {@link AppOpenAdManager} and
 * {@link InterstitialPlacements} read this so the two formats mutually
 * respect one cooldown, regardless of which fired first -- an app-open ad
 * should not immediately follow an interstitial the user just dismissed, or
 * vice versa.
 *
 * @module noteferry/Domain/Ads/AdActivity
 *
 * @file      AdActivity.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

let LastShownAt: number | null = null;

export/**
       * Records that a full-screen ad was just shown.
       *
       * @category Ads
       * @since 1.0.0
       */
const RecordFullScreenAdShown = (): void =>
{
    LastShownAt = Date.now();
};

export/**
       * Milliseconds since the last full-screen ad was shown this session, or
       * `Infinity` if none has been shown yet.
       *
       * @category Ads
       * @since 1.0.0
       */
const GetMillisecondsSinceLastFullScreenAd = (): number =>
    LastShownAt === null ? Infinity : Date.now() - LastShownAt;
