/**
 * General app settings. Reached from the "General" row on the settings
 * screen: launch behavior, home screen layout, and contrast. Home-screen
 * database order is set from the Database settings screen's edit mode
 * instead — see `database-settings.tsx`.
 *
 * @module noteferry/app/general-settings
 *
 * @file      general-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { Alert, ScrollView, View } from "react-native";
import { Body } from "@noteferry/ui/Primitive/Text";
import { BottomSheet, BottomSheetDescription, BottomSheetTitle, BottomSheetView } from "@noteferry/ui/Primitive/BottomSheet";
import { MenuGroup, MenuItem, MenuItemCheck } from "@noteferry/ui/Primitive/Menu";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { RadioGroup, RadioGroupItem } from "@noteferry/ui/Primitive/RadioGroup";
import { Setting, SettingsContainer } from "@noteferry/ui/Primitive/Setting";
import { Switch } from "@noteferry/ui/Primitive/Switch";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import { MakeStyles, Token, ViewStyle, useToken } from "@noteferry/ui/Core";
import { useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SupportedLocales } from "@/Domain/Localization";
import type { SupportedLocale } from "@/Domain/Localization";
import { useConnections } from "@/Domain/Connection";
import { useLanguage } from "@/features/settings/use-language";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSettings } from "@/features/settings/use-settings";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";

interface LayoutOption
{
    readonly AccessibilityLabel: string;
    readonly Value: Domain.Settings.HomeScreenLayout;
}

interface ContrastOption
{
    readonly Label: string;
    readonly ShortLabel: string;
    readonly Value: Domain.Settings.Contrast;
}

interface LaunchOption
{
    /** `"Home"`, or the target database's id — also the selection key. */
    readonly Key: string;
    readonly Label: string;
    readonly Value: Domain.Behavior.LaunchBehavior;
}

interface LanguageOption
{
    /** `null` clears the override and follows the device's own locale. */
    readonly Value: SupportedLocale | null;
    readonly Label: string;
}

const GeneralSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();
    const { HasProAccess } = useSubscription();
    const { DataSources } = useConnections();
    const Router = useLazyRouter();
    const { t } = useTranslation("settings");
    const { Current: CurrentLanguage, SetLanguage } = useLanguage();
    const ContrastSheetRef = useRef<BottomSheet | null>(null);
    const LaunchSheetRef = useRef<BottomSheet | null>(null);
    const LanguageSheetRef = useRef<BottomSheet | null>(null);
    const { [Token.Semantic.Muted]: MutedColor } = useToken(Token.Semantic.Muted);

    const LayoutOptions: ReadonlyArray<LayoutOption> = [
        { AccessibilityLabel: t("general.homeScreenLayout.oneColumn"), Value: "1" },
        { AccessibilityLabel: t("general.homeScreenLayout.twoColumn"), Value: "2" }
    ];

    const ContrastOptions: ReadonlyArray<ContrastOption> = [
        { Label: t("general.highContrast.system"), ShortLabel: t("general.highContrast.systemShort"), Value: "System" },
        { Label: t("general.highContrast.standard"), ShortLabel: t("general.highContrast.standardShort"), Value: "Standard" },
        { Label: t("general.highContrast.high"), ShortLabel: t("general.highContrast.highShort"), Value: "High" }
    ];

    const SelectedContrast =
        ContrastOptions.find((Option: ContrastOption) => Option.Value === AppSettings.Contrast)
            ?? ContrastOptions[ 0 ];

    const LanguageNames: Record<SupportedLocale, string> = {
        de: t("general.language.names.de"),
        "en-US": t("general.language.names.en-US"),
        "es-419": t("general.language.names.es-419"),
        ja: t("general.language.names.ja"),
        ko: t("general.language.names.ko")
    };
    const LanguageOptions: ReadonlyArray<LanguageOption> = [
        { Label: t("general.language.system"), Value: null },
        ...SupportedLocales.map((Locale: SupportedLocale): LanguageOption => ({
            Label: LanguageNames[ Locale ],
            Value: Locale
        }))
    ];
    const SelectedLanguage =
        LanguageOptions.find((Option: LanguageOption) => Option.Value === CurrentLanguage)
            ?? LanguageOptions[ 0 ];

    const LaunchOptions: ReadonlyArray<LaunchOption> = [
        { Key: "Home", Label: t("general.onLaunch.homeScreen"), Value: { Type: "Home" } },
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
            ?? t("general.onLaunch.placeholder");

    const ShowSettingsGate = useCallback((Message: string): void =>
    {
        Alert.alert(
            t("general.proGate.title"),
            Message,
            [
                { style: "cancel", text: t("general.proGate.cancel") },
                { onPress: Router.push("/plans"), text: t("general.proGate.comparePlans") },
                { onPress: Router.push("/subscribe"), text: t("general.proGate.upgrade") }
            ]
        );
    }, [ Router, t ]);

    const SetHomeScreenLayout = useCallback((Value: Domain.Settings.HomeScreenLayout) =>
    {
        if (Value !== "1" && !HasProAccess)
        {
            ShowSettingsGate(t("general.proGate.layoutMessage"));
            return;
        }

        void Update({ HomeScreenLayout: Value });
    }, [ HasProAccess, ShowSettingsGate, Update, t ]);

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

    const OpenLanguageMenu = useCallback((): void =>
    {
        LanguageSheetRef.current?.present();
    }, []);

    const SelectLanguage = useCallback((Value: SupportedLocale | null): void =>
    {
        void SetLanguage(Value);
        LanguageSheetRef.current?.dismiss();
    }, [ SetLanguage ]);

    const OpenLaunchMenu = useCallback((): void =>
    {
        LaunchSheetRef.current?.present();
    }, []);

    const SelectLaunch = useCallback((Value: Domain.Behavior.LaunchBehavior): void =>
    {
        LaunchSheetRef.current?.dismiss();

        if (Value.Type !== "Home" && !HasProAccess)
        {
            ShowSettingsGate(t("general.proGate.launchMessage"));
            return;
        }

        void Update({ LaunchBehavior: Value });
    }, [ HasProAccess, ShowSettingsGate, Update, t ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <SettingsContainer>
                        <Setting
                            Description={ t("general.onLaunch.description") }
                            Title={ t("general.onLaunch.title") }>
                            <Pressable
                                Accessibility={ {
                                    Label: t("general.onLaunch.accessibilityLabel", { label: SelectedLaunchLabel }),
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
                            Description={ t("general.recentPages.description") }
                            Title={ t("general.recentPages.title") }>
                            <Switch
                                OnValueChange={ (Value: boolean) =>
                                    void Update({ ShowRecentPages: Value }) }
                                Value={ AppSettings.ShowRecentPages }
                            />
                        </Setting>
                        <Setting
                            Description={ t("general.recentPageDatabaseName.description") }
                            Title={ t("general.recentPageDatabaseName.title") }>
                            <Switch
                                Disabled={ !AppSettings.ShowRecentPages }
                                OnValueChange={ (Value: boolean) =>
                                    void Update({ ShowRecentPageDatabaseName: Value }) }
                                Value={ AppSettings.ShowRecentPageDatabaseName }
                            />
                        </Setting>
                        <Setting
                            Description={ t("general.recentPageCovers.description") }
                            Title={ t("general.recentPageCovers.title") }>
                            <Switch
                                Disabled={ !AppSettings.ShowRecentPages }
                                OnValueChange={ (Value: boolean) =>
                                    void Update({ ShowRecentPageCovers: Value }) }
                                Value={ AppSettings.ShowRecentPageCovers }
                            />
                        </Setting>
                        <Setting
                            Description={ t("general.homeScreenLayout.description") }
                            Title={ t("general.homeScreenLayout.title") }>
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
                            Description={ t("general.highContrast.description") }
                            Title={ t("general.highContrast.title") }>
                            <Pressable
                                Accessibility={ {
                                    Label: t("general.highContrast.accessibilityLabel", { label: SelectedContrast.Label }),
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
                        <Setting
                            Description={ t("general.language.description") }
                            Title={ t("general.language.title") }>
                            <Pressable
                                Accessibility={ {
                                    Label: t("general.language.accessibilityLabel", { label: SelectedLanguage.Label }),
                                    Role: "button"
                                } }
                                OnPress={ OpenLanguageMenu }
                                style={ Styles.MenuTrigger }>
                                <Body NumberOfLines={ 1 }>{ SelectedLanguage.Label }</Body>
                                <ChevronDown
                                    color={ MutedColor }
                                    size={ 16 }
                                />
                            </Pressable>
                        </Setting>
                    </SettingsContainer>
                </ScrollView>
            </SafeAreaView>
            <BottomSheet
                Ref={ ContrastSheetRef }
                SnapPoints={ [ "34%" ] }
                TestId="contrast-options-sheet">
                <BottomSheetView style={ Styles.Sheet }>
                    <View style={ Styles.SheetHeader }>
                        <BottomSheetTitle>{ t("general.highContrast.title") }</BottomSheetTitle>
                        <BottomSheetDescription>
                            { t("general.highContrast.sheetDescription") }
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.SheetMenu }>
                        { ContrastOptions.map((Option: ContrastOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectContrast(Option.Value) }
                                Style={ Styles.SheetMenuOption }
                                key={ Option.Value }>
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
                        <BottomSheetTitle>{ t("general.onLaunch.title") }</BottomSheetTitle>
                        <BottomSheetDescription>
                            { t("general.onLaunch.sheetDescription") }
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.SheetMenu }>
                        { LaunchOptions.map((Option: LaunchOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectLaunch(Option.Value) }
                                Style={ Styles.SheetMenuOption }
                                key={ Option.Key }>
                                { SelectedLaunchKey === Option.Key
                                    ? <MenuItemCheck />
                                    : null }
                            </MenuItem>
                        )) }
                    </MenuGroup>
                </BottomSheetView>
            </BottomSheet>
            <BottomSheet
                Ref={ LanguageSheetRef }
                SnapPoints={ [ "50%" ] }
                TestId="language-options-sheet">
                <BottomSheetView style={ Styles.Sheet }>
                    <View style={ Styles.SheetHeader }>
                        <BottomSheetTitle>{ t("general.language.title") }</BottomSheetTitle>
                        <BottomSheetDescription>
                            { t("general.language.sheetDescription") }
                        </BottomSheetDescription>
                    </View>
                    <MenuGroup Style={ Styles.SheetMenu }>
                        { LanguageOptions.map((Option: LanguageOption) => (
                            <MenuItem
                                AccessibilityLabel={ Option.Label }
                                Label={ Option.Label }
                                OnPress={ () => SelectLanguage(Option.Value) }
                                Style={ Styles.SheetMenuOption }
                                key={ Option.Value ?? "system" }>
                                { SelectedLanguage.Value === Option.Value
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
    })
});

export default GeneralSettingsScreen;
