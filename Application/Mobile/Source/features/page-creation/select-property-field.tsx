/**
 * Single-choice input for Notion Select properties.
 *
 * @module notivex/features/page-creation/select-property-field
 *
 * @file      select-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Body, type BottomSheet } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle } from "@notivex/ui";
import {
    PropertyOptionPill,
    PropertyOptionSheet,
    PropertyOptionSheetTrigger
} from "@/features/page-creation/property-option-sheet";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";
import { useRef } from "react";

/** Props for a single-choice Notion property field. */
export interface SelectPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (OptionId: string | undefined) => void;
    readonly Property: Domain.Property.SelectPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled dropdown from a Notion property's normalized options. */
export const SelectPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: SelectPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const SheetRef = useRef<BottomSheet | null>(null);
    const SelectedOption = Property.Options.find(
        (Option: Domain.Property.PropertyOption) => Option.Id === Value
    );

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <PropertyOptionSheetTrigger
                AccessibilityLabel={ Property.Name }
                Disabled={ Disabled }
                Inline={ Inline }
                OnPress={ () => SheetRef.current?.present() }>
                { SelectedOption === undefined
                    ? <Body Color={ Token.Semantic.Muted }
                        Style={ Styles.EmptyValue }>Empty</Body>
                    : <PropertyOptionPill Option={ SelectedOption } /> }
            </PropertyOptionSheetTrigger>
            <PropertyOptionSheet
                OnOptionPress={ (Option: Domain.Property.PropertyOption) =>
                {
                    OnValueChange(Option.Id);
                    SheetRef.current?.dismiss();
                } }
                OnRemoveOption={ () => OnValueChange(undefined) }
                PropertyName={ Property.Name }
                Ref={ SheetRef }
                Sections={ [ {
                    Id: "options",
                    Options: Property.Options
                } ] }
                SelectedOptionIds={ SelectedOption === undefined
                    ? [ ]
                    : [ SelectedOption.Id ] }
            />
        </View>
    );
};

const useStyles = MakeStyles({
    /* Measured on-device: this bare `Body`'s painted glyph sits ~4dp above
     * where the property label's glyph sits, unlike `PropertyOptionPill`
     * (a font-metrics quirk specific to unwrapped `Text`, not present once
     * it's wrapped in the pill's own padded box) — so only the "Empty"
     * fallback needs this nudge, never the pill. Doubled to 8: this sits
     * inside `PropertyOptionSheetTrigger`'s own centered `TriggerValue`
     * wrapper, which (confirmed on-device) absorbs half of an asymmetric
     * top margin on a centered child. */
    EmptyValue: TextStyle({
        marginTop: 8
    }),
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    })
});
