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
import { Button, Description, Heading1, Heading2 } from "@notivex/ui/Primitive";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { DeleteAccount, RequestAccountData } from "@/Domain/Runtime/NotivexApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/Domain/Auth/NotivexAuthProvider";
import { useCallback, useState } from "react";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

const NotionIntegrationsUrl = "https://www.notion.so/my-integrations";

const AccountSettingsScreen = (): React.JSX.Element =>
{
    const Router = useLazyRouter();
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
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Button
                    AccessibilityLabel="Back"
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ styles.back }>
                    Back
                </Button>

                <Heading1>Account settings</Heading1>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.scroll }>
                    <Heading2 Style={ styles.sectionHeading }>Notion</Heading2>
                    <Button
                        Appearance="Cell"
                        OnPress={ () => void HandleManageInNotion() }>
                        Manage the Notivex connection in Notion
                    </Button>

                    <Heading2 Style={ styles.sectionHeading }>Your data</Heading2>
                    <Button
                        Appearance="Cell"
                        Disabled={ IsRequestingData }
                        OnPress={ () => void HandleRequestData() }>
                        { IsRequestingData ? "Requesting…" : "Request my account data" }
                    </Button>

                    <Heading2 Style={ styles.sectionHeading }>Danger zone</Heading2>
                    <Description Style={ styles.dangerDescription }>
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

const styles = StyleSheet.create({
    back:
    {
        alignSelf: "flex-start"
    },
    container:
    {
        flex: 1
    },
    dangerDescription:
    {
        marginBottom: 4
    },
    list:
    {
        gap: 12,
        paddingVertical: 16
    },
    safeArea:
    {
        flex: 1,
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 24
    },
    scroll:
    {
        alignSelf: "stretch",
        flex: 1
    },
    sectionHeading:
    {
        marginTop: 12
    }
});

export default AccountSettingsScreen;
