/**
 * App-level settings, reached from the gear button on the home screen: a
 * table of entry points into General/Databases/Notifications/Quick
 * Actions/Account settings sub-screens, then in-line launch behavior,
 * home-screen database order, review/feedback/bug links, and app info.
 *
 * @module notivex/app/settings
 *
 * @file      settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import type * as Domain from "@notivex/domain";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import { Alert, ScrollView, View } from "react-native";
import { Bell, Database, ExternalLink, GripVertical, Settings, UserRound, Zap } from "lucide-react-native";
import { Body, Button, ButtonLabel, Description, Heading2, LabelText, Sortable } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { BehaviorPicker } from "@/Component/BehaviorPicker";
import Constants from "expo-constants";
import { SettingsTable, SettingsTableRow } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useConnections } from "@/Domain/Connection";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSettings } from "@/features/settings/use-settings";

const SortableItemExtent = 44;

const SettingsScreen = (): React.JSX.Element =>
{
    "use no memo";

    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
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
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsTable>
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Settings
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="General"
                        OnPress={ Router.push("/general-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Database
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Databases"
                        OnPress={ Router.push("/database-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Bell
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Notifications"
                        OnPress={ Router.push("/notification-settings") }
                    />
                    <SettingsTableRow
                        Divider
                        Icon={
                            <Zap
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Quick Actions"
                        OnPress={ Router.push("/quick-action-settings") }
                    />
                    <SettingsTableRow
                        Icon={
                            <UserRound
                                color={ Theme.Semantic.IconSecondary }
                                size={ 20 }
                                strokeWidth={ 1.8 }
                            />
                        }
                        Label="Account settings"
                        OnPress={ Router.push("/account-settings") }
                    />
                </SettingsTable>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <Heading2 Style={ Styles.SectionHeading }>On launch</Heading2>
                    <Description Style={ Styles.SectionSubtitle }>
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

                    <Heading2 Style={ Styles.SectionHeading }>Home screen order</Heading2>
                    <Description Style={ Styles.SectionSubtitle }>
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
                                                <View style={ Styles.SortableRow }>
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

                    <Heading2 Style={ Styles.SectionHeading }>Support Notivex</Heading2>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => void HandleLeaveReview() }
                        Style={ Styles.SupportButton }>
                        <ButtonLabel Color={ Token.Semantic.Primary }>
                            Leave a review
                        </ButtonLabel>
                        <ExternalLink
                            color={ Theme.Semantic.Primary }
                            size={ 16 }
                            strokeWidth={ 1.8 }
                        />
                    </Button>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => void HandleSubmitFeedback() }
                        Style={ Styles.SupportButton }>
                        Submit feedback
                    </Button>
                    <Button
                        Appearance="Primary"
                        OnPress={ HandleReportBug }
                        Style={ Styles.SupportButton }>
                        Report a bug
                    </Button>

                    <View style={ Styles.AppInfo }>
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

const useStyles = MakeStyles({
    AppInfo: ViewStyle({
        alignItems: "center",
        paddingTop: Token.Spacing.S
    }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    List: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.Xl
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
    SectionHeading: TextStyle({
        marginTop: Token.Spacing.M
    }),
    SectionSubtitle: TextStyle({
        marginBottom: 4,
        marginTop: -6
    }),
    SortableRow: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: Token.Radii.Large,
        flexDirection: "row",
        height: SortableItemExtent - 4,
        justifyContent: "space-between",
        marginBottom: 4,
        paddingHorizontal: Token.Spacing.M
    }),
    SupportButton: ViewStyle({
        alignSelf: "stretch"
    })
});

export default SettingsScreen;
