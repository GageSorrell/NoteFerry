/**
 * App-level settings, reached from the gear button on the home screen:
 * per-database entry points, app-wide preferences (launch behavior,
 * home-screen database order, quick actions, offline notifications), app
 * info, and links into review/feedback/account-settings.
 *
 * @module notivex/app/settings
 *
 * @file      settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import type * as Domain from "@notivex/domain";
import {
    Body,
    Button,
    Checkbox,
    Description,
    Heading2,
    LabelText,
    Pressable,
    Sortable,
    Switch
} from "@notivex/ui/Primitive";
import { ChevronRight, Database, GripVertical } from "lucide-react-native";
import type { PressableStateCallbackType } from "react-native";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { BehaviorPicker } from "@/Component/BehaviorPicker";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useConnections } from "@/Domain/Connection";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSettings } from "@/features/settings/use-settings";
import { useTheme } from "@notivex/ui";

const SortableItemExtent = 44;

/** A plain, tappable row matching the existing "Databases" row's chrome. */
interface SettingsRowProps extends React.PropsWithChildren
{
    readonly Label: string;
    readonly OnPress: () => void;
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function SettingsRow({ Label, OnPress, children }: SettingsRowProps): React.JSX.Element
{
    const Theme = useTheme();

    return (
        <Pressable
            Accessibility={ { Label, Role: "button" } }
            OnPress={ OnPress }
            style={ ({ pressed }: PressableStateCallbackType) => [
                styles.row,
                { backgroundColor: Theme.Semantic.BackgroundModal },
                pressed && styles.rowPressed
            ] }>
            { children }
            <ChevronRight
                color={ Theme.Semantic.IconSecondary }
                size={ 18 }
                strokeWidth={ 1.8 }
            />
        </Pressable>
    );
}

const SettingsScreen = (): React.JSX.Element =>
{
    "use no memo";

    const Router = useLazyRouter();
    const Theme = useTheme();
    const { DataSources } = useConnections();
    const { Settings: AppSettings, Update } = useSettings();

    const DatabaseOrder = AppSettings.DatabaseOrder.length > 0
        ? AppSettings.DatabaseOrder
        : DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema) => Source.DataSourceId);
    const DataSourceById = new Map(DataSources.map((
        Source: Domain.DataSource.CachedDataSourceSchema
    ) => [ Source.DataSourceId, Source ] as const));

    const HandleReorder = useCallback((NextOrder: ReadonlyArray<string>) =>
    {
        void Update({
            DatabaseOrder: NextOrder as ReadonlyArray<Domain.Id.NotionDataSourceId>
        });
    }, [ Update ]);

    const ToggleQuickAction = useCallback((DataSourceId: Domain.Id.NotionDataSourceId) =>
    {
        const Current = AppSettings.QuickActionDataSourceIds;
        const Next = Current.includes(DataSourceId)
            ? Current.filter((Id: Domain.Id.NotionDataSourceId) => Id !== DataSourceId)
            : [ ...Current, DataSourceId ];

        void Update({ QuickActionDataSourceIds: Next });
    }, [ AppSettings.QuickActionDataSourceIds, Update ]);

    const HandleLeaveReview = useCallback(async () =>
    {
        if (await StoreReview.hasAction())
        {
            await StoreReview.requestReview();
        }
    }, [ ]);

    const HandleSubmitFeedback = useCallback(async () =>
    {
        const Available = await MailComposer.isAvailableAsync();

        if (!Available)
        {
            Alert.alert(
                "No mail app available",
                "Set up a mail account on this device to send feedback."
            );

            return;
        }

        await MailComposer.composeAsync({
            body: `\n\n—\nNotivex ${ Application.nativeApplicationVersion ?? "?" } `
                + `(${ Application.nativeBuildVersion ?? "?" })`,
            recipients: [ "gage@sorrell.sh" ],
            subject: "Notivex feedback"
        });
    }, [ ]);

    const HandleReportBug = useCallback(() =>
    {
        Alert.alert("Coming soon", "Bug reporting isn't wired up yet — TODO.");
    }, [ ]);

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

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.scroll }>
                    <SettingsRow
                        Label="Database settings"
                        OnPress={ Router.push("/database-settings") }>
                        <View style={ styles.rowLeft }>
                            <Database
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                            <View style={ styles.rowText }>
                                <Body>Databases</Body>
                                <Description>
                                    Manage the databases available for quick entry.
                                </Description>
                            </View>
                        </View>
                    </SettingsRow>

                    <Heading2 Style={ styles.sectionHeading }>On launch</Heading2>
                    <Description Style={ styles.sectionSubtitle }>
                        What Notivex shows when it opens.
                    </Description>
                    <BehaviorPicker
                        DataSources={ DataSources }
                        OnChange={ (Value: Domain.Behavior.PostCreationBehavior) =>
                        {
                            if (Value.Type !== "CloseApp")
                            {
                                void Update({ LaunchBehavior: Value });
                            }
                        } }
                        Value={ AppSettings.LaunchBehavior }
                    />

                    <Heading2 Style={ styles.sectionHeading }>Home screen order</Heading2>
                    <Description Style={ styles.sectionSubtitle }>
                        Drag to reorder the databases shown on the home screen.
                    </Description>
                    { DatabaseOrder.length === 0
                        ? <Body>No databases yet.</Body>
                        : (
                            <Sortable.Root
                                ItemExtent={ SortableItemExtent }
                                OnValueChange={ HandleReorder }
                                Value={ DatabaseOrder }>
                                <Sortable.List>
                                    { DatabaseOrder.map((Id: Domain.Id.NotionDataSourceId) =>
                                    {
                                        const Source = DataSourceById.get(Id);

                                        return (
                                            <Sortable.Item
                                                Id={ Id }
                                                key={ Id }>
                                                <View
                                                    style={ [
                                                        styles.sortableRow,
                                                        { backgroundColor: Theme.Semantic.BackgroundModal }
                                                    ] }>
                                                    <Body NumberOfLines={ 1 }>
                                                        { Source?.Title ?? Id }
                                                    </Body>
                                                    <Sortable.Handle>
                                                        <GripVertical
                                                            color={ Theme.Semantic.IconSecondary }
                                                            size={ 16 }
                                                        />
                                                    </Sortable.Handle>
                                                </View>
                                            </Sortable.Item>
                                        );
                                    }) }
                                </Sortable.List>
                            </Sortable.Root>
                        ) }

                    <Heading2 Style={ styles.sectionHeading }>Quick actions</Heading2>
                    <Description Style={ styles.sectionSubtitle }>
                        Choose up to six databases to show as home-screen shortcuts
                        (long-press the app icon). Leave all unchecked to use the first
                        six databases automatically.
                    </Description>
                    { DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema) =>
                    {
                        const Checked = AppSettings.QuickActionDataSourceIds
                            .includes(Source.DataSourceId);
                        const AtLimit = AppSettings.QuickActionDataSourceIds.length >= 6;

                        return (
                            <View
                                key={ Source.DataSourceId }
                                style={ styles.quickActionRow }>
                                <Checkbox
                                    Checked={ Checked }
                                    Disabled={ !Checked && AtLimit }
                                    OnCheckedChange={ () => ToggleQuickAction(Source.DataSourceId) }
                                />
                                <Body NumberOfLines={ 1 }>{ Source.Title }</Body>
                            </View>
                        );
                    }) }

                    <Heading2 Style={ styles.sectionHeading }>Notifications</Heading2>
                    <View style={ styles.switchRow }>
                        <View style={ styles.rowText }>
                            <Body>Notify when back online</Body>
                            <Description>
                                Notify you if a page was created while offline.
                            </Description>
                        </View>
                        <Switch
                            OnValueChange={ (Value: boolean) =>
                                void Update({ NotifyOnOfflineSubmit: Value }) }
                            Value={ AppSettings.NotifyOnOfflineSubmit }
                        />
                    </View>

                    <SettingsRow
                        Label="Account settings"
                        OnPress={ Router.push("/account-settings") }>
                        <View style={ styles.rowText }>
                            <Body>Account settings</Body>
                        </View>
                    </SettingsRow>

                    <Heading2 Style={ styles.sectionHeading }>Support Notivex</Heading2>
                    <Button
                        Appearance="Cell"
                        OnPress={ () => void HandleLeaveReview() }
                        Style={ styles.supportButton }>
                        Leave a review
                    </Button>
                    <Button
                        Appearance="Cell"
                        OnPress={ () => void HandleSubmitFeedback() }
                        Style={ styles.supportButton }>
                        Submit feedback
                    </Button>
                    <Button
                        Appearance="Cell"
                        OnPress={ HandleReportBug }
                        Style={ styles.supportButton }>
                        Report a bug
                    </Button>

                    <View style={ styles.appInfo }>
                        <LabelText>
                            Notivex { Application.nativeApplicationVersion ?? Constants.expoConfig?.version }
                            { " " }(build { Application.nativeBuildVersion ?? "—" })
                        </LabelText>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    appInfo:
    {
        alignItems: "center",
        paddingTop: 8
    },
    back:
    {
        alignSelf: "flex-start"
    },
    container:
    {
        flex: 1
    },
    list:
    {
        gap: 12,
        paddingVertical: 24
    },
    quickActionRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        paddingVertical: 6
    },
    row:
    {
        alignItems: "center",
        borderRadius: 14,
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    rowLeft:
    {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: 12
    },
    rowPressed:
    {
        opacity: 0.72
    },
    rowText:
    {
        flex: 1,
        gap: 2
    },
    safeArea:
    {
        flex: 1,
        gap: 16,
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
    },
    sectionSubtitle:
    {
        marginBottom: 4,
        marginTop: -6
    },
    sortableRow:
    {
        alignItems: "center",
        borderRadius: 10,
        flexDirection: "row",
        height: SortableItemExtent - 4,
        justifyContent: "space-between",
        marginBottom: 4,
        paddingHorizontal: 12
    },
    supportButton:
    {
        alignSelf: "stretch"
    },
    switchRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
        paddingVertical: 8
    }
});

export default SettingsScreen;
