/**
 * Shared icon-and-name label for page-creation properties.
 *
 * @module notivex/features/page-creation/property-label
 *
 * @file      property-label.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    CalendarDays,
    CircleDot,
    GitBranch,
    Hash,
    Link,
    ListTodo,
    Mail,
    Paperclip,
    Phone,
    SquareCheck,
    Tags,
    Text,
    Type,
    Users,
    type LucideIcon
} from "lucide-react-native";
import { LabelText } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { UseTheme } from "@notivex/ui";

const PropertyTypeIcon:
Readonly<Record<Domain.Property.PropertyDefinition["Type"], LucideIcon>> =
    Object.freeze({
        Checkbox: SquareCheck,
        Date: CalendarDays,
        Email: Mail,
        Files: Paperclip,
        MultiSelect: Tags,
        Number: Hash,
        People: Users,
        PhoneNumber: Phone,
        Relation: GitBranch,
        RichText: Text,
        Select: CircleDot,
        Status: ListTodo,
        Title: Type,
        Url: Link
    });

/** Props for a property icon followed by its display name. */
export interface PropertyLabelProps
{
    readonly Property: Domain.Property.PropertyDefinition;
}

/** Displays the type-specific icon and name of a Notion property. */
export function PropertyLabel({ Property }: PropertyLabelProps): React.JSX.Element
{
    const Theme = UseTheme();
    const Icon = PropertyTypeIcon[ Property.Type ];

    return (
        <View style={ styles.container }>
            <Icon
                accessible={ false }
                color={ Theme.Semantic.Secondary }
                size={ 14 }
                strokeWidth={ 2 }
            />
            <LabelText>{ Property.Name }</LabelText>
        </View>
    );
}

const styles = StyleSheet.create({
    container:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 6
    }
});
