/**
 * Shared chrome for a bordered, row-divided table of navigation rows — used
 * by the settings screen's top-level section table and the database
 * settings screen's database list, so both render identically: a leading
 * icon, a title, and a trailing chevron, inside one rounded, bordered
 * container with a hairline divider between rows.
 *
 * @module noteferry/Component/SettingsTable
 *
 * @file      SettingsTable.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ItemTitle, Pressable } from "@noteferry/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui";
import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";

/** {@inheritDoc SettingsTable} */
export type SettingsTableProps = React.PropsWithChildren;

export/**
       * The rounded, bordered container for a set of `SettingsTableRow`s.
       *
       * @category Component
       * @since 1.0.0
       */
const SettingsTable = ({ children }: SettingsTableProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View
            accessibilityRole="list"
            style={ Styles.Table }>
            { children }
        </View>
    );
};

SettingsTable.displayName = "SettingsTable";

/** {@inheritDoc SettingsTableRow} */
export interface SettingsTableRowProps
{
    readonly AccessibilityLabel?: string;

    /** Renders the hairline bottom border — omit on a table's last row. */
    readonly Divider?: boolean;

    /** A leading icon element, already sized and colored by the caller. */
    readonly Icon: React.ReactNode;
    readonly Label: string;
    readonly OnPress: () => void;
}

export/**
       * One tappable row inside a `SettingsTable`: a leading icon, a title,
       * and a trailing chevron.
       *
       * @category Component
       * @since 1.0.0
       */
const SettingsTableRow = ({
    AccessibilityLabel,
    Divider = false,
    Icon,
    Label,
    OnPress
}: SettingsTableRowProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();

    return (
        <Pressable
            Accessibility={ { Label: AccessibilityLabel ?? Label, Role: "button" } }
            OnPress={ OnPress }
            style={ [ Styles.Row, Divider && Styles.RowDivider ] }>
            { Icon }
            <ItemTitle
                NumberOfLines={ 2 }
                Style={ Styles.Title }>
                { Label }
            </ItemTitle>
            <ChevronRight
                color={ Theme.Semantic.IconSecondary }
                size={ 18 }
                strokeWidth={ 1.8 }
            />
        </Pressable>
    );
};

SettingsTableRow.displayName = "SettingsTableRow";

const useStyles = MakeStyles({
    Row: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 56,
        paddingHorizontal: 12,
        paddingVertical: 9
    }),
    RowDivider: ViewStyle({
        borderBottomColor: Token.Semantic.Border,
        borderBottomWidth: 1
    }),
    Table: ViewStyle({
        borderColor: Token.Semantic.Border,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden"
    }),
    Title: TextStyle({
        flex: 1
    })
});
