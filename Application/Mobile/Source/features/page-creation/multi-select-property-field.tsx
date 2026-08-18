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
import { StyleSheet, View } from "react-native";
import { PropertyLabel } from "@/features/page-creation/property-label";
import {
    PropertyOptionPill,
    PropertyOptionSheet,
    PropertyOptionSheetTrigger
} from "@/features/page-creation/property-option-sheet";
import { Token } from "@notivex/ui";
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
export function MultiSelectPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value = EmptySelectedOptionIds
}: MultiSelectPropertyFieldProps): React.JSX.Element
{
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
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <PropertyOptionSheetTrigger
                AccessibilityLabel={ Property.Name }
                Disabled={ Disabled }
                Inline={ Inline }
                OnPress={ () => SheetRef.current?.present() }>
                { SelectedOptions.length === 0
                    ? <Body Color={ Token.Semantic.Muted }>Empty</Body>
                    : SelectedOptions.map((Option: Domain.Property.PropertyOption) => (
                        <PropertyOptionPill Option={ Option } key={ Option.Id } />
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
}

const styles = StyleSheet.create({
    field:
    {
        gap: 6
    },
    inlineField:
    {
        flex: 1,
        minWidth: 0
    }
});
