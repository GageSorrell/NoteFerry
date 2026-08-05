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

import * as React from "react";
import {
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    StyleSheet,
    type ViewStyle,
} from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";
import { Spinner } from "./Spinner.js";
import { Text } from "./Text.js";

export type ButtonVariant =
    | "Primary" | "Icon" | "NavIcon" | "Link" | "Blue" | "SoftBlue"
    | "Hint" | "Red" | "RedFill" | "White" | "Cell" | "Close";

export type ButtonSize = "ExtraSmall" | "Small" | "Medium" | "Large" | "Circle";

const SizeStyle: Record<ButtonSize, ViewStyle> = {
    ExtraSmall: { height: 24, paddingHorizontal: 6 },
    Small: { height: 32, paddingHorizontal: 12 },
    Medium: { height: 36, paddingHorizontal: 16 },
    Large: { height: 40, paddingHorizontal: 32 },
    Circle: {},
};

export interface ButtonProps {
    readonly Variant?: ButtonVariant;
    readonly Size?: ButtonSize;
    readonly Disabled?: boolean;
    readonly Loading?: boolean;
    readonly OnPress?: ((Event: GestureResponderEvent) => void) | undefined;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string | undefined;
    readonly children?: React.ReactNode;
}

/**
 * Forwards its ref to the underlying `Pressable` — needed so `Button` can
 * be used directly as `*Trigger`'s `AsChild` child (`DialogTrigger`,
 * `PopoverTrigger`, ...), which measure/attach to that node rather than
 * wrapping it in a second, touch-swallowing `Pressable` of their own.
 */
export const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(({
    Variant = "Primary",
    Size = "Medium",
    Disabled = false,
    Loading = false,
    OnPress,
    Style,
    AccessibilityLabel,
    children,
}: ButtonProps, ForwardedRef): React.JSX.Element =>
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
                    Container: { width: 36, height: 36, borderWidth: 1, borderColor: BorderButtonColor, borderRadius: MediumRadius },
                    TextColor: IconColor,
                };
            case "NavIcon":
                return { Container: { width: 28, height: 28 }, TextColor: IconColor };
            case "Link":
                return { Container: {}, TextColor: PrimaryColor };
            case "Blue":
                return {
                    Container: { backgroundColor: BlueColor, borderWidth: 1, borderColor: BorderColor },
                    TextColor: "#FFFFFF",
                };
            case "SoftBlue":
                return { Container: { backgroundColor: WithAlpha(BlueColor, 0.1) }, TextColor: BlueColor };
            case "Hint":
                return { Container: {}, TextColor: MutedColor };
            case "Red":
                return { Container: { borderWidth: 1, borderColor: WithAlpha(RedColor, 0.5) }, TextColor: RedColor };
            case "RedFill":
                return { Container: { backgroundColor: RedColor }, TextColor: "#FFFFFF" };
            case "White":
                return { Container: { borderWidth: 1, borderColor: "#FFFFFF" }, TextColor: "#FFFFFF" };
            case "Cell":
                return { Container: { justifyContent: "flex-start", borderRadius: 0 }, TextColor: PrimaryColor };
            case "Close":
                return {
                    Container: { width: 18, height: 18, borderRadius: FullRadius, backgroundColor: WithAlpha(DefaultColor, 0.05) },
                    TextColor: MutedColor,
                };
            case "Primary":
            default:
                return {
                    Container: { borderWidth: 1, borderColor: BorderButtonColor },
                    TextColor: PrimaryColor,
                };
        }
    }, [ Variant, BorderButtonColor, BorderColor, BlueColor, IconColor, PrimaryColor, RedColor, MutedColor, DefaultColor, MediumRadius, FullRadius ]);

    return (
        <Pressable
            ref={ ForwardedRef }
            disabled={ Disabled || Loading }
            onPress={ OnPress }
            accessibilityRole="button"
            accessibilityLabel={ AccessibilityLabel }
            accessibilityState={ { disabled: Disabled || Loading } }
            hitSlop={ IsIconOnly ? 8 : undefined }
            style={ ({ pressed }) => [
                Styles.Base,
                Size !== "Circle" ? SizeStyle[ Size ] : undefined,
                { borderRadius: Size === "Large" ? MediumRadius : SmallRadius },
                VariantStyle.Container,
                pressed && !Disabled ? { backgroundColor: WithAlpha(DefaultColor, 0.05) } : undefined,
                (Disabled || Loading) && Styles.Disabled,
                Style,
            ] }
        >
            { Loading
                ? <Spinner Size={ 16 } Color={ VariantStyle.TextColor } />
                : typeof children === "string"
                    ? (
                        <Text
                            Variant="Body"
                            Color={ VariantStyle.TextColor }
                            Weight={ Variant === "Blue" || Variant === "RedFill" ? "500" : "400" }
                        >
                            { children }
                        </Text>
                    )
                    : children }
        </Pressable>
    );
});

Button.displayName = "Button";

/** `@notion-kit/ui`'s `CloseButton` — a `Button` preconfigured as `Variant="Close"`. */
export const CloseButton = ({ OnPress, AccessibilityLabel = "Close" }: Pick<ButtonProps, "OnPress" | "AccessibilityLabel">): React.JSX.Element => (
    <Button Variant="Close" OnPress={ OnPress } AccessibilityLabel={ AccessibilityLabel }>
        <Text Variant="Body">✕</Text>
    </Button>
);

const Styles = StyleSheet.create({
    Base: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    Disabled: {
        opacity: 0.4,
    },
});
