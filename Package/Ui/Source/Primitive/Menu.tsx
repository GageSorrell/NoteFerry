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
import { Body, BodyCompact, Description, LabelText, MenuItemText } from "./Text.js";
import { Check, ChevronRight } from "lucide-react-native";
import {
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { Predicate } from "effect";
import { UseToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

/** {@inheritDoc MenuGroup} */
export interface MenuGroupProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A vertically padded container for related menu content.
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
       * A secondary-text heading for a group of menu items.
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
       * Forwards its ref to the underlying `Pressable` — needed so a `MenuItem`
       * can be used as an anchor for its own `Popup` (e.g. `DateSheet`'s
       * "Date format"/"Time format"/"Timezone" rows, each of which opens a
       * popup anchored directly to the row that triggered it), the same way
       * `Button` already forwards its ref for `*Trigger` `AsChild` usage.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItem = React.forwardRef<React.ComponentRef<typeof Pressable>, MenuItemProps>(({
    Variant = "Default",
    Icon,
    Label,
    Description: DescriptionText,
    Disabled = false,
    OnPress,
    Style,
    children
}: MenuItemProps, ForwardedRef: React.ForwardedRef<View>): React.JSX.Element =>
{
    const {
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Secondary]: SecondaryColor,
        [Semantic.Red]: RedColor,
        [Semantic.Default]: DefaultColor,
        [Radii.Medium]: MediumRadius
    } = UseToken(
        Semantic.Primary,
        Semantic.Secondary,
        Semantic.Red,
        Semantic.Default,
        Radii.Medium
    );

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
            ref={ ForwardedRef }
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
                    { Predicate.isString(Icon) ? <Body>{ Icon }</Body> : Icon }
                </View>
            ) }
            <View style={ { flex: 1, minWidth: 0 } }>
                { DescriptionText !== undefined
                    ? (
                        <View style={ { gap: 2, marginVertical: 4 } }>
                            <MenuItemText
                                Color={ TextColor }
                                NumberOfLines={ 1 }>
                                { Label }
                            </MenuItemText>
                            <Description
                                Color={ Semantic.Secondary }
                                NumberOfLines={ 2 }>
                                { DescriptionText }
                            </Description>
                        </View>
                    )
                    : typeof Label === "string"
                        ? <MenuItemText
                            Color={ TextColor }
                            NumberOfLines={ 1 }>
                            { Label }
                        </MenuItemText>
                        : Label
                }
            </View>
            { children }
        </Pressable>
    );
});

MenuItem.displayName = "MenuItem";

/** {@inheritDoc MenuItemAction} */
export interface MenuItemActionProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A trailing container for an action, status, or accessory within a `MenuItem`.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemAction = ({ Style, children }: MenuItemActionProps): React.JSX.Element =>
    <View style={ [ { flexShrink: 0, marginLeft: "auto" }, Style ] }>
        { children }
    </View>;

export/**
       * A trailing check-mark indicator for a selected `MenuItem`.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemCheck = (): React.JSX.Element =>
{
    const { [Semantic.Primary]: PrimaryColor } = UseToken(Semantic.Primary);

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
       * The trailing "current value + chevron" cluster on a `MenuItem` row
       * that opens a picker (e.g. `DateSheet`'s "Date format"/"Time format"/
       * "Timezone" rows). String/number `children` are wrapped in `Body` —
       * bare text can't be a direct child of the underlying `View` (RN
       * throws "Text strings must be rendered within a <Text> component").
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemSelect = ({ children }: MenuItemSelectProps): React.JSX.Element =>
{
    const { [Semantic.Muted]: MutedColor } = UseToken(Semantic.Muted);

    return (
        <MenuItemAction Style={ {
            alignItems: "center",
            flexDirection: "row"
        } }>
            { typeof children === "string" || typeof children === "number"
                ? <BodyCompact
                    Color={ Semantic.Muted }
                    NumberOfLines={ 1 }>
                    { children }
                </BodyCompact>
                : children }
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
       * Displays a muted shortcut hint at the trailing edge of a `MenuItem`.
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
       * A centered footer container for supplementary menu content.
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
