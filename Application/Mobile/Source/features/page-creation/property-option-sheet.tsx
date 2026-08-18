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
import {
    Keyboard,
    type PressableStateCallbackType,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle
} from "react-native";
import { Check, X } from "lucide-react-native";
import type { PropsWithChildren, RefObject } from "react";
import { useTheme } from "@notivex/ui";

export /**
        *
        */
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
    const Content = (
        <>
            { Status
                ? <View style={ [
                    styles.dot,
                    { backgroundColor: PropertyOptionDot[Option.Color] }
                ] } />
                : null }
            <Body NumberOfLines={ 1 }
                Style={ styles.pillLabel }>
                { Option.Name }
            </Body>
            { OnRemove === undefined
                ? null
                : <X color={ Theme.Semantic.IconSecondary }
                    size={ 14 } /> }
        </>
    );
    const PillStyle = [
        styles.pill,
        Status && styles.statusPill,
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
                    pressed && styles.pressed
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
    readonly Style?: StyleProp<ViewStyle> | undefined;
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
    const Theme = useTheme();

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
                styles.trigger,
                {
                    borderColor: Theme.Semantic.Ring,
                    borderRadius: Theme.Radii.Medium
                },
                Inline && styles.inlineTrigger,
                Style,
                pressed && styles.pressed,
                Disabled && styles.disabled
            ] }>
            <View style={ styles.triggerValue }>{ children }</View>
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
                contentContainerStyle={ styles.sheetContent }
                style={ { backgroundColor: Theme.Semantic.BackgroundSidebar } }>
                <ModalTitle Style={ styles.sheetTitle }>{ PropertyName }</ModalTitle>
                <View style={ [
                    styles.selectedPanel,
                    { backgroundColor: Theme.Semantic.BackgroundModal }
                ] }>
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
                    Style={ styles.instruction }>
                    { Multiple ? "Select options" : "Select an option" }
                </Body>
                { Sections.map((Section: PropertyOptionSection) => (
                    <View key={ Section.Id }
                        style={ styles.section }>
                        { Section.Label === undefined
                            ? null
                            : (
                                <Body
                                    Color={ Theme.Semantic.Secondary }
                                    Style={ styles.sectionLabel }
                                    Weight="600">
                                    { Section.Label }
                                </Body>
                            ) }
                        <View style={ [
                            styles.optionList,
                            { backgroundColor: Theme.Semantic.BackgroundModal }
                        ] }>
                            { Section.Options.map((Option, OptionIndex) =>
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
                                            styles.optionRow,
                                            OptionIndex > 0 && {
                                                borderTopColor: Theme.Semantic.Border,
                                                borderTopWidth: StyleSheet.hairlineWidth
                                            },
                                            pressed && {
                                                backgroundColor:
                                                    Theme.Semantic.BackgroundInput
                                            }
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

const styles = StyleSheet.create({
    disabled:
    {
        opacity: 0.55
    },
    dot:
    {
        borderRadius: 4,
        height: 8,
        width: 8
    },
    inlineTrigger:
    {
        borderWidth: 0,
        minHeight: 32,
        paddingHorizontal: 0
    },
    instruction:
    {
        marginHorizontal: 18,
        marginTop: 16
    },
    optionList:
    {
        borderRadius: 14,
        overflow: "hidden"
    },
    optionRow:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 9
    },
    pill:
    {
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 6,
        flexDirection: "row",
        flexShrink: 1,
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3
    },
    pillLabel:
    {
        flexShrink: 1
    },
    pressed:
    {
        opacity: 0.6
    },
    section:
    {
        gap: 7,
        marginHorizontal: 16,
        marginTop: 8
    },
    sectionLabel:
    {
        marginHorizontal: 2
    },
    selectedPanel:
    {
        alignItems: "center",
        borderRadius: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginHorizontal: 16,
        marginTop: 18,
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    sheetContent:
    {
        paddingBottom: 40
    },
    sheetTitle:
    {
        marginTop: 2,
        textAlign: "center"
    },
    statusPill:
    {
        borderRadius: 999
    },
    trigger:
    {
        alignItems: "center",
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 36,
        minWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    triggerValue:
    {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        minWidth: 0
    }
});
