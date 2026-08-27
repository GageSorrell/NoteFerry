/**
 * Adaptive banner ad, gated on ad-free entitlement and ads-runtime readiness.
 * Renders nothing (no wrapper markup, no reserved layout space) whenever it
 * has nothing to show, including after a load failure.
 *
 * @module noteferry/Component/Ads/BannerAdSlot
 *
 * @file      BannerAdSlot.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type BannerPlacement, ResolveAdUnitId } from "@/Domain/Ads/AdUnits";
import { useAdsReady } from "@/Domain/Ads/AdsRuntime";
import { useEffect, useState } from "react";
import { useIsAdFree } from "@/Domain/Ads/Entitlement";
import { LoadGoogleMobileAds, type GoogleMobileAdsModule } from "@/Domain/Ads/GoogleMobileAds";

/** {@inheritDoc BannerAdSlot} */
export interface BannerAdSlotProps
{
    readonly Placement: BannerPlacement;
}

export/**
       * Renders an anchored adaptive banner for a banner placement.
       *
       * @category Components
       * @since 1.0.0
       */
const BannerAdSlot = ({ Placement }: BannerAdSlotProps): React.JSX.Element | null =>
{
    const IsAdFree = useIsAdFree();
    const IsAdsReady = useAdsReady();
    const [ HasError, SetHasError ] = useState(false);
    const [ AdsModule, SetAdsModule ] = useState<GoogleMobileAdsModule | null>(null);
    const UnitId = ResolveAdUnitId(Placement);

    useEffect(() =>
    {
        if (IsAdFree || !IsAdsReady)
        {
            return;
        }

        let Cancelled = false;
        void LoadGoogleMobileAds()
            .then((Module) =>
            {
                if (!Cancelled) SetAdsModule(Module);
            })
            .catch(() => SetHasError(true));

        return () => { Cancelled = true; };
    }, [ IsAdFree, IsAdsReady ]);

    if (IsAdFree || !IsAdsReady || UnitId === null || HasError || AdsModule === null)
    {
        return null;
    }

    const { BannerAd, BannerAdSize } = AdsModule;

    return (
        <BannerAd
            onAdFailedToLoad={ () => SetHasError(true) }
            size={ BannerAdSize.ANCHORED_ADAPTIVE_BANNER }
            unitId={ UnitId }
        />
    );
};
