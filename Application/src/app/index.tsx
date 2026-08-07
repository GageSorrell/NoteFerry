/**
 * @module notivex/app
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { ConnectNotion } from "@/features/connections/connect";
import { DisconnectNotion } from "@/runtime/notivex-api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import { useConnections } from "@/features/connections/use-connections";
import { useState } from "react";

const HomeScreen = () =>
{
    const { SignOut } = useAuth();
    const { Connections, IsLoading, Refetch } = useConnections();
    const [ Busy, SetBusy ] = useState(false);

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleConnect()
    {
        try
        {
            SetBusy(true);
            await ConnectNotion();
            await Refetch();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Connect Notion failed", Error);
        }
        finally
        {
            SetBusy(false);
        }
    }

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleDisconnect(ConnectionId: Domain.Id.NotionConnectionId)
    {
        try
        {
            SetBusy(true);
            await DisconnectNotion(ConnectionId);
            await Refetch();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Disconnect failed", Error);
        }
        finally
        {
            SetBusy(false);
        }
    }

    return (
        <ThemedView style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <ThemedText type="title">Notivex</ThemedText>
                <ThemedText
                    style={ styles.subtitle }
                    themeColor="textSecondary"
                    type="default">
                    Notion connections
                </ThemedText>

                <Pressable
                    disabled={ Busy }
                    onPress={ HandleConnect }
                    style={ styles.primaryButton }>
                    <ThemedText type="smallBold">
                        {Busy ? "Working…" : "Connect a Notion workspace"}
                    </ThemedText>
                </Pressable>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.listContainer }>
                    {IsLoading
                        ? <ActivityIndicator />
                        : Connections.length === 0
                            ? (
                                <ThemedText
                                    themeColor="textSecondary"
                                    type="small">
                                    No connections yet.
                                </ThemedText>
                            )
                            : Connections.map((Connection) => (
                                <ThemedView
                                    key={ Connection.Id }
                                    style={ styles.row }
                                    type="backgroundElement">
                                    <ThemedText type="smallBold">
                                        {Connection.WorkspaceName}
                                    </ThemedText>
                                    <Pressable
                                        disabled={ Busy }
                                        onPress={ () => HandleDisconnect(Connection.Id) }>
                                        <ThemedText
                                            themeColor="textSecondary"
                                            type="small">
                                            Disconnect
                                        </ThemedText>
                                    </Pressable>
                                </ThemedView>
                            ))}
                </ScrollView>

                <Pressable
                    onPress={ () => { void SignOut(); } }
                    style={ styles.signOut }>
                    <ThemedText
                        themeColor="textSecondary"
                        type="small">
                        Sign out
                    </ThemedText>
                </Pressable>
            </SafeAreaView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container:
    {
        flex: 1
    },
    list:
    {
        gap: Spacing.M,
        paddingVertical: Spacing.L
    },
    listContainer:
    {
        alignSelf: "stretch",
        flex: 1
    },
    primaryButton:
    {
        alignItems: "center",
        alignSelf: "stretch",
        borderColor: "#8883",
        borderRadius: Spacing.L,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: Spacing.XL
    },
    row:
    {
        alignItems: "center",
        borderRadius: Spacing.M,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: Spacing.L
    },
    safeArea:
    {
        flex: 1,
        gap: Spacing.L,
        paddingHorizontal: Spacing.XL,
        paddingVertical: Spacing.L
    },
    signOut:
    {
        alignItems: "center",
        paddingVertical: Spacing.M
    },
    subtitle:
    {
        marginTop: Spacing.XS
    }
});

export default HomeScreen;
