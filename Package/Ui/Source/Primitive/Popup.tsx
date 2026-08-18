/**
 * Internal anchored-overlay primitive, built on `react-native-popover-view`
 * (it owns anchor measurement, screen-edge collision, and platform-
 * appropriate presentation). `Popover`, `Tooltip`, `DropdownMenu`,
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

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Shadow from "../Token/Shadow.js";
import {
    type GestureResponderEvent,
    type StyleProp,
    type ViewStyle,
    useWindowDimensions
} from "react-native";
import RNPopover, { PopoverPlacement, Rect } from "react-native-popover-view";
import type { ReadonlyRecord } from "effect/Record";
import type { Thunk } from "@sorrell/effect/Function";
import { useToken } from "../ThemeProvider.js";

/**
 * The relative location where a given `Popup` component may be placed.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type PopupPlacement =
    | "Top"
    | "Bottom"
    | "Left"
    | "Right"
    | "Auto"
    | "Center"
    | "Floating";

const PlacementMap: ReadonlyRecord<PopupPlacement, PopoverPlacement> =
    Object.freeze({
        Auto: PopoverPlacement.AUTO,
        Bottom: PopoverPlacement.BOTTOM,
        Center: PopoverPlacement.CENTER,
        Floating: PopoverPlacement.FLOATING,
        Left: PopoverPlacement.LEFT,
        Right: PopoverPlacement.RIGHT,
        Top: PopoverPlacement.TOP
    } as const);

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

export/**
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
const CloneTrigger = (
    Child: React.ReactElement<{ readonly OnPress?: ((Event: GestureResponderEvent) => void) | undefined }>,
    OnPress: (Event: GestureResponderEvent) => void,
    Ref?: PopupAnchor
): React.ReactElement =>
    React.cloneElement(Child, {
        OnPress: (Event: GestureResponderEvent) =>
        {
            Child.props.OnPress?.(Event);
            OnPress(Event);
        },
        ...(Ref === undefined ? { } : { ref: Ref })
    });

/** {@inheritDoc Popup} */
export interface PopupProps extends React.PropsWithChildren
{
    readonly IsVisible: boolean;
    readonly OnRequestClose: Thunk;
    readonly Anchor: PopupAnchor;
    readonly Placement?: PopupPlacement;
    readonly MatchAnchorWidth?: boolean;

    /**
     * `"Tooltip"` uses the tooltip color/shape; `"Popup"` (the default) is
     * the generic card look shared by popovers, menus, and selects.
     */
    readonly Variant?: "Popup" | "Tooltip";
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * The shared anchored-overlay shell behind `Popover`/`Tooltip`/`DropdownMenu`/`ContextMenu`/`Select`.
       *
       * @category Component
       * @since 1.0.0
       */
const Popup = ({
    IsVisible,
    OnRequestClose,
    Anchor,
    Placement = "Bottom",
    MatchAnchorWidth = false,
    Variant = "Popup",
    Style,
    children
}: PopupProps): React.JSX.Element =>
{
    const {
        [Semantic.BackgroundPopover]: PopoverBackground,
        [Semantic.BackgroundTooltip]: TooltipBackground,
        [Semantic.Border]: BorderColor,
        [Radii.Large]: LargeRadius,
        [Radii.Small]: SmallRadius,
        [Shadow.Card]: CardShadow
    } = useToken(
        Semantic.BackgroundPopover,
        Semantic.BackgroundTooltip,
        Semantic.Border,
        Radii.Large,
        Radii.Small,
        Shadow.Card
    );
    const Window = useWindowDimensions();
    const [ AnchorRect, SetAnchorRect ] = React.useState<Rect | null>(null);

    React.useEffect(() =>
    {
        if (!IsVisible)
        {
            return;
        }

        let IsActive = true;
        const Current = Anchor.current as {
            readonly measureInWindow?: (
                Callback: (X: number, Y: number, Width: number, Height: number) => void
            ) => void;
        } | null;

        Current?.measureInWindow?.((X: number, Y: number, Width: number, Height: number) =>
        {
            if (!IsActive)
            {
                return;
            }

            SetAnchorRect(new Rect(X, Y, Width, Height));
        });

        return () =>
        {
            IsActive = false;
        };
    }, [ Anchor, IsVisible, Window.height, Window.width ]);

    const VariantStyle: ViewStyle = Variant === "Tooltip"
        ? {
            alignItems: "center",
            backgroundColor: TooltipBackground,
            borderRadius: SmallRadius,
            flexDirection: "row",
            gap: 6,
            maxWidth: 220,
            paddingHorizontal: 8,
            paddingVertical: 4
        }
        : {
            backgroundColor: PopoverBackground,
            /* react-native-popover-view hard-codes a dark bottom-edge color
             * in its base content style. Override that side explicitly so it
             * matches the rest of Notivex's themed popup border. */
            borderBottomColor: BorderColor,
            borderColor: BorderColor,
            borderRadius: LargeRadius,
            borderWidth: 1,
            // elevation: CardShadow.Elevation,
            elevation: 5,
            shadowColor: "#333333",
            // shadowColor: CardShadow.ShadowColor,
            shadowOffset: CardShadow.ShadowOffset === undefined
                ? undefined
                : {
                    // height: CardShadow.ShadowOffset.Height,
                    height: 8,
                    width: CardShadow.ShadowOffset.Width
                },
            shadowOpacity: CardShadow.ShadowOpacity,
            shadowRadius: CardShadow.ShadowRadius
        };

    return (
        <RNPopover
            // animationConfig={ {
            //     delay: 0,
            //     duration: 100
            // } }
            arrowSize={ { height: 0, width: 0 } }
            backgroundStyle={ { opacity: 0 } }
            from={ AnchorRect ?? Anchor }
            isVisible={ IsVisible && AnchorRect !== null }
            offset={ -1 }
            onCloseComplete={ () => SetAnchorRect(null) }
            onRequestClose={ OnRequestClose }
            placement={ PlacementMap[ Placement ] }
            popoverStyle={ [
                { overflow: "hidden" },
                VariantStyle,
                MatchAnchorWidth && AnchorRect !== null
                    ? { width: AnchorRect.width }
                    : undefined,
                Style
            ] as StyleProp<ViewStyle> }>
            { children }
        </RNPopover>
    );
};
