/**
 * Ported from `@notion-kit/ui`'s `primitives/combobox.tsx`. Source's
 * `Combobox` is a searchable multi/single-select with removable "chip"
 * tokens (`ComboboxChips`/`ComboboxChip`); the chips/multi-select variant
 * was trimmed here — `TagsInput.tsx` already covers free-form multi-tag
 * entry, and a searchable *single*-select is the remaining, distinct use
 * case this file covers: `Select` (tap a fixed short list) plus a search
 * box, built on `Autocomplete.tsx`'s engine the same way `Command.tsx` is.
 *
 * @module @notivex/ui/Primitive/Combobox
 *
 * @file      Combobox.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    Autocomplete,
    type AutocompleteFilter,
    AutocompleteItem,
    type AutocompleteItemProps,
    useAutocompleteContext
} from "./Autocomplete.js";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { UseColor, useRadii } from "../ThemeProvider.js";
import { Body } from "./Text.js";
import { ChevronDown } from "lucide-react-native";
import { MenuItemCheck } from "./Menu.js";

export {
    AutocompleteContent as ComboboxContent,
    AutocompleteEmpty as ComboboxEmpty,
    AutocompleteGroup as ComboboxGroup,
    AutocompleteInput as ComboboxInput,
    AutocompleteLabel as ComboboxLabel,
    AutocompleteList as ComboboxList,
    AutocompleteSeparator as ComboboxSeparator
} from "./Autocomplete.js";

interface ComboboxValueContextValue
{
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
    readonly Labels: React.RefObject<Map<string, string>>;
    readonly BumpVersion: () => void;
}

const ComboboxValueContext = React.createContext<ComboboxValueContextValue | undefined>(undefined);

const useComboboxValueContext = (): ComboboxValueContextValue =>
{
    const Value = React.useContext(ComboboxValueContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Combobox` part was used outside of `<Combobox>`.");
    }

    return Value;
};

/** {@inheritDoc Combobox} */
export interface ComboboxProps extends React.PropsWithChildren
{
    readonly Value?: string;
    readonly DefaultValue?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Filter?: AutocompleteFilter;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const Combobox = ({
    Value,
    DefaultValue,
    OnValueChange,
    Filter,
    children
}: ComboboxProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;
    const Labels = React.useRef(new Map<string, string>());
    const [ , SetVersion ] = React.useState(0);
    const BumpVersion = React.useCallback(() => SetVersion((V: number) => V + 1), [ ]);

    const HandleValueChange = React.useCallback((NextValue: string) =>
    {
        SetUncontrolledValue(NextValue);
        OnValueChange?.(NextValue);
    }, [ OnValueChange ]);

    const ContextValue = React.useMemo<ComboboxValueContextValue>(() => ({
        BumpVersion,
        Labels,
        OnValueChange: HandleValueChange,
        Value: CurrentValue
    }), [ CurrentValue, HandleValueChange, BumpVersion ]);

    return (
        <ComboboxValueContext.Provider value={ ContextValue }>
            <Autocomplete { ...{ Filter } }>
                { children }
            </Autocomplete>
        </ComboboxValueContext.Provider>
    );
};

/** {@inheritDoc ComboboxTrigger} */
export interface ComboboxTriggerProps extends React.PropsWithChildren
{
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const ComboboxTrigger = ({ Disabled = false, Style, children }: ComboboxTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useAutocompleteContext();
    const RingColor = UseColor(Semantic.Ring);
    const MutedColor = UseColor(Semantic.Muted);
    const MediumRadius = useRadii(Radii.Medium);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled, expanded: IsOpen } }
            disabled={ Disabled }
            onPress={ () => SetIsOpen(!IsOpen) }
            ref={ AnchorRef }
            style={ [
                {
                    alignItems: "center",
                    borderColor: RingColor,
                    borderRadius: MediumRadius,
                    borderWidth: 1,
                    flexDirection: "row",
                    height: 28,
                    minWidth: 0,
                    paddingHorizontal: 8
                },
                Disabled ? { opacity: 0.3 } : undefined,
                Style
            ] }>
            { children }
            <ChevronDown
                color={ MutedColor }
                size={ 14 }
                style={ { marginLeft: "auto" } }
            />
        </Pressable>
    );
};

/** {@inheritDoc ComboboxValue} */
export interface ComboboxValueProps
{
    readonly Placeholder?: string;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const ComboboxValue = ({ Placeholder }: ComboboxValueProps): React.JSX.Element =>
{
    const { Value, Labels } = useComboboxValueContext();
    const MutedColor = UseColor(Semantic.Muted);
    const Label = Value === undefined ? undefined : Labels.current.get(Value);

    return (
        <Body
            Color={ Label === undefined ? MutedColor : undefined }
            NumberOfLines={ 1 }
            Style={ { flexShrink: 1 } }>
            { Label ?? Placeholder ?? "" }
        </Body>
    );
};

/** {@inheritDoc ComboboxItem} */
export interface ComboboxItemProps extends Omit<AutocompleteItemProps, "OnSelect">
{
    readonly HideCheck?: boolean;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const ComboboxItem = ({
    Value,
    Label,
    HideCheck = false,
    children,
    ...Rest
}: ComboboxItemProps): React.JSX.Element | null =>
{
    const { Value: SelectedValue, OnValueChange, Labels, BumpVersion } = useComboboxValueContext();
    const { SetIsOpen, SetQuery } = useAutocompleteContext();
    const IsSelected = SelectedValue === Value;

    React.useEffect(() =>
    {
        Labels.current.set(Value, Label ?? Value);
        BumpVersion();

        return () =>
        {
            Labels.current.delete(Value);
            BumpVersion();
        };
    }, [ Value, Label, Labels, BumpVersion ]);

    return (
        <AutocompleteItem
            { ...{ ...Rest, Label, Value } }
            OnSelect={ () =>
            {
                OnValueChange?.(Value);
                SetIsOpen(false);
                SetQuery("");
            } }>
            { !HideCheck && IsSelected && <MenuItemCheck /> }
            { children }
        </AutocompleteItem>
    );
};
