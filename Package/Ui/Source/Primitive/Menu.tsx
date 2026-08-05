/**
 * Ported from `@notion-kit/ui`'s `primitives/menu.tsx` — the presentational
 * building blocks (`MenuItem`, `MenuGroup`, ...) shared by `DropdownMenu`,
 * `ContextMenu`, and `Select`'s list content. Purely visual; positioning
 * and dismissal live in `Popup.tsx` and the overlay wrappers that use it.
 * Source's `@deprecated MenuItemSwitch` was not ported.
 *
 * @module @notivex/ui/Primitive/Menu
 *
 * @file      Menu.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Check, ChevronRight } from "lucide-react-native";
import * as React from "react";
import {
    Pressable,
    View,
    type GestureResponderEvent,
    type StyleProp,
    type ViewStyle,
} from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";
import { Text } from "./Text.js";

export interface MenuGroupProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MenuGroup = ({ Style, children }: MenuGroupProps): React.JSX.Element =>
    <View style={ [ { paddingVertical: 4 }, Style ] }>{ children }</View>;

export interface MenuLabelProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MenuLabel = ({ Style, children }: MenuLabelProps): React.JSX.Element =>
    <Text Variant="Label" Color={ Semantic.Secondary } Style={ [ { paddingHorizontal: 14, marginVertical: 4 }, Style ] }>{ children }</Text>;

export type MenuItemVariant = "Default" | "Secondary" | "Warning" | "Error";

export interface MenuItemProps {
    readonly Variant?: MenuItemVariant;
    readonly Icon?: React.ReactNode;
    readonly Label?: React.ReactNode;
    readonly Description?: string;
    readonly Disabled?: boolean;
    readonly OnPress?: (Event: GestureResponderEvent) => void;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MenuItem = ({
    Variant = "Default",
    Icon,
    Label,
    Description,
    Disabled = false,
    OnPress,
    Style,
    children,
}: MenuItemProps): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);
    const SecondaryColor = UseColor(Semantic.Secondary);
    const RedColor = UseColor(Semantic.Red);
    const DefaultColor = UseColor(Semantic.Default);
    const MediumRadius = useRadii(Radii.Medium);

    const TextColor = Variant === "Secondary" ? SecondaryColor : Variant === "Error" ? RedColor : PrimaryColor;

    return (
        <Pressable
            disabled={ Disabled }
            onPress={ OnPress }
            accessibilityRole="menuitem"
            accessibilityLabel={ typeof Label === "string" ? Label : undefined }
            accessibilityState={ { disabled: Disabled } }
            style={ ({ pressed }) => [
                { flexDirection: "row", alignItems: "center", minHeight: 28, marginHorizontal: 4, paddingHorizontal: 8, borderRadius: MediumRadius },
                pressed && !Disabled ? { backgroundColor: WithAlpha(DefaultColor, 0.1) } : undefined,
                Disabled ? { opacity: 0.4 } : undefined,
                Style,
            ] }
        >
            { Icon !== undefined && <View style={ { marginRight: 8, alignItems: "center", justifyContent: "center" } }>{ Icon }</View> }
            <View style={ { flex: 1, minWidth: 0 } }>
                { Description !== undefined
                    ? (
                        <View style={ { gap: 2, marginVertical: 4 } }>
                            <Text Variant="Body" Color={ TextColor } NumberOfLines={ 1 }>{ Label }</Text>
                            <Text Variant="Description" Color={ Semantic.Secondary } NumberOfLines={ 2 }>{ Description }</Text>
                        </View>
                    )
                    : typeof Label === "string"
                        ? <Text Variant="Body" Color={ TextColor } NumberOfLines={ 1 }>{ Label }</Text>
                        : Label }
            </View>
            { children }
        </Pressable>
    );
};

export interface MenuItemActionProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MenuItemAction = ({ Style, children }: MenuItemActionProps): React.JSX.Element =>
    <View style={ [ { marginLeft: "auto", flexShrink: 0 }, Style ] }>{ children }</View>;

export const MenuItemCheck = (): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);

    return (
        <MenuItemAction Style={ { width: 14 } }>
            <Check size={ 14 } color={ PrimaryColor } />
        </MenuItemAction>
    );
};

export interface MenuItemSelectProps {
    readonly children?: React.ReactNode;
}

export const MenuItemSelect = ({ children }: MenuItemSelectProps): React.JSX.Element =>
{
    const MutedColor = UseColor(Semantic.Muted);

    return (
        <MenuItemAction Style={ { flexDirection: "row", alignItems: "center" } }>
            { children }
            <ChevronRight size={ 12 } color={ MutedColor } style={ { marginLeft: 6 } } />
        </MenuItemAction>
    );
};

export interface MenuItemShortcutProps {
    readonly children?: React.ReactNode;
}

export const MenuItemShortcut = ({ children }: MenuItemShortcutProps): React.JSX.Element =>
    <MenuItemAction><Text Variant="Description" Color={ Semantic.Muted }>{ children }</Text></MenuItemAction>;

export interface MenuFooterProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const MenuFooter = ({ Style, children }: MenuFooterProps): React.JSX.Element =>
    <View style={ [ { minHeight: 28, width: "100%", alignItems: "center", paddingHorizontal: 12, paddingVertical: 4 }, Style ] }>{ children }</View>;
