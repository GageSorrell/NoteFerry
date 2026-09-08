/**
 * Windows variant of `Sortable.tsx` — the same public API
 * (`SortableRoot`/`SortableList`/`SortableItem`/`SortableHandle`, a
 * `Value`/`OnValueChange`-shaped ids list, `ItemExtent`/`Disabled`), rebuilt
 * from the ground up rather than ported: RN's `PanResponder` — the obvious
 * fallback for a Reanimated/`react-native-gesture-handler`-free drag — is
 * confirmed broken on RNW's Fabric architecture (`onPanResponderMove` never
 * fires; open upstream issue `react-native-windows#14119`), so this is built
 * on the lower-level, W3C-style Pointer Events API instead
 * (`onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel`, already
 * available on RN core `View`).
 *
 * Internals: `useSharedValue`/`useAnimatedStyle`/`runOnJS`/`withTiming`
 * worklets are replaced with a plain `Animated.Value` per item (JS-driven —
 * no UI-thread worklets exist without Reanimated) plus ordinary React state
 * for the `Positions` map. `MovePositions` ports as-is once its `"worklet"`
 * directive is dropped — it was already a plain function. The drag handle
 * tracks `pageY` deltas manually between pointer events to compute the
 * active item's target slot, exactly mirroring the mobile file's
 * `translationY`/`ItemExtent` math.
 *
 * @module @noteferry/ui/Primitive/Sortable
 *
 * @file      Sortable.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Animated, type PointerEvent, type StyleProp, View, type ViewStyle } from "react-native";
import { GripVertical } from "../Icon.js";

import { useToken } from "../ThemeProvider.js";

/** Shifts every index between `From` and `To` by one slot, matching a single item moving from `From` to `To`. */
const MovePositions = (Positions: Record<string, number>, From: number, To: number): Record<string, number> =>
{
    const Next: Record<string, number> = { ...Positions };

    for (const Id in Positions)
    {
        const Index = Positions[ Id ];

        if (Index === From)
        {
            Next[ Id ] = To;
        }
        else if (From < To && Index !== undefined && Index > From && Index <= To)
        {
            Next[ Id ] = Index - 1;
        }
        else if (From > To && Index !== undefined && Index >= To && Index < From)
        {
            Next[ Id ] = Index + 1;
        }
    }

    return Next;
};

interface SortableContextValue
{
    readonly Positions: Record<string, number>;
    readonly SetPositions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    readonly ActiveId: string | null;
    readonly SetActiveId: (Id: string | null) => void;
    readonly ItemExtent: number;
    readonly ItemCount: number;
    readonly Disabled: boolean;
    readonly CommitOrder: () => void;
    /** Lazily creates/returns the one `Animated.Value` (a `top` offset, in px) backing an item's position. */
    readonly GetItemTopAnim: (Id: string) => Animated.Value;
}

const SortableContext = React.createContext<SortableContextValue | undefined>(undefined);

const useSortableContext = (): SortableContextValue =>
{
    const Value = React.useContext(SortableContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] A `Sortable` part was used outside of `<SortableRoot>`.");
    }

    return Value;
};

const SortableItemContext = React.createContext<string | undefined>(undefined);

const useSortableItemId = (): string =>
{
    const Value = React.useContext(SortableItemContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] `SortableHandle` was used outside of `SortableItem`.");
    }

    return Value;
};

/** {@inheritDoc SortableRoot} */
export interface SortableRootProps extends React.PropsWithChildren
{
    readonly Value: ReadonlyArray<string>;
    readonly OnValueChange?: (Value: ReadonlyArray<string>) => void;
    readonly ItemExtent: number;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A container for sortable items.
       *
       * @category Component
       * @since 1.0.0
       */
const SortableRoot = ({
    Disabled = false,
    ItemExtent,
    OnValueChange,
    Style,
    Value,
    children
}: SortableRootProps): React.JSX.Element =>
{
    const [ Positions, SetPositions ] = React.useState<Record<string, number>>(
        () => Object.fromEntries(Value.map((Id: string, Index: number) => [ Id, Index ]))
    );
    const [ ActiveId, SetActiveId ] = React.useState<string | null>(null);
    const ValueRef = React.useRef(Value);
    ValueRef.current = Value;
    const OnValueChangeRef = React.useRef(OnValueChange);
    OnValueChangeRef.current = OnValueChange;
    const PositionsRef = React.useRef(Positions);
    PositionsRef.current = Positions;
    const TopAnimsRef = React.useRef(new Map<string, Animated.Value>());

    React.useEffect(() =>
    {
        if (ActiveId === null)
        {
            SetPositions(Object.fromEntries(Value.map((Id: string, Index: number) => [ Id, Index ])));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ Value.join(" ") ]);

    const CommitOrder = React.useCallback(() =>
    {
        const CurrentValue = ValueRef.current;
        const CurrentPositions = PositionsRef.current;
        const NextValue = [ ...CurrentValue ].sort(
            (A: string, B: string) => (CurrentPositions[ A ] ?? 0) - (CurrentPositions[ B ] ?? 0)
        );
        OnValueChangeRef.current?.(NextValue);
    }, [ ]);

    const GetItemTopAnim = React.useCallback((Id: string): Animated.Value =>
    {
        const Existing = TopAnimsRef.current.get(Id);

        if (Existing !== undefined)
        {
            return Existing;
        }

        const Created = new Animated.Value((Positions[ Id ] ?? 0) * ItemExtent);
        TopAnimsRef.current.set(Id, Created);
        return Created;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ ItemExtent ]);

    const ContextValue = React.useMemo<SortableContextValue>(() => ({
        ActiveId,
        CommitOrder,
        Disabled,
        GetItemTopAnim,
        ItemCount: Value.length,
        ItemExtent,
        Positions,
        SetActiveId,
        SetPositions
    }), [ ActiveId, CommitOrder, Disabled, GetItemTopAnim, Value.length, ItemExtent, Positions ]);

    return (
        <View style={ Style }>
            <SortableContext.Provider value={ ContextValue }>
                { children }
            </SortableContext.Provider>
        </View>
    );
};

/** {@inheritDoc SortableList} */
export interface SortableListProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A list of sortable items.
       *
       * @category Component
       * @since 1.0.0
       */
const SortableList = ({ Style, children }: SortableListProps): React.JSX.Element =>
{
    const { ItemExtent, ItemCount } = useSortableContext();

    return <View style={ [
        {
            height: ItemCount * ItemExtent,
            position: "relative",
            width: "100%"
        },
        Style
    ] }>
        { children }
    </View>;
};

/** {@inheritDoc SortableItem} */
export interface SortableItemProps extends React.PropsWithChildren
{
    readonly Id: string;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * An item belonging to a sortable container component.
       *
       * @category Component
       * @since 1.0.0
       */
const SortableItem = ({ Id, Style, children }: SortableItemProps): React.JSX.Element =>
{
    const { Positions, ActiveId, ItemExtent, GetItemTopAnim } = useSortableContext();
    const IsActive = ActiveId === Id;
    const TopAnim = GetItemTopAnim(Id);

    /* While this item is being dragged, `SortableHandle` drives `TopAnim`
     * directly (`.setValue(...)`, no animation) on every pointer move. Once
     * it's some other item's turn (or nobody's), animate to its resolved
     * slot instead — the JS-driven equivalent of the mobile file's
     * `IsActive ? Top : withTiming(Top)`. */
    React.useEffect(() =>
    {
        if (!IsActive)
        {
            Animated.timing(TopAnim, {
                duration: 200,
                toValue: (Positions[ Id ] ?? 0) * ItemExtent,
                useNativeDriver: false
            }).start();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ IsActive, Positions[ Id ], ItemExtent ]);

    return (
        <SortableItemContext.Provider value={ Id }>
            <Animated.View style={ [
                {
                    height: ItemExtent,
                    position: "absolute",
                    width: "100%"
                },
                {
                    elevation: IsActive ? 4 : 0,
                    top: TopAnim,
                    zIndex: IsActive ? 1 : 0
                },
                Style
            ] }>
                { children }
            </Animated.View>
        </SortableItemContext.Provider>
    );
};

/** {@inheritDoc SortableHandle} */
export interface SortableHandleProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A handle to manually sort an item.
       *
       * @category Component
       * @since 1.0.0
       */
const SortableHandle = ({ Style, children }: SortableHandleProps): React.JSX.Element =>
{
    const Id = useSortableItemId();
    const {
        Positions,
        SetPositions,
        SetActiveId,
        ItemExtent,
        ItemCount,
        Disabled,
        CommitOrder,
        GetItemTopAnim
    } = useSortableContext();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    /* Transient drag bookkeeping — deliberately a ref, not state: it's read
     * and written on every `onPointerMove`, and nothing about it should
     * trigger a re-render on its own. */
    const DragRef = React.useRef<{ readonly StartY: number; readonly StartIndex: number } | null>(null);

    const HandlePointerDown = React.useCallback((Event: PointerEvent) =>
    {
        if (Disabled)
        {
            return;
        }

        const StartIndex = Positions[ Id ] ?? 0;
        DragRef.current = { StartIndex, StartY: Event.nativeEvent.pageY };
        SetActiveId(Id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ Disabled, Id, Positions[ Id ], SetActiveId ]);

    const HandlePointerMove = React.useCallback((Event: PointerEvent) =>
    {
        const Drag = DragRef.current;

        if (Drag === null)
        {
            return;
        }

        const DeltaY = Event.nativeEvent.pageY - Drag.StartY;
        GetItemTopAnim(Id).setValue((Drag.StartIndex * ItemExtent) + DeltaY);

        const RawIndex = Drag.StartIndex + Math.round(DeltaY / ItemExtent);
        const NextIndex = Math.min(Math.max(RawIndex, 0), ItemCount - 1);

        SetPositions((Previous: Record<string, number>) =>
        {
            const CurrentIndex = Previous[ Id ] ?? 0;
            return NextIndex === CurrentIndex ? Previous : MovePositions(Previous, CurrentIndex, NextIndex);
        });
    }, [ GetItemTopAnim, Id, ItemCount, ItemExtent, SetPositions ]);

    const EndDrag = React.useCallback(() =>
    {
        if (DragRef.current === null)
        {
            return;
        }

        DragRef.current = null;
        SetActiveId(null);
        CommitOrder();
    }, [ CommitOrder, SetActiveId ]);

    return (
        <View
            onPointerCancel={ EndDrag }
            onPointerDown={ HandlePointerDown }
            onPointerMove={ HandlePointerMove }
            onPointerUp={ EndDrag }
            style={ [
                {
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6
                },
                Style
            ] }>
            { children ?? <GripVertical
                color={ MutedColor }
                size={ 14 }
            /> }
        </View>
    );
};

export/**
       * The sortable components offered by `@notivex/ui`.
       *
       * @category Component
       * @since 1.0.0
       */
const Sortable =
    Object.freeze({
        Handle: SortableHandle,
        Item: SortableItem,
        List: SortableList,
        Root: SortableRoot
    } as const);
