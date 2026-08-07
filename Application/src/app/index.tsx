/**
 * @module notivex/app
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Body, Heading1 } from "@notivex/ui/Primitive";
import { ConnectNotion } from "@/features/connections/connect";
import { DisconnectNotion } from "@/runtime/notivex-api";
import { SafeAreaView } from "react-native-safe-area-context";
import { UseAuth } from "@/Domain/Auth";
import { useConnections } from "@/features/connections/use-connections";
import { useState } from "react";

const HomeScreen = () =>
{
    const { SignOut } = UseAuth();
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
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Heading1>Notivex</Heading1>
                <Body Style={ styles.subtitle }>
                    Notion connections
                </Body>

                <Pressable
                    disabled={ Busy }
                    onPress={ HandleConnect }
                    style={ styles.primaryButton }>
                    <Body>
                        { Busy ? "Working…" : "Connect a Notion workspace" }
                    </Body>
                </Pressable>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.listContainer }>
                    {IsLoading
                        ? <ActivityIndicator />
                        : Connections.length === 0
                            ? (
                                <Body>
                                    No connections yet.
                                </Body>
                            )
                            : Connections.map((Connection: Domain.NotionConnection.NotionConnection) => (
                                <View
                                    key={ Connection.Id }
                                    style={ styles.row }>
                                    <Body>
                                        { Connection.WorkspaceName }
                                    </Body>
                                    <Pressable
                                        disabled={ Busy }
                                        onPress={ () => HandleDisconnect(Connection.Id) }>
                                        <Body>
                                            Disconnect
                                        </Body>
                                    </Pressable>
                                </View>
                            ))}
                </ScrollView>

                <Pressable
                    onPress={ () => void SignOut() }
                    style={ styles.signOut }>
                    <Body>
                        Sign out
                    </Body>
                </Pressable>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container:
    {
        flex: 1
    },
    list:
    {
        gap: 32,
        paddingVertical: 48
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
        borderRadius: 32,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: 64
    },
    row:
    {
        alignItems: "center",
        borderRadius: 32,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 32
    },
    safeArea:
    {
        flex: 1,
        gap: 3,
        paddingHorizontal: 64,
        paddingVertical: 48
    },
    signOut:
    {
        alignItems: "center",
        paddingVertical: 48
    },
    subtitle:
    {
        marginTop: 8
    }
});

export default HomeScreen;
