/**
 * Grouped single-choice input for Notion Status properties.
 *
 * @module notivex/features/page-creation/status-property-field
 *
 * @file      status-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Body, type BottomSheet } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { Predicate } from "@sorrell/effect";
import {
    PropertyOptionPill,
    PropertyOptionSheet,
    PropertyOptionSheetTrigger
} from "@/features/page-creation/property-option-sheet";
import { Token } from "@notivex/ui";
import { useRef } from "react";

interface DisplayStatusGroup
{
    readonly Id: string;
    readonly Name: string;
    readonly Options: ReadonlyArray<Domain.Property.PropertyOption>;
}

/** Props for a grouped Notion status field. */
export interface StatusPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (OptionId: string | undefined) => void;
    readonly Property: Domain.Property.StatusPropertyDefinition;
    readonly Value?: string | undefined;
}

const FallbackGroupFor = (
    Option: Domain.Property.PropertyOption
): "To-do" | "In progress" | "Complete" =>
{
    if (Option.Color === "Green" || Option.Color === "Red")
    {
        return "Complete";
    }

    if (Option.Color === "Default" || Option.Color === "Gray")
    {
        return "To-do";
    }

    return "In progress";
};

const BuildDisplayGroups = (
    Property: Domain.Property.StatusPropertyDefinition
): ReadonlyArray<DisplayStatusGroup> =>
{
    if (Property.Groups !== undefined && Property.Groups.length > 0)
    {
        const OptionById = new Map(Property.Options.map((Option) =>
            [ Option.Id, Option ] as const));
        const AssignedOptionIds = new Set<Domain.Id.NotionOptionId>();
        const Groups = Property.Groups.map((Group) => ({
            Id: Group.Id,
            Name: Group.Name,
            Options: Group.OptionIds.flatMap((OptionId) =>
            {
                const Option = OptionById.get(OptionId);

                if (Option === undefined)
                {
                    return [ ] as const;
                }

                AssignedOptionIds.add(OptionId);
                return [ Option ] as const;
            })
        }));
        const Unassigned = Property.Options.filter((Option) =>
            !AssignedOptionIds.has(Option.Id));

        return Unassigned.length === 0
            ? Groups
            : [
                ...Groups,
                {
                    Id: "unassigned",
                    Name: "Other",
                    Options: Unassigned
                }
            ];
    }

    const Names = [ "To-do", "In progress", "Complete" ] as const;

    return Names.map((Name: typeof Names[number]) => ({
        Id: Name,
        Name,
        Options: Property.Options.filter((Option) =>
            FallbackGroupFor(Option) === Name)
    }));
};

/** Renders a Notion-style status picker with its three ordered groups. */
export function StatusPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: StatusPropertyFieldProps): React.JSX.Element
{
    const SheetRef = useRef<BottomSheet | null>(null);
    const SelectedOption = Property.Options.find(Predicate.HasPropertyValue("Id", Value));
    const Groups = BuildDisplayGroups(Property).filter((Group) =>
        Group.Options.length > 0);

    return (
        <View style={ [ styles.field, Inline && styles.inlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <PropertyOptionSheetTrigger
                AccessibilityLabel={ Property.Name }
                Disabled={ Disabled }
                Inline={ Inline }
                OnPress={ () => SheetRef.current?.present() }>
                { SelectedOption === undefined
                    ? <Body Color={ Token.Semantic.Muted }>Empty</Body>
                    : <PropertyOptionPill Option={ SelectedOption } Status /> }
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
                Sections={ Groups.map((Group: DisplayStatusGroup) => ({
                    Id: Group.Id,
                    Label: Group.Name,
                    Options: Group.Options
                })) }
                SelectedOptionIds={ SelectedOption === undefined
                    ? [ ]
                    : [ SelectedOption.Id ] }
                Status
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
