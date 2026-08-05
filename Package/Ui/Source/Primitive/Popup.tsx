/**
 * Internal anchored-overlay primitive, built on `react-native-popover-view`
 * (it owns anchor measurement, screen-edge collision, and platform-
 * appropriate presentation — a real `Modal` on iOS/Android, an absolutely
 * positioned `View` on web). `Popover`, `Tooltip`, `DropdownMenu`,
 * `ContextMenu`, and `Select` are all thin wrappers around this one
 * primitive — they differ only in trigger gesture (tap / long-press /
 * hover) and content, not in how the overlay itself is anchored and
 * dismissed. This replaces `@notion-kit/ui`'s shared `positioner()`/
 * `popup()` cva pair (see `design.tsx`), which had no direct RN analogue.
 *
 * @module @notivex/ui/Primitive/Popup
 *
 * @file      Popup.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import RNPopover, { PopoverPlacement } from "react-native-popover-view";

import { useRadii, UseColor, useShadow } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import * as Shadow from "../Token/Shadow.js";

export type PopupPlacement = "Top" | "Bottom" | "Left" | "Right" | "Auto" | "Center" | "Floating";

const PlacementMap: Record<PopupPlacement, PopoverPlacement> = {
    Top: PopoverPlacement.TOP,
    Bottom: PopoverPlacement.BOTTOM,
    Left: PopoverPlacement.LEFT,
    Right: PopoverPlacement.RIGHT,
    Auto: PopoverPlacement.AUTO,
    Center: PopoverPlacement.CENTER,
    Floating: PopoverPlacement.FLOATING,
};

/**
 * An anchor for a `Popup` — a ref to whatever component the popup should
 * point at (usually a `Pressable`). Typed loosely (`any`) deliberately:
 * `react-native-popover-view`'s `from` prop wants a legacy-architecture
 * `RefObject<React.Component>`, while RN's New Architecture host-component
 * refs (what `Pressable` actually hands back) are `ReactNativeElement`
 * instances, not `React.Component`s — the two libraries' ref types don't
 * unify. At runtime this is just an opaque ref holding whatever
 * `Pressable` assigns to it; `any` sidesteps the mismatch at the one
 * boundary that needs it instead of forcing a cast in every call site.
 */
export type PopupAnchor = React.RefObject<any>;

/**
 * Implements the `AsChild` pattern every `*Trigger` component supports:
 * clones the single child element, merging in an `OnPress` handler (the
 * child's own `OnPress`, if any, still fires first) and — when an anchor
 * ref is given — attaching it directly to that child, instead of wrapping
 * the child in a second `Pressable`. Nested `Pressable`s in RN don't bubble
 * touches from child to parent, so wrapping an already-interactive child
 * (e.g. a `Button`) in another `Pressable` would silently swallow every
 * press; cloning the child avoids that entirely. Any `ref` the caller
 * already attached to `Child` is intentionally not preserved here — none
 * of this library's own trigger usages need that, and merging an
 * unknown, possibly-forwardRef'd child ref safely isn't worth the
 * complexity it would add.
 */
export const CloneTrigger = (
    Child: React.ReactElement<{ readonly OnPress?: ((Event: GestureResponderEvent) => void) | undefined }>,
    OnPress: (Event: GestureResponderEvent) => void,
    Ref?: PopupAnchor,
): React.ReactElement =>
    React.cloneElement(Child, {
        OnPress: (Event: GestureResponderEvent) =>
        {
            Child.props.OnPress?.(Event);
            OnPress(Event);
        },
        ...(Ref === undefined ? {} : { ref: Ref }),
    });

export interface PopupProps {
    readonly IsVisible: boolean;
    readonly OnRequestClose: () => void;
    readonly Anchor: PopupAnchor;
    readonly Placement?: PopupPlacement;
    /** `"Tooltip"` uses the tooltip color/shape; `"Popup"` (the default) is the generic card look shared by popovers, menus, and selects. */
    readonly Variant?: "Popup" | "Tooltip";
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

/** The shared anchored-overlay shell behind `Popover`/`Tooltip`/`DropdownMenu`/`ContextMenu`/`Select`. */
export const Popup = ({
    IsVisible,
    OnRequestClose,
    Anchor,
    Placement = "Bottom",
    Variant = "Popup",
    Style,
    children,
}: PopupProps): React.JSX.Element =>
{
    const PopoverBackground = UseColor(Semantic.BackgroundPopover);
    const TooltipBackground = UseColor(Semantic.BackgroundTooltip);
    const BorderColor = UseColor(Semantic.Border);
    const LargeRadius = useRadii(Radii.Large);
    const SmallRadius = useRadii(Radii.Small);
    const CardShadow = useShadow(Shadow.Card);

    const VariantStyle: ViewStyle = Variant === "Tooltip"
        ? { backgroundColor: TooltipBackground, borderRadius: SmallRadius }
        : {
            backgroundColor: PopoverBackground,
            borderRadius: LargeRadius,
            borderWidth: 1,
            borderColor: BorderColor,
            shadowColor: CardShadow.ShadowColor,
            shadowOffset: CardShadow.ShadowOffset === undefined
                ? undefined
                : { width: CardShadow.ShadowOffset.Width, height: CardShadow.ShadowOffset.Height },
            shadowOpacity: CardShadow.ShadowOpacity,
            shadowRadius: CardShadow.ShadowRadius,
            elevation: CardShadow.Elevation,
        };

    return (
        <RNPopover
            isVisible={ IsVisible }
            from={ Anchor }
            placement={ PlacementMap[ Placement ] }
            onRequestClose={ OnRequestClose }
            popoverStyle={ [ { overflow: "hidden" }, VariantStyle, Style ] as StyleProp<ViewStyle> }
        >
            { children }
        </RNPopover>
    );
};
