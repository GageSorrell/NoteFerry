/**
 * Ported from `@notion-kit/ui`'s `primitives/button.tsx` +
 * `primitives/variants.ts`'s `buttonVariants` cva. Source's `variant`/`size`
 * axes become `Variant`/`Size`; colors are resolved live via `useTheme`
 * (rather than baked into a static stylesheet) since they're theme-aware.
 *
 * @module @noteferry/ui/Primitive/Button
 *
 * @file      Button.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Body, ButtonLabel } from "./Text.js";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";
import {
    type GestureResponderEvent,
    View as RNView,
    type StyleProp,
    type View,
    type ViewStyle
} from "react-native";
import { MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { Mix, WithAlpha } from "../Utility/index.js";
import type { ReadonlyRecord } from "effect/Record";
import { Spinner } from "./Spinner.js";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { useToken } from "../ThemeProvider.js";

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

const SizeStyle: ReadonlyRecord<ButtonSize, ViewStyle> =
    Object.freeze({
        Circle: { },
        ExtraSmall: { height: 28, paddingHorizontal: 6 },
        Large: { height: 44, paddingHorizontal: 32 },
        Medium: { height: 40, paddingHorizontal: 16 },
        Small: { height: 36, paddingHorizontal: 12 }
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

/** {@inheritDoc ButtonGradientFill} */
interface ButtonGradientFillProps
{
    readonly BorderRadius: number;
    readonly Colors: readonly [ Top: string, Bottom: string ];
    readonly Style: ViewStyle;
}

/**
 * Paints a top-to-bottom, two-stop gradient behind a solid-fill `Button`'s
 * content. React Native's `backgroundColor` has no CSS-gradient equivalent,
 * so — following the same `react-native-svg` approach `DatabaseCard`'s cover
 * gradient already uses — an absolutely-positioned, corner-matched `Svg`
 * renders as the first child of the `Button`, behind its label/icon.
 *
 * @category Component
 * @since 1.0.0
 */
const ButtonGradientFill = ({
    BorderRadius,
    Colors: [ Top, Bottom ],
    Style
}: ButtonGradientFillProps): React.JSX.Element => (
    <RNView
        pointerEvents="none"
        style={ [ Style, { borderRadius: BorderRadius } ] }>
        <Svg
            height="100%"
            width="100%">
            <Defs>
                <LinearGradient
                    id="Fill"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%">
                    <Stop
                        offset="0%"
                        stopColor={ Top }
                    />
                    <Stop
                        offset="100%"
                        stopColor={ Bottom }
                    />
                </LinearGradient>
            </Defs>
            <Rect
                fill="url(#Fill)"
                height="100%"
                width="100%"
            />
        </Svg>
    </RNView>
);

ButtonGradientFill.displayName = "ButtonGradientFill";

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
    const Styles = useStyles();
    const {
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Icon]: IconColor,
        [Semantic.BorderButton]: BorderButtonColor,
        [Semantic.Border]: BorderColor,
        [Semantic.Blue]: BlueColor,
        [Semantic.BlueHover]: BlueHoverColor,
        [Semantic.Red]: RedColor,
        [Semantic.Muted]: MutedColor,
        [Semantic.Default]: DefaultColor,
        [Semantic.BackgroundMain]: BackgroundMainColor,
        [Radii.Medium]: MediumRadius,
        [Radii.Large]: LargeRadius,
        [Radii.Full]: FullRadius
    } = useToken(
        Semantic.Primary,
        Semantic.Icon,
        Semantic.BorderButton,
        Semantic.Border,
        Semantic.Blue,
        Semantic.BlueHover,
        Semantic.Red,
        Semantic.Muted,
        Semantic.Default,
        Semantic.BackgroundMain,
        Radii.Medium,
        Radii.Large,
        Radii.Full
    );

    const IsIconOnly = Appearance === "Icon" || Appearance === "NavIcon" || Appearance === "Close";

    const VariantStyle = React.useMemo<{
        Container: ViewStyle;
        /* Two-stop, top-to-bottom fill for solid, colorful appearances — a
         * flat `backgroundColor` alone reads noticeably flatter than
         * Notion's own filled buttons, which render this same subtle
         * lighter-top/darker-bottom gradient. */
        Gradient?: readonly [ Top: string, Bottom: string ];
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
                        borderColor: BorderColor,
                        borderWidth: 1
                    },
                    /* `BlueHover` is Notion's own darker companion to `Blue`
                     * (already used elsewhere as a "deeper blue", e.g.
                     * `Calendar`'s selected-day fill) — exactly the pair
                     * their blue buttons gradient between. */
                    Gradient: [ BlueColor, BlueHoverColor ] as const,
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
                    Container: { },
                    Gradient: [ RedColor, Mix(RedColor, "#000000", 0.17) ] as const,
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
        BlueHoverColor,
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

    /* One step back down the same `Radii` scale from `Large`/`ExtraLarge`
       (10px/12px) to `Medium`/`Large` (8px/10px) — Notion's actual buttons
       round slightly less than that first pass landed on. */
    const ContainerRadius = Size === "Large" ? LargeRadius : MediumRadius;

    return (
        <TouchableOpacity
            accessibilityLabel={ AccessibilityLabel }
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled || Loading } }
            disabled={ Disabled || Loading }
            hitSlop={ IsIconOnly ? 8 : undefined }
            /* `react-native-gesture-handler`'s `TouchableOpacity` captures its
               base opacity at construction and only re-reads it on press-out, so
               a button disabled after mount never applies `Styles.Disabled`'s
               dimming. Re-key on the disabled/loading state to remount it and
               pick up the correct base opacity. */
            key={ Disabled || Loading ? "disabled" : "enabled" }
            onPress={ OnPress }
            { ...{ onPressIn, onPressOut } }
            ref={ ForwardedRef }
            style={ [
                Styles.Base,
                Size !== "Circle" ? SizeStyle[ Size ] : undefined,
                { borderRadius: ContainerRadius },
                VariantStyle.Container,
                pressed && !Disabled
                    ? VariantStyle.PressedContainer ?? { backgroundColor: WithAlpha(DefaultColor, 0.05) }
                    : undefined,
                (Disabled || Loading) && Styles.Disabled,
                Style
            ] }>
            { VariantStyle.Gradient
                ? <ButtonGradientFill
                    BorderRadius={ ContainerRadius }
                    Colors={ VariantStyle.Gradient }
                    Style={ Styles.GradientFill }
                />
                : null }
            { Loading
                ? <Spinner
                    Color={ VariantStyle.TextColor }
                    Size={ 16 }
                />
                : typeof children === "string"
                    ? (
                        <ButtonLabel
                            Color={ VariantStyle.TextColor }
                            Style={ [
                                Styles.Label,
                                { textAlign: Appearance === "Cell" ? "left" : "center" }
                            ] }>
                            { children }
                        </ButtonLabel>
                    )
                    : children }
        </TouchableOpacity>
    );
});

Button.displayName = "Button";

/** {@inheritDoc AuthButton} */
export interface AuthButtonProps extends ButtonProps
{
    /** The provider or authentication-method icon shown at the leading edge. */
    readonly Icon: React.JSX.Element;
}

export/**
       * Notion-style authentication button with an outlined, full-width row.
       * Equal leading and trailing slots keep the label visually centered even
       * though only the leading slot contains an icon.
       *
       * @category Component
       * @since 1.0.0
       */
const AuthButton = ({
    Icon,
    Style,
    children,
    ...Props
}: AuthButtonProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <Button
            { ...Props }
            Appearance="Primary"
            Size="Large"
            Style={ [ Styles.AuthButton, Style ] }>
            <RNView
                accessible={ false }
                style={ Styles.AuthButtonSide }>
                { Icon }
            </RNView>
            { typeof children === "string"
                ? (
                    <ButtonLabel
                        Color={ Semantic.Primary }
                        Style={ Styles.AuthButtonLabel }>
                        { children }
                    </ButtonLabel>
                )
                : (
                    <RNView style={ Styles.AuthButtonContent }>
                        { children }
                    </RNView>
                ) }
            <RNView
                accessible={ false }
                style={ Styles.AuthButtonSide }
            />
        </Button>
    );
};

AuthButton.displayName = "AuthButton";

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
{
    const Styles = useStyles();

    return (
        <Button
            { ...{ AccessibilityLabel, OnPress } }
            Appearance="Close"
            Size="Circle">
            <Body
                Color={ Semantic.Muted }
                Style={ Styles.CloseGlyph }>
                ✕
            </Body>
        </Button>
    );
};

CloseButton.displayName = "CloseButton";

const useStyles = MakeStyles({
    AuthButton: MakeViewStyle({
        alignSelf: "stretch",
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 12
    }),
    AuthButtonContent: MakeViewStyle({
        alignItems: "center",
        flex: 1
    }),
    AuthButtonLabel: TextStyle({
        flex: 1,
        textAlign: "center"
    }),
    AuthButtonSide: MakeViewStyle({
        alignItems: "center",
        height: 24,
        justifyContent: "center",
        width: 24
    }),
    Base: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
        justifyContent: "center"
    }),
    CloseGlyph: TextStyle({
        fontSize: 10,
        includeFontPadding: false,
        lineHeight: 12,
        textAlign: "center",
        textAlignVertical: "center"
    }),
    Disabled: MakeViewStyle({
        opacity: 0.4
    }),
    GradientFill: MakeViewStyle({
        bottom: 0,
        left: 0,
        overflow: "hidden",
        position: "absolute",
        right: 0,
        top: 0
    }),
    Label: TextStyle({
        /* Fill the row so `textAlign` positions the glyph. `justifyContent`
         * alone does not center a single child through the gesture-handler
         * touchable's inner wrapper on Android. */
        flexGrow: 1,
        fontSize: 12,
        lineHeight: 22
    })
});
