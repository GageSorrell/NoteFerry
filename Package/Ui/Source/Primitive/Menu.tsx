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

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Body, Description, LabelText } from "./Text.js";
import { Check, ChevronRight } from "lucide-react-native";
import {
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { UseColor, useRadii } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/** {@inheritDoc MenuGroup} */
export interface MenuGroupProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuGroup = ({ Style, children }: MenuGroupProps): React.JSX.Element =>
    <View style={ [ { paddingVertical: 4 }, Style ] }>{ children }</View>;

/** {@inheritDoc MenuLabel} */
export interface MenuLabelProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuLabel = ({ Style, children }: MenuLabelProps): React.JSX.Element =>
    <LabelText
        Color={ Semantic.Secondary }
        Style={ [
            {
                marginVertical: 4,
                paddingHorizontal: 14
            },
            Style
        ] }>
        { children }
    </LabelText>;

/**
 * The visual style of a menu item.
 *
 * @category Navigation
 * @since 1.0.0
 */
export type MenuItemVariant =
    | "Default"
    | "Secondary"
    | "Warning"
    | "Error";

/** {@inheritDoc MenuItem} */
export interface MenuItemProps extends React.PropsWithChildren
{
    readonly Variant?: MenuItemVariant | undefined;
    readonly Icon?: React.ReactNode;
    readonly Label?: React.ReactNode;
    readonly Description?: string | undefined;
    readonly Disabled?: boolean;
    readonly OnPress?: (Event: GestureResponderEvent) => void;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItem = ({
    Variant = "Default",
    Icon,
    Label,
    Description: DescriptionText,
    Disabled = false,
    OnPress,
    Style,
    children
}: MenuItemProps): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);
    const SecondaryColor = UseColor(Semantic.Secondary);
    const RedColor = UseColor(Semantic.Red);
    const DefaultColor = UseColor(Semantic.Default);
    const MediumRadius = useRadii(Radii.Medium);

    const TextColor = Variant === "Secondary"
        ? SecondaryColor
        : Variant === "Error"
            ? RedColor
            : PrimaryColor;

    return (
        <Pressable
            accessibilityLabel={ typeof Label === "string" ? Label : undefined }
            accessibilityRole="menuitem"
            accessibilityState={ { disabled: Disabled } }
            disabled={ Disabled }
            onPress={ OnPress }
            style={ ({ pressed }: { readonly pressed: boolean; }) => [
                {
                    alignItems: "center",
                    borderRadius: MediumRadius,
                    flexDirection: "row",
                    marginHorizontal: 4,
                    minHeight: 28,
                    paddingHorizontal: 8
                },
                pressed && !Disabled ? { backgroundColor: WithAlpha(DefaultColor, 0.1) } : undefined,
                Disabled ? { opacity: 0.4 } : undefined,
                Style
            ] }>
            { Icon !== undefined && (
                <View style={ {
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8
                } }>
                    { Icon }
                </View>
            ) }
            <View style={ { flex: 1, minWidth: 0 } }>
                { DescriptionText !== undefined
                    ? (
                        <View style={ { gap: 2, marginVertical: 4 } }>
                            <Body
                                Color={ TextColor }
                                NumberOfLines={ 1 }>
                                { Label }
                            </Body>
                            <Description
                                Color={ Semantic.Secondary }
                                NumberOfLines={ 2 }>
                                { DescriptionText }
                            </Description>
                        </View>
                    )
                    : typeof Label === "string"
                        ? <Body
                            Color={ TextColor }
                            NumberOfLines={ 1 }>
                            { Label }
                        </Body>
                        : Label
                }
            </View>
            { children }
        </Pressable>
    );
};

/** {@inheritDoc MenuItemAction} */
export interface MenuItemActionProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemAction = ({ Style, children }: MenuItemActionProps): React.JSX.Element =>
    <View style={ [ { flexShrink: 0, marginLeft: "auto" }, Style ] }>
        { children }
    </View>;

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemCheck = (): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);

    return (
        <MenuItemAction Style={ { width: 14 } }>
            <Check
                color={ PrimaryColor }
                size={ 14 }
            />
        </MenuItemAction>
    );
};

/** {@inheritDoc MenuItemSelect} */
export interface MenuItemSelectProps extends React.PropsWithChildren { }

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemSelect = ({ children }: MenuItemSelectProps): React.JSX.Element =>
{
    const MutedColor = UseColor(Semantic.Muted);

    return (
        <MenuItemAction Style={ {
            alignItems: "center",
            flexDirection: "row"
        } }>
            { children }
            <ChevronRight
                color={ MutedColor }
                size={ 12 }
                style={ { marginLeft: 6 } }
            />
        </MenuItemAction>
    );
};

/** {@inheritDoc MenuItemShortcut} */
export interface MenuItemShortcutProps extends React.PropsWithChildren { }

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemShortcut = ({ children }: MenuItemShortcutProps): React.JSX.Element =>
    <MenuItemAction>
        <Description Color={ Semantic.Muted }>
            { children }
        </Description>
    </MenuItemAction>;

/** {@inheritDoc MenuFooter} */
export interface MenuFooterProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuFooter = ({ Style, children }: MenuFooterProps): React.JSX.Element =>
    <View style={ [
        {
            alignItems: "center",
            minHeight: 28,
            paddingHorizontal: 12,
            paddingVertical: 4,
            width: "100%"
        },
        Style
    ] }>
        { children }
    </View>;
