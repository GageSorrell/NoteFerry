/**
 * Account-settings screen: delete the account, request a copy of account
 * data, or open Notion's own connected-integrations page. Reached from the
 * "Account settings" row on the settings screen.
 *
 * @module noteferry/app/account-settings
 *
 * @file      account-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, ScrollView, View } from "react-native";
import { Button } from "@noteferry/ui/Primitive/Button";
import { Description, Heading1, Heading2 } from "@noteferry/ui/Primitive/Text";
import { DeleteAccount, RequestAccountData } from "@/Domain/Runtime/NoteFerryApi";
import { MakeStyles, TextStyle, Token, ViewStyle } from "@noteferry/ui/Core";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/Domain/Auth/NoteFerryAuthProvider";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";
import { LoadPurchases } from "@/Domain/Subscription/Purchases";

const NotionIntegrationsUrl = "https://www.notion.so/my-integrations";

const AccountSettingsScreen = (): React.JSX.Element =>
{
    const Router = useLazyRouter();
    const Styles = useStyles();
    const { SignOut } = useAuth();
    const { Status } = useSubscription();
    const { t } = useTranslation("settings");
    const [ IsDeleting, SetIsDeleting ] = useState(false);
    const [ IsRequestingData, SetIsRequestingData ] = useState(false);

    const HandleManageInNotion = useCallback(async () =>
    {
        await WebBrowser.openBrowserAsync(NotionIntegrationsUrl);
    }, [ ]);

    const HandleRequestData = useCallback(async () =>
    {
        SetIsRequestingData(true);

        try
        {
            await RequestAccountData();
            Alert.alert(
                t("accountSettings.requestData.successTitle"),
                t("accountSettings.requestData.successMessage")
            );
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to request account data", Error);
            Alert.alert(t("accountSettings.errorGeneric.title"), t("accountSettings.errorGeneric.message"));
        }
        finally
        {
            SetIsRequestingData(false);
        }
    }, [ t ]);

    const PerformDelete = useCallback(async () =>
    {
        SetIsDeleting(true);

        try
        {
            await DeleteAccount();
            await SignOut();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to delete account", Error);
            Alert.alert(t("accountSettings.errorGeneric.title"), t("accountSettings.errorGeneric.message"));
            SetIsDeleting(false);
        }
    }, [ SignOut, t ]);

    const HandleDeleteAccount = useCallback(() =>
    {
        const Manage = (): void =>
        {
            if (Status?.ManagementUrl)
            {
                Linking.openURL(Status.ManagementUrl);
            }
            else
            {
                void LoadPurchases().then(({ default: Purchases }) => Purchases.showManageSubscriptions());
            }
        };

        Alert.alert(
            t("accountSettings.deleteConfirm.title"),
            t("accountSettings.deleteConfirm.message"),
            [
                { style: "cancel", text: t("accountSettings.deleteConfirm.cancel") },
                ...(Status?.Active && Status.Term !== "Lifetime"
                    ? [ { onPress: Manage, text: t("accountSettings.deleteConfirm.manageSubscription") } ]
                    : [ ]),
                {
                    onPress: () => void PerformDelete(),
                    style: "destructive",
                    text: t("accountSettings.deleteConfirm.confirm")
                }
            ]
        );
    }, [ PerformDelete, Status, t ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Button
                    AccessibilityLabel={ t("accountSettings.back") }
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ Styles.Back }>
                    { t("accountSettings.back") }
                </Button>

                <Heading1>{ t("accountSettings.title") }</Heading1>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <Heading2 Style={ Styles.SectionHeading }>{ t("accountSettings.notion.heading") }</Heading2>
                    <Button
                        Appearance="Cell"
                        OnPress={ () => void HandleManageInNotion() }>
                        { t("accountSettings.notion.manageButton") }
                    </Button>

                    <Heading2 Style={ Styles.SectionHeading }>{ t("accountSettings.yourData.heading") }</Heading2>
                    <Button
                        Appearance="Cell"
                        Disabled={ IsRequestingData }
                        OnPress={ () => void HandleRequestData() }>
                        { IsRequestingData
                            ? t("accountSettings.yourData.requesting")
                            : t("accountSettings.yourData.requestButton") }
                    </Button>

                    <Heading2 Style={ Styles.SectionHeading }>{ t("accountSettings.dangerZone.heading") }</Heading2>
                    <Description Style={ Styles.DangerDescription }>
                        { t("accountSettings.dangerZone.description") }
                    </Description>
                    <Button
                        Appearance="Red"
                        Disabled={ IsDeleting }
                        OnPress={ HandleDeleteAccount }>
                        { IsDeleting
                            ? t("accountSettings.dangerZone.deleting")
                            : t("accountSettings.dangerZone.deleteButton") }
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Back: ViewStyle({
        alignSelf: "flex-start"
    }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    DangerDescription: TextStyle({
        marginBottom: 4
    }),
    List: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.L
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.S,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    SectionHeading: TextStyle({
        marginTop: Token.Spacing.M
    })
});

export default AccountSettingsScreen;
