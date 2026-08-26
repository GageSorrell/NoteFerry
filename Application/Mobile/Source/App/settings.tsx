/**
 * App-level settings, reached from the gear button on the home screen: a
 * table of entry points into General/Databases/Notifications/Quick
 * Actions/Account settings sub-screens, then review/feedback/bug links and
 * app info.
 *
 * @module noteferry/app/settings
 *
 * @file      settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import * as StoreReview from "expo-store-review";
import { Linking, ScrollView, View } from "react-native";
import {
    Bell,
    Building2,
    Crown,
    Database,
    ExternalLink,
    Settings,
    UserRound,
    Zap
} from "lucide-react-native";
import { Button, ButtonLabel, Heading2, LabelText } from "@noteferry/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui";
import Constants from "expo-constants";
import { SettingsTable, SettingsTableRow } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";
import Purchases from "react-native-purchases";

const SettingsScreen = (): React.JSX.Element =>
{
    "use no memo";

    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const { Status } = useSubscription();

    const HandleLeaveReview = useCallback(async () =>
    {
        if (await StoreReview.hasAction())
        {
            await StoreReview.requestReview();
        }
    }, [ ]);

    const HandleSubmitFeedback = useCallback((): void =>
    {
        Router.push({ params: { mode: "feedback" }, pathname: "/feedback" })();
    }, [ Router ]);

    const HandleReportBug = useCallback((): void =>
    {
        Router.push({ params: { mode: "bug" }, pathname: "/feedback" })();
    }, [ Router ]);

    const SubscriptionLabel = Status?.Active
        ? Status.Term === "Lifetime"
            ? "NoteFerry Pro · Lifetime access"
            : `NoteFerry Pro · ${Status.Term ?? "Active"}${Status.Renews ? " · Renews" : " · Expires"}`
        : "Upgrade to NoteFerry Pro";

    const OpenSubscription = useCallback((): void =>
    {
        if (!Status?.Active)
        {
            Router.push("/subscribe")();
            return;
        }

        if (Status.Term === "Lifetime")
        {
            Router.push("/plans")();
            return;
        }

        if (Status.ManagementUrl)
        {
            void Linking.openURL(Status.ManagementUrl);
        }
        else
        {
            void Purchases.showManageSubscriptions();
        }
    }, [ Router, Status ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsTable>
                    <SettingsTableRow
                        Divider
                        AccessibilityLabel={ SubscriptionLabel }
                        Icon={
                            <Crown
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label={ SubscriptionLabel }
                        OnPress={ OpenSubscription }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Settings
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="General"
                        OnPress={ Router.push("/general-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Database
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Databases"
                        OnPress={ Router.push("/database-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Building2
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Workspaces"
                        OnPress={ Router.push("/workspace-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Bell
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Notifications"
                        OnPress={ Router.push("/notification-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Zap
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Quick Actions"
                        OnPress={ Router.push("/quick-action-settings") }
                    />
                    <SettingsTableRow
                        Icon={
                            <UserRound
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Account settings"
                        OnPress={ Router.push("/account-settings") }
                    />
                </SettingsTable>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <Heading2 Style={ Styles.SectionHeading }>Support NoteFerry</Heading2>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => void HandleLeaveReview() }
                        Style={ Styles.SupportButton }>
                        <ButtonLabel
                            Color={ Token.Semantic.Primary }
                            Style={ Styles.SupportButtonLabel }>
                            Leave a review
                        </ButtonLabel>
                        <ExternalLink
                            color={ Theme.Semantic.Primary }
                            size={ 16 }
                            strokeWidth={ 1.8 }
                        />
                    </Button>
                    <Button
                        Appearance="Primary"
                        OnPress={ HandleSubmitFeedback }
                        Style={ Styles.SupportButton }>
                        Submit feedback
                    </Button>
                    <Button
                        Appearance="Primary"
                        OnPress={ HandleReportBug }
                        Style={ Styles.SupportButton }>
                        Report a bug
                    </Button>

                    <View style={ Styles.AppInfo }>
                        <LabelText Color={ Token.Semantic.Muted }>
                            NoteFerry { Application.nativeApplicationVersion ?? Constants.expoConfig?.version }
                            { " " }(build { Application.nativeBuildVersion ?? "—" })
                        </LabelText>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    AppInfo: ViewStyle({
        alignItems: "center",
        paddingTop: Token.Spacing.S
    }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    List: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.Xl
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.L,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    SectionHeading: TextStyle({
        marginTop: Token.Spacing.M
    }),
    SupportButton: ViewStyle({
        alignSelf: "stretch"
    }),
    /* Matches `Button`'s own label size for a plain-string child — the
     * "Leave a review" label is rendered by hand (to sit beside the
     * external-link glyph) so it needs the same size applied explicitly. */
    SupportButtonLabel: TextStyle({
        fontSize: 12,
        lineHeight: 22
    })
});

export default SettingsScreen;
