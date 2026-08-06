/**
 * Ported from `@notion-kit/ui`'s `primitives/tabs.tsx`, built on plain RN
 * `Pressable`/`View` instead of `@base-ui/react/tabs` (which has no RN
 * analogue). Single-value, non-generic (`TabValue` is always `string`,
 * matching the rest of this library's controlled-value primitives, e.g.
 * `Select`/`RadioGroup`) — source's `TabValue` generic parameter wasn't
 * carried over.
 *
 * @module @notivex/ui/Primitive/Tabs
 *
 * @file      Tabs.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    Pressable,
    type StyleProp,
    View,
    type ViewStyle
} from "react-native";
import { LabelText } from "./Text.js";
import { UseColor } from "../ThemeProvider.js";

interface TabsContextValue
{
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = (): TabsContextValue =>
{
    const Value = React.useContext(TabsContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Tabs` part was used outside of `<Tabs>`.");
    }

    return Value;
};

/** {@inheritDoc Tabs} */
export interface TabsProps extends React.PropsWithChildren
{
    readonly Value?: string;
    readonly DefaultValue?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Navigable tabs.
       *
       * @category Component
       * @since 1.0.0
       */
const Tabs = ({
    Value,
    DefaultValue,
    OnValueChange,
    Style,
    children
}: TabsProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;

    const HandleValueChange = React.useCallback((NextValue: string) =>
    {
        SetUncontrolledValue(NextValue);
        OnValueChange?.(NextValue);
    }, [ OnValueChange ]);

    const ContextValue = React.useMemo<TabsContextValue>(() => ({
        OnValueChange: HandleValueChange,
        Value: CurrentValue
    }), [ CurrentValue, HandleValueChange ]);

    return (
        <TabsContext.Provider value={ ContextValue }>
            <View style={ Style }>{ children }</View>
        </TabsContext.Provider>
    );
};

/** {@inheritDoc TabsList} */
export interface TabsListProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A list of navigable tabs.
       *
       * @category Component
       * @since 1.0.0
       */
const TabsList = ({ Style, children }: TabsListProps): React.JSX.Element =>
{
    const BorderColor = UseColor(Semantic.Border);

    return (
        <View
            accessibilityRole="tablist"
            style={ [
                {
                    alignItems: "center",
                    borderBottomColor: BorderColor,
                    borderBottomWidth: 1,
                    flexDirection: "row",
                    height: 40
                },
                Style
            ] }>
            { children }
        </View>
    );
};

/** {@inheritDoc TabsTrigger} */
export interface TabsTriggerProps extends React.PropsWithChildren
{
    readonly Value: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A trigger to prompt the user to select a tab to navigate to.
       *
       * @category Component
       * @since 1.0.0
       */
const TabsTrigger = ({ Value, Disabled = false, Style, children }: TabsTriggerProps): React.JSX.Element =>
{
    const { Value: ActiveValue, OnValueChange } = useTabsContext();
    const IsActive = ActiveValue === Value;
    const PrimaryColor = UseColor(Semantic.Primary);
    const MutedColor = UseColor(Semantic.Muted);

    return (
        <Pressable
            accessibilityRole="tab"
            accessibilityState={ { disabled: Disabled, selected: IsActive } }
            disabled={ Disabled }
            onPress={ () => OnValueChange?.(Value) }
            style={ [
                {
                    borderBottomColor: IsActive ? PrimaryColor : "transparent",
                    borderBottomWidth: 2,
                    height: 36,
                    justifyContent: "center",
                    marginRight: 4,
                    paddingHorizontal: 8
                },
                Disabled ? { opacity: 0.5 } : undefined,
                Style
            ] }>
            { typeof children === "string"
                ? <LabelText
                    Color={ IsActive ? PrimaryColor : MutedColor }
                    Weight="500">
                    { children }
                </LabelText>
                : children
            }
        </Pressable>
    );
};

/** {@inheritDoc TabsContent} */
export interface TabsContentProps extends React.PropsWithChildren
{
    readonly Value: string;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Content within a tab.
       *
       * @category Component
       * @since 1.0.0
       */
const TabsContent = ({ Value, Style, children }: TabsContentProps): React.JSX.Element | null =>
{
    const { Value: ActiveValue } = useTabsContext();

    if (ActiveValue !== Value)
    {
        return null;
    }

    return <View style={ [ { flex: 1 }, Style ] }>{ children }</View>;
};
