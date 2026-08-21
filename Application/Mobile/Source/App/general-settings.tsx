/**
 * General app settings. Reached from the "General" row on the settings
 * screen: launch behavior, home screen layout and database order, and
 * contrast.
 *
 * @module notivex/app/general-settings
 *
 * @file      general-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    Body,
    BottomSheet,
    BottomSheetDescription,
    BottomSheetTitle,
    BottomSheetView,
    Description,
    Heading2,
    MenuGroup,
    MenuItem,
    MenuItemCheck,
    Pressable,
    RadioGroup,
    RadioGroupItem,
    Setting,
    SettingsContainer,
    Sortable
} from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme, useToken } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, GripVertical } from "lucide-react-native";
import { useCallback, useRef } from "react";
import { useSettings } from "@/features/settings/use-settings";
import { Alert, ScrollView, View } from "react-native";
import { useConnections } from "@/Domain/Connection";
import { useSubscription } from "@/Domain/Subscription";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

const SortableItemExtent = 44;

interface LayoutOption
{
    readonly AccessibilityLabel: string;
    readonly Value: Domain.Settings.HomeScreenLayout;
}

const LayoutOptions: readonly LayoutOption[] = [
    { AccessibilityLabel: "One database per row", Value: "1" },
    { AccessibilityLabel: "Two square cards per row", Value: "2" }
];

interface ContrastOption
{
    readonly Label: string;
    readonly ShortLabel: string;
    readonly Value: Domain.Settings.Contrast;
}

const ContrastOptions: readonly ContrastOption[] = [
    { Label: "Use system setting", ShortLabel: "System", Value: "System" },
    { Label: "Standard contrast", ShortLabel: "Disabled", Value: "Standard" },
    { Label: "High contrast", ShortLabel: "Enabled", Value: "High" }
];

interface LaunchOption
{
    /** `"Home"`, or the target database's id — also the selection key. */
    readonly Key: string;
    readonly Label: string;
    readonly Value: Domain.Behavior.LaunchBehavior;
}

const GeneralSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();
    const { HasProAccess } = useSubscription();
    const { DataSources } = useConnections();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const ContrastSheetRef = useRef<BottomSheet | null>(null);
    const LaunchSheetRef = useRef<BottomSheet | null>(null);
    const { [Token.Semantic.Muted]: MutedColor } = useToken(Token.Semantic.Muted);

    const SelectedContrast =
        ContrastOptions.find((Option: ContrastOption) => Option.Value === AppSettings.Contrast)
            ?? ContrastOptions[ 0 ];

    const DatabaseOrder = AppSettings.DatabaseOrder.length > 0
        ? AppSettings.DatabaseOrder
        : DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema) => Source.DataSourceId);
    const DataSourceById = new Map(DataSources.map((
        Source: Domain.DataSource.CachedDataSourceSchema
    ) => [ Source.DataSourceId, Source ] as const));

    const LaunchOptions: readonly LaunchOption[] = [
        { Key: "Home", Label: "Home screen", Value: { Type: "Home" } },
        ...DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema): LaunchOption => ({
            Key: Source.DataSourceId,
            Label: Source.Title,
            Value: { DataSourceId: Source.DataSourceId, Type: "SelectedDatabase" }
        }))
    ];

    const SelectedLaunchKey = AppSettings.LaunchBehavior.Type === "Home"
        ? "Home"
        : AppSettings.LaunchBehavior.DataSourceId;
    const SelectedLaunchLabel =
        LaunchOptions.find((Option: LaunchOption) => Option.Key === SelectedLaunchKey)?.Label
            ?? "Select a database";

    const ShowSettingsGate = useCallback((Message: string): void =>
    {
        Alert.alert(
            "Available with Notivex Pro",
            Message,
            [
                { style: "cancel", text: "Not now" },
                { onPress: Router.push("/plans"), text: "Compare plans" },
                { onPress: Router.push("/subscribe"), text: "Upgrade" }
            ]
        );
    }, [ Router ]);

    const SetHomeScreenLayout = useCallback((Value: Domain.Settings.HomeScreenLayout) =>
    {
        if (Value !== "1" && !HasProAccess)
        {
            ShowSettingsGate("Pro unlocks the two-column layout and custom database ordering.");
            return;
        }

        void Update({ HomeScreenLayout: Value });
    }, [ HasProAccess, ShowSettingsGate, Update ]);

    const SetContrast = useCallback((Value: Domain.Settings.Contrast) =>
    {
        void Update({ Contrast: Value });
    }, [ Update ]);

    const OpenContrastMenu = useCallback((): void =>
    {
        ContrastSheetRef.current?.present();
    }, []);

    const SelectContrast = useCallback((Value: Domain.Settings.Contrast): void =>
    {
        SetContrast(Value);
        ContrastSheetRef.current?.dismiss();
    }, [ SetContrast ]);

    const OpenLaunchMenu = useCallback((): void =>
    {
        LaunchSheetRef.current?.present();
    }, []);

    const SelectLaunch = useCallback((Value: Domain.Behavior.LaunchBehavior): void =>
    {
        LaunchSheetRef.current?.dismiss();

        if (Value.Type !== "Home" && !HasProAccess)
        {
            ShowSettingsGate("Pro can launch directly into a selected database.");
            return;
        }

        void Update({ LaunchBehavior: Value });
    }, [ HasProAccess, ShowSettingsGate, Update ]);

    const HandleReorder = useCallback((NextOrder: ReadonlyArray<string>) =>
    {
        if (!HasProAccess)
        {
            ShowSettingsGate("Pro lets you set a custom home-screen database order.");
            return;
        }

        void Update({
            DatabaseOrder: NextOrder as ReadonlyArray<Domain.Id.NotionDataSourceId>
        });
    }, [ HasProAccess, ShowSettingsGate, Update ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <SettingsContainer>
                        <Setting
                            Description="What Notivex shows when it opens."
                            Title="On launch">
                            <Pressable
                                Accessibility={ {
                                    Label: `On launch: ${ SelectedLaunchLabel }`,
                                    Role: "button"
                                } }
                                OnPress={ OpenLaunchMenu }
                                style={ Styles.MenuTrigger }>
                                <Body NumberOfLines={ 1 }>{ SelectedLaunchLabel }</Body>
                                <ChevronDown
                                    color={ MutedColor }
                                    size={ 16 }
                                />
                            </Pressable>
                        </Setting>
                        <Setting
                            Description="Show one database per row, or two square cards per row."
                            Title="Home screen layout">
                            { /* `RadioGroupItem` is decorative only (`pointerEvents="none"`) —
                                 the outer `Pressable` covers the preview *and* the dot, so
                                 tapping either registers the same selection. */ }
                            <RadioGroup
                                OnValueChange={ (Value: string) =>
                                    SetHomeScreenLayout(Value as Domain.Settings.HomeScreenLayout) }
                                Style={ Styles.LayoutOptions }
                                Value={ AppSettings.HomeScreenLayout }>
                                { LayoutOptions.map((Option: LayoutOption) => (
                                    <Pressable
                                        Accessibility={ {
                                            Label: Option.AccessibilityLabel,
                                            Role: "radio",
                                            State: { checked: AppSettings.HomeScreenLayout === Option.Value }
                                        } }
                                        OnPress={ () => SetHomeScreenLayout(Option.Value) }
                                        key={ Option.Value }
                                        style={ Styles.LayoutOption }>
                                        { Option.Value === "1"
                                            ? (
                                                <View style={ Styles.PreviewRows }>
                                                    <View style={ Styles.PreviewWideBox } />
                                                    <View style={ Styles.PreviewWideBox } />
                                                </View>
                                            )
                                            : (
                                                <View style={ Styles.PreviewGrid }>
                                                    <View style={ Styles.PreviewGridRow }>
                                                        <View style={ Styles.PreviewSquare } />
                                                        <View style={ Styles.PreviewSquare } />
                                                    </View>
                                                    <View style={ Styles.PreviewGridRow }>
                                                        <View style={ Styles.PreviewSquare } />
                                                        <View style={ Styles.PreviewSquare } />
                                                    </View>
                                                </View>
                                            ) }
                                        <View
                                            accessible={ false }
                                            pointerEvents="none">
                                            <RadioGroupItem Value={ Option.Value } />
                                        </View>
                                    </Pressable>
                                )) }
                            </RadioGroup>
                        </Setting>
                        <Setting
                            Description="Increase the contrast of dividers, borders, and switches."
                            Title="High contrast">
                            <Pressable
                                Accessibility={ {
                                    Label: `High contrast: ${ SelectedContrast.Label }`,
                                    Role: "button"
                                } }
                                OnPress={ OpenContrastMenu }
                                style={ Styles.MenuTrigger }>
                                <Body NumberOfLines={ 1 }>{ SelectedContrast.ShortLabel }</Body>
                                <ChevronDown
                                    color={ MutedColor }
                                    size={ 16 }
                                />
                            </Pressable>
                        </Setting>
                    </SettingsContainer>

                    { DataSources.length > 1
                        ? (
                            <View>
                                <Heading2 Style={ Styles.SectionHeading }>Home screen order</Heading2>
                                <Description Style={ Styles.SectionSubtitle }>
                                    Drag to reorder the databases shown on the home screen.
                                </Description>
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
                            </View>
                        )
                        : null }
                </ScrollView>
            </SafeAreaView>
            <BottomSheet
                Ref={ ContrastSheetRef }
                SnapPoints={ [ "34%" ] }
                TestId="contrast-options-sheet">
                <BottomSheetView style={ Styles.Sheet }>
                    <View style={ Styles.SheetHeader }>
                        <BottomSheetTitle>High contrast</BottomSheetTitle>
                        <BottomSheetDescription>
                            Choose how much contrast to use for dividers, borders, and switches.
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.SheetMenu }>
                        { ContrastOptions.map((Option: ContrastOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectContrast(Option.Value) }
                                key={ Option.Value }
                                Style={ Styles.SheetMenuOption }>
                                { AppSettings.Contrast === Option.Value
                                    ? <MenuItemCheck />
                                    : null }
                            </MenuItem>
                        )) }
                    </MenuGroup>
                </BottomSheetView>
            </BottomSheet>
            <BottomSheet
                Ref={ LaunchSheetRef }
                SnapPoints={ [ "50%" ] }
                TestId="launch-options-sheet">
                <BottomSheetView style={ Styles.Sheet }>
                    <View style={ Styles.SheetHeader }>
                        <BottomSheetTitle>On launch</BottomSheetTitle>
                        <BottomSheetDescription>
                            Choose what Notivex shows when it opens.
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.SheetMenu }>
                        { LaunchOptions.map((Option: LaunchOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectLaunch(Option.Value) }
                                key={ Option.Key }
                                Style={ Styles.SheetMenuOption }>
                                { SelectedLaunchKey === Option.Key
                                    ? <MenuItemCheck />
                                    : null }
                            </MenuItem>
                        )) }
                    </MenuGroup>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    LayoutOption: ViewStyle({
        alignItems: "center",
        gap: 10,
        padding: 8
    }),
    LayoutOptions: ViewStyle({
        flexDirection: "row",
        gap: 8
    }),
    List: ViewStyle({
        gap: Token.Spacing.L
    }),
    MenuTrigger: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        justifyContent: "flex-end",
        maxWidth: "100%",
        minHeight: 44
    }),
    PreviewGrid: ViewStyle({
        gap: 4
    }),
    PreviewGridRow: ViewStyle({
        flexDirection: "row",
        gap: 4
    }),
    PreviewRows: ViewStyle({
        gap: 4
    }),
    PreviewSquare: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundInput,
        borderColor: Token.Semantic.Border,
        borderRadius: 3,
        borderWidth: 1,
        height: 12,
        width: 12
    }),
    PreviewWideBox: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundInput,
        borderColor: Token.Semantic.Border,
        borderRadius: 3,
        borderWidth: 1,
        height: 14,
        width: 28
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.L
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
    Sheet: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.SheetHorizontal,
        paddingVertical: Token.Spacing.S
    }),
    SheetHeader: ViewStyle({
        gap: 4
    }),
    SheetMenu: ViewStyle({
        marginTop: 12
    }),
    SheetMenuOption: ViewStyle({
        minHeight: 48,
        paddingHorizontal: 12
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
    })
});

export default GeneralSettingsScreen;
