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
import Bell from "lucide-react-native/icons/bell";
import Building2 from "lucide-react-native/icons/building-2";
import Crown from "lucide-react-native/icons/crown";
import Database from "lucide-react-native/icons/database";
import ExternalLink from "lucide-react-native/icons/external-link";
import Settings from "lucide-react-native/icons/settings";
import UserRound from "lucide-react-native/icons/user-round";
import Zap from "lucide-react-native/icons/zap";
import { Button } from "@noteferry/ui/Primitive/Button";
import { ButtonLabel, Heading2, LabelText } from "@noteferry/ui/Primitive/Text";
import { Linking, ScrollView, View } from "react-native";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { SettingsTable, SettingsTableRow } from "@/Component";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";
import { LoadPurchases } from "@/Domain/Subscription/Purchases";

const SettingsScreen = (): React.JSX.Element =>
{
    "use no memo";

    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const { Status } = useSubscription();
    const { t } = useTranslation("settings");

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

    const TermLabel = Status?.Term === "Monthly"
        ? t("hub.subscription.termMonthly")
        : Status?.Term === "Yearly"
            ? t("hub.subscription.termYearly")
            : t("hub.subscription.termActive");
    const SubscriptionLabel = Status?.Active
        ? Status.Term === "Lifetime"
            ? t("hub.subscription.lifetime")
            : t("hub.subscription.activeLabel", {
                status: Status.Renews ? t("hub.subscription.renews") : t("hub.subscription.expires"),
                term: TermLabel
            })
        : t("hub.subscription.upgrade");

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
            void LoadPurchases().then(({ default: Purchases }) => Purchases.showManageSubscriptions());
        }
    }, [ Router, Status ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsTable>
                    <SettingsTableRow
                        AccessibilityLabel={ SubscriptionLabel }
                        Divider
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
                        Label={ t("hub.rows.general") }
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
                        Label={ t("hub.rows.databases") }
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
                        Label={ t("hub.rows.workspaces") }
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
                        Label={ t("hub.rows.notifications") }
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
                        Label={ t("hub.rows.quickActions") }
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
                        Label={ t("hub.rows.accountSettings") }
                        OnPress={ Router.push("/account-settings") }
                    />
                </SettingsTable>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <Heading2 Style={ Styles.SectionHeading }>{ t("hub.support.heading") }</Heading2>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => void HandleLeaveReview() }
                        Style={ Styles.SupportButton }>
                        <ButtonLabel
                            Color={ Token.Semantic.Primary }
                            Style={ Styles.SupportButtonLabel }>
                            { t("hub.support.leaveReview") }
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
                        { t("hub.support.submitFeedback") }
                    </Button>
                    <Button
                        Appearance="Primary"
                        OnPress={ HandleReportBug }
                        Style={ Styles.SupportButton }>
                        { t("hub.support.reportBug") }
                    </Button>

                    <View style={ Styles.AppInfo }>
                        <LabelText Color={ Token.Semantic.Muted }>
                            { t("hub.appInfo", {
                                build: Application.nativeBuildVersion ?? "—",
                                version: Application.nativeApplicationVersion ?? Constants.expoConfig?.version
                            }) }
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
