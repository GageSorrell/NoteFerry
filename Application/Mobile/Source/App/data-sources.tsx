/**
 * Data-source discovery screen for a single Notion connection: browse the data
 * sources the connection can see in Notion, and cache one (fetch + normalize
 * its schema) for later quick-entry. Reached from a connection row on the home
 * screen.
 *
 * @module notivex/app/data-sources
 *
 * @file      data-sources.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Body, Button, Description, Heading1, LabelText } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDataSources } from "@/features/data-sources/use-data-sources";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useLocalSearchParams } from "expo-router";

/* eslint-disable-next-line jsdoc/require-jsdoc */
function IsEmoji(Icon: string | undefined): Icon is string
{
    return Icon !== undefined && !Icon.startsWith("http");
}

const DataSourcesScreen = () =>
{
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const Params = useLocalSearchParams<{ connectionId: string; workspaceName?: string }>();
    const ConnectionId = Params.connectionId as Domain.Id.NotionConnectionId;

    const { Discovered, Cached, IsSearching, BusyId, Search, Cache } = useDataSources(ConnectionId);

    type CachedById = ReadonlyMap<Domain.Id.NotionDataSourceId, Domain.DataSource.CachedDataSourceSchema>;
    const CachedById: CachedById = new Map(
        Cached.map((Entry: Domain.DataSource.CachedDataSourceSchema) =>
            [ Entry.DataSourceId, Entry ] as const)
    );

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Button
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ Styles.Back }>
                    ‹ Back
                </Button>

                <Heading1>
                    { Params.workspaceName ?? "Data sources" }
                </Heading1>
                <Description Style={ Styles.Subtitle }>
                    Choose a Notion data source to enable quick entry.
                </Description>

                <Button
                    Appearance="SoftBlue"
                    Disabled={ IsSearching }
                    OnPress={ Search }
                    Style={ Styles.SearchButton }>
                    { IsSearching ? "Searching…" : "Search again" }
                </Button>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.ListContainer }>
                    { IsSearching && Discovered.length === 0
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
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
                                        style={ Styles.Row }>
                                        <View style={ Styles.RowLeft }>
                                            { IsEmoji(Source.Icon)
                                                ? <Body Style={ Styles.Icon }>{ Source.Icon }</Body>
                                                : null }
                                            <View style={ Styles.RowText }>
                                                <Body NumberOfLines={ 1 }>
                                                    { Source.Title }
                                                </Body>
                                                { Entry
                                                    ? (
                                                        <LabelText Style={ Styles.Meta }>
                                                            Saved · { Entry.Properties.length } fields
                                                        </LabelText>
                                                    )
                                                    : null }
                                            </View>
                                        </View>

                                        <View style={ Styles.RowActions }>
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

const useStyles = MakeStyles({
    Back: ViewStyle({
        alignSelf: "flex-start"
    }),
    Container: ViewStyle({
        flex: 1
    }),
    Icon: TextStyle({
        fontSize: 20
    }),
    List: ViewStyle({
        gap: Token.Spacing.L,
        paddingVertical: Token.Spacing.Xl
    }),
    ListContainer: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    Meta: TextStyle({
        marginTop: 2
    }),
    Row: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.L,
        justifyContent: "space-between"
    }),
    RowActions: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.S
    }),
    RowLeft: ViewStyle({
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: Token.Spacing.M
    }),
    RowText: ViewStyle({
        flex: 1
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.S,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    SearchButton: ViewStyle({
        alignSelf: "flex-start",
        marginTop: Token.Spacing.S
    }),
    Subtitle: TextStyle({
        marginTop: Token.Spacing.Xs
    })
});

export default DataSourcesScreen;
