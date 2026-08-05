/**
 * Ported from `@notion-kit/ui`'s `primitives/select.tsx`, built on
 * `Popup.tsx` + `Menu.tsx` instead of `@base-ui/react/select`. Per the port
 * plan, this is the one general-purpose implementation (not a parallel
 * native-picker path) — `@expo/ui`'s native `Picker` remains available as
 * a manual escape hatch for call sites that specifically want the OS
 * picker UI, but isn't wired in here.
 *
 * Source's `SelectValue` reads the selected item's label straight out of
 * `@base-ui/react`'s internal store; there's no RN equivalent, so
 * `SelectItem` registers its own `(Value, Label)` pair into a small
 * registry (a `ref` + a version counter to force `SelectValue` to
 * re-render) on mount instead.
 *
 * @module @notivex/ui/Primitive/Select
 *
 * @file      Select.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ChevronDown } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, type StyleProp, type ViewStyle } from "react-native";

import { UseColor, useRadii } from "../ThemeProvider.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import { MenuItem, MenuItemCheck, type MenuItemProps } from "./Menu.js";
import { type PopupAnchor, type PopupPlacement, Popup } from "./Popup.js";
import { Text } from "./Text.js";

export { MenuGroup as SelectGroup, MenuLabel as SelectLabel } from "./Menu.js";
export { Separator as SelectSeparator } from "./Separator.js";

interface SelectContextValue {
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
    readonly Labels: React.RefObject<Map<string, string>>;
    readonly BumpVersion: () => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = (): SelectContextValue =>
{
    const Value = React.useContext(SelectContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Select` part was used outside of `<Select>`.");
    }

    return Value;
};

export interface SelectProps {
    readonly Value?: string;
    readonly DefaultValue?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
    readonly children?: React.ReactNode;
}

export const Select = ({
    Value,
    DefaultValue,
    OnValueChange,
    Open,
    DefaultOpen = false,
    OnOpenChange,
    children,
}: SelectProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;
    const AnchorRef = React.useRef<React.Component>(null);
    const Labels = React.useRef(new Map<string, string>());
    const [ , SetVersion ] = React.useState(0);
    const BumpVersion = React.useCallback(() => SetVersion((V) => V + 1), []);

    const HandleValueChange = React.useCallback((NextValue: string) =>
    {
        SetUncontrolledValue(NextValue);
        OnValueChange?.(NextValue);
    }, [ OnValueChange ]);

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<SelectContextValue>(() => ({
        Value: CurrentValue,
        OnValueChange: HandleValueChange,
        IsOpen,
        SetIsOpen,
        AnchorRef,
        Labels,
        BumpVersion,
    }), [ CurrentValue, HandleValueChange, IsOpen, SetIsOpen, BumpVersion ]);

    return <SelectContext.Provider value={ ContextValue }>{ children }</SelectContext.Provider>;
};

export interface SelectTriggerProps {
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const SelectTrigger = ({ Disabled = false, Style, children }: SelectTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useSelectContext();
    const RingColor = UseColor(Semantic.Ring);
    const MutedColor = UseColor(Semantic.Muted);
    const MediumRadius = useRadii(Radii.Medium);

    return (
        <Pressable
            ref={ AnchorRef }
            disabled={ Disabled }
            onPress={ () => SetIsOpen(!IsOpen) }
            accessibilityRole="button"
            accessibilityState={ { disabled: Disabled, expanded: IsOpen } }
            style={ [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    height: 28,
                    minWidth: 0,
                    paddingHorizontal: 8,
                    borderWidth: 1,
                    borderColor: RingColor,
                    borderRadius: MediumRadius,
                },
                Disabled ? { opacity: 0.3 } : undefined,
                Style,
            ] }
        >
            { children }
            <ChevronDown size={ 14 } color={ MutedColor } style={ { marginLeft: "auto" } } />
        </Pressable>
    );
};

export interface SelectValueProps {
    readonly Placeholder?: string;
}

export const SelectValue = ({ Placeholder }: SelectValueProps): React.JSX.Element =>
{
    const { Value, Labels } = useSelectContext();
    const MutedColor = UseColor(Semantic.Muted);
    const Label = Value === undefined ? undefined : Labels.current.get(Value);

    return (
        <Text Variant="Body" Color={ Label === undefined ? MutedColor : undefined } NumberOfLines={ 1 } Style={ { flexShrink: 1 } }>
            { Label ?? Placeholder ?? "" }
        </Text>
    );
};

export interface SelectContentProps {
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const SelectContent = ({ Placement = "Bottom", Style, children }: SelectContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useSelectContext();

    return (
        <Popup IsVisible={ IsOpen } OnRequestClose={ () => SetIsOpen(false) } Anchor={ AnchorRef } Placement={ Placement } Style={ [ { minWidth: 144 }, Style ] }>
            <ScrollView style={ { maxHeight: 320 } } contentContainerStyle={ { paddingVertical: 4 } }>
                { children }
            </ScrollView>
        </Popup>
    );
};

export interface SelectItemProps extends Omit<MenuItemProps, "OnPress" | "Label"> {
    readonly Value: string;
    readonly Label: string;
    readonly HideCheck?: boolean;
}

export const SelectItem = ({ Value, Label, HideCheck = false, children, ...Rest }: SelectItemProps): React.JSX.Element =>
{
    const { Value: SelectedValue, OnValueChange, SetIsOpen, Labels, BumpVersion } = useSelectContext();
    const IsSelected = SelectedValue === Value;

    React.useEffect(() =>
    {
        Labels.current.set(Value, Label);
        BumpVersion();

        return () =>
        {
            Labels.current.delete(Value);
            BumpVersion();
        };
    }, [ Value, Label, Labels, BumpVersion ]);

    return (
        <MenuItem
            { ...Rest }
            Label={ Label }
            OnPress={ () =>
            {
                OnValueChange?.(Value);
                SetIsOpen(false);
            } }
        >
            { !HideCheck && IsSelected && <MenuItemCheck /> }
            { children }
        </MenuItem>
    );
};
