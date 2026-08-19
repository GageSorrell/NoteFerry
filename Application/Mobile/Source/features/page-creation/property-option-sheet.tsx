/**
 * Shared Notion-style option picker presented in a native bottom sheet.
 *
 * @module notivex/features/page-creation/property-option-sheet
 *
 * @file      property-option-sheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    Body,
    BottomSheet,
    type BottomSheet as BottomSheetHandle,
    BottomSheetScrollView,
    ModalTitle,
    Pressable
} from "@notivex/ui/Primitive";
import { Check, X } from "lucide-react-native";
import {
    Keyboard,
    type PressableStateCallbackType,
    type ViewStyle as RnViewStyle,
    type StyleProp,
    StyleSheet,
    View
} from "react-native";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import type { PropsWithChildren, RefObject } from "react";

export /** Notion's option-pill background color per `PropertyOptionColor`. */
const PropertyOptionBackground:
Readonly<Record<Domain.Property.PropertyOptionColor, string>> =
    Object.freeze({
        Blue: "#D3E5EF",
        Brown: "#EEE0DA",
        Default: "#E3E2E0",
        Gray: "#E3E2E0",
        Green: "#DBEDDB",
        Orange: "#FADEC9",
        Pink: "#F5E0E9",
        Purple: "#E8DEEE",
        Red: "#FFE2DD",
        Yellow: "#FDECC8"
    });

const PropertyOptionDot:
Readonly<Record<Domain.Property.PropertyOptionColor, string>> = Object.freeze({
    Blue: "#337EA9",
    Brown: "#9F6B53",
    Default: "#9B9A97",
    Gray: "#787774",
    Green: "#448361",
    Orange: "#D9730D",
    Pink: "#C14C8A",
    Purple: "#9065B0",
    Red: "#D44C47",
    Yellow: "#CB912F"
});

const PropertyOptionSheetSnapPoints = [ "50%", "83.333%" ];

/** A named option group rendered inside the sheet. */
export interface PropertyOptionSection
{
    readonly Id: string;
    readonly Label?: string | undefined;
    readonly Options: ReadonlyArray<Domain.Property.PropertyOption>;
}

/** Props for a colored Notion option pill. */
export interface PropertyOptionPillProps
{
    readonly OnRemove?: (() => void) | undefined;
    readonly Option: Domain.Property.PropertyOption;
    readonly Status?: boolean | undefined;
}

/** Renders a Select/Multi-select pill, or a dotted Status pill. */
export function PropertyOptionPill({
    OnRemove,
    Option,
    Status = false
}: PropertyOptionPillProps): React.JSX.Element
{
    const Theme = useTheme();
    const Styles = useStyles();
    const Content = (
        <>
            { Status
                ? <View style={ [
                    Styles.Dot,
                    { backgroundColor: PropertyOptionDot[Option.Color] }
                ] } />
                : null }
            <Body NumberOfLines={ 1 }
                Style={ Styles.PillLabel }>
                { Option.Name }
            </Body>
            { OnRemove === undefined
                ? null
                : <X color={ Theme.Semantic.IconSecondary }
                    size={ 14 } /> }
        </>
    );
    const PillStyle = [
        Styles.Pill,
        Status && Styles.StatusPill,
        { backgroundColor: PropertyOptionBackground[Option.Color] }
    ];

    return OnRemove === undefined
        ? <View style={ PillStyle }>{ Content }</View>
        : (
            <Pressable
                Accessibility={ {
                    Label: `Remove ${ Option.Name }`,
                    Role: "button"
                } }
                OnPress={ OnRemove }
                style={ ({ pressed }: PressableStateCallbackType) => [
                    PillStyle,
                    pressed && Styles.Pressed
                ] }>
                { Content }
            </Pressable>
        );
}

/** Props for the compact control that opens a property option sheet. */
export interface PropertyOptionSheetTriggerProps extends PropsWithChildren
{
    readonly AccessibilityLabel: string;
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnPress: () => void;
    readonly Style?: StyleProp<RnViewStyle> | undefined;
}

/** Renders the common field trigger used by all option property types. */
export function PropertyOptionSheetTrigger({
    AccessibilityLabel,
    Disabled = false,
    Inline = false,
    OnPress,
    Style,
    children
}: PropertyOptionSheetTriggerProps): React.JSX.Element
{
    const Styles = useStyles();

    return (
        <Pressable
            Accessibility={ {
                Label: AccessibilityLabel,
                Role: "button",
                State: { disabled: Disabled }
            } }
            Disabled={ Disabled }
            OnPress={ () =>
            {
                Keyboard.dismiss();
                OnPress();
            } }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.Trigger,
                Inline && Styles.InlineTrigger,
                Style,
                pressed && Styles.Pressed,
                Disabled && Styles.Disabled
            ] }>
            <View style={ Styles.TriggerValue }>{ children }</View>
        </Pressable>
    );
}

/** Props for the shared option picker sheet. */
export interface PropertyOptionSheetProps
{
    readonly Multiple?: boolean | undefined;
    readonly OnOptionPress: (Option: Domain.Property.PropertyOption) => void;
    readonly OnRemoveOption: (Option: Domain.Property.PropertyOption) => void;
    readonly PropertyName: string;
    readonly Ref: RefObject<BottomSheetHandle | null>;
    readonly Sections: ReadonlyArray<PropertyOptionSection>;
    readonly SelectedOptionIds: ReadonlyArray<Domain.Id.NotionOptionId>;
    readonly Status?: boolean | undefined;
}

/** Displays selected pills and available options in a native bottom sheet. */
export function PropertyOptionSheet({
    Multiple = false,
    OnOptionPress,
    OnRemoveOption,
    PropertyName,
    Ref,
    Sections,
    SelectedOptionIds,
    Status = false
}: PropertyOptionSheetProps): React.JSX.Element
{
    const Theme = useTheme();
    const Styles = useStyles();
    const SelectedIds = new Set(SelectedOptionIds);
    const SelectedOptions = Sections
        .flatMap((Section: PropertyOptionSection) => Section.Options)
        .filter((Option: Domain.Property.PropertyOption) =>
            SelectedIds.has(Option.Id));

    return (
        <BottomSheet
            BackgroundColor={ Theme.Semantic.BackgroundSidebar }
            Ref={ Ref }
            SnapPoints={ PropertyOptionSheetSnapPoints }>
            <BottomSheetScrollView
                contentContainerStyle={ Styles.SheetContent }
                style={ Styles.SheetScroll }>
                <ModalTitle Style={ Styles.SheetTitle }>{ PropertyName }</ModalTitle>
                <View style={ Styles.SelectedPanel }>
                    { SelectedOptions.length === 0
                        ? <Body Color={ Theme.Semantic.Muted }>Empty</Body>
                        : SelectedOptions.map((Option: Domain.Property.PropertyOption) => (
                            <PropertyOptionPill
                                OnRemove={ () => OnRemoveOption(Option) }
                                Option={ Option }
                                Status={ Status }
                                key={ Option.Id }
                            />
                        )) }
                </View>
                <Body Color={ Theme.Semantic.Secondary }
                    Style={ Styles.Instruction }>
                    { Multiple ? "Select options" : "Select an option" }
                </Body>
                { Sections.map((Section: PropertyOptionSection) => (
                    <View key={ Section.Id }
                        style={ Styles.Section }>
                        { Section.Label === undefined
                            ? null
                            : (
                                <Body
                                    Color={ Theme.Semantic.Secondary }
                                    Style={ Styles.SectionLabel }
                                    Weight="600">
                                    { Section.Label }
                                </Body>
                            ) }
                        <View style={ Styles.OptionList }>
                            { Section.Options.map((
                                Option: Domain.Property.PropertyOption,
                                OptionIndex: number
                            ) =>
                            {
                                const Selected = SelectedIds.has(Option.Id);

                                return (
                                    <Pressable
                                        Accessibility={ {
                                            Label: Option.Name,
                                            Role: Multiple ? "checkbox" : "radio",
                                            State: { checked: Selected }
                                        } }
                                        OnPress={ () => OnOptionPress(Option) }
                                        key={ Option.Id }
                                        style={ ({ pressed }: PressableStateCallbackType) => [
                                            Styles.OptionRow,
                                            OptionIndex > 0 && Styles.OptionRowDivider,
                                            pressed && Styles.OptionRowPressed
                                        ] }>
                                        <PropertyOptionPill
                                            Option={ Option }
                                            Status={ Status }
                                        />
                                        { Selected
                                            ? <Check
                                                color={ Theme.Semantic.IconSecondary }
                                                size={ 17 }
                                            />
                                            : null }
                                    </Pressable>
                                );
                            }) }
                        </View>
                    </View>
                )) }
            </BottomSheetScrollView>
        </BottomSheet>
    );
}

const useStyles = MakeStyles({
    Disabled: ViewStyle({
        opacity: 0.55
    }),
    Dot: ViewStyle({
        borderRadius: 4,
        height: 8,
        width: 8
    }),
    InlineTrigger: ViewStyle({
        borderWidth: 0,
        minHeight: 32,
        paddingHorizontal: 0
    }),
    Instruction: TextStyle({
        marginHorizontal: 18,
        marginTop: 16
    }),
    OptionList: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 14,
        overflow: "hidden"
    }),
    OptionRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 9
    }),
    OptionRowDivider: ViewStyle({
        borderTopColor: Token.Semantic.Border,
        borderTopWidth: StyleSheet.hairlineWidth
    }),
    OptionRowPressed: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundInput
    }),
    Pill: ViewStyle({
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 6,
        flexDirection: "row",
        flexShrink: 1,
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3
    }),
    PillLabel: TextStyle({
        flexShrink: 1
    }),
    Pressed: ViewStyle({
        opacity: 0.6
    }),
    Section: ViewStyle({
        gap: 7,
        marginHorizontal: 16,
        marginTop: 8
    }),
    SectionLabel: TextStyle({
        marginHorizontal: 2
    }),
    SelectedPanel: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginHorizontal: 16,
        marginTop: 18,
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 10
    }),
    SheetContent: ViewStyle({
        paddingBottom: 40
    }),
    SheetScroll: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar
    }),
    SheetTitle: TextStyle({
        marginTop: 2,
        textAlign: "center"
    }),
    StatusPill: ViewStyle({
        borderRadius: 999
    }),
    Trigger: ViewStyle({
        alignItems: "center",
        borderColor: Token.Semantic.Ring,
        borderRadius: Token.Radii.Medium,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 36,
        minWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4
    }),
    TriggerValue: ViewStyle({
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        minWidth: 0
    })
});
