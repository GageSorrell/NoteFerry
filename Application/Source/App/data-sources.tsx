/**
 * Data-source discovery screen for a single Notion connection: browse the data
 * sources the connection can see in Notion, and cache one (fetch + normalize
 * its schema) for later quick-entry. Reached from a connection row on the home
 * screen (ArchitectureInitialDraft.md §36).
 *
 * @module notivex/app/data-sources
 *
 * @file      data-sources.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Body, Button, Description, Heading1, LabelText } from "@notivex/ui/Primitive";
import { SafeAreaView } from "react-native-safe-area-context";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useDataSources } from "@/features/data-sources/use-data-sources";
import { useLocalSearchParams } from "expo-router";

/* eslint-disable-next-line jsdoc/require-jsdoc */
function IsEmoji(Icon: string | undefined): Icon is string
{
    return Icon !== undefined && !Icon.startsWith("http");
}

const DataSourcesScreen = () =>
{
    const Router = UseLazyRouter();
    const Params = useLocalSearchParams<{ connectionId: string; workspaceName?: string }>();
    const ConnectionId = Params.connectionId as Domain.Id.NotionConnectionId;

    const { Discovered, Cached, IsSearching, BusyId, Search, Cache } = useDataSources(ConnectionId);

    const CachedById = new Map(
        Cached.map((Entry: Domain.DataSource.CachedDataSourceSchema) =>
            [ Entry.DataSourceId, Entry ] as const)
    );

    return (
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Button
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ styles.back }>
                    ‹ Back
                </Button>

                <Heading1>
                    { Params.workspaceName ?? "Data sources" }
                </Heading1>
                <Description Style={ styles.subtitle }>
                    Choose a Notion data source to enable quick entry.
                </Description>

                <Button
                    Appearance="SoftBlue"
                    Disabled={ IsSearching }
                    OnPress={ Search }
                    Style={ styles.searchButton }>
                    { IsSearching ? "Searching…" : "Search again" }
                </Button>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.listContainer }>
                    { IsSearching && Discovered.length === 0
                        ? <ActivityIndicator />
                        : Discovered.length === 0
                            ? (
                                <Description>
                                    No data sources found. Make sure this workspace has databases
                                    shared with the Notivex integration.
                                </Description>
                            )
                            : Discovered.map((Source: Domain.DataSource.DiscoveredDataSource) =>
                            {
                                const Entry = CachedById.get(Source.DataSourceId);
                                const Busy = BusyId === Source.DataSourceId;

                                return (
                                    <View
                                        key={ Source.DataSourceId }
                                        style={ styles.row }>
                                        <View style={ styles.rowLeft }>
                                            { IsEmoji(Source.Icon)
                                                ? <Body Style={ styles.icon }>{ Source.Icon }</Body>
                                                : null }
                                            <View style={ styles.rowText }>
                                                <Body NumberOfLines={ 1 }>
                                                    { Source.Title }
                                                </Body>
                                                { Entry
                                                    ? (
                                                        <LabelText Style={ styles.meta }>
                                                            Saved · { Entry.Properties.length } fields
                                                        </LabelText>
                                                    )
                                                    : null }
                                            </View>
                                        </View>

                                        <View style={ styles.rowActions }>
                                            { Entry
                                                ? (
                                                    <Button
                                                        Appearance="Link"
                                                        OnPress={ Router.push({
                                                            params:
                                                            {
                                                                connectionId: Source.ConnectionId,
                                                                dataSourceId: Source.DataSourceId,
                                                                title: Source.Title
                                                            },
                                                            pathname: "/destination-config"
                                                        }) }>
                                                        Configure
                                                    </Button>
                                                )
                                                : null }
                                            <Button
                                                Appearance={ Entry ? "Cell" : "Primary" }
                                                Disabled={ Busy }
                                                OnPress={ () => void Cache(Source.DataSourceId) }>
                                                { Busy ? "Saving…" : Entry ? "Update" : "Save" }
                                            </Button>
                                        </View>
                                    </View>
                                );
                            }) }
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
    icon:
    {
        fontSize: 20
    },
    list:
    {
        gap: 16,
        paddingVertical: 24
    },
    listContainer:
    {
        alignSelf: "stretch",
        flex: 1
    },
    meta:
    {
        marginTop: 2
    },
    row:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 16,
        justifyContent: "space-between"
    },
    rowActions:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 8
    },
    rowLeft:
    {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: 12
    },
    rowText:
    {
        flex: 1
    },
    safeArea:
    {
        flex: 1,
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 24
    },
    searchButton:
    {
        alignSelf: "flex-start",
        marginTop: 8
    },
    subtitle:
    {
        marginTop: 4
    }
});

export default DataSourcesScreen;
