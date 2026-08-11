/**
 * Ported from `@notion-kit/ui`'s `primitives/autocomplete.tsx`, built on
 * `Popup.tsx` + `Menu.tsx` instead of `@base-ui/react/autocomplete` (which
 * has no RN analogue). This is the shared filtered-list engine behind
 * `Combobox.tsx` (adds a persisted selected value) and `Command.tsx` (adds
 * a full-screen `Dialog` host) — see `useAutocompleteContext`, exposed for
 * exactly that reuse, the same way `DropdownMenu.tsx` exposes
 * `useDropdownMenuContext` for `ContextMenu.tsx`.
 *
 * Trimmed from source: no `AutocompleteRow`/`AutocompleteCollection`
 * (base-ui virtualization internals with no RN equivalent — lists here are
 * a plain `ScrollView`, not virtualized) and no keyboard highlight
 * navigation (arrow-key item highlighting; touch UI selects by tap, and
 * this library targets touch-first). Filtering is by rendered children
 * (matching this library's compound-component style everywhere else, e.g.
 * `DropdownMenu`), not a data-driven `items` array — each `AutocompleteItem`
 * decides its own visibility by comparing its `Value`/`Label` against the
 * live query.
 *
 * @module @notivex/ui/Primitive/Autocomplete
 *
 * @file      Autocomplete.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { CloneTrigger, Popup, type PopupAnchor, type PopupPlacement } from "./Popup.js";
import { Input, type InputProps } from "./Input.js";
import { MenuGroup, MenuItem, type MenuItemVariant, MenuLabel } from "./Menu.js";
import { ScrollView, type StyleProp, View, type ViewStyle } from "react-native";
import { Description } from "./Text.js";
import { UseToken } from "../ThemeProvider.js";

export { Separator as AutocompleteSeparator } from "./Separator.js";

/**
 * A function that filters the set of possible choices for a
 * given `Autocomplete` component.
 *
 * @category Mutator
 * @since 1.0.0
 */
export type AutocompleteFilter = (ItemText: string, Query: string) => boolean;

const DefaultFilter: AutocompleteFilter = (ItemText: string, Query: string) =>
    ItemText.toLowerCase().includes(Query.toLowerCase());

interface AutocompleteContextValue
{
    readonly Query: string;
    readonly SetQuery: (Query: string) => void;
    readonly IsOpen: boolean;
    readonly SetIsOpen: (Open: boolean) => void;
    readonly AnchorRef: PopupAnchor;
    readonly Filter: AutocompleteFilter;
    readonly MatchRegistry: React.RefObject<Map<string, boolean>>;
    readonly BumpVersion: () => void;
}

const AutocompleteContext = React.createContext<AutocompleteContextValue | undefined>(undefined);

export/**
       * Exposed so `Combobox.tsx`/`Command.tsx` can reuse this engine.
       *
       * @category Hook
       * @since 1.0.0
       */
const useAutocompleteContext = (): AutocompleteContextValue =>
{
    const Value = React.useContext(AutocompleteContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] An `Autocomplete` part was used outside of `<Autocomplete>`.");
    }

    return Value;
};

/** {@inheritDoc Autocomplete} */
export interface AutocompleteProps extends React.PropsWithChildren
{
    readonly Query?: string | undefined;
    readonly DefaultQuery?: string | undefined;
    readonly OnQueryChange?: ((Query: string) => void) | undefined;
    readonly Open?: boolean | undefined;
    readonly DefaultOpen?: boolean | undefined;
    readonly OnOpenChange?: ((Open: boolean) => void) | undefined;
    readonly Filter?: AutocompleteFilter | undefined;
}

export/**
       * A state provider that coordinates query text, filtering, popup
       * visibility, and item matches for compound autocomplete controls.
       *
       * @category Component
       * @since 1.0.0
       */
const Autocomplete = ({
    Query,
    DefaultQuery = "",
    OnQueryChange,
    Open,
    DefaultOpen = false,
    OnOpenChange,
    Filter = DefaultFilter,
    children
}: AutocompleteProps): React.JSX.Element =>
{
    const [ UncontrolledQuery, SetUncontrolledQuery ] = React.useState(DefaultQuery);
    const CurrentQuery = Query ?? UncontrolledQuery;
    const [ UncontrolledOpen, SetUncontrolledOpen ] = React.useState(DefaultOpen);
    const IsOpen = Open ?? UncontrolledOpen;
    const AnchorRef = React.useRef<React.Component>(null);
    const MatchRegistry = React.useRef(new Map<string, boolean>());
    const [ Version, SetVersion ] = React.useState(0);
    const BumpVersion = React.useCallback(() => SetVersion((V: number) => V + 1), [ ]);

    const SetQuery = React.useCallback((NextQuery: string) =>
    {
        SetUncontrolledQuery(NextQuery);
        OnQueryChange?.(NextQuery);
    }, [ OnQueryChange ]);

    const SetIsOpen = React.useCallback((NextOpen: boolean) =>
    {
        SetUncontrolledOpen(NextOpen);
        OnOpenChange?.(NextOpen);
    }, [ OnOpenChange ]);

    const ContextValue = React.useMemo<AutocompleteContextValue>(() => ({
        AnchorRef,
        BumpVersion,
        Filter,
        IsOpen,
        MatchRegistry,
        Query: CurrentQuery,
        SetIsOpen,
        SetQuery
    /* `Version` is intentionally unused in the value shape below; it's a dependency-only   *
     * trigger so `MatchRegistry` mutations (bumped from `AutocompleteItem`'s effect) force *
     * this memo to hand consumers — namely `AutocompleteEmpty` — a fresh context value.    */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }), [ CurrentQuery, SetQuery, IsOpen, SetIsOpen, Filter, BumpVersion, Version ]);

    return <AutocompleteContext.Provider value={ ContextValue }>{ children }</AutocompleteContext.Provider>;
};

/** {@inheritDoc AutocompleteInput} */
export interface AutocompleteInputProps extends Omit<InputProps, "Value" | "OnChangeText" | "OnFocus">
{
    /** Opens the popup when the input gains focus. Defaults to `true`. */
    readonly OpenOnFocus?: boolean;
}

export/**
       * A search input bound to the nearest `Autocomplete` query and popup state.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteInput = ({ OpenOnFocus = true, ...Rest }: AutocompleteInputProps): React.JSX.Element =>
{
    const { Query, SetQuery, SetIsOpen } = useAutocompleteContext();

    return (
        <Input
            { ...Rest }
            Clear
            OnCancel={ () => SetQuery("") }
            OnChangeText={ (NextQuery: string) =>
            {
                SetQuery(NextQuery);
                SetIsOpen(true);
            } }
            OnFocus={ OpenOnFocus ? () => SetIsOpen(true) : undefined }
            Search
            Value={ Query }
        />
    );
};

/** {@inheritDoc AutocompleteTrigger} */
export interface AutocompleteTriggerProps extends React.PropsWithChildren
{
    /**
     * Clone `children` instead of wrapping it in a second `Pressable`.
     *
     * @see {@link CloneTrigger}
     */
    readonly AsChild?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * The control that opens and anchors an `Autocomplete` results popup.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteTrigger = ({
    AsChild = false,
    Style,
    children
}: AutocompleteTriggerProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useAutocompleteContext();
    const Toggle = React.useCallback(() => SetIsOpen(!IsOpen), [ IsOpen, SetIsOpen ]);

    if (AsChild)
    {
        return CloneTrigger(children as React.ReactElement<{ OnPress?: () => void }>, Toggle, AnchorRef);
    }

    return <View style={ Style }>{ children }</View>;
};

/** {@inheritDoc AutocompleteTrigger} */
export interface AutocompleteContentProps extends React.PropsWithChildren
{
    /**
     * `"Floating"` (the default) anchors a `Popup` to the input; `"Inline"` renders `children` directly.
     * This is used when the caller supplies its own host, e.g. `Command.tsx`'s `Dialog`.
     */
    readonly Variant?:
        | "Floating"
        | "Inline";
    readonly Placement?: PopupPlacement;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * The floating or inline container for an `Autocomplete`'s filtered results.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteContent = ({
    Variant = "Floating",
    Placement = "Bottom",
    Style,
    children
}: AutocompleteContentProps): React.JSX.Element =>
{
    const { IsOpen, SetIsOpen, AnchorRef } = useAutocompleteContext();

    if (Variant === "Inline")
    {
        return <View style={ Style }>{ children }</View>;
    }

    return (
        <Popup
            Anchor={ AnchorRef }
            IsVisible={ IsOpen }
            OnRequestClose={ () => SetIsOpen(false) }
            Placement={ Placement }
            Style={ [ { minWidth: 220 }, Style ] }>
            { children }
        </Popup>
    );
};

/** {@inheritDoc AutocompleteList} */
export interface AutocompleteListProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A scrollable container for `Autocomplete` groups and items.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteList = ({ Style, children }: AutocompleteListProps): React.JSX.Element => (
    <ScrollView
        contentContainerStyle={ { paddingVertical: 4 } }
        keyboardShouldPersistTaps="handled"
        style={ [ { maxHeight: 300 }, Style ] }>
        { children }
    </ScrollView>
);

/** {@inheritDoc AutocompleteGroup} */
export interface AutocompleteGroupProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Groups related `Autocomplete` items within a result list.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteGroup = ({ Style, children }: AutocompleteGroupProps): React.JSX.Element =>
    <MenuGroup Style={ Style }>{ children }</MenuGroup>;

/** {@inheritDoc AutocompleteLabel} */
export interface AutocompleteLabelProps
{
    readonly title: React.ReactNode;
}

export/**
       * A heading for an `Autocomplete` group.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteLabel = ({ title }: AutocompleteLabelProps): React.JSX.Element =>
{
    if (typeof title === "string")
    {
        return <MenuLabel>{ title }</MenuLabel>;
    }

    return <>{ title }</>;
};

/** {@inheritDoc AutocompleteItem} */
export interface AutocompleteItemProps extends React.PropsWithChildren
{
    readonly Value: string;
    readonly Label?: string | undefined;
    readonly Description?: string | undefined;
    readonly Icon?: React.ReactNode;
    readonly Variant?: MenuItemVariant | undefined;
    readonly OnSelect?: ((Value: string) => void) | undefined;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A selectable `Autocomplete` option that is hidden when it does not match the current query.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteItem = ({
    Value,
    Label,
    Description,
    Icon,
    Variant,
    OnSelect,
    Style,
    children
}: AutocompleteItemProps): React.JSX.Element | null =>
{
    const { Query, Filter, MatchRegistry, BumpVersion } = useAutocompleteContext();
    const IsMatch = Filter(Label ?? Value, Query);

    React.useEffect(() =>
    {
        MatchRegistry.current.set(Value, IsMatch);
        BumpVersion();

        return () =>
        {
            /* eslint-disable-next-line react-hooks/exhaustive-deps */
            MatchRegistry.current.delete(Value);
            BumpVersion();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ Value, IsMatch, MatchRegistry ]);

    if (!IsMatch)
    {
        return null;
    }

    return (
        <MenuItem
            { ...{ Description, Icon, Style, Variant } }
            Label={ Label ?? Value }
            OnPress={ () => OnSelect?.(Value) }>
            { children }
        </MenuItem>
    );
};

/** {@inheritDoc AutocompleteEmpty} */
export interface AutocompleteEmptyProps extends React.PropsWithChildren { }

export/**
       * Renders fallback content when no registered `Autocomplete` item matches the current query.
       *
       * @category Component
       * @since 1.0.0
       */
const AutocompleteEmpty = ({ children }: AutocompleteEmptyProps): React.JSX.Element | null =>
{
    const { MatchRegistry } = useAutocompleteContext();
    const { [Semantic.Secondary]: MutedColor } = UseToken(Semantic.Secondary);
    const HasAnyMatch = [ ...MatchRegistry.current.values() ].some(Boolean);

    if (HasAnyMatch)
    {
        return null;
    }

    return (
        <View style={ {
            alignItems: "center",
            justifyContent: "center",
            minHeight: 28,
            padding: 8
        } }>
            <Description Color={ MutedColor }>
                { children ?? "No results found." }
            </Description>
        </View>
    );
};
