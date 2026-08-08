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
    type StyleProp,
    StyleSheet,
    type View,
    type ViewStyle
} from "react-native";
import { UseColor, useRadii } from "../ThemeProvider.js";
import { Body } from "./Text.js";
import { Spinner } from "./Spinner.js";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { WithAlpha } from "../Utility/index.js";

/**
 * The visual style and intent of a given `Button` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type ButtonAppearance =
    | "Primary"
    | "SignIn"
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
export interface ButtonProps extends React.PropsWithChildren
{
    readonly AccessibilityLabel?: string | undefined;
    readonly Disabled?: boolean;
    readonly Loading?: boolean;
    readonly OnPress?: ((Event: GestureResponderEvent) => unknown) | undefined;
    readonly Size?: ButtonSize;
    readonly Style?: StyleProp<ViewStyle>;
    readonly Appearance?: ButtonAppearance;
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
const Button = React.forwardRef<React.ComponentRef<typeof TouchableOpacity>, ButtonProps>(({
    Appearance = "Primary",
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
    const BackgroundMainColor = UseColor(Semantic.BackgroundMain);
    const MediumRadius = useRadii(Radii.Medium);
    const SmallRadius = useRadii(Radii.Small);
    const FullRadius = useRadii(Radii.Full);

    const IsIconOnly = Appearance === "Icon" || Appearance === "NavIcon" || Appearance === "Close";

    const VariantStyle = React.useMemo<{
        Container: ViewStyle;
        PressedContainer?: ViewStyle;
        TextColor: string;
    }>(() =>
    {
        switch (Appearance)
        {
            case "SignIn":
                /* An inverted, high-contrast CTA: filled with the primary
                 * text color and labeled in the page background color. Both
                 * tokens flip with the theme, so the button is dark-on-white in
                 * Light mode and light-on-dark in Dark mode. Pressing dims the
                 * fill toward the page background in either mode. */
                return {
                    Container:
                    {
                        backgroundColor: PrimaryColor,
                        minHeight: 40,
                        paddingHorizontal: 16
                    },
                    PressedContainer:
                    {
                        backgroundColor: WithAlpha(PrimaryColor, 0.85),
                        minHeight: 40,
                        paddingHorizontal: 16
                    },
                    TextColor: BackgroundMainColor
                } as const;
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
        Appearance,
        BorderButtonColor,
        BorderColor,
        BlueColor,
        IconColor,
        PrimaryColor,
        RedColor,
        MutedColor,
        DefaultColor,
        BackgroundMainColor,
        MediumRadius,
        FullRadius
    ]);

    const [ pressed, SetIsPressed ] = React.useState(false);

    const onPressIn = () => SetIsPressed(true);

    const onPressOut = () => SetIsPressed(false);

    return (
        <TouchableOpacity
            accessibilityLabel={ AccessibilityLabel }
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled || Loading } }
            disabled={ Disabled || Loading }
            hitSlop={ IsIconOnly ? 8 : undefined }
            onPress={ OnPress }
            { ...{ onPressIn, onPressOut } }
            ref={ ForwardedRef }
            style={ [
                Styles.Base,
                Size !== "Circle" ? SizeStyle[ Size ] : undefined,
                { borderRadius: Size === "Large" ? MediumRadius : SmallRadius },
                VariantStyle.Container,
                pressed && !Disabled
                    ? VariantStyle.PressedContainer ?? { backgroundColor: WithAlpha(DefaultColor, 0.05) }
                    : undefined,
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
                            Style={ [
                                Styles.Label,
                                { textAlign: Appearance === "Cell" ? "left" : "center" }
                            ] }
                            Weight={ Appearance === "Blue" || Appearance === "RedFill" ? "500" : "400" }>
                            { children }
                        </Body>
                    )
                    : children }
        </TouchableOpacity>
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
        Appearance="Close"
        Size="Circle">
        <Body
            Color={ Semantic.Muted }
            Style={ Styles.CloseGlyph }>
            ✕
        </Body>
    </Button>;

CloseButton.displayName = "CloseButton";

const Styles = StyleSheet.create({
    Base:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        justifyContent: "center"
    },
    CloseGlyph:
    {
        fontSize: 10,
        includeFontPadding: false,
        lineHeight: 12,
        textAlign: "center",
        textAlignVertical: "center"
    },
    Disabled:
    {
        opacity: 0.4
    },
    Label:
    {
        /* Fill the row so `textAlign` positions the glyph. `justifyContent`
         * alone does not center a single child through the gesture-handler
         * touchable's inner wrapper on Android. */
        flexGrow: 1
    }
});
