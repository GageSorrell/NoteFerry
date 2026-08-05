/**
 * Ported from `@notion-kit/ui`'s `primitives/radio-group.tsx`. Source built
 * this on `@base-ui/react/radio-group`'s context; reimplemented here with a
 * plain `React.Context` since RN has no equivalent.
 *
 * @module @notivex/ui/Primitive/RadioGroup
 *
 * @file      RadioGroup.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";

interface RadioGroupContextValue {
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
    readonly Disabled?: boolean | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

export interface RadioGroupProps {
    readonly Value?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const RadioGroup = ({ Value, OnValueChange, Disabled, Style, children }: RadioGroupProps): React.JSX.Element =>
{
    const ContextValue = React.useMemo<RadioGroupContextValue>(
        () => ({ Value, OnValueChange, Disabled }),
        [ Value, OnValueChange, Disabled ],
    );

    return (
        <RadioGroupContext.Provider value={ ContextValue }>
            <View accessibilityRole="radiogroup" style={ [ { gap: 8, width: "100%" }, Style ] }>
                { children }
            </View>
        </RadioGroupContext.Provider>
    );
};

export interface RadioGroupItemProps {
    readonly Value: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export const RadioGroupItem = ({ Value: ItemValue, Disabled: ItemDisabled, Style }: RadioGroupItemProps): React.JSX.Element =>
{
    const Context = React.useContext(RadioGroupContext);

    if (Context === undefined)
    {
        throw new Error("[@notivex/ui] `RadioGroupItem` must be used inside `<RadioGroup>`.");
    }

    const BorderColor = UseColor(Semantic.Border);
    const BlueColor = UseColor(Semantic.Blue);

    const IsChecked = Context.Value === ItemValue;
    const IsDisabled = ItemDisabled ?? Context.Disabled ?? false;

    return (
        <Pressable
            disabled={ IsDisabled }
            onPress={ () => Context.OnValueChange?.(ItemValue) }
            accessibilityRole="radio"
            accessibilityState={ { checked: IsChecked, disabled: IsDisabled } }
            hitSlop={ 8 }
            style={ [
                {
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: IsChecked ? 0 : 1,
                    borderColor: BorderColor,
                    backgroundColor: IsChecked ? BlueColor : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: IsDisabled ? 0.5 : 1,
                },
                Style,
            ] }
        >
            { IsChecked ? <View style={ { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" } } /> : null }
        </Pressable>
    );
};
