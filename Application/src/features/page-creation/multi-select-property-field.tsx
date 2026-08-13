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
import {
    Body,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { PropertyOptionBackground } from
    "@/features/page-creation/select-property-field";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { UseTheme } from "@notivex/ui";

const EmptySelectedOptionIds:
ReadonlyArray<Domain.Id.NotionOptionId> = Object.freeze([ ]);

/** Props for a multiple-choice Notion property field. */
export interface MultiSelectPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly OnValueChange: (
        OptionIds: ReadonlyArray<Domain.Id.NotionOptionId>
    ) => void;
    readonly Property: Domain.Property.MultiSelectPropertyDefinition;
    readonly Value?: ReadonlyArray<Domain.Id.NotionOptionId> | undefined;
}

/** Renders an option-only multi-select without free-form text entry. */
export function MultiSelectPropertyField({
    Disabled = false,
    OnValueChange,
    Property,
    Value = EmptySelectedOptionIds
}: MultiSelectPropertyFieldProps): React.JSX.Element
{
    const Theme = UseTheme();
    const SelectedIds = new Set(Value);
    const SelectedOptions = Property.Options.filter(
        (Option: Domain.Property.PropertyOption) => SelectedIds.has(Option.Id)
    );

    const SetOptionChecked = (
        OptionId: Domain.Id.NotionOptionId,
        Checked: boolean
    ): void =>
    {
        OnValueChange(Checked
            ? SelectedIds.has(OptionId) ? Value : [ ...Value, OptionId ]
            : Value.filter((SelectedId: Domain.Id.NotionOptionId) =>
                SelectedId !== OptionId));
    };

    return (
        <View style={ styles.field }>
            <PropertyLabel Property={ Property } />
            <DropdownMenu>
                <DropdownMenuTrigger
                    AccessibilityLabel={ Property.Name }
                    Disabled={ Disabled }
                    Style={ [
                        styles.trigger,
                        {
                            borderColor: Theme.Semantic.Ring,
                            borderRadius: Theme.Radii.Medium
                        }
                    ] }>
                    <View style={ styles.selectedValues }>
                        { SelectedOptions.length === 0
                            ? <Body Color={ Theme.Semantic.Muted }>Choose options</Body>
                            : SelectedOptions.map((Option: Domain.Property.PropertyOption) => (
                                <View
                                    style={ [
                                        styles.selectedValue,
                                        {
                                            backgroundColor:
                                                PropertyOptionBackground[ Option.Color ]
                                        }
                                    ] }
                                    key={ Option.Id }>
                                    <Body NumberOfLines={ 1 }>{ Option.Name }</Body>
                                </View>
                            )) }
                    </View>
                    <ChevronDown
                        color={ Theme.Semantic.Muted }
                        size={ 14 }
                        style={ styles.chevron }
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent Style={ { minWidth: 144 } }>
                    { Property.Options.map((Option: Domain.Property.PropertyOption) => (
                        <DropdownMenuCheckboxItem
                            Checked={ SelectedIds.has(Option.Id) }
                            CloseOnSelect={ false }
                            Label={ Option.Name }
                            OnCheckedChange={ (Checked: boolean) =>
                                SetOptionChecked(Option.Id, Checked) }
                            Style={ [
                                styles.option,
                                {
                                    backgroundColor:
                                        PropertyOptionBackground[ Option.Color ]
                                }
                            ] }
                            key={ Option.Id }
                        />
                    )) }
                </DropdownMenuContent>
            </DropdownMenu>
        </View>
    );
}

const styles = StyleSheet.create({
    chevron:
    {
        flexShrink: 0,
        marginLeft: 6
    },
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
        borderRadius: 6,
        maxWidth: "100%",
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    selectedValues:
    {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        minWidth: 0
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
    }
});
