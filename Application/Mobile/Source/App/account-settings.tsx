/**
 * Account-settings screen: delete the account, request a copy of account
 * data, or open Notion's own connected-integrations page. Reached from the
 * "Account settings" row on the settings screen.
 *
 * @module notivex/app/account-settings
 *
 * @file      account-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as WebBrowser from "expo-web-browser";
import { Alert, ScrollView, View } from "react-native";
import { Button, Description, Heading1, Heading2 } from "@notivex/ui/Primitive";
import { DeleteAccount, RequestAccountData } from "@/Domain/Runtime/NotivexApi";
import { MakeStyles, TextStyle, Token, ViewStyle } from "@notivex/ui";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/Domain/Auth/NotivexAuthProvider";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

const NotionIntegrationsUrl = "https://www.notion.so/my-integrations";

const AccountSettingsScreen = (): React.JSX.Element =>
{
    const Router = useLazyRouter();
    const Styles = useStyles();
    const { SignOut } = useAuth();
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
                "Request sent",
                "We'll email you a copy of your account data once it's ready."
            );
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to request account data", Error);
            Alert.alert("Something went wrong", "Please try again.");
        }
        finally
        {
            SetIsRequestingData(false);
        }
    }, [ ]);

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
            Alert.alert("Something went wrong", "Please try again.");
            SetIsDeleting(false);
        }
    }, [ SignOut ]);

    const HandleDeleteAccount = useCallback(() =>
    {
        Alert.alert(
            "Delete your account?",
            "This permanently deletes your Notivex account, connections, and "
                + "quick-entry destinations. This can't be undone.",
            [
                { style: "cancel", text: "Cancel" },
                {
                    onPress: () => void PerformDelete(),
                    style: "destructive",
                    text: "Delete account"
                }
            ]
        );
    }, [ PerformDelete ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Button
                    AccessibilityLabel="Back"
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ Styles.Back }>
                    Back
                </Button>

                <Heading1>Account settings</Heading1>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <Heading2 Style={ Styles.SectionHeading }>Notion</Heading2>
                    <Button
                        Appearance="Cell"
                        OnPress={ () => void HandleManageInNotion() }>
                        Manage the Notivex connection in Notion
                    </Button>

                    <Heading2 Style={ Styles.SectionHeading }>Your data</Heading2>
                    <Button
                        Appearance="Cell"
                        Disabled={ IsRequestingData }
                        OnPress={ () => void HandleRequestData() }>
                        { IsRequestingData ? "Requesting…" : "Request my account data" }
                    </Button>

                    <Heading2 Style={ Styles.SectionHeading }>Danger zone</Heading2>
                    <Description Style={ Styles.DangerDescription }>
                        Permanently deletes your account and everything associated
                        with it. This can't be undone.
                    </Description>
                    <Button
                        Appearance="Red"
                        Disabled={ IsDeleting }
                        OnPress={ HandleDeleteAccount }>
                        { IsDeleting ? "Deleting…" : "Delete account" }
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
