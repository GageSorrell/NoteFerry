/**
 * Index of the user's selected databases and their quick-entry form settings.
 *
 * @module noteferry/app/database-settings
 *
 * @file      database-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Body, Description } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import type { EventArg, NavigationAction } from "expo-router/build/react-navigation";
import { MakeStyles, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ListDataSources,
    RemoveDataSourceFromNoteFerry,
    SwapFreeActiveDataSource
} from "@/Domain/Runtime/NoteFerryApi";
import GripVertical from "lucide-react-native/icons/grip-vertical";
import { OrderDataSources } from "@/Domain/Utility/DatabaseOrder";
import { ResourceIcon } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sortable } from "@noteferry/ui/Primitive/Sortable";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useSettings } from "@/features/settings/use-settings";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";

/* The list's fixed row height — SettingsTableRow's own `minHeight`, made
 * exact (rather than a minimum) so it can double as `Sortable`'s
 * `ItemExtent`, which requires every item to report the same size. */
const RowHeight = 56;

interface DatabaseSettingsRowProps
{
    /** Renders the hairline bottom border — omit on the list's last row. */
    readonly Divider: boolean;
    readonly IsEditMode: boolean;
    readonly OnConfigure: () => void;
    readonly OnRemove: () => void;
    readonly Source: Domain.DataSource.CachedDataSourceSchema;
}

/**
 * One row of the database list, styled like `SettingsTableRow` (a leading
 * icon and title inside a bordered, divided table). An available database's
 * icon/title/chevron are one tappable zone, navigating to Customize exactly
 * like a `SettingsTableRow` navigates to a sub-screen; a locked (Free-tier)
 * database keeps its explicit "Replace active" button instead, since that
 * opens an inline panel rather than navigating. In edit mode, a leading drag
 * handle and an icon-only remove button appear alongside either.
 */
const DatabaseSettingsRow = ({
    Divider,
    IsEditMode,
    OnConfigure,
    OnRemove,
    Source
}: DatabaseSettingsRowProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const { t } = useTranslation("settings");
    const IsLocked = Source.Access === "Locked";

    const IconAndText = (
        <>
            <ResourceIcon Resource={ Source } />
            <View style={ Styles.DatabaseText }>
                <Body NumberOfLines={ 1 }>{ Source.Title }</Body>
                <Description>
                    { IsLocked
                        ? t("databaseSettings.status.locked")
                        : t("databaseSettings.status.active") }
                </Description>
            </View>
        </>
    );

    return (
        <View style={ [ Styles.Row, Divider && Styles.RowDivider ] }>
            { IsEditMode
                ? (
                    <Sortable.Handle>
                        <GripVertical
                            color={ Theme.Semantic.IconSecondary }
                            size={ 16 }
                        />
                    </Sortable.Handle>
                )
                : null }
            { IsLocked
                ? <View style={ Styles.DatabaseTitle }>{ IconAndText }</View>
                : (
                    <Pressable
                        Accessibility={ {
                            Label: t("databaseSettings.customize", { title: Source.Title }),
                            Role: "button",
                            State: { disabled: IsEditMode }
                        } }
                        Disabled={ IsEditMode }
                        OnPress={ OnConfigure }
                        style={ Styles.DatabaseTitle }>
                        { IconAndText }
                        <View style={ IsEditMode ? Styles.ChevronDisabled : undefined }>
                            <ChevronRight
                                color={ Theme.Semantic.IconSecondary }
                                size={ 18 }
                                strokeWidth={ 1.8 }
                            />
                        </View>
                    </Pressable>
                ) }
            <View style={ Styles.Actions }>
                { IsLocked
                    ? (
                        <Button
                            Disabled={ IsEditMode }
                            OnPress={ OnConfigure }
                            Size="Small">
                            { t("databaseSettings.replaceActive") }
                        </Button>
                    )
                    : null }
                { IsEditMode
                    ? (
                        <Button
                            AccessibilityLabel={ t("databaseSettings.remove", { title: Source.Title }) }
                            Appearance="Icon"
                            OnPress={ OnRemove }>
                            <Trash2
                                color={ Theme.Semantic.IconSecondary }
                                size={ 16 }
                            />
                        </Button>
                    )
                    : null }
            </View>
        </View>
    );
};

DatabaseSettingsRow.displayName = "DatabaseSettingsRow";

const DatabaseSettingsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Navigation = useNavigation();
    const Onboarding = useOnboarding();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const { HasProAccess } = useSubscription();
    const {
        IsLoading: IsLoadingSettings,
        Settings: AppSettings,
        Update: UpdateSettings
    } = useSettings();
    const { t } = useTranslation("settings");
    const [ DataSources, SetDataSources ] =
        useState<readonly Domain.DataSource.CachedDataSourceSchema[]>([ ]);
    /* Dragging updates this draft synchronously. Persisting only the finished
     * draft prevents overlapping requests from saving an earlier drag last. */
    const [ DraftDatabaseOrder, SetDraftDatabaseOrder ] =
        useState<readonly Domain.Id.NotionDataSourceId[] | null>(null);
    const [ IsEditMode, SetIsEditMode ] = useState(false);
    const [ IsLoading, SetIsLoading ] = useState(!Development.Active);
    const [ IsSavingOrder, SetIsSavingOrder ] = useState(false);
    const [ ReplaceTarget, SetReplaceTarget ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const DatabaseOrderRef = useRef(AppSettings.DatabaseOrder);
    const SaveOrderPromise = useRef<Promise<boolean> | null>(null);
    /* Set right before the programmatic `dismissTo` below, so that call's own
     * `beforeRemove` (fired for the same reason as any other navigation away
     * from this screen) passes through instead of being re-intercepted. */
    const AllowNavigation = useRef(false);

    const OrderedDataSources = OrderDataSources(
        DataSources,
        DraftDatabaseOrder ?? AppSettings.DatabaseOrder
    );

    const Load = useCallback(async (): Promise<void> =>
    {
        SetIsLoading(true);
        try
        {
            SetDataSources(await ListDataSources());
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ ]);

    useEffect(() =>
    {
        if (Development.Active)
        {
            return;
        }

        void ListDataSources().then(SetDataSources).catch((Error: unknown) =>
            {
                console.error("Failed to load database settings", Error);
            }).finally(() => SetIsLoading(false));
    }, [ Development.Active, Load ]);

    const SaveDatabaseOrder = useCallback((): Promise<boolean> =>
    {
        if (SaveOrderPromise.current !== null)
        {
            return SaveOrderPromise.current;
        }

        const NextOrder = DatabaseOrderRef.current;
        const IsUnchanged = NextOrder.length === AppSettings.DatabaseOrder.length
            && NextOrder.every((Id, Index) => Id === AppSettings.DatabaseOrder[Index]);

        if (IsUnchanged)
        {
            return Promise.resolve(true);
        }

        SetIsSavingOrder(true);
        const Save = UpdateSettings({ DatabaseOrder: NextOrder })
            .then(() => true)
            .catch((Error: unknown) =>
            {
                console.error("Failed to save database order", Error);
                Alert.alert(
                    t("dataSources.errorGeneric.title"),
                    t("dataSources.errorGeneric.message")
                );
                return false;
            })
            .finally(() =>
            {
                SetIsSavingOrder(false);
                SaveOrderPromise.current = null;
            });

        SaveOrderPromise.current = Save;
        return Save;
    }, [ AppSettings.DatabaseOrder, UpdateSettings, t ]);

    const LeaveScreen = useCallback(async (): Promise<void> =>
    {
        if (Onboarding.IsActive)
        {
            await Onboarding.Complete();
        }

        AllowNavigation.current = true;
        Router.dismissTo("/")();
    }, [ Onboarding, Router ]);

    const StopEditingAndLeave = useCallback(async (): Promise<void> =>
    {
        if (!await SaveDatabaseOrder())
        {
            return;
        }

        SetDraftDatabaseOrder(null);
        SetIsEditMode(false);
        await LeaveScreen();
    }, [ LeaveScreen, SaveDatabaseOrder ]);

    /* This screen is reachable both from the settings hub and, via "You're
     * all set!"'s "Customize" link, from mid-onboarding -- and either way,
     * leaving it (the header back button or Android's hardware back, both of
     * which fire `beforeRemove`) should always land on the home screen's
     * database cards rather than wherever the navigation stack says came
     * before. Reached from onboarding, `index` isn't a registered route yet
     * (it sits behind the `IsInApp` guard in `_layout.tsx`, which requires
     * onboarding to be inactive), so onboarding is completed first -- the
     * same step its own "get started" action would have taken -- to flip
     * that guard before navigating home. Skipped while a development mock is
     * active: `IsInApp` there is unconditionally false, so `index` is never
     * reachable and default back navigation (into the mock picker) is left
     * alone.
     *
     * While edit mode is on, leaving is additionally gated behind a
     * confirmation -- choosing "Stop Editing" saves the current draft before
     * leaving, while "Keep Editing" returns to the sorting handles. */
    type BeforeRemoveEvent = EventArg<"beforeRemove", true, { action: NavigationAction; }>;
    useEffect(() => Navigation.addListener("beforeRemove", (Event: BeforeRemoveEvent) =>
    {
        if (AllowNavigation.current || Development.Active)
        {
            return;
        }

        Event.preventDefault();

        if (!IsEditMode)
        {
            void LeaveScreen();
            return;
        }

        Alert.alert(
            t("databaseSettings.exitEditConfirm.title"),
            t("databaseSettings.exitEditConfirm.message"),
            [
                { style: "cancel", text: t("databaseSettings.exitEditConfirm.keepEditing") },
                {
                    onPress: () => void StopEditingAndLeave(),
                    text: t("databaseSettings.exitEditConfirm.stopEditing")
                }
            ]
        );
    }), [ Development.Active, IsEditMode, LeaveScreen, Navigation, StopEditingAndLeave, t ]);

    const ShowProGate = useCallback((Title: string, Message: string): void =>
    {
        Alert.alert(
            Title,
            Message,
            [
                { style: "cancel", text: t("databaseSettings.customizeGate.cancel") },
                { onPress: Router.push("/plans"), text: t("databaseSettings.customizeGate.comparePlans") },
                { onPress: Router.push("/subscribe"), text: t("databaseSettings.customizeGate.upgrade") }
            ]
        );
    }, [ Router, t ]);

    const ShowCustomizationGate = useCallback((): void =>
    {
        ShowProGate(t("databaseSettings.customizeGate.title"), t("databaseSettings.customizeGate.message"));
    }, [ ShowProGate, t ]);

    const ShowReorderGate = useCallback((): void =>
    {
        ShowProGate(t("general.proGate.title"), t("general.proGate.orderMessage"));
    }, [ ShowProGate, t ]);

    const Configure = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        if (!HasProAccess)
        {
            ShowCustomizationGate();
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
    }, [ HasProAccess, Router, ShowCustomizationGate ]);

    const HandlePrimaryAction = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        if (Source.Access === "Locked")
        {
            SetReplaceTarget(Source);
            return;
        }

        Configure(Source);
    }, [ Configure ]);

    const Replace = useCallback(async (
        Active: Domain.DataSource.CachedDataSourceSchema
    ): Promise<void> =>
    {
        if (!ReplaceTarget) return;
        await SwapFreeActiveDataSource(ReplaceTarget.DataSourceId, Active.DataSourceId);
        SetReplaceTarget(null);
        await Load();
    }, [ Load, ReplaceTarget ]);

    const Remove = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        Alert.alert(
            t("databaseSettings.removeConfirm.title"),
            t("databaseSettings.removeConfirm.message", { title: Source.Title }),
            [
                { style: "cancel", text: t("databaseSettings.removeConfirm.cancel") },
                {
                    onPress: () => void RemoveDataSourceFromNoteFerry(Source.DataSourceId).then(Load),
                    style: "destructive",
                    text: t("databaseSettings.removeConfirm.confirm")
                }
            ]
        );
    }, [ Load, t ]);

    const ToggleEditMode = useCallback(async (): Promise<void> =>
    {
        if (IsEditMode)
        {
            if (!await SaveDatabaseOrder())
            {
                return;
            }

            SetDraftDatabaseOrder(null);
            SetIsEditMode(false);
            return;
        }

        if (!HasProAccess)
        {
            ShowReorderGate();
            return;
        }

        /* Editing and replacing a Free slot are mutually exclusive flows for
         * the same row actions -- drop any pending replace panel so it can't
         * sit open (with its own, still-enabled replace buttons) behind the
         * now-disabled primary action. */
        SetReplaceTarget(null);
        const FullOrder = OrderDataSources(DataSources, AppSettings.DatabaseOrder)
            .map((Source) => Source.DataSourceId);

        DatabaseOrderRef.current = FullOrder;
        SetDraftDatabaseOrder(FullOrder);
        SetIsEditMode(true);
    }, [ AppSettings.DatabaseOrder, DataSources, HasProAccess, IsEditMode, SaveDatabaseOrder, ShowReorderGate ]);

    const HandleReorder = useCallback((NextOrder: readonly string[]): void =>
    {
        const TypedOrder = NextOrder as readonly Domain.Id.NotionDataSourceId[];

        DatabaseOrderRef.current = TypedOrder;
        SetDraftDatabaseOrder(TypedOrder);
    }, [ ]);

    const RenderHeaderRight = useCallback(() => (
        !IsLoading && !IsLoadingSettings && DataSources.length > 0
            ? (
                <Button
                    Disabled={ IsSavingOrder }
                    Appearance="Link"
                    OnPress={ () => void ToggleEditMode() }
                    Size="Small">
                    { IsEditMode
                        ? t("databaseSettings.editAction.save")
                        : t("databaseSettings.editAction.edit") }
                </Button>
            )
            : null
    ), [ DataSources.length, IsEditMode, IsLoading, IsLoadingSettings, IsSavingOrder, ToggleEditMode, t ]);

    return (
        <View style={ Styles.Container }>
            <Stack.Screen options={ { headerRight: RenderHeaderRight } } />
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <Description>
                    { t("databaseSettings.description") }
                </Description>

                { ReplaceTarget
                    ? (
                        <View style={ Styles.ReplacePanel }>
                            <Body Weight="600">{ t("databaseSettings.replacePanel.title") }</Body>
                            <Description>
                                { t("databaseSettings.replacePanel.description", { title: ReplaceTarget.Title }) }
                            </Description>
                            { DataSources.filter((Source) => Source.Access === "Available")
                                .map((Source) => (
                                    <Button
                                        key={ Source.DataSourceId }
                                        OnPress={ () => void Replace(Source) }>
                                        { t("databaseSettings.replacePanel.replaceButton", { title: Source.Title }) }
                                    </Button>
                                )) }
                            <Button Appearance="Link" OnPress={ () => SetReplaceTarget(null) }>
                                { t("databaseSettings.replacePanel.cancel") }
                            </Button>
                        </View>
                    )
                    : null }

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    { IsLoading || IsLoadingSettings
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                        : OrderedDataSources.length === 0
                            ? (
                                <Description>
                                    { t("databaseSettings.empty") }
                                </Description>
                            )
                            : IsEditMode
                                ? (
                                    <Sortable.Root
                                        Disabled={ IsSavingOrder }
                                        ItemExtent={ RowHeight }
                                        OnValueChange={ HandleReorder }
                                        Style={ Styles.Table }
                                        Value={ OrderedDataSources.map((Source) => Source.DataSourceId) }>
                                        <Sortable.List>
                                            { OrderedDataSources.map((
                                                Source: Domain.DataSource.CachedDataSourceSchema,
                                                Index: number
                                            ) => (
                                                <Sortable.Item
                                                    Id={ Source.DataSourceId }
                                                    key={ Source.DataSourceId }>
                                                    <DatabaseSettingsRow
                                                        Divider={ Index < OrderedDataSources.length - 1 }
                                                        IsEditMode
                                                        OnConfigure={ () => HandlePrimaryAction(Source) }
                                                        OnRemove={ () => Remove(Source) }
                                                        Source={ Source }
                                                    />
                                                </Sortable.Item>
                                            )) }
                                        </Sortable.List>
                                    </Sortable.Root>
                                )
                                : (
                                    <View style={ Styles.Table }>
                                        { OrderedDataSources.map((
                                            Source: Domain.DataSource.CachedDataSourceSchema,
                                            Index: number
                                        ) => (
                                            <DatabaseSettingsRow
                                                Divider={ Index < OrderedDataSources.length - 1 }
                                                IsEditMode={ false }
                                                OnConfigure={ () => HandlePrimaryAction(Source) }
                                                OnRemove={ () => Remove(Source) }
                                                Source={ Source }
                                                key={ Source.DataSourceId }
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
    Actions: ViewStyle({ alignItems: "center", flexDirection: "row", gap: Token.Spacing.S }),
    /* Matches `Button`'s own disabled dimming, so the chevron reads as
     * non-interactive the same way the row's other actions do in edit mode. */
    ChevronDisabled: ViewStyle({ opacity: 0.4 }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    DatabaseText: ViewStyle({ flex: 1 }),
    DatabaseTitle: ViewStyle({ alignItems: "center", flex: 1, flexDirection: "row", gap: Token.Spacing.M }),
    List: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.Xl
    }),
    ReplacePanel: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        gap: Token.Spacing.S,
        padding: Token.Spacing.L
    }),
    Row: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        height: RowHeight,
        paddingHorizontal: 12,
        paddingVertical: 9
    }),
    RowDivider: ViewStyle({
        borderBottomColor: Token.Semantic.Border,
        borderBottomWidth: 1
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.L,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    /* Matches `SettingsTable`'s own container so the database list reads as
     * the same kind of bordered, divided table as the settings hub's rows. */
    Table: ViewStyle({
        borderColor: Token.Semantic.Border,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden"
    })
});

export default DatabaseSettingsScreen;
