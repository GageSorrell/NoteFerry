/**
 * Ported from `@notion-kit/ui`'s `primitives/button.tsx` +
 * `primitives/variants.ts`'s `buttonVariants` cva. Source's `variant`/`size`
 * axes become `Variant`/`Size`; colors are resolved live via `useColor`
 * (rather than baked into a static stylesheet) since they're theme-aware.
 *
 * @module @notivex/ui/Primitive/Button
 *
 * @file      Button.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    StyleSheet,
    type View,
    type ViewStyle
} from "react-native";
import { UseColor, useRadii } from "../ThemeProvider.js";
import { Body } from "./Text.js";
import { Spinner } from "./Spinner.js";
import { WithAlpha } from "../Utility/index.js";

/**
 * The visual style and intent of a given `Button` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type ButtonVariant =
    | "Primary"
    | "Icon"
    | "NavIcon"
    | "Link"
    | "Blue"
    | "SoftBlue"
    | "Hint"
    | "Red"
    | "RedFill"
    | "White"
    | "Cell"
    | "Close";

/**
 * The size of a given `Button` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type ButtonSize =
    | "ExtraSmall"
    | "Small"
    | "Medium"
    | "Large"
    | "Circle";

const SizeStyle: Record<ButtonSize, ViewStyle> =
    Object.freeze({
        Circle: { },
        ExtraSmall: { height: 24, paddingHorizontal: 6 },
        Large: { height: 40, paddingHorizontal: 32 },
        Medium: { height: 36, paddingHorizontal: 16 },
        Small: { height: 32, paddingHorizontal: 12 }
    } as const);

/** {@inheritDoc Button} */
export interface ButtonProps
{
    readonly Variant?: ButtonVariant;
    readonly Size?: ButtonSize;
    readonly Disabled?: boolean;
    readonly Loading?: boolean;
    readonly OnPress?: ((Event: GestureResponderEvent) => void) | undefined;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string | undefined;
    readonly children?: React.ReactNode;
}

export/**
       * Forwards its ref to the underlying `Pressable` — needed so `Button` can
       * be used directly as `*Trigger`'s `AsChild` child (`DialogTrigger`,
       * `PopoverTrigger`, ...), which measure/attach to that node rather than
       * wrapping it in a second, touch-swallowing `Pressable` of their own.
       *
       * @category Component
       * @since 1.0.0
       */
const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(({
    Variant = "Primary",
    Size = "Medium",
    Disabled = false,
    Loading = false,
    OnPress,
    Style,
    AccessibilityLabel,
    children
}: ButtonProps, ForwardedRef: React.ForwardedRef<View>): React.JSX.Element =>
{
    const PrimaryColor = UseColor(Semantic.Primary);
    const IconColor = UseColor(Semantic.Icon);
    const BorderButtonColor = UseColor(Semantic.BorderButton);
    const BorderColor = UseColor(Semantic.Border);
    const BlueColor = UseColor(Semantic.Blue);
    const RedColor = UseColor(Semantic.Red);
    const MutedColor = UseColor(Semantic.Muted);
    const DefaultColor = UseColor(Semantic.Default);
    const MediumRadius = useRadii(Radii.Medium);
    const SmallRadius = useRadii(Radii.Small);
    const FullRadius = useRadii(Radii.Full);

    const IsIconOnly = Variant === "Icon" || Variant === "NavIcon" || Variant === "Close";

    const VariantStyle = React.useMemo<{ Container: ViewStyle; TextColor: string }>(() =>
    {
        switch (Variant)
        {
            case "Icon":
                return {
                    Container:
                    {
                        borderColor: BorderButtonColor,
                        borderRadius: MediumRadius,
                        borderWidth: 1,
                        height: 36,
                        width: 36
                    },
                    TextColor: IconColor
                };
            case "NavIcon":
                return {
                    Container:
                    {
                        height: 28,
                        width: 28
                    },
                    TextColor: IconColor
                } as const;
            case "Link":
                return {
                    Container: { },
                    TextColor: PrimaryColor
                } as const;
            case "Blue":
                return {
                    Container:
                    {
                        backgroundColor: BlueColor,
                        borderColor: BorderColor,
                        borderWidth: 1
                    },
                    TextColor: "#FFFFFF"
                } as const;
            case "SoftBlue":
                return {
                    Container:
                    {
                        backgroundColor: WithAlpha(BlueColor, 0.1)
                    },
                    TextColor: BlueColor
                } as const;
            case "Hint":
                return {
                    Container: { },
                    TextColor: MutedColor
                } as const;
            case "Red":
                return {
                    Container:
                    {
                        borderColor: WithAlpha(RedColor, 0.5),
                        borderWidth: 1
                    },
                    TextColor: RedColor
                } as const;
            case "RedFill":
                return {
                    Container:
                    {
                        backgroundColor: RedColor
                    },
                    TextColor: "#FFFFFF"
                } as const;
            case "White":
                return {
                    Container:
                    {
                        borderColor: "#FFFFFF",
                        borderWidth: 1
                    },
                    TextColor: "#FFFFFF"
                } as const;
            case "Cell":
                return {
                    Container:
                    {
                        borderRadius: 0,
                        justifyContent: "flex-start"
                    },
                    TextColor: PrimaryColor
                } as const;
            case "Close":
                return {
                    Container:
                    {
                        backgroundColor: WithAlpha(DefaultColor, 0.05),
                        borderRadius: FullRadius,
                        height: 18,
                        width: 18
                    },
                    TextColor: MutedColor
                } as const;
            case "Primary":
            default:
                return {
                    Container:
                    {
                        borderColor: BorderButtonColor,
                        borderWidth: 1
                    },
                    TextColor: PrimaryColor
                } as const;
        }
    }, [
        Variant,
        BorderButtonColor,
        BorderColor,
        BlueColor,
        IconColor,
        PrimaryColor,
        RedColor,
        MutedColor,
        DefaultColor,
        MediumRadius,
        FullRadius
    ]);

    return (
        <Pressable
            accessibilityLabel={ AccessibilityLabel }
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled || Loading } }
            disabled={ Disabled || Loading }
            hitSlop={ IsIconOnly ? 8 : undefined }
            onPress={ OnPress }
            ref={ ForwardedRef }
            style={ ({ pressed }: { readonly pressed: boolean; }) => [
                Styles.Base,
                Size !== "Circle" ? SizeStyle[ Size ] : undefined,
                { borderRadius: Size === "Large" ? MediumRadius : SmallRadius },
                VariantStyle.Container,
                pressed && !Disabled ? { backgroundColor: WithAlpha(DefaultColor, 0.05) } : undefined,
                (Disabled || Loading) && Styles.Disabled,
                Style
            ] }>
            { Loading
                ? <Spinner
                    Color={ VariantStyle.TextColor }
                    Size={ 16 }
                />
                : typeof children === "string"
                    ? (
                        <Body
                            Color={ VariantStyle.TextColor }
                            Weight={ Variant === "Blue" || Variant === "RedFill" ? "500" : "400" }>
                            { children }
                        </Body>
                    )
                    : children }
        </Pressable>
    );
});

Button.displayName = "Button";

export/**
       * `@notion-kit/ui`'s `CloseButton` — a `Button` preconfigured as `Variant="Close"`.
       *
       * @category Component
       * @since 1.0.0
       */
const CloseButton = ({
    OnPress,
    AccessibilityLabel = "Close"
}: Pick<ButtonProps, "OnPress" | "AccessibilityLabel">): React.JSX.Element =>
    <Button
        { ...{ AccessibilityLabel, OnPress } }
        Variant="Close">
        <Body>✕</Body>
    </Button>;

const Styles = StyleSheet.create({
    Base:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        justifyContent: "center"
    },
    Disabled:
    {
        opacity: 0.4
    }
});
