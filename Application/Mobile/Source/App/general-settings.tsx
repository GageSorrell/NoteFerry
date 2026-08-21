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
    Pressable,
    RadioGroup,
    RadioGroupItem,
    Setting,
    SettingsContainer
} from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useSettings } from "@/features/settings/use-settings";
import { View } from "react-native";

interface LayoutOption
{
    readonly AccessibilityLabel: string;
    readonly Value: Domain.Settings.HomeScreenLayout;
}

const LayoutOptions: ReadonlyArray<LayoutOption> = [
    { AccessibilityLabel: "One database per row", Value: "1" },
    { AccessibilityLabel: "Two square cards per row", Value: "2" }
];

interface ContrastOption
{
    readonly Label: string;
    readonly Value: Domain.Settings.Contrast;
}

const ContrastOptions: ReadonlyArray<ContrastOption> = [
    { Label: "Use system setting", Value: "System" },
    { Label: "Standard contrast", Value: "Standard" },
    { Label: "High contrast", Value: "High" }
];

const GeneralSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();

    const SetHomeScreenLayout = useCallback((Value: Domain.Settings.HomeScreenLayout) =>
    {
        void Update({ HomeScreenLayout: Value });
    }, [ Update ]);

    const SetContrast = useCallback((Value: Domain.Settings.Contrast) =>
    {
        void Update({ Contrast: Value });
    }, [ Update ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsContainer>
                    <Setting
                        Description="Show one database per row, or two square cards per row."
                        Title="Home screen layout"
                        Wide>
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
                        Title="High contrast"
                        Wide>
                        { /* Mirrors the row above: `RadioGroupItem` is decorative only
                             (`pointerEvents="none"`) — the outer `Pressable` covers the
                             whole row, so tapping the label registers the selection too. */ }
                        <RadioGroup
                            OnValueChange={ (Value: string) =>
                                SetContrast(Value as Domain.Settings.Contrast) }
                            Value={ AppSettings.Contrast }>
                            { ContrastOptions.map((Option: ContrastOption) => (
                                <Pressable
                                    Accessibility={ {
                                        Label: Option.Label,
                                        Role: "radio",
                                        State: { checked: AppSettings.Contrast === Option.Value }
                                    } }
                                    OnPress={ () => SetContrast(Option.Value) }
                                    key={ Option.Value }
                                    style={ Styles.ContrastOption }>
                                    <View
                                        accessible={ false }
                                        pointerEvents="none">
                                        <RadioGroupItem Value={ Option.Value } />
                                    </View>
                                    <Body>{ Option.Label }</Body>
                                </Pressable>
                            )) }
                        </RadioGroup>
                    </Setting>
                </SettingsContainer>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    ContrastOption: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        paddingVertical: 4
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
