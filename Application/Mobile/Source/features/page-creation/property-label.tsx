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
import CalendarDays from "lucide-react-native/icons/calendar-days";
import CircleDot from "lucide-react-native/icons/circle-dot";
import GitBranch from "lucide-react-native/icons/git-branch";
import Hash from "lucide-react-native/icons/hash";
import Link from "lucide-react-native/icons/link";
import ListTodo from "lucide-react-native/icons/list-todo";
import Mail from "lucide-react-native/icons/mail";
import Paperclip from "lucide-react-native/icons/paperclip";
import Phone from "lucide-react-native/icons/phone";
import SquareCheck from "lucide-react-native/icons/square-check";
import Tags from "lucide-react-native/icons/tags";
import Text from "lucide-react-native/icons/text-align-start";
import Type from "lucide-react-native/icons/type";
import Users from "lucide-react-native/icons/users";
import type { LucideIcon } from "lucide-react-native";
import { MakeStyles, TextStyle, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { LabelText } from "@noteferry/ui/Primitive/Text";
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
