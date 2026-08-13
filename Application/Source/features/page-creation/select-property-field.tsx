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
import {
    Body,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { PropertyLabel } from "@/features/page-creation/property-label";

export const PropertyOptionBackground:
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

/** Props for a single-choice Notion property field. */
export interface SelectPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly OnValueChange: (OptionId: string) => void;
    readonly Property: Domain.Property.SelectPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled dropdown from a Notion property's normalized options. */
export function SelectPropertyField({
    Disabled = false,
    OnValueChange,
    Property,
    Value
}: SelectPropertyFieldProps): React.JSX.Element
{
    const SelectedOption = Property.Options.find(
        (Option: Domain.Property.PropertyOption) => Option.Id === Value
    );

    return (
        <View style={ styles.field }>
            <PropertyLabel Property={ Property } />
            <Select
                OnValueChange={ OnValueChange }
                Value={ Value === "" ? undefined : Value }>
                <SelectTrigger
                    AccessibilityLabel={ Property.Name }
                    Disabled={ Disabled }
                    Style={ styles.trigger }>
                    { SelectedOption === undefined
                        ? <SelectValue Placeholder="Choose an option" />
                        : (
                            <View style={ [
                                styles.selectedValue,
                                {
                                    backgroundColor:
                                        PropertyOptionBackground[ SelectedOption.Color ]
                                }
                            ] }>
                                <Body NumberOfLines={ 1 }>{ SelectedOption.Name }</Body>
                            </View>
                        ) }
                </SelectTrigger>
                <SelectContent>
                    { Property.Options.map((Option: Domain.Property.PropertyOption) => (
                        <SelectItem
                            Label={ Option.Name }
                            Style={ [
                                styles.option,
                                { backgroundColor: PropertyOptionBackground[ Option.Color ] }
                            ] }
                            Value={ Option.Id }
                            key={ Option.Id }
                        />
                    )) }
                </SelectContent>
            </Select>
        </View>
    );
}

const styles = StyleSheet.create({
    field:
    {
        gap: 6
    },
    option:
    {
        borderRadius: 6,
        marginVertical: 2
    },
    selectedValue:
    {
        alignSelf: "center",
        borderRadius: 6,
        flexShrink: 1,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    trigger:
    {
        minHeight: 36
    }
});
