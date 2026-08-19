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
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
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
export function SelectPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: SelectPropertyFieldProps): React.JSX.Element
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
                    ? <Body Color={ Token.Semantic.Muted }>Empty</Body>
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
}

const useStyles = MakeStyles({
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    })
});
