/**
 * Shared icon-and-name label for page-creation properties.
 *
 * @module noteferry/features/page-creation/property-label
 *
 * @file      property-label.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import {
    CalendarDays,
    CircleDot,
    GitBranch,
    Hash,
    Link,
    ListTodo,
    type LucideIcon,
    Mail,
    Paperclip,
    Phone,
    SquareCheck,
    Tags,
    Text,
    Type,
    Users
} from "lucide-react-native";
import { MakeStyles, TextStyle, ViewStyle, useTheme } from "@noteferry/ui";
import { LabelText } from "@noteferry/ui/Primitive";
import { View } from "react-native";

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
    readonly Muted?: boolean | undefined;
    readonly Property: Domain.Property.PropertyDefinition;
}

/** Displays the type-specific icon and name of a Notion property. */
export const PropertyLabel = ({
    Muted = false,
    Property
}: PropertyLabelProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const Icon = PropertyTypeIcon[ Property.Type ];
    const Color = Theme.Semantic.Primary;

    return (
        <View style={ [ Styles.Container, Muted && Styles.Muted ] }>
            <Icon
                accessible={ false }
                color={ Color }
                size={ 14 }
                strokeWidth={ 2 }
            />
            <LabelText
                Color={ Color }
                NumberOfLines={ 2 }
                Style={ Styles.Name }
                Weight="500">
                { Property.Name }
            </LabelText>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 6
    }),
    Muted: ViewStyle({
        opacity: 0.65
    }),
    Name: TextStyle({
        flexShrink: 1
    })
});
