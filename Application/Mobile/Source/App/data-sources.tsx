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
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Body, Button, Description, Heading1, LabelText } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDataSources } from "@/features/data-sources/use-data-sources";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useLocalSearchParams } from "expo-router";
import { useSubscription } from "@/Domain/Subscription";

/** True when Notion supplied an emoji rather than an image URL. */
function IsEmoji(Icon: string | undefined): Icon is string
{
    return Icon !== undefined && !Icon.startsWith("http");
}

/** Walks an Effect failure's `cause`/`error`/`failure` chain for a tagged error, matching `feedback.tsx`. */
function FindTaggedError(Error_: unknown): Record<string, unknown> | null
{
    const Seen = new Set<unknown>();
    const Queue: unknown[] = [ Error_ ];

    while (Queue.length > 0)
    {
        const Current = Queue.shift();

        if (!Current || typeof Current !== "object" || Seen.has(Current))
        {
            continue;
        }

        Seen.add(Current);
        const Record_ = Current as Record<string, unknown>;

        if (typeof Record_._tag === "string")
        {
            return Record_;
        }

        Queue.push(Record_.cause, Record_.error, Record_.failure);
    }

    return null;
}

const DataSourcesScreen = () =>
{
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const Params = useLocalSearchParams<{ connectionId: string; workspaceName?: string }>();
    const ConnectionId = Params.connectionId as Domain.Id.NotionConnectionId;
    const { HasProAccess } = useSubscription();

    const { Discovered, Cached, GlobalActiveCount, IsSearching, BusyId, Search, Cache } =
        useDataSources(ConnectionId);

    type CachedDataSourceMap = ReadonlyMap<Domain.Id.NotionDataSourceId, Domain.DataSource.CachedDataSourceSchema>;
    const CachedById: CachedDataSourceMap = new Map(
        Cached.map((Entry: Domain.DataSource.CachedDataSourceSchema) =>
            [ Entry.DataSourceId, Entry ] as const)
    );

    const ShowProUpsell = (): void =>
    {
        Alert.alert(
            "Add unlimited databases with Pro",
            "Free includes three active databases. You can replace one from Database settings.",
            [
                { style: "cancel", text: "Not now" },
                { onPress: Router.push("/plans"), text: "Compare plans" },
                { onPress: Router.push("/subscribe"), text: "Upgrade" }
            ]
        );
    };

    const Save = async (DataSourceId: Domain.Id.NotionDataSourceId): Promise<void> =>
    {
        const Existing = CachedById.get(DataSourceId);

        /* The free-tier cap is global across every workspace, not just this
         * connection's own `Cached` list — a free user already at the limit
         * in another workspace must see the paywall here too, rather than a
         * silent server rejection. */
        if (!Existing && !HasProAccess && GlobalActiveCount >= 3)
        {
            ShowProUpsell();
            return;
        }

        try
        {
            await Cache(DataSourceId);
        }
        catch (Error_)
        {
            const Tagged = FindTaggedError(Error_);

            if (Tagged?._tag === "FreeDatabaseLimitReached")
            {
                ShowProUpsell();
            }
            else
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to cache data source", Error_);
                Alert.alert("Something went wrong", "Please try again.");
            }
        }
    };
    const Configure = (Source: Domain.DataSource.DiscoveredDataSource): void =>
    {
        if (!HasProAccess)
        {
            Alert.alert(
                "Customize databases with Pro",
                "Pro unlocks aliases, form settings, templates, and post-creation behavior.",
                [
                    { style: "cancel", text: "Not now" },
                    { onPress: Router.push("/plans"), text: "Compare plans" },
                    { onPress: Router.push("/subscribe"), text: "Upgrade" }
                ]
            );
            return;
        }

        Router.push({
            params: {
                connectionId: Source.ConnectionId,
                dataSourceId: Source.DataSourceId,
                title: Source.Title
            },
            pathname: "/destination-config"
        })();
    };

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
                                                            { Entry.Access === "Locked" ? "Locked" : "Saved" }
                                                            { ` · ${Entry.Properties.length} fields` }
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
                                                        OnPress={ () => Configure(Source) }>
                                                        Configure
                                                    </Button>
                                                )
                                                : null }
                                            <Button
                                                Appearance={ Entry ? "Cell" : "Primary" }
                                                Disabled={ Busy }
                                                OnPress={ () => void Save(Source.DataSourceId) }>
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
