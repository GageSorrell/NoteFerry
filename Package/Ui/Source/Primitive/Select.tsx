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
 * @module @noteferry/ui/Primitive/Select
 *
 * @file      Select.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { MenuItem, MenuItemCheck, type MenuItemProps } from "./Menu.js";
import { Popup, type PopupAnchor, type PopupPlacement } from "./Popup.js";
import { ScrollView, type StyleProp, type ViewStyle } from "react-native";
export { MenuGroup as SelectGroup, MenuLabel as SelectLabel } from "./Menu.js";
import { Body } from "./Text.js";
import { ChevronDown } from "../Icon.js";
import { NoteFerryUiError } from "../NoteFerryUiError.js";
import { Pressable } from "./Pressable.js";
import type { Thunk } from "@sorrell/effect/Function";
import { useToken } from "../ThemeProvider.js";

export { Separator as SelectSeparator } from "./Separator.js";

interface SelectContextValue
{
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Value: string) => void) | undefined;
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
    readonly Labels: React.RefObject<Map<string, string>>;
    readonly BumpVersion: Thunk;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = (): SelectContextValue =>
{
    const Value = React.useContext(SelectContext);

    if (Value === undefined)
    {
        throw new NoteFerryUiError("A Select part was used outside of Select.");
    }

    return Value;
};

/** {@inheritDoc Select} */
export interface SelectProps extends React.PropsWithChildren
{
    readonly Value?: string;
    readonly DefaultValue?: string;
    readonly OnValueChange?: (Value: string) => void;
    readonly Open?: boolean;
    readonly DefaultOpen?: boolean;
    readonly OnOpenChange?: (Open: boolean) => void;
}

export/**
       * Choose an item from a given list.
       *
       * @category Component
       * @since 1.0.0
       */
const Select = ({
    Value,
    DefaultValue,
    OnValueChange,
    Open,
    DefaultOpen = false,
    OnOpenChange,
    children
}: SelectProps): React.JSX.Element =>
{
    const [ UncontrolledValue, SetUncontrolledValue ] = React.useState(DefaultValue);
    const CurrentValue = Value ?? UncontrolledValue;
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;
    const AnchorRef = React.useRef<React.Component>(null);
    const Labels = React.useRef(new Map<string, string>());
    const [ , SetVersion ] = React.useState(0);
    const BumpVersion = React.useCallback(() => SetVersion((V: number) => V + 1), [ ]);

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
        AnchorRef,
        BumpVersion,
        IsOpen,
        Labels,
        OnValueChange: HandleValueChange,
        SetIsOpen,
        Value: CurrentValue
    }), [ CurrentValue, HandleValueChange, IsOpen, SetIsOpen, BumpVersion ]);

    return <SelectContext.Provider value={ ContextValue }>{ children }</SelectContext.Provider>;
};

/** {@inheritDoc SelectTrigger} */
export interface SelectTriggerProps extends React.PropsWithChildren
{
    readonly AccessibilityLabel?: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A trigger to prompt the user to select an item via an associated `Select` component.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectTrigger = ({
    AccessibilityLabel,
    Disabled = false,
    Style,
    children
}: SelectTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useSelectContext();
    const {
        [Semantic.Ring]: RingColor,
        [Semantic.Muted]: MutedColor,
        [Radii.Medium]: MediumRadius
    } = useToken(
        Semantic.Ring,
        Semantic.Muted,
        Radii.Medium
    );

    return (
        <Pressable
            Accessibility={ {
                Label: AccessibilityLabel,
                Role: "button",
                State: { disabled: Disabled, expanded: IsOpen }
            } }
            Disabled={ Disabled }
            OnPress={ () => SetIsOpen(!IsOpen) }
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
            ] }
        >
            { children }
            <ChevronDown
                color={ MutedColor }
                size={ 14 }
                style={ { marginLeft: "auto" } }
            />
        </Pressable>
    );
};

/** {@inheritDoc SelectValue} */
export interface SelectValueProps
{
    readonly Placeholder?: string;
}

export/**
       * The representation of a selected item.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectValue = ({ Placeholder }: SelectValueProps): React.JSX.Element =>
{
    const { Value, Labels } = useSelectContext();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);
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

/** {@inheritDoc SelectContent} */
export interface SelectContentProps extends React.PropsWithChildren
{
    readonly MatchTriggerWidth?: boolean;
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * The representation of an item that can be selected by the user.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectContent = ({
    MatchTriggerWidth = true,
    Placement = "Bottom",
    Style,
    children
}: SelectContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useSelectContext();

    return (
        <Popup
            Anchor={ AnchorRef }
            IsVisible={ IsOpen }
            MatchAnchorWidth={ MatchTriggerWidth }
            OnRequestClose={ () => SetIsOpen(false) }
            Placement={ Placement }
            Style={ [ { minWidth: 144 }, Style ] }>
            <ScrollView
                contentContainerStyle={ { paddingVertical: 4 } }
                style={ { maxHeight: 320 } }>
                { children }
            </ScrollView>
        </Popup>
    );
};

/** {@inheritDoc SelectItem} */
export interface SelectItemProps extends Omit<MenuItemProps, "OnPress" | "Label">
{
    readonly Value: string;
    readonly Label: string;
    readonly DisplayLabel?: React.ReactNode;
    readonly HideCheck?: boolean;
}

export/**
       * A selectable option that registers its label, updates the `Select`
       * value, and optionally displays a check mark.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectItem = ({
    Value,
    Label,
    DisplayLabel,
    HideCheck = false,
    children,
    ...Rest
}: SelectItemProps): React.JSX.Element =>
{
    const {
        BumpVersion,
        Labels,
        OnValueChange,
        Value: SelectedValue,
        SetIsOpen
    } = useSelectContext();

    const IsSelected = SelectedValue === Value;

    React.useEffect(() =>
    {
        Labels.current.set(Value, Label);
        BumpVersion();

        return () =>
        {
            /* eslint-disable-next-line react-hooks/exhaustive-deps */
            Labels.current.delete(Value);
            BumpVersion();
        };
    }, [ Value, Label, Labels, BumpVersion ]);

    return (
        <MenuItem
            { ...Rest }
            AccessibilityLabel={ Label }
            Label={ DisplayLabel ?? Label }
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
