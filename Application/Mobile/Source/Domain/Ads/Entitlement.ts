/**
 * Whether the current user should see no ads at all. No purchase or
 * subscription system exists yet -- this is the single seam every ad
 * placement checks, so wiring a future paid tier only means changing the
 * body of {@link IsAdFree} (and, if it becomes asynchronous/reactive, the
 * subscribable snapshot behind {@link useIsAdFree}, following the same
 * `useSyncExternalStore` shape as {@link useAdsReady}).
 *
 * @module notivex/Domain/Ads/Entitlement
 *
 * @file      Entitlement.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * Whether the current user is entitled to an ad-free experience. Always
       * `false` today. For use outside components (module singletons like
       * {@link AppOpenAdManager}); inside components, prefer
       * {@link useIsAdFree}.
       *
       * @category Ads
       * @since 1.0.0
       */
const IsAdFree = (): boolean => false;

export/**
       * Whether the current user is entitled to an ad-free experience.
       *
       * @category Ads
       * @since 1.0.0
       */
const useIsAdFree = (): boolean => IsAdFree();
