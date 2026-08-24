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

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { MakeStyles, TextStyle as MakeTextStyle, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import { Search, X } from "lucide-react-native";
import {
    type StyleProp,
    TextInput,
    type TextInputProps,
    type TextStyle,
    View,
    type ViewStyle
} from "react-native";
import { Pressable } from "./Pressable.js";
import type { Thunk } from "@sorrell/effect/Function";
import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

/**
 * The visual style of a given `Input` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type InputVariant =
    | "Default"
    | "Plain"
    | "Flat";

/**
 * The size of a given `Input` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type InputSize =
    | "Default"
    | "Large";

/** {@inheritDoc Input} */
export interface InputProps
{
    readonly Variant?: InputVariant;
    readonly Size?: InputSize;
    readonly Value?: string;
    readonly Placeholder?: string;
    readonly KeyboardType?: TextInputProps[ "keyboardType" ];
    readonly OnChangeText?: (Text: string) => void;
    readonly Disabled?: boolean;
    readonly Invalid?: boolean;
    readonly Search?: boolean;
    readonly Clear?: boolean;
    readonly OnCancel?: Thunk;
    readonly EndIcon?: React.ReactNode;
    readonly SecureTextEntry?: boolean;
    readonly Style?: StyleProp<ViewStyle>;

    /**
     * Overrides the value text's style — e.g. a larger `FontSize`/`LineHeight`
     * to match another component. `Style` above only reaches the outer
     * container.
     */
    readonly TextStyle?: StyleProp<TextStyle>;
    readonly AutoFocus?: boolean | undefined;
    readonly OnSubmitEditing?: TextInputProps[ "onSubmitEditing" ];
    readonly OnFocus?: TextInputProps[ "onFocus" ];
    readonly OnBlur?: TextInputProps[ "onBlur" ];
}

const HeightBySize: Record<InputSize, number> = { Default: 28, Large: 34 };
const FontSizeBySize: Record<InputSize, number> = { Default: 14, Large: 15 };

export/**
       * A themed text input with optional search, clear, trailing-icon, validation, and size treatments.
       *
       * @category Component
       * @since 1.0.0
       */
const Input = ({
    Variant = "Default",
    Size = "Default",
    Value,
    Placeholder,
    KeyboardType,
    OnChangeText,
    Disabled = false,
    Invalid = false,
    Search: ShowSearch = false,
    Clear = false,
    OnCancel,
    EndIcon,
    SecureTextEntry,
    Style,
    TextStyle: TextStyleOverride,
    AutoFocus,
    OnSubmitEditing,
    OnFocus,
    OnBlur
}: InputProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Semantic.Ring]: RingColor,
        [Semantic.BackgroundInput]: InputBackground,
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Muted]: MutedColor,
        [Semantic.Red]: RedColor,
        [Semantic.Cursor]: CursorColor,
        [Radii.Medium]: MediumRadius
    } = useToken(
        Semantic.Ring,
        Semantic.BackgroundInput,
        Semantic.Primary,
        Semantic.Muted,
        Semantic.Red,
        Semantic.Cursor,
        Radii.Medium
    );

    const ShowClear = Clear && !Disabled && typeof Value === "string" && Value.length > 0;

    const ContainerStyle: ViewStyle = {
        backgroundColor: Variant === "Flat" ? "transparent" : InputBackground,
        borderColor: Invalid ? WithAlpha(RedColor, 0.5) : RingColor,
        borderRadius: MediumRadius,
        borderWidth: Variant === "Flat" ? 0 : 1,
        height: HeightBySize[ Size ]
    };

    return (
        <View style={ [ Styles.Container, ContainerStyle, Style ] }>
            { ShowSearch
                ? <Search
                    color={ MutedColor }
                    size={ 14 }
                    style={ Styles.LeadingIcon }
                />
                : null
            }
            <TextInput
                autoFocus={ AutoFocus }
                cursorColor={ CursorColor }
                editable={ !Disabled }
                keyboardType={ KeyboardType }
                onBlur={ OnBlur }
                onChangeText={ OnChangeText }
                onFocus={ OnFocus }
                onSubmitEditing={ OnSubmitEditing }
                placeholder={ Placeholder }
                placeholderTextColor={ WithAlpha(PrimaryColor, 0.45) }
                secureTextEntry={ SecureTextEntry }
                selectionColor={ CursorColor }
                style={ [
                    Styles.Input,
                    {
                        color: PrimaryColor,
                        fontSize: FontSizeBySize[Size],
                        opacity: Disabled ? 0.5 : 1
                    },
                    TextStyleOverride
                ] }
                value={ Value }
            />
            { ShowClear
                ? <Pressable
                    Accessibility={ {
                        Label: "Clear input",
                        Role: "button"
                    } }
                    OnPress={ OnCancel }
                    hitSlop={ 8 }
                    style={ Styles.TrailingIcon }>
                    <X
                        color={ MutedColor }
                        size={ 14 }
                    />
                </Pressable>
                : null }
            { EndIcon ? <View style={ Styles.TrailingIcon }>{ EndIcon }</View> : null }
        </View>
    );
};

const useStyles = MakeStyles({
    Container: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 8,
        width: "100%"
    }),
    Input: MakeTextStyle({
        flex: 1,
        /* Every value rendered through `@notivex/ui`'s `Text` primitives
         * (Body, PropertyLabel, the picker pills' "Empty" state, …) renders
         * in Inter — but a bare RN `TextInput` has no font applied by
         * default, so it silently falls back to the OS system font (SF Pro
         * / Roboto). At the same nominal `fontSize`, that fallback's metrics
         * read visibly smaller than Inter, which is what made the "Empty"
         * placeholder in Input-based fields look undersized next to
         * Text-based ones despite matching point sizes. */
        fontFamily: "Inter_400Regular",
        margin: 0,
        padding: 0,
        /* Android's `TextInput` defaults to top-aligned text regardless of
         * the row's `alignItems: "center"` — without this it sits visibly
         * above center whenever the box is taller than one text line. iOS
         * already centers by default, so this is a no-op there. */
        textAlignVertical: "center"
    }),
    LeadingIcon: MakeViewStyle({
        marginRight: 6
    }),
    TrailingIcon: MakeViewStyle({
        marginLeft: 6
    })
});
