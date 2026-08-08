/**
 * Getting ready — after granting access, Notion can take a few seconds to share
 * the chosen pages. This screen waits calmly (polling discovery for up to ~30s)
 * and then advances; if nothing turns up it offers a retry or a "later" exit.
 *
 * @module notivex/app/sync
 *
 * @file      sync.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { Button } from "@notivex/ui/Primitive";
import type { ImageAsset } from "@/Domain/Utility";
import { ListConnections } from "@/Domain/Runtime/NotivexApi";
import { OnboardingCopy } from "@/features/onboarding/copy";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { useNotionSync } from "@/features/onboarding/use-notion-sync";
import { useRouter } from "expo-router";

const Copy = OnboardingCopy.Sync;

/** Props for {@link SyncInner}. */
interface SyncInnerProps
{
    readonly ConnectionId: Domain.Id.NotionConnectionId;
}

const SyncInner = ({ ConnectionId }: SyncInnerProps) =>
{
    const Router = useRouter();
    const { Status, Retry } = useNotionSync(ConnectionId);

    const GoToDone = () => Router.replace("/done");

    if (Status === "Ready")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle={ Copy.Ready.Body }
                Title={ Copy.Ready.Title }>
                <View style={ styles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ GoToDone }
                    Style={ styles.cta }>
                    { Copy.Ready.Cta }
                </Button>
            </OnboardingScreen>
        );
    }

    if (Status === "Empty")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle={ Copy.Empty.Body }
                Title={ Copy.Empty.Title }>
                <View style={ styles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ Retry }
                    Style={ styles.cta }>
                    { Copy.Empty.Cta }
                </Button>
                <Button
                    Appearance="Link"
                    OnPress={ GoToDone }
                    Style={ styles.cta }>
                    { Copy.Empty.Secondary }
                </Button>
            </OnboardingScreen>
        );
    }

    if (Status === "Error")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle={ Copy.Error.Body }
                Title={ Copy.Error.Title }>
                <View style={ styles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ Retry }
                    Style={ styles.cta }>
                    { Copy.Error.Cta }
                </Button>
            </OnboardingScreen>
        );
    }

    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle={ Copy.Syncing.Body }
            Title={ Copy.Syncing.Title }>
            <View style={ styles.center }>
                <ActivityIndicator />
            </View>
        </OnboardingScreen>
    );
};

const SyncScreen = () =>
{
    const [ ConnectionId, SetConnectionId ] =
        useState<Domain.Id.NotionConnectionId | null>(null);

    useEffect(() =>
    {
        let Cancelled = false;

        const Resolve = async () =>
        {
            try
            {
                const List = await ListConnections();

                if (!Cancelled)
                {
                    SetConnectionId(List.at(0)?.Id ?? null);
                }
            }
            catch (Error)
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to resolve the Notion connection", Error);
            }
        };

        void Resolve();

        return () =>
        {
            Cancelled = true;
        };
    }, [ ]);

    if (ConnectionId === null)
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle={ Copy.Syncing.Body }
                Title={ Copy.Syncing.Title }>
                <View style={ styles.center }>
                    <ActivityIndicator />
                </View>
            </OnboardingScreen>
        );
    }

    return <SyncInner ConnectionId={ ConnectionId } />;
};

const styles = StyleSheet.create({
    center:
    {
        alignItems: "center",
        marginTop: 24
    },
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

export default SyncScreen;
