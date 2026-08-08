/**
 * You're all set — the final onboarding screen. Refreshing the connection here
 * flips the derived stage over to the app, and marking onboarding complete lets
 * the navigator swap onboarding out for the home screen.
 *
 * @module notivex/app/done
 *
 * @file      done.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { StyleSheet, View } from "react-native";
import { Button } from "@notivex/ui/Primitive";
import type { ImageAsset } from "@/Domain/Utility";
import { OnboardingCopy } from "@/features/onboarding/copy";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const Copy = OnboardingCopy.Done;

const DoneScreen = () =>
{
    const { Complete, RefetchConnection } = useOnboarding();
    const [ Pending, SetPending ] = useState(false);

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleStart()
    {
        SetPending(true);
        await RefetchConnection();
        Complete();
    }

    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle={ Copy.Body }
            Title={ Copy.Title }>
            <View style={ styles.spacer } />
            <Button
                Appearance="Primary"
                Disabled={ Pending }
                OnPress={ HandleStart }
                Style={ styles.cta }>
                { Copy.Cta }
            </Button>
        </OnboardingScreen>
    );
};

const styles = StyleSheet.create({
    cta:
    {
        alignSelf: "stretch",
        minHeight: 48
    },
    spacer:
    {
        flex: 1
    }
});

export default DoneScreen;
