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
    Alert,
    AppState,
    type AppStateStatus,
    Platform,
    type PressableStateCallbackType,
    ScrollView,
    View
} from "react-native";
import { AddWorkspace, ResolveCurrentConnection, useConnections } from "@/Domain/Connection";
import { Body, Button, Description, MeterBar, Pressable } from "@notivex/ui/Primitive";
import { CircleFadingArrowUp, HelpCircle, Settings, UserRound } from "lucide-react-native";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DatabaseCard } from "@/Component/DatabaseCard";
import { Image } from "expo-image";
import { RegisterQuickActions } from "@/Domain/Runtime/QuickActions";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { WorkspaceMenu } from "@/Component/WorkspaceMenu";
import { useAuth } from "@/Domain/Auth";
import { useFocusEffect } from "expo-router";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSettings } from "@/features/settings/use-settings";
import { useSubscription } from "@/Domain/Subscription";

/* Only the *first* home-screen mount of an app session should honor
 * `LaunchBehavior`; a returning visit from inside the app (e.g. back from
 * settings) must not bounce the user back out to `create-page`. Module-scope
 * so it survives remounts but resets on a fresh JS bundle (app restart). */
let HasAppliedLaunchBehavior = false;

const PlansLastOpenedStoragePrefix = "notivex:plans-last-opened:";
const PlansReminderIntervalMilliseconds = 5 * 24 * 60 * 60 * 1000;

/** The `create-page` destination for tapping a given database's card. */
const CreatePageHref = (Source: Domain.DataSource.CachedDataSourceSchema) =>
{
    return {
        params:
        {
            dataSourceId: Source.DataSourceId,
            title: Source.Title
        },
        pathname: "/create-page" as const
    };
};

/** Applies `DatabaseOrder`, keeping unlisted sources in their existing order. */
const OrderDataSources = (
    DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>,
    DatabaseOrder: ReadonlyArray<Domain.Id.NotionDataSourceId>
): ReadonlyArray<Domain.DataSource.CachedDataSourceSchema> =>
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
};

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

    const { Connections, DataSources, IsLoading, Refetch: RefetchConnections } = useConnections();
    const {
        IsLoading: IsLoadingSettings,
        Refetch: RefetchSettings,
        Settings: AppSettings,
        Update: UpdateSettings
    } = useSettings();
    const {
        Allowance,
        HasProAccess,
        Refresh: RefreshSubscription,
        Sale,
        Status
    } = useSubscription();
    const { Session, SignOut } = useAuth();
    const [ DismissedSaleId, SetDismissedSaleId ] = useState<string | null>(null);
    const [ PlansLastOpenedAt, SetPlansLastOpenedAt ] = useState<number | null>(null);
    const [ CurrentTime, SetCurrentTime ] = useState(() => Date.now());
    const [ IsAddingWorkspace, SetIsAddingWorkspace ] = useState(false);
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const CurrentConnection = ResolveCurrentConnection(Connections, AppSettings.SelectedConnectionId);
    const AvatarUri = CurrentConnection?.NotionOwnerAvatarUrl
        ?? CurrentConnection?.WorkspaceIconUrl;
    const AvatarName = CurrentConnection?.WorkspaceName ?? "Notion";
    const ControlBackground = Theme.Mode === "Dark"
        ? "#2F2F2F"
        : "#EBEAE8";
    const VisibleDataSources = AppSettings.ShowAllWorkspaceDatabases || CurrentConnection === undefined
        ? DataSources
        : DataSources.filter((Source: Domain.DataSource.CachedDataSourceSchema) =>
            Source.ConnectionId === CurrentConnection.Id);
    const OrderedDataSources = OrderDataSources(VisibleDataSources, AppSettings.DatabaseOrder);
    const IsFree = Status !== null && !Status.Active && Status.EnforcementEnabled;
    const PlansStorageKey = Session
        ? `${PlansLastOpenedStoragePrefix}${Session.user.id}`
        : null;
    const ShowPlansButton = Platform.OS !== "ios" || (Status !== null && !HasProAccess);
    const ShowPlansBadge = PlansLastOpenedAt === null
        || CurrentTime - PlansLastOpenedAt >= PlansReminderIntervalMilliseconds;

    const HandleSelectWorkspace = useCallback((ConnectionId: Domain.Id.NotionConnectionId): void =>
    {
        void UpdateSettings({ SelectedConnectionId: ConnectionId });
    }, [ UpdateSettings ]);

    const HandleAddWorkspace = useCallback(async (): Promise<void> =>
    {
        if (IsAddingWorkspace)
        {
            return;
        }

        SetIsAddingWorkspace(true);

        try
        {
            const NewConnection = await AddWorkspace(Connections);

            if (NewConnection !== null)
            {
                await RefetchConnections();
                Router.push({
                    params: {
                        connectionId: NewConnection.Id,
                        workspaceName: NewConnection.WorkspaceName
                    },
                    pathname: "/data-sources"
                })();
            }
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to add workspace", Error);
        }
        finally
        {
            SetIsAddingWorkspace(false);
        }
    }, [ Connections, IsAddingWorkspace, RefetchConnections, Router ]);

    const OpenSource = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        if (Source.Access === "Locked")
        {
            Alert.alert(
                "Unlock this database with Pro",
                "Free includes three active databases.  Upgrade for unlimited databases, " +
                "or replace an active database in Database settings.",
                [
                    { style: "cancel", text: "Not now" },
                    { onPress: Router.push("/plans"), text: "Compare plans" },
                    { onPress: Router.push("/subscribe"), text: "Upgrade" }
                ]
            );
            return;
        }

        Router.push(CreatePageHref(Source))();
    }, [ Router ]);

    useFocusEffect(useCallback(() =>
    {
        void RefreshSubscription();
        void RefetchConnections();
        void RefetchSettings();
    }, [ RefetchConnections, RefetchSettings, RefreshSubscription ]));

    useEffect(() =>
    {
        const Subscription = AppState.addEventListener("change", (State: AppStateStatus) =>
        {
            if (State === "active")
            {
                void RefreshSubscription();
            }
        });

        return Subscription.remove;
    }, [ RefreshSubscription ]);

    useEffect(() =>
    {
        if (!Allowance?.NextAvailableAt)
        {
            return;
        }

        const Timer = setInterval(RefreshSubscription, 15000);
        return () => clearInterval(Timer);
    }, [ Allowance?.NextAvailableAt, RefreshSubscription ]);

    useEffect(() =>
    {
        if (!Sale)
        {
            return;
        }

        void AsyncStorage.getItem(`subscription-sale-dismissed:${Sale.CampaignId}`)
            .then((Value: string | null) => SetDismissedSaleId(Value === "true" ? Sale.CampaignId : null));
    }, [ Sale ]);

    const DismissSale = useCallback((): void =>
    {
        if (!Sale)
        {
            return;
        }

        SetDismissedSaleId(Sale.CampaignId);
        void AsyncStorage.setItem(`subscription-sale-dismissed:${Sale.CampaignId}`, "true");
    }, [ Sale ]);

    useEffect(() =>
    {
        if (!PlansStorageKey)
        {
            return;
        }

        let IsCurrent = true;
        void AsyncStorage.getItem(PlansStorageKey)
            .then((Value: string | null) =>
            {
                if (!IsCurrent)
                {
                    return;
                }
                const Timestamp = Value === null ? NaN : Number(Value);
                SetPlansLastOpenedAt(Number.isFinite(Timestamp) ? Timestamp : null);
            })
            .catch(() =>
            {
                if (IsCurrent)
                {
                    SetPlansLastOpenedAt(null);
                }
            });

        return () =>
        {
            IsCurrent = false;
        };
    }, [ PlansStorageKey ]);

    useEffect(() =>
    {
        const Timer = setInterval(() => SetCurrentTime(Date.now()), 60 * 1000);
        return () => clearInterval(Timer);
    }, [ ]);

    const OpenPlans = useCallback((): void =>
    {
        const Timestamp = Date.now();
        SetPlansLastOpenedAt(Timestamp);
        if (PlansStorageKey)
        {
            void AsyncStorage.setItem(PlansStorageKey, String(Timestamp));
        }
        Router.push("/plans")();
    }, [ PlansStorageKey, Router ]);

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
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <View style={ Styles.TopBar }>
                    <WorkspaceMenu
                        Connections={ Connections }
                        CurrentConnectionId={ CurrentConnection?.Id }
                        OnAddWorkspace={ () => void HandleAddWorkspace() }
                        OnLogOut={ () => void SignOut() }
                        OnOpenWorkspaceSettings={ Router.push("/workspace-settings") }
                        OnSelectWorkspace={ HandleSelectWorkspace }
                        ShowAllWorkspaceDatabases={ AppSettings.ShowAllWorkspaceDatabases }>
                        <NotionAvatar
                            Name={ AvatarName }
                            Uri={ AvatarUri }
                            key={ AvatarUri ?? AvatarName }
                        />
                    </WorkspaceMenu>
                    <View style={ Styles.HeaderActions }>
                        { ShowPlansButton
                            ? (
                                <Pressable
                                    Accessibility={ {
                                        Label: ShowPlansBadge
                                            ? "Compare plans, new"
                                            : "Compare plans",
                                        Role: "button"
                                    } }
                                    OnPress={ OpenPlans }
                                    style={ ({ pressed }: PressableStateCallbackType) => [
                                        Styles.SettingsButton,
                                        { backgroundColor: ControlBackground },
                                        pressed && Styles.ControlPressed
                                    ] }>
                                    { Platform.OS === "ios"
                                        ? (
                                            <SymbolView
                                                name="arrow.up.circle"
                                                size={ 20 }
                                                tintColor="#8C8786"
                                            />
                                        )
                                        : (
                                            <CircleFadingArrowUp
                                                color="#8C8786"
                                                size={ 20 }
                                                strokeWidth={ 1.8 }
                                            />
                                        ) }
                                    { ShowPlansBadge
                                        ? <View style={ Styles.NotificationBadge } />
                                        : null }
                                </Pressable>
                            )
                            : null }
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
                            : AppSettings.HomeScreenLayout === "2"
                                ? (
                                    /* `flexWrap` + `justifyContent: "flex-start"` (the
                                       default) already left-aligns a lone last card
                                       instead of centering or spacing it out. */
                                    <View style={ Styles.DatabaseCardsGrid }>
                                        { OrderedDataSources.map((
                                            Source: Domain.DataSource.CachedDataSourceSchema
                                        ) => (
                                            <View
                                                key={
                                                    `${ Source.ConnectionId }:${ Source.DataSourceId }`
                                                }
                                                style={ Styles.GridCell }>
                                                <DatabaseCard
                                                    OnPress={ () => OpenSource(Source) }
                                                    Source={ Source }
                                                    Square
                                                />
                                            </View>
                                        )) }
                                    </View>
                                )
                                : (
                                    <View style={ Styles.DatabaseCards }>
                                        { OrderedDataSources.map((
                                            Source: Domain.DataSource.CachedDataSourceSchema
                                        ) => (
                                            <DatabaseCard
                                                OnPress={ () => OpenSource(Source) }
                                                Source={ Source }
                                                key={
                                                    `${ Source.ConnectionId }:${ Source.DataSourceId }`
                                                }
                                            />
                                        )) }
                                    </View>
                                ) }

                    { IsFree && Sale && DismissedSaleId !== Sale.CampaignId
                        ? (
                            <View style={ Styles.SaleBanner }>
                                <Pressable
                                    Accessibility={ { Label: Sale.Copy, Role: "button" } }
                                    OnPress={ Router.push({
                                        params: { campaignId: Sale.CampaignId },
                                        pathname: "/subscribe"
                                    }) }
                                    style={ Styles.SaleCopy }>
                                    <Body Weight="600">{ Sale.Copy }</Body>
                                    <Description>View the limited-time offer</Description>
                                </Pressable>
                                <Button
                                    Appearance="Link"
                                    OnPress={ DismissSale }>
                                    Dismiss
                                </Button>
                            </View>
                        )
                        : null }

                    { IsFree && Allowance
                        ? (
                            <View style={ Styles.UsagePanel }>
                                <View style={ Styles.UsageHeading }>
                                    <Body Weight="600">Free page allowance</Body>
                                    <Pressable
                                        Accessibility={ { Label: "Compare Free and Pro", Role: "button" } }
                                        OnPress={ Router.push("/plans") }>
                                        <HelpCircle
                                            color={ Theme.Semantic.IconSecondary }
                                            size={ 19 }
                                        />
                                    </Pressable>
                                </View>
                                <MeterBar
                                    Max={ Allowance.Limit }
                                    Value={ Allowance.Used }
                                />
                                <Description>
                                    { Allowance.Used } of { Allowance.Limit } pages used in the last
                                    { ` ${Allowance.WindowMinutes} minutes.` }
                                </Description>
                                { Allowance.NextAvailableAt
                                    ? (
                                        <Description>
                                            Next slot at { Allowance.NextAvailableAt.toLocaleTimeString([], {
                                                hour: "numeric",
                                                minute: "2-digit"
                                            }) }.
                                        </Description>
                                    )
                                    : null }
                                <Button OnPress={ Router.push("/subscribe") }>Upgrade</Button>
                            </View>
                        )
                        : null }
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
        backgroundColor: Token.Semantic.BackgroundSidebar,
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
    DatabaseCardsGrid: ViewStyle({
        columnGap: Token.Spacing.M,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        overflow: "visible",
        paddingHorizontal: 2,
        rowGap: Token.Spacing.L
    }),
    GridCell: ViewStyle({
        width: "48%"
    }),
    HeaderActions: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.S
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
    NotificationBadge: ViewStyle({
        backgroundColor: "#D92D20",
        borderColor: Token.Semantic.BackgroundSidebar,
        borderRadius: 5,
        borderWidth: 1.5,
        height: 10,
        position: "absolute",
        right: 2,
        top: 2,
        width: 10
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.L,
        paddingTop: 10
    }),
    SaleBanner: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        flexDirection: "row",
        gap: Token.Spacing.M,
        padding: Token.Spacing.L
    }),
    SaleCopy: ViewStyle({ flex: 1, gap: 2 }),
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
    }),
    UsageHeading: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between"
    }),
    UsagePanel: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        gap: Token.Spacing.M,
        padding: Token.Spacing.L
    })
});

export default HomeScreen;
