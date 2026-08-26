/**
 * Ported from `@notion-kit/ui`'s `primitives/checkbox.tsx`.
 *
 * @module @noteferry/ui/Primitive/Checkbox
 *
 * @file      Checkbox.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Check, Minus } from "lucide-react-native";
import { type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "./Pressable.js";
import type { ReadonlyRecord } from "effect/Record";
import { useToken } from "../ThemeProvider.js";

/**
 * The size of a given `Checkbox` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type CheckboxSize =
    | "Medium"
    | "Small"
    | "ExtraSmall";

/**
 * The state of a given `Checkbox` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type CheckedState =
    | boolean
    | "Indeterminate";

const SizeInPixels: ReadonlyRecord<CheckboxSize, number> =
    Object.freeze({
        ExtraSmall: 13,
        Medium: 16,
        Small: 14
    } as const);

/** {@inheritDoc Checkbox} */
export interface CheckboxProps
{
    readonly Checked?: CheckedState;
    readonly OnCheckedChange?: (Checked: boolean) => void;
    readonly Size?: CheckboxSize;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string;
}

export/**
       * An accessible checkbox control that supports checked, unchecked, and indeterminate states.
       *
       * @category Component
       * @since 1.0.0
       */
const Checkbox = ({
    Checked = false,
    OnCheckedChange,
    Size = "Medium",
    Disabled = false,
    Style,
    AccessibilityLabel
}: CheckboxProps): React.JSX.Element =>
{
    const {
        [Semantic.BorderButton]: BorderButtonColor,
        [Semantic.Blue]: BlueColor
    } = useToken(
        Semantic.BorderButton,
        Semantic.Blue
    );

    const IsChecked = Checked === true;
    const IsIndeterminate = Checked === "Indeterminate";
    const IsFilled = IsChecked || IsIndeterminate;
    const Dimension = SizeInPixels[ Size ];

    return (
        <Pressable
            Accessibility={ {
                Label: AccessibilityLabel,
                Role: "checkbox",
                State: { checked: IsIndeterminate ? "mixed" : IsChecked, disabled: Disabled }
            } }
            Disabled={ Disabled }
            OnPress={ () => OnCheckedChange?.(!IsChecked) }
            hitSlop={ 8 }
            style={ [
                {
                    alignItems: "center",
                    backgroundColor: IsFilled ? BlueColor : "transparent",
                    borderColor: BorderButtonColor,
                    borderRadius: Size === "ExtraSmall" ? 2 : 3,
                    borderWidth: IsFilled ? 0 : 1,
                    height: Dimension,
                    justifyContent: "center",
                    opacity: Disabled ? 0.5 : 1,
                    width: Dimension
                },
                Style
            ] }>
            { IsIndeterminate
                ? <Minus
                    color="#FFFFFF"
                    size={ Dimension * 0.7 }
                    strokeWidth={ 3 }
                />
                : IsChecked
                    ? <Check
                        color="#FFFFFF"
                        size={ Dimension * 0.8 }
                        strokeWidth={ 3 }
                    />
                    : null }
        </Pressable>
    );
};
