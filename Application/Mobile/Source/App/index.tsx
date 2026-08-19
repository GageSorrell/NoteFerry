/**
 * @module notivex/app
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    ActivityIndicator,
    type PressableStateCallbackType,
    ScrollView,
    View
} from "react-native";
import { Body, Description, Pressable } from "@notivex/ui/Primitive";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { Settings, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { DatabaseCard } from "@/Component/DatabaseCard";
import { Image } from "expo-image";
import { Predicate } from "@sorrell/effect";
import { RegisterQuickActions } from "@/Domain/Runtime/QuickActions";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConnections } from "@/Domain/Connection";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSettings } from "@/features/settings/use-settings";

/* Only the *first* home-screen mount of an app session should honor
 * `LaunchBehavior`; a returning visit from inside the app (e.g. back from
 * settings) must not bounce the user back out to `create-page`. Module-scope
 * so it survives remounts but resets on a fresh JS bundle (app restart). */
let HasAppliedLaunchBehavior = false;

/** Applies `DatabaseOrder`, keeping unlisted sources in their existing order. */
function OrderDataSources(
    DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>,
    DatabaseOrder: ReadonlyArray<Domain.Id.NotionDataSourceId>
): ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>
{
    if (DatabaseOrder.length === 0)
    {
        return DataSources;
    }

    const ByDataSourceId = new Map(DataSources.map((
        Source: Domain.DataSource.CachedDataSourceSchema
    ) => [ Source.DataSourceId, Source ] as const));
    const Ordered = DatabaseOrder
        .map((Id: Domain.Id.NotionDataSourceId) => ByDataSourceId.get(Id))
        .filter((
            Source: Domain.DataSource.CachedDataSourceSchema | undefined
        ): Source is Domain.DataSource.CachedDataSourceSchema => Source !== undefined);
    const OrderedIds = new Set(DatabaseOrder);

    return [
        ...Ordered,
        ...DataSources.filter((Source: Domain.DataSource.CachedDataSourceSchema) =>
            !OrderedIds.has(Source.DataSourceId))
    ];
}

interface NotionAvatarProps
{
    readonly Name: string;
    readonly Uri?: string | undefined;
}

/** Displays the authorizing Notion user's image with an initials fallback. */
const NotionAvatar = ({ Name, Uri }: NotionAvatarProps): React.JSX.Element =>
{
    "use no memo";

    const Theme = useTheme();
    const Styles = useStyles();
    const [ HasImageError, SetHasImageError ] = useState(false);
    const CanDisplayImage = Uri !== undefined
        && (Uri.startsWith("https://") || Uri.startsWith("http://"))
        && !HasImageError;
    const Initial = Name.trim().charAt(0).toUpperCase() || "N";

    return (
        <View
            accessibilityLabel={ `Notion profile for ${ Name }` }
            accessible
            style={ Styles.Avatar }>
            { CanDisplayImage
                ? (
                    <Image
                        accessibilityIgnoresInvertColors
                        cachePolicy="memory-disk"
                        contentFit="cover"
                        onError={ () => SetHasImageError(true) }
                        source={ { uri: Uri } }
                        style={ Styles.AvatarImage }
                        transition={ 100 }
                    />
                )
                : Name.trim() === ""
                    ? (
                        <UserRound
                            color={ Theme.Semantic.IconSecondary }
                            size={ 24 }
                            strokeWidth={ 1.8 }
                        />
                    )
                    : <Body Weight="600">{ Initial }</Body> }
        </View>
    );
};

NotionAvatar.displayName = "NotionAvatar";

const HomeScreen = () =>
{
    "use no memo";

    const { Connections, DataSources, IsLoading } = useConnections();
    const { IsLoading: IsLoadingSettings, Settings: AppSettings } = useSettings();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const Connection = Connections.find(Predicate.HasPropertyValue("Status", "Active"))
        ?? Connections[0];
    const AvatarUri = Connection?.NotionOwnerAvatarUrl
        ?? Connection?.WorkspaceIconUrl;
    const AvatarName = Connection?.WorkspaceName ?? "Notion";
    const HomeBackground = Theme.Mode === "Dark"
        ? Theme.Semantic.BackgroundMain
        : "#F7F7F5";
    const ControlBackground = Theme.Mode === "Dark"
        ? "#2F2F2F"
        : "#EBEAE8";
    const OrderedDataSources = OrderDataSources(DataSources, AppSettings.DatabaseOrder);

    /* Launch behavior: hand off to `create-page` for the chosen database on
     * the very first mount of the session only. */
    useEffect(() =>
    {
        if (HasAppliedLaunchBehavior || IsLoadingSettings)
        {
            return;
        }

        HasAppliedLaunchBehavior = true;

        if (AppSettings.LaunchBehavior.Type === "SelectedDatabase")
        {
            Router.replace({
                params: { dataSourceId: AppSettings.LaunchBehavior.DataSourceId },
                pathname: "/create-page"
            })();
        }
    }, [ AppSettings.LaunchBehavior, IsLoadingSettings, Router ]);

    /* Keeps the quick-action shortcuts in sync with the current databases and
     * settings — cheap to re-run; `expo-quick-actions` just replaces the list. */
    useEffect(() =>
    {
        if (IsLoading || IsLoadingSettings)
        {
            return;
        }

        void RegisterQuickActions(DataSources, AppSettings);
    }, [ AppSettings, DataSources, IsLoading, IsLoadingSettings ]);

    return (
        <View style={ [ Styles.Container, { backgroundColor: HomeBackground } ] }>
            <SafeAreaView style={ Styles.SafeArea }>
                <View style={ Styles.TopBar }>
                    <NotionAvatar
                        Name={ AvatarName }
                        Uri={ AvatarUri }
                        key={ AvatarUri ?? AvatarName }
                    />
                    <Pressable
                        Accessibility={ {
                            Label: "Settings",
                            Role: "button"
                        } }
                        OnPress={ Router.push("/settings") }
                        style={ ({ pressed }: PressableStateCallbackType) => [
                            Styles.SettingsButton,
                            { backgroundColor: ControlBackground },
                            pressed && Styles.ControlPressed
                        ] }>
                        <Settings
                            color="#8C8786"
                            size={ 19 }
                            strokeWidth={ 1.8 }
                        />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.ListContainer }>
                    <Description
                        Style={ Styles.SectionTitle }
                        Weight="500">
                        Databases
                    </Description>
                    { IsLoading
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                        : OrderedDataSources.length === 0
                            ? <Body>No databases found yet.</Body>
                            : (
                                <View style={ Styles.DatabaseCards }>
                                    { OrderedDataSources.map((
                                        Source: Domain.DataSource.CachedDataSourceSchema
                                    ) => (
                                        <DatabaseCard
                                            OnPress={ Router.push({
                                                params:
                                                {
                                                    dataSourceId: Source.DataSourceId,
                                                    title: Source.Title
                                                },
                                                pathname: "/create-page"
                                            }) }
                                            Source={ Source }
                                            key={
                                                `${ Source.ConnectionId }:${ Source.DataSourceId }`
                                            }
                                        />
                                    )) }
                                </View>
                            ) }
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Avatar: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderColor: Token.Semantic.BackgroundModal,
        borderRadius: 18,
        borderWidth: 2,
        height: 36,
        justifyContent: "center",
        overflow: "hidden",
        width: 36
    }),
    AvatarImage: ImageStyle({
        height: "100%",
        width: "100%"
    }),
    Container: ViewStyle({
        flex: 1
    }),
    ControlPressed: ViewStyle({
        opacity: 0.68,
        transform: [ { scale: 0.97 } ]
    }),
    DatabaseCards: ViewStyle({
        gap: Token.Spacing.L,
        overflow: "visible",
        paddingHorizontal: 2
    }),
    List: ViewStyle({
        gap: 14,
        paddingBottom: 28,
        paddingHorizontal: Token.Spacing.L,
        paddingTop: 22
    }),
    ListContainer: ViewStyle({
        alignSelf: "stretch",
        flex: 1,
        marginHorizontal: -16
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.L,
        paddingTop: 10
    }),
    SectionTitle: TextStyle({
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 2
    }),
    SettingsButton: ViewStyle({
        alignItems: "center",
        borderRadius: 22,
        height: 42,
        justifyContent: "center",
        width: 82
    }),
    TopBar: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: Token.Size.TouchTarget.Minimum
    })
});

export default HomeScreen;
