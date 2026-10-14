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
import { ButtonLabel, Description, Heading2 } from "@noteferry/ui/Primitive/Text";
import { DeleteAccount, RequestAccountData } from "@/Domain/Runtime/NoteFerryApi";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import ExternalLink from "lucide-react-native/icons/external-link";
import { PresentError } from "@/Domain/Observability";
import { Setting, SettingsContainer } from "@noteferry/ui/Primitive/Setting";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/Domain/Auth/NoteFerryAuthProvider";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";
import { LoadPurchases } from "@/Domain/Subscription/Purchases";

const NotionIntegrationsUrl = "https://www.notion.so/my-integrations";

const AccountSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const Theme = useTheme();
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
            PresentError(Error, "RequestAccountData");
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
            PresentError(Error, "DeleteAccount");
            SetIsDeleting(false);
        }
    }, [ SignOut ]);

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
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <SettingsContainer>
                        <Setting
                            Description={ t("accountSettings.notion.description") }
                            Title={ t("accountSettings.notion.title") }>
                            <Button
                                OnPress={ () => void HandleManageInNotion() }
                                Size="Small">
                                <ButtonLabel
                                    Color={ Token.Semantic.Primary }
                                    Style={ Styles.ManageButtonLabel }>
                                    { t("accountSettings.notion.manageButton") }
                                </ButtonLabel>
                                <ExternalLink
                                    color={ Theme.Semantic.Primary }
                                    size={ 14 }
                                    strokeWidth={ 1.8 }
                                />
                            </Button>
                        </Setting>
                        <Setting
                            Description={ t("accountSettings.yourData.description") }
                            Title={ t("accountSettings.yourData.title") }>
                            <Button
                                Disabled={ IsRequestingData }
                                OnPress={ () => void HandleRequestData() }
                                Size="Small">
                                { IsRequestingData
                                    ? t("accountSettings.yourData.requesting")
                                    : t("accountSettings.yourData.requestButton") }
                            </Button>
                        </Setting>
                    </SettingsContainer>

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
    /* Matches `Button`'s own label size for a plain-string child — the
     * "Manage" label is rendered by hand (to sit beside the external-link
     * glyph) so it needs the same size applied explicitly. */
    ManageButtonLabel: TextStyle({
        fontSize: 12,
        lineHeight: 22
    }),
    SafeArea: ViewStyle({
        flex: 1,
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
