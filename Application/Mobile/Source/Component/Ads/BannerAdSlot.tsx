/**
 * Adaptive banner ad, gated on ad-free entitlement and ads-runtime readiness.
 * Renders nothing (no wrapper markup, no reserved layout space) whenever it
 * has nothing to show, including after a load failure.
 *
 * @module notivex/Component/Ads/BannerAdSlot
 *
 * @file      BannerAdSlot.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { type BannerPlacement, ResolveAdUnitId, useAdsReady, useIsAdFree } from "@/Domain/Ads";
import { useState } from "react";

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
    const UnitId = ResolveAdUnitId(Placement);

    if (IsAdFree || !IsAdsReady || UnitId === null || HasError)
    {
        return null;
    }

    return (
        <BannerAd
            onAdFailedToLoad={ () => SetHasError(true) }
            size={ BannerAdSize.ANCHORED_ADAPTIVE_BANNER }
            unitId={ UnitId }
        />
    );
};
