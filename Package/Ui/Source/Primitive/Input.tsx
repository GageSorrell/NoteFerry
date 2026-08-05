/**
 * Ported from `@notion-kit/ui`'s `primitives/input.tsx`. Search/clear icons
 * use `lucide-react-native` directly (matching source's `@notion-kit/icons`,
 * itself a thin `lucide-react` wrapper) — the fuller `IconBlock`/`IconMenu`
 * abstraction is ported later, in Phase 4.
 *
 * @module @notivex/ui/Primitive/Input
 *
 * @file      Input.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Search, X } from "lucide-react-native";
import * as React from "react";
import {
    Pressable,
    type StyleProp,
    StyleSheet,
    TextInput,
    type TextInputProps,
    View,
    type ViewStyle,
} from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

export type InputVariant = "Default" | "Plain" | "Flat";
export type InputSize = "Default" | "Large";

export interface InputProps {
    readonly Variant?: InputVariant;
    readonly Size?: InputSize;
    readonly Value?: string;
    readonly Placeholder?: string;
    readonly OnChangeText?: (Text: string) => void;
    readonly Disabled?: boolean;
    readonly Invalid?: boolean;
    readonly Search?: boolean;
    readonly Clear?: boolean;
    readonly OnCancel?: () => void;
    readonly EndIcon?: React.ReactNode;
    readonly SecureTextEntry?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly AutoFocus?: boolean;
    readonly OnSubmitEditing?: TextInputProps[ "onSubmitEditing" ];
}

const HeightBySize: Record<InputSize, number> = { Default: 28, Large: 34 };
const FontSizeBySize: Record<InputSize, number> = { Default: 14, Large: 15 };

export const Input = ({
    Variant = "Default",
    Size = "Default",
    Value,
    Placeholder,
    OnChangeText,
    Disabled = false,
    Invalid = false,
    Search: ShowSearch = false,
    Clear = false,
    OnCancel,
    EndIcon,
    SecureTextEntry,
    Style,
    AutoFocus,
    OnSubmitEditing,
}: InputProps): React.JSX.Element =>
{
    const RingColor = UseColor(Semantic.Ring);
    const InputBackground = UseColor(Semantic.BackgroundInput);
    const PrimaryColor = UseColor(Semantic.Primary);
    const MutedColor = UseColor(Semantic.Muted);
    const RedColor = UseColor(Semantic.Red);
    const MediumRadius = useRadii(Radii.Medium);

    const ShowClear = Clear && !Disabled && typeof Value === "string" && Value.length > 0;

    const ContainerStyle: ViewStyle = {
        height: HeightBySize[ Size ],
        borderRadius: MediumRadius,
        backgroundColor: Variant === "Flat" ? "transparent" : InputBackground,
        borderWidth: Variant === "Flat" ? 0 : 1,
        borderColor: Invalid ? WithAlpha(RedColor, 0.5) : RingColor,
    };

    return (
        <View style={ [ Styles.Container, ContainerStyle, Style ] }>
            { ShowSearch ? <Search size={ 14 } color={ MutedColor } style={ Styles.LeadingIcon } /> : null }
            <TextInput
                value={ Value }
                onChangeText={ OnChangeText }
                placeholder={ Placeholder }
                placeholderTextColor={ WithAlpha(PrimaryColor, 0.45) }
                editable={ !Disabled }
                secureTextEntry={ SecureTextEntry }
                autoFocus={ AutoFocus }
                onSubmitEditing={ OnSubmitEditing }
                style={ [
                    Styles.Input,
                    { color: PrimaryColor, fontSize: FontSizeBySize[ Size ], opacity: Disabled ? 0.5 : 1 },
                ] }
            />
            { ShowClear
                ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Clear input" onPress={ OnCancel } hitSlop={ 8 } style={ Styles.TrailingIcon }>
                        <X size={ 14 } color={ MutedColor } />
                    </Pressable>
                )
                : null }
            { EndIcon ? <View style={ Styles.TrailingIcon }>{ EndIcon }</View> : null }
        </View>
    );
};

const Styles = StyleSheet.create({
    Container: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 8,
    },
    Input: {
        flex: 1,
        padding: 0,
        margin: 0,
    },
    LeadingIcon: {
        marginRight: 6,
    },
    TrailingIcon: {
        marginLeft: 6,
    },
});
