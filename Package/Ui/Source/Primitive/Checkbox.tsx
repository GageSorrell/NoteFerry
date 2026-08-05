/**
 * Ported from `@notion-kit/ui`'s `primitives/checkbox.tsx`.
 *
 * @module @notivex/ui/Primitive/Checkbox
 *
 * @file      Checkbox.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Check, Minus } from "lucide-react-native";
import * as React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";

export type CheckboxSize = "Medium" | "Small" | "ExtraSmall";
export type CheckedState = boolean | "Indeterminate";

const SizeInPixels: Record<CheckboxSize, number> = { Medium: 16, Small: 14, ExtraSmall: 13 };

export interface CheckboxProps {
    readonly Checked?: CheckedState;
    readonly OnCheckedChange?: (Checked: boolean) => void;
    readonly Size?: CheckboxSize;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AccessibilityLabel?: string;
}

export const Checkbox = ({
    Checked = false,
    OnCheckedChange,
    Size = "Medium",
    Disabled = false,
    Style,
    AccessibilityLabel,
}: CheckboxProps): React.JSX.Element =>
{
    const BorderButtonColor = UseColor(Semantic.BorderButton);
    const BlueColor = UseColor(Semantic.Blue);

    const IsChecked = Checked === true;
    const IsIndeterminate = Checked === "Indeterminate";
    const IsFilled = IsChecked || IsIndeterminate;
    const Dimension = SizeInPixels[ Size ];

    return (
        <Pressable
            disabled={ Disabled }
            onPress={ () => OnCheckedChange?.(!IsChecked) }
            accessibilityRole="checkbox"
            accessibilityLabel={ AccessibilityLabel }
            accessibilityState={ { checked: IsIndeterminate ? "mixed" : IsChecked, disabled: Disabled } }
            hitSlop={ 8 }
            style={ [
                {
                    width: Dimension,
                    height: Dimension,
                    borderRadius: Size === "ExtraSmall" ? 2 : 3,
                    borderWidth: IsFilled ? 0 : 1,
                    borderColor: BorderButtonColor,
                    backgroundColor: IsFilled ? BlueColor : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: Disabled ? 0.5 : 1,
                },
                Style,
            ] }
        >
            { IsIndeterminate
                ? <Minus size={ Dimension * 0.7 } color="#FFFFFF" strokeWidth={ 3 } />
                : IsChecked
                    ? <Check size={ Dimension * 0.8 } color="#FFFFFF" strokeWidth={ 3 } />
                    : null }
        </Pressable>
    );
};
