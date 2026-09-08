/**
 * Windows variant of `Selectable.tsx`. Same long-press-to-enter,
 * tap-to-toggle multi-select idiom, but built on RN core `Pressable`'s own
 * `onLongPress`/`onPress` props directly instead of racing
 * `react-native-gesture-handler`'s `Gesture.LongPress()`/`Gesture.Tap()` —
 * functionally identical for this file's single-gesture-per-item use case,
 * and needs no gesture-handler root.
 *
 * @module @noteferry/ui/Primitive/Selectable
 *
 * @file      Selectable.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { Check } from "../Icon.js";
import type { Thunk } from "@sorrell/effect/Function";
import { useToken } from "../ThemeProvider.js";

interface SelectableContextValue
{
    readonly SelectedIds: ReadonlySet<string>;
    readonly IsActive: boolean;
    readonly Disabled: boolean;
    readonly Activate: (Id: string) => void;
    readonly Deactivate: Thunk;
    readonly Toggle: (Id: string) => void;
}

const SelectableContext = React.createContext<SelectableContextValue | undefined>(undefined);

const useSelectableContext = (): SelectableContextValue =>
{
    const Value = React.useContext(SelectableContext);

    if (Value === undefined)
    {
        throw new Error("[@noteferry/ui] A `Selectable` part was used outside of `<SelectableRoot>`.");
    }

    return Value;
};

/**
 * The selection state a `SelectableItem` needs to render itself — whether
 * it's currently selected, and whether selection mode is active at all
 * (useful for e.g. only showing a `SelectableCheckmark` slot once active).
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export interface SelectableItemState
{
    readonly IsSelected: boolean;
    readonly IsActive: boolean;
}

export/**
       * The selection state/actions for an individual item — the hook form of
       * what `SelectableItem` wires up to gestures internally. Use this
       * directly when an item's Press/LongPress handling can't go through
       * `SelectableItem`'s own `Pressable` wrapper.
       *
       * @category Component
       * @since 1.0.0
       */
const useSelectableItem = (
    Id: string
): SelectableItemState & Pick<SelectableContextValue, "Toggle" | "Activate"> =>
{
    const { SelectedIds, IsActive, Toggle, Activate } = useSelectableContext();

    return {
        Activate,
        IsActive,
        IsSelected: SelectedIds.has(Id),
        Toggle
    };
};

export/**
       * The selection state/actions for the whole `SelectableRoot` — the
       * "select all"/"clear"/"exit selection mode" surface a caller's toolbar
       * needs, as opposed to any one item's own state.
       *
       * @category Component
       * @since 1.0.0
       */
const useSelectable = (): Omit<SelectableContextValue, "Disabled"> =>
{
    const { SelectedIds, IsActive, Activate, Deactivate, Toggle } = useSelectableContext();

    return { Activate, Deactivate, IsActive, SelectedIds, Toggle };
};

/** {@inheritDoc SelectableRoot} */
export interface SelectableRootProps extends React.PropsWithChildren
{
    readonly SelectedIds?: ReadonlySet<string>;
    readonly DefaultSelectedIds?: ReadonlySet<string>;
    readonly OnSelectedIdsChange?: (SelectedIds: ReadonlySet<string>) => void;
    readonly Active?: boolean;
    readonly DefaultActive?: boolean;
    readonly OnActiveChange?: (Active: boolean) => void;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A container coordinating long-press-to-enter, tap-to-toggle multi-select
       * over its `SelectableItem` children.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectableRoot = ({
    SelectedIds,
    DefaultSelectedIds,
    OnSelectedIdsChange,
    Active,
    DefaultActive = false,
    OnActiveChange,
    Disabled = false,
    Style,
    children
}: SelectableRootProps): React.JSX.Element =>
{
    const [ UncontrolledSelectedIds, SetUncontrolledSelectedIds ] =
        React.useState<ReadonlySet<string>>(DefaultSelectedIds ?? new Set());
    const CurrentSelectedIds = SelectedIds ?? UncontrolledSelectedIds;

    const [ UncontrolledActive, SetUncontrolledActive ] = React.useState(DefaultActive);
    const CurrentActive = Active ?? UncontrolledActive;

    const SetSelectedIds = React.useCallback((Next: ReadonlySet<string>) =>
    {
        SetUncontrolledSelectedIds(Next);
        OnSelectedIdsChange?.(Next);
    }, [ OnSelectedIdsChange ]);

    const SetActive = React.useCallback((Next: boolean) =>
    {
        SetUncontrolledActive(Next);
        OnActiveChange?.(Next);
    }, [ OnActiveChange ]);

    const Activate = React.useCallback((Id: string) =>
    {
        SetActive(true);
        SetSelectedIds(new Set([ ...CurrentSelectedIds, Id ]));
    }, [ CurrentSelectedIds, SetActive, SetSelectedIds ]);

    const Deactivate = React.useCallback(() =>
    {
        SetActive(false);
        SetSelectedIds(new Set());
    }, [ SetActive, SetSelectedIds ]);

    const Toggle = React.useCallback((Id: string) =>
    {
        const Next = new Set(CurrentSelectedIds);

        if (Next.has(Id))
        {
            Next.delete(Id);
        }
        else
        {
            Next.add(Id);
        }

        SetSelectedIds(Next);

        if (Next.size === 0)
        {
            SetActive(false);
        }
    }, [ CurrentSelectedIds, SetActive, SetSelectedIds ]);

    const ContextValue = React.useMemo<SelectableContextValue>(() => ({
        Activate,
        Deactivate,
        Disabled,
        IsActive: CurrentActive,
        SelectedIds: CurrentSelectedIds,
        Toggle
    }), [ Activate, Deactivate, Disabled, CurrentActive, CurrentSelectedIds, Toggle ]);

    return (
        <View style={ Style }>
            <SelectableContext.Provider value={ ContextValue }>
                { children }
            </SelectableContext.Provider>
        </View>
    );
};

/** {@inheritDoc SelectableItem} */
export interface SelectableItemProps
{
    readonly Id: string;
    readonly OnPress?: Thunk;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode | ((State: SelectableItemState) => React.ReactNode);
}

export/**
       * An item participating in a `SelectableRoot`'s selection. A `LongPress`
       * enters selection mode and selects this item; once active, every
       * `SelectableItem`'s plain taps toggle selection instead of firing
       * `OnPress`.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectableItem = ({ Id, OnPress, Style, children }: SelectableItemProps): React.JSX.Element =>
{
    const { SelectedIds, IsActive, Disabled, Activate, Toggle } = useSelectableContext();
    const IsSelected = SelectedIds.has(Id);

    const HandlePress = React.useCallback(() =>
    {
        if (Disabled)
        {
            return;
        }

        if (IsActive)
        {
            Toggle(Id);
        }
        else
        {
            OnPress?.();
        }
    }, [ Disabled, IsActive, Toggle, Id, OnPress ]);

    const HandleLongPress = React.useCallback(() =>
    {
        if (!Disabled && !IsActive)
        {
            Activate(Id);
        }
    }, [ Disabled, IsActive, Activate, Id ]);

    return (
        <Pressable
            disabled={ Disabled }
            onLongPress={ HandleLongPress }
            onPress={ HandlePress }
            style={ Style }>
            { typeof children === "function" ? children({ IsActive, IsSelected }) : children }
        </Pressable>
    );
};

/** {@inheritDoc SelectableCheckmark} */
export interface SelectableCheckmarkProps
{
    readonly IsSelected: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * An opt-in "selected" badge — place it inside a `SelectableItem`'s own
       * content (usually absolutely positioned over a leading icon/thumbnail).
       * Renders an outlined circle while unselected and a filled checkmark once
       * `IsSelected`, matching the iOS/Android Photos-style selection affordance.
       *
       * @category Component
       * @since 1.0.0
       */
const SelectableCheckmark = ({ IsSelected, Style }: SelectableCheckmarkProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Semantic.Border]: BorderColor,
        [Semantic.Blue]: BlueColor,
        [Radii.Full]: FullRadius
    } = useToken(
        Semantic.Border,
        Semantic.Blue,
        Radii.Full
    );

    return (
        <View style={ [
            Styles.Checkmark,
            {
                backgroundColor: IsSelected ? BlueColor : "transparent",
                borderColor: IsSelected ? BlueColor : BorderColor,
                borderRadius: FullRadius
            },
            Style
        ] }>
            { IsSelected && (
                <Check
                    color="#FFFFFF"
                    size={ 12 }
                    strokeWidth={ 3 }
                />
            ) }
        </View>
    );
};

const useStyles = MakeStyles({
    Checkmark: MakeViewStyle({
        alignItems: "center",
        borderWidth: 1.5,
        height: 20,
        justifyContent: "center",
        width: 20
    })
});
