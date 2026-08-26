/**
 * Ported from `@notion-kit/ui`'s `primitives/radio-group.tsx`. Source built
 * this on `@base-ui/react/radio-group`'s context; reimplemented here with a
 * plain `React.Context` since RN has no equivalent.
 *
 * @module @noteferry/ui/Primitive/RadioGroup
 *
 * @file      RadioGroup.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { Pressable } from "./Pressable.js";
import { useToken } from "../ThemeProvider.js";

interface RadioGroupContextValue
{
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
    readonly Disabled?: boolean | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

/** {@inheritDoc RadioGroup} */
export interface RadioGroupProps extends React.PropsWithChildren
{
    readonly Value?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A group of items from which at most one item may be selected.
       *
       * @category Component
       * @since 1.0.0
       */
const RadioGroup = ({
    Value,
    OnValueChange,
    Disabled,
    Style,
    children
}: RadioGroupProps): React.JSX.Element =>
{
    const ContextValue = React.useMemo<RadioGroupContextValue>(
        () => ({ Disabled, OnValueChange, Value }),
        [ Disabled, OnValueChange, Value ]
    );

    return (
        <RadioGroupContext.Provider value={ ContextValue }>
            <View
                accessibilityRole="radiogroup"
                style={ [ { gap: 8, width: "100%" }, Style ] }>
                { children }
            </View>
        </RadioGroupContext.Provider>
    );
};

/** {@inheritDoc RadioGroupItem} */
export interface RadioGroupItemProps
{
    readonly Value: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * An item in a `RadioGroup`.
       *
       * @category Component
       * @since 1.0.0
       */
const RadioGroupItem = ({
    Value: ItemValue,
    Disabled: ItemDisabled,
    Style
}: RadioGroupItemProps): React.JSX.Element =>
{
    const Context = React.useContext(RadioGroupContext);

    if (Context === undefined)
    {
        throw new Error("[@noteferry/ui] `RadioGroupItem` must be used inside `<RadioGroup>`.");
    }

    const {
        [Semantic.Border]: BorderColor,
        [Semantic.Blue]: BlueColor
    } = useToken(
        Semantic.Border,
        Semantic.Blue
    );

    const IsChecked = Context.Value === ItemValue;
    const IsDisabled = ItemDisabled ?? Context.Disabled ?? false;

    return (
        <Pressable
            Accessibility={ {
                Label: undefined,
                Role: "radio",
                State: { checked: IsChecked, disabled: IsDisabled }
            } }
            Disabled={ IsDisabled }
            OnPress={ () => Context.OnValueChange?.(ItemValue) }
            hitSlop={ 8 }
            style={ [
                {
                    alignItems: "center",
                    backgroundColor: IsChecked ? BlueColor : "transparent",
                    borderColor: BorderColor,
                    borderRadius: 9,
                    borderWidth: IsChecked ? 0 : 1,
                    height: 18,
                    justifyContent: "center",
                    opacity: IsDisabled ? 0.5 : 1,
                    width: 18
                },
                Style
            ] }>
            { IsChecked ? <View style={ {
                backgroundColor: "#FFFFFF",
                borderRadius: 4,
                height: 8,
                width: 8
            } } /> : null }
        </Pressable>
    );
};
