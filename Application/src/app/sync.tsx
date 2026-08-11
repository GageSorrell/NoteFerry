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

import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button } from "@notivex/ui/Primitive";
import type { ImageAsset } from "@/Domain/Utility";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

/** Props for sync states that advance to the final onboarding step. */
interface CompletableSyncStateProps
{
    readonly OnContinue: () => void;
}

/** Props for sync states that can restart discovery. */
interface RetryableSyncStateProps
{
    readonly OnRetry: () => void;
}

/** Shows that Notion is still applying the user's integration access change. */
const SyncingState = () =>
{
    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle={
                "Notion is updating the Notivex integration with access to "
                + "the pages and databases you selected. This can take up to 30 seconds."
            }
            Title="Waiting for Notion">
            <View style={ styles.center }>
                <ActivityIndicator
                    accessibilityLabel={
                        "Waiting for Notion to share the selected pages and "
                        + "databases with Notivex"
                    }
                />
            </View>
        </OnboardingScreen>
    );
};

/** Confirms that Notivex can access at least one selected data source. */
const ReadyState = ({ OnContinue }: CompletableSyncStateProps) =>
{
    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle="Your workspace is ready to go."
            Title="All connected">
            <View style={ styles.spacer } />
            <Button
                Appearance="Primary"
                OnPress={ OnContinue }
                Style={ styles.cta }>
                Continue
            </Button>
        </OnboardingScreen>
    );
};

/** Explains that Notion has not shared any pages or databases yet. */
const EmptyState = ({ OnContinue, OnRetry }: CompletableSyncStateProps & RetryableSyncStateProps) =>
{
    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle="Nothing's shared with Notivex yet. Share a page or database in Notion, then try again."
            Title="Nothing shared yet">
            <View style={ styles.spacer } />
            <Button
                Appearance="Primary"
                OnPress={ OnRetry }
                Style={ styles.cta }>
                Try again
            </Button>
            <Button
                Appearance="Link"
                OnPress={ OnContinue }
                Style={ styles.cta }>
                I&apos;ll do this later
            </Button>
        </OnboardingScreen>
    );
};

/** Offers another discovery attempt after repeated requests to Notion fail. */
const ErrorState = ({ OnRetry }: RetryableSyncStateProps) =>
{
    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle="We couldn't reach Notion. Check your connection and try again."
            Title="We hit a snag">
            <View style={ styles.spacer } />
            <Button
                Appearance="Primary"
                OnPress={ OnRetry }
                Style={ styles.cta }>
                Try again
            </Button>
        </OnboardingScreen>
    );
};

const SyncScreen = () =>
{
    const Router = UseLazyRouter();
    const { NotionSync: { Retry, Status } } = useOnboarding();

    const GoToDone = Router.replace("/done");

    if (Status === "Ready")
    {
        return <ReadyState OnContinue={ GoToDone } />;
    }

    if (Status === "Empty")
    {
        return (
            <EmptyState
                OnContinue={ GoToDone }
                OnRetry={ Retry }
            />
        );
    }

    if (Status === "Error")
    {
        return <ErrorState OnRetry={ Retry } />;
    }

    return <SyncingState />;
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
