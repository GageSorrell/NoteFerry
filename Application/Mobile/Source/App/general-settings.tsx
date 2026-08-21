/**
 * General app settings. Reached from the "General" row on the settings
 * screen.
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
    MenuGroup,
    MenuItem,
    MenuItemCheck,
    Pressable,
    RadioGroup,
    RadioGroupItem,
    Setting,
    SettingsContainer
} from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle, useToken } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { useCallback, useRef } from "react";
import { useSettings } from "@/features/settings/use-settings";
import { Alert, View } from "react-native";
import { useSubscription } from "@/Domain/Subscription";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

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

const GeneralSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();
    const { HasProAccess } = useSubscription();
    const Router = useLazyRouter();
    const ContrastSheetRef = useRef<BottomSheet | null>(null);
    const { [Token.Semantic.Muted]: MutedColor } = useToken(Token.Semantic.Muted);

    const SelectedContrast =
        ContrastOptions.find((Option: ContrastOption) => Option.Value === AppSettings.Contrast)
            ?? ContrastOptions[ 0 ];

    const SetHomeScreenLayout = useCallback((Value: Domain.Settings.HomeScreenLayout) =>
    {
        if (Value !== "1" && !HasProAccess)
        {
            Alert.alert(
                "Customize your home with Pro",
                "Pro unlocks the two-column layout and custom database ordering.",
                [
                    { style: "cancel", text: "Not now" },
                    { onPress: Router.push("/plans"), text: "Compare plans" },
                    { onPress: Router.push("/subscribe"), text: "Upgrade" }
                ]
            );
            return;
        }

        void Update({ HomeScreenLayout: Value });
    }, [ HasProAccess, Router, Update ]);

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

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsContainer>
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
                            style={ Styles.ContrastMenuTrigger }>
                            <Body NumberOfLines={ 1 }>{ SelectedContrast.ShortLabel }</Body>
                            <ChevronDown
                                color={ MutedColor }
                                size={ 16 }
                            />
                        </Pressable>
                    </Setting>
                </SettingsContainer>
            </SafeAreaView>
            <BottomSheet
                Ref={ ContrastSheetRef }
                SnapPoints={ [ "34%" ] }
                TestId="contrast-options-sheet">
                <BottomSheetView style={ Styles.ContrastSheet }>
                    <View style={ Styles.ContrastSheetHeader }>
                        <BottomSheetTitle>High contrast</BottomSheetTitle>
                        <BottomSheetDescription>
                            Choose how much contrast to use for dividers, borders, and switches.
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.ContrastMenu }>
                        { ContrastOptions.map((Option: ContrastOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectContrast(Option.Value) }
                                key={ Option.Value }
                                Style={ Styles.ContrastMenuOption }>
                                { AppSettings.Contrast === Option.Value
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
    ContrastMenu: ViewStyle({
        marginTop: 12
    }),
    ContrastMenuOption: ViewStyle({
        minHeight: 48,
        paddingHorizontal: 12
    }),
    ContrastMenuTrigger: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        justifyContent: "flex-end",
        maxWidth: "100%",
        minHeight: 44
    }),
    ContrastSheet: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.SheetHorizontal,
        paddingVertical: Token.Spacing.S
    }),
    ContrastSheetHeader: ViewStyle({
        gap: 4
    }),
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
    })
});

export default GeneralSettingsScreen;
