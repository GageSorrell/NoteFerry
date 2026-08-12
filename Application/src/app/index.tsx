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
import { DatabaseCard } from "@/Component/DatabaseCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { UseAuth } from "@/Domain/Auth";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useConnections } from "@/Domain/Connection";

const HomeScreen = () =>
{
    "use no memo";

    const { SignOut } = UseAuth();
    const { Connections, DataSources, IsLoading } = useConnections();
    const Router = UseLazyRouter();

    return (
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Heading1>Notivex</Heading1>
                <Body Style={ styles.subtitle }>
                    Notion connections
                </Body>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.listContainer }>
                    {IsLoading
                        ? <ActivityIndicator />
                        : (
                            <>
                                <Body Style={ styles.sectionTitle }>
                                    Databases
                                </Body>
                                {DataSources.length === 0
                                    ? (
                                        <Body>
                                            No databases found yet.
                                        </Body>
                                    )
                                    : (
                                        <View style={ styles.databaseCards }>
                                            {DataSources.map((
                                                Source: Domain.DataSource.CachedDataSourceSchema
                                            ) => (
                                                <DatabaseCard
                                                    OnPress={ Router.push({
                                                        params:
                                                        {
                                                            connectionId: Source.ConnectionId,
                                                            dataSourceId: Source.DataSourceId,
                                                            title: Source.Title
                                                        },
                                                        pathname: "/destination-config"
                                                    }) }
                                                    Source={ Source }
                                                    key={
                                                        `${ Source.ConnectionId }:${ Source.DataSourceId }`
                                                    }
                                                />
                                            ))}
                                        </View>
                                    )}

                                <Body Style={ styles.sectionTitle }>
                                    Notion workspaces
                                </Body>
                                {Connections.length === 0
                                    ? (
                                        <Body>
                                            No connections yet.
                                        </Body>
                                    )
                                    : Connections.map((
                                        Connection: Domain.NotionConnection.NotionConnection
                                    ) => (
                                        <View
                                            key={ Connection.Id }
                                            style={ styles.workspaceRow }>
                                            <Body>
                                                { Connection.WorkspaceName }
                                            </Body>
                                            <View style={ styles.rowActions }>
                                                <Pressable
                                                    onPress={ Router.push({
                                                        params:
                                                        {
                                                            connectionId: Connection.Id,
                                                            workspaceName: Connection.WorkspaceName
                                                        },
                                                        pathname: "/data-sources"
                                                    }) }>
                                                    <Body>
                                                        Data sources
                                                    </Body>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                            </>
                        )}
                </ScrollView>

                <Pressable
                    onPress={ SignOut }
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
    databaseCards:
    {
        gap: 16,
        overflow: "visible",
        paddingHorizontal: 8
    },
    list:
    {
        gap: 16,
        paddingVertical: 48
    },
    listContainer:
    {
        alignSelf: "stretch",
        flex: 1
    },
    rowActions:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 16
    },
    safeArea:
    {
        flex: 1,
        gap: 3,
        paddingHorizontal: 24,
        paddingVertical: 48
    },
    sectionTitle:
    {
        marginTop: 16
    },
    signOut:
    {
        alignItems: "center",
        paddingVertical: 48
    },
    subtitle:
    {
        marginTop: 8
    },
    workspaceRow:
    {
        alignItems: "center",
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16
    }
});

export default HomeScreen;
