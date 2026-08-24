/**
 * Multiple-choice input for Notion Multi-select properties.
 *
 * @module notivex/features/page-creation/multi-select-property-field
 *
 * @file      multi-select-property-field.tsx
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

const EmptySelectedOptionIds:
ReadonlyArray<Domain.Id.NotionOptionId> = Object.freeze([ ]);

/** Props for a multiple-choice Notion property field. */
export interface MultiSelectPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (
        OptionIds: ReadonlyArray<Domain.Id.NotionOptionId>
    ) => void;
    readonly Property: Domain.Property.MultiSelectPropertyDefinition;
    readonly Value?: ReadonlyArray<Domain.Id.NotionOptionId> | undefined;
}

/** Renders an option-only multi-select without free-form text entry. */
export const MultiSelectPropertyField = ({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value = EmptySelectedOptionIds
}: MultiSelectPropertyFieldProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const SheetRef = useRef<BottomSheet | null>(null);
    const SelectedIds = new Set(Value);
    const SelectedOptions = Property.Options.filter(
        (Option: Domain.Property.PropertyOption) => SelectedIds.has(Option.Id)
    );

    const ToggleOption = (OptionId: Domain.Id.NotionOptionId): void =>
    {
        OnValueChange(SelectedIds.has(OptionId)
            ? Value.filter((SelectedId: Domain.Id.NotionOptionId) =>
                SelectedId !== OptionId)
            : [ ...Value, OptionId ]);
    };

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <PropertyOptionSheetTrigger
                AccessibilityLabel={ Property.Name }
                Disabled={ Disabled }
                Inline={ Inline }
                OnPress={ () => SheetRef.current?.present() }>
                { SelectedOptions.length === 0
                    ? <Body Color={ Token.Semantic.Muted }
                        Style={ Styles.EmptyValue }>Empty</Body>
                    : SelectedOptions.map((Option: Domain.Property.PropertyOption) => (
                        <PropertyOptionPill Option={ Option }
                            key={ Option.Id } />
                    )) }
            </PropertyOptionSheetTrigger>
            <PropertyOptionSheet
                Multiple
                OnOptionPress={ (Option: Domain.Property.PropertyOption) =>
                    ToggleOption(Option.Id) }
                OnRemoveOption={ (Option: Domain.Property.PropertyOption) =>
                    ToggleOption(Option.Id) }
                PropertyName={ Property.Name }
                Ref={ SheetRef }
                Sections={ [ {
                    Id: "options",
                    Options: Property.Options
                } ] }
                SelectedOptionIds={ Value }
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
