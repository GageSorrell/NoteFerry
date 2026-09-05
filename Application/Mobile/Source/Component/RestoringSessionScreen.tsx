/**
 * Branded full-screen shown while the locally-persisted Supabase session is
 * being restored. Replaces a bare spinner-on-blank-background so a slow
 * cold-start storage read still looks like NoteFerry, not a frozen or blank
 * screen. If the restore is taking longer than usual, reveals a retry action
 * and a path to continue without waiting, rather than leaving the user
 * staring at a spinner with no recourse — the native splash is already gone
 * by the time this renders (see `App/_layout.tsx`), so this *is* the app's
 * first paint for a user whose session takes a moment to come back.
 *
 * @module noteferry/Component/RestoringSessionScreen
 *
 * @file      RestoringSessionScreen.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Button } from "@noteferry/ui/Primitive/Button";
import { Caption } from "@noteferry/ui/Primitive/Text";
import { Image } from "expo-image";
import type React from "react";
import { Screen } from "./Screen";
import { Spinner } from "@noteferry/ui/Primitive/Spinner";
import { View } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "@noteferry/ui/Core";
import { useTranslation } from "react-i18next";

/* How long to keep showing just the logo and spinner before offering a way
 * out. Short enough that an impatient user on a slow device isn't stuck
 * watching a spinner do nothing, but long enough that it doesn't flash on a
 * normal, healthy restore. */
const GracePeriodMs = 2000;

/** {@inheritDoc RestoringSessionScreen} */
export interface RestoringSessionScreenProps
{
    /**
     * Lets the user proceed without waiting for the session restore to
     * finish. Omit to hide that action entirely (e.g. while the screen is
     * shown for a different, non-auth reason).
     */
    readonly OnContinueSignedOut?: (() => void) | undefined;

    /** Re-attempts the session restore from scratch. Omit to hide "Retry". */
    readonly OnRetry?: (() => void) | undefined;
}

export/**
       * @category Component
       * @since 1.0.0
       */
const RestoringSessionScreen = ({
    OnContinueSignedOut,
    OnRetry
}: RestoringSessionScreenProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const { t } = useTranslation("common");
    const [ ShowSlowState, SetShowSlowState ] = useState(false);

    useEffect(() =>
    {
        const Timer = setTimeout(() => SetShowSlowState(true), GracePeriodMs);

        return () => clearTimeout(Timer);
    }, [ ]);

    const OfferActions = ShowSlowState && (OnRetry !== undefined || OnContinueSignedOut !== undefined);

    return (
        <Screen OuterProps={ { style: { backgroundColor: Theme.Semantic.BackgroundMain } } }>
            <View
                accessibilityLabel={ t("loading") }
                style={ {
                    alignItems: "center",
                    flex: 1,
                    gap: 20,
                    justifyContent: "center"
                } }>
                <Image
                    source={ Theme.Mode === "Dark"
                        ? require("../../Resource/Logo/NoteFerryLogoDark.png")
                        : require("../../Resource/Logo/NoteFerryLogoLight.png") }
                    style={ { height: 56, width: 56 } }
                />
                <Spinner Size={ 24 } />
                {
                    OfferActions &&
                    <View style={ { alignItems: "center", gap: 12, marginTop: 12 } }>
                        <Caption Style={ { textAlign: "center" } }>
                            { t("restoringSession.slow") }
                        </Caption>
                        <View style={ { flexDirection: "row", gap: 12 } }>
                            {
                                OnRetry !== undefined &&
                                <Button Appearance="Hint" OnPress={ OnRetry } Size="Small">
                                    { t("restoringSession.retry") }
                                </Button>
                            }
                            {
                                OnContinueSignedOut !== undefined &&
                                <Button Appearance="Link" OnPress={ OnContinueSignedOut } Size="Small">
                                    { t("restoringSession.continueSignedOut") }
                                </Button>
                            }
                        </View>
                    </View>
                }
            </View>
        </Screen>
    );
};

RestoringSessionScreen.displayName = "RestoringSessionScreen";
