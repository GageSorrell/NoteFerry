/**
 * A thin wrapper around `react-native`'s `Pressable` that collapses the three
 * accessibility props into a single required `Accessibility` object and renames
 * `disabled`/`onPress` to the project's PascalCase convention. Every other
 * `Pressable` prop — including `style` and `children` — passes through
 * unchanged, and the ref is forwarded to the underlying `Pressable`.
 *
 * @module @notivex/ui/Primitive/Pressable
 *
 * @file      Pressable.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    type AccessibilityProps,
    Pressable as RNPressable,
    type PressableProps as RNPressableProps,
    type View
} from "react-native";

/** The accessibility props of {@link Pressable}, grouped into one object. */
export interface PressableAccessibility
{
    readonly Label: AccessibilityProps["accessibilityLabel"];
    readonly Role: AccessibilityProps["accessibilityRole"];
    readonly State?: AccessibilityProps["accessibilityState"];
}

/** {@inheritDoc Pressable} */
export interface PressableProps extends Omit<
    RNPressableProps,
    | "accessibilityLabel"
    | "accessibilityRole"
    | "accessibilityState"
    | "disabled"
    | "onPress"
>
{
    readonly Accessibility: PressableAccessibility | undefined;
    readonly Disabled?: RNPressableProps["disabled"];
    readonly OnPress?: RNPressableProps["onPress"];
}

export/**
       * A `Pressable` whose accessibility props are supplied through a single
       * `Accessibility` object rather than three separate props.
       *
       * @category Component
       * @since 1.0.0
       */
const Pressable = React.forwardRef<React.ComponentRef<typeof RNPressable>, PressableProps>(({
    Accessibility,
    Disabled,
    OnPress,
    ...Rest
}: PressableProps, ForwardedRef: React.ForwardedRef<View>): React.JSX.Element =>
    (
        <RNPressable
            accessibilityLabel={ Accessibility?.Label }
            accessibilityRole={ Accessibility?.Role }
            accessibilityState={ Accessibility?.State }
            disabled={ Disabled }
            onPress={ OnPress }
            ref={ ForwardedRef }
            { ...Rest }
        />
    ));

Pressable.displayName = "Pressable";
