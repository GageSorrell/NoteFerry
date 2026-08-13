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
import {
    Body,
    Select,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from "@notivex/ui/Primitive";
import { Fragment } from "react";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { PropertyOptionBackground } from
    "@/features/page-creation/select-property-field";
import { StyleSheet, View } from "react-native";

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

interface DisplayStatusGroup
{
    readonly Id: string;
    readonly Name: string;
    readonly Options: readonly Domain.Property.PropertyOption[];
}

/** Props for a grouped Notion status field. */
export interface StatusPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly OnValueChange: (OptionId: string) => void;
    readonly Property: Domain.Property.StatusPropertyDefinition;
    readonly Value?: string | undefined;
}

interface StatusPillProps
{
    readonly Option: Domain.Property.PropertyOption;
}

/** Renders the compact colored-dot tag used by Notion for a status. */
const StatusPill = ({ Option }: StatusPillProps): React.JSX.Element =>
    <View style={ [
        styles.pill,
        { backgroundColor: PropertyOptionBackground[ Option.Color ] }
    ] }>
        <View style={ [
            styles.dot,
            { backgroundColor: PropertyOptionDot[ Option.Color ] }
        ] } />
        <Body NumberOfLines={ 1 }>{ Option.Name }</Body>
    </View>;

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
): readonly DisplayStatusGroup[] =>
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
                    return [ ];
                }

                AssignedOptionIds.add(OptionId);
                return [ Option ];
            })
        }));
        const Unassigned = Property.Options.filter((Option) =>
            !AssignedOptionIds.has(Option.Id));

        return Unassigned.length === 0
            ? Groups
            : [
                ...Groups,
                { Id: "unassigned", Name: "Other", Options: Unassigned }
            ];
    }

    const Names = [ "To-do", "In progress", "Complete" ] as const;

    return Names.map((Name) => ({
        Id: Name,
        Name,
        Options: Property.Options.filter((Option) =>
            FallbackGroupFor(Option) === Name)
    }));
};

/** Renders a Notion-style status picker with its three ordered groups. */
export function StatusPropertyField({
    Disabled = false,
    OnValueChange,
    Property,
    Value
}: StatusPropertyFieldProps): React.JSX.Element
{
    const SelectedOption = Property.Options.find((Option) => Option.Id === Value);
    const Groups = BuildDisplayGroups(Property).filter((Group) =>
        Group.Options.length > 0);

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
                        : <StatusPill Option={ SelectedOption } /> }
                </SelectTrigger>
                <SelectContent MatchTriggerWidth>
                    { Groups.map((Group, GroupIndex) => (
                        <Fragment key={ Group.Id }>
                            { GroupIndex === 0
                                ? null
                                : <SelectSeparator Style={ styles.separator } /> }
                            <SelectLabel>{ Group.Name }</SelectLabel>
                            { Group.Options.map((Option) => (
                                <SelectItem
                                    DisplayLabel={ <StatusPill Option={ Option } /> }
                                    HideCheck
                                    Label={ Option.Name }
                                    Style={ styles.option }
                                    Value={ Option.Id }
                                    key={ Option.Id }
                                />
                            )) }
                        </Fragment>
                    )) }
                </SelectContent>
            </Select>
        </View>
    );
}

const styles = StyleSheet.create({
    dot:
    {
        borderRadius: 4,
        height: 8,
        width: 8
    },
    field:
    {
        gap: 6
    },
    option:
    {
        paddingVertical: 3
    },
    pill:
    {
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 999,
        flexDirection: "row",
        flexShrink: 1,
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    separator:
    {
        marginVertical: 6
    },
    trigger:
    {
        minHeight: 36
    }
});
