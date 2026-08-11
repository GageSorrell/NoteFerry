/**
 * Grant access — the user hands the Notivex content integration the databases
 * and pages it may write to (a separate Notion authorization from sign-in).
 * Marking onboarding active on mount keeps the flow on screen once a connection
 * is created; on success we move to the sync step.
 *
 * @module notivex/app/grant
 *
 * @file      grant.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { ConnectNotion } from "@/Domain/Connection";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { Token } from "@notivex/ui";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

const GrantScreen = () =>
{
    const Router = UseLazyRouter();
    const { Begin } = useOnboarding();

    const [ Pending, SetPending ] = useState(false);

    /* Beginning onboarding also starts connection/data-source discovery in the
     * shared provider, so it keeps running across the transition to `/sync`. */
    useEffect(Begin, [ Begin ]);

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleGrant()
    {
        try
        {
            SetPending(true);
            await ConnectNotion();
            Router.replace("/sync")();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Notion grant failed", Error);
        }
        finally
        {
            SetPending(false);
        }
    }

    return (
        <OnboardingScreen
            Hero={ require("../../assets/Onboarding/Grant.png") }
            Subtitle="Pick the databases and pages Notivex can write to — nothing else is ever touched."
            Title="Give Notivex a place to write">
            <View style={ styles.spacer } />
            <Body
                Color={ Token.Semantic.Muted }
                Style={ styles.note }>
                You can change what&apos;s shared anytime, right from Notion.
            </Body>
            <Button
                Appearance="Primary"
                Disabled={ Pending }
                OnPress={ () => void HandleGrant() }
                Style={ styles.cta }>
                Choose pages in Notion
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
    note:
    {
        textAlign: "center"
    },
    spacer:
    {
        flex: 1
    }
});

export default GrantScreen;
