/**
 * A Notion-style page/database picker bottom sheet, composed from existing
 * primitives (`BottomSheet`, `Input`, `MenuItem`, `IconBlock`) — named and
 * structured after `@notion-kit/ui`'s `tree/` block the way `DateSheet.tsx`
 * is named and structured after `date-cell/date-time-picker.tsx`: not a
 * line-for-line port, but the same shape rebuilt on this package's own
 * primitives. Source splits this into a headless `core/tree.tsx`
 * (`useTree`/`<Tree>`, built on DOM `role="tree"` ARIA + per-item
 * `HTMLElement` refs for keyboard navigation) plus a `presets/combobox.tsx`
 * consumer (`ComboboxTree`, an `Autocomplete` with a "browse nested tree" /
 * "search flat list" mode switch). Both collapse into this one file:
 *
 * - The ARIA-tree/keyboard-navigation half of `core/tree.tsx` has no RN
 *   analogue (no DOM, no arrow-key focus model on a touch device) and was
 *   dropped; `BuildTree`'s pure data-shaping logic (flat items with
 *   `ParentId` → a `RootIds` + `Level`-annotated node map) is a direct,
 *   non-visual port of source's `buildTree`.
 * - `ComboboxTree`'s browse/search duality is kept, but rebuilt on a plain
 *   `.map()` over `BottomSheetScrollView` instead of `Autocomplete` (a
 *   floating-popover primitive with no natural home inside a sheet) —
 *   matching `DateSheet.tsx`'s own precedent of rendering even long lists
 *   (its ~400-entry timezone list) this way rather than reaching for
 *   `FlashList`/`BottomSheetFlashList` (the latter deprecated upstream in
 *   `@gorhom/bottom-sheet` v5). A sheet is a small, session-scoped surface,
 *   not the kind of always-mounted list virtualization exists for.
 * - Per-row keyboard navigation (`ArrowLeft`/`ArrowRight`/`ArrowUp`/
 *   `ArrowDown`, from source's `createTreeNavigation`) has no touch
 *   equivalent and was dropped; expand/collapse is a tap on the row's own
 *   chevron instead.
 * - Search results are a flat, unindented list (no breadcrumb of ancestor
 *   titles) and capped at `MaxSearchResults`, matching the same defensive
 *   cap source's own `useEmojiFactory.search` applies.
 *
 * @module @notivex/ui/Primitive/TreeSheet
 *
 * @file      TreeSheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Spacing from "../Token/Spacing.js";
import { Body, Heading3 } from "../Primitive/Text.js";
import {
    BottomSheet,
    BottomSheetHeader,
    type BottomSheetProps,
    BottomSheetScrollView
} from "../Primitive/BottomSheet.js";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { IconBlock, type IconData } from "./IconBlock.js";
import { MenuItem, MenuItemCheck } from "../Primitive/Menu.js";
import { StyleSheet, View } from "react-native";
import { UseColor, useSpacing } from "../ThemeProvider.js";
import { Input } from "../Primitive/Input.js";
import { TouchableOpacity } from "@gorhom/bottom-sheet";

const IndentWidth = 16 as const;
const MaxSearchResults = 100 as const;

/**
 * One entry in a `TreeSheet`'s `Items` list — a flat, `ParentId`-linked
 * shape (the same shape source's `buildTree`/`TreeItemData` expects), not a
 * pre-nested tree. Extend it with your own fields (a page's database id,
 * last-edited time, ...) — `TreeSheet` only reads `Id`/`ParentId`/`Title`/
 * `Icon`.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export interface TreeItemData
{
    readonly Id: string;
    readonly ParentId?: string | undefined;
    readonly Title: string;
    readonly Icon?: IconData | undefined;
}

interface TreeNode<A extends TreeItemData>
{
    readonly Item: A;
    readonly Level: number;
    readonly Children: ReadonlyArray<string>;
}

interface TreeEntity<A extends TreeItemData>
{
    readonly RootIds: ReadonlyArray<string>;
    readonly Nodes: ReadonlyMap<string, TreeNode<A>>;
}

/** Direct, non-visual port of source's `buildTree` — see the file header comment. */
const BuildTree = <A extends TreeItemData,>(Items: ReadonlyArray<A>): TreeEntity<A> =>
{
    const ItemById = new Map<string, A>();
    const ChildrenOf = new Map<string, Array<string>>();
    const RootIds: Array<string> = [ ];

    for (const CurrentItem of Items)
    {
        ItemById.set(CurrentItem.Id, CurrentItem);

        if (!ChildrenOf.has(CurrentItem.Id))
        {
            ChildrenOf.set(CurrentItem.Id, [ ]);
        }

        if (CurrentItem.ParentId === undefined)
        {
            RootIds.push(CurrentItem.Id);
        }
        else
        {
            const Siblings = ChildrenOf.get(CurrentItem.ParentId) ?? [ ];
            Siblings.push(CurrentItem.Id);
            ChildrenOf.set(CurrentItem.ParentId, Siblings);
        }
    }

    const Nodes = new Map<string, TreeNode<A>>();
    const Queue: Array<{ readonly Id: string; readonly Level: number }> =
        RootIds.map((Id: string) => ({ Id, Level: 0 }));

    while (Queue.length > 0)
    {
        const Current = Queue.shift()!;
        const CurrentItem = ItemById.get(Current.Id);

        if (CurrentItem === undefined)
        {
            continue;
        }

        const Children = ChildrenOf.get(Current.Id) ?? [ ];
        Nodes.set(Current.Id, { Children, Item: CurrentItem, Level: Current.Level });

        for (const ChildId of Children)
        {
            Queue.push({ Id: ChildId, Level: Current.Level + 1 });
        }
    }

    return { Nodes, RootIds };
};

interface VisibleRow
{
    readonly Id: string;
    readonly Level: number;
    readonly HasChildren: boolean;
}

/** Depth-first walk of `Entity`, descending into a node's children only while it's in `ExpandedIds`. */
const FlattenVisibleRows = <A extends TreeItemData,>(
    Entity: TreeEntity<A>,
    ExpandedIds: ReadonlySet<string>
): ReadonlyArray<VisibleRow> =>
{
    const Rows: Array<VisibleRow> = [ ];

    const Visit = (Id: string): void =>
    {
        const Node = Entity.Nodes.get(Id);

        if (Node === undefined)
        {
            return;
        }

        const HasChildren = Node.Children.length > 0;
        Rows.push({ HasChildren, Id, Level: Node.Level });

        if (HasChildren && ExpandedIds.has(Id))
        {
            for (const ChildId of Node.Children)
            {
                Visit(ChildId);
            }
        }
    };

    for (const RootId of Entity.RootIds)
    {
        Visit(RootId);
    }

    return Rows;
};

const DefaultIcon = <A extends TreeItemData,>(Node: A, HasChildren: boolean): IconData =>
    Node.Icon ?? { Src: HasChildren ? "folder" : "file-text", Type: "Lucide" };

interface TreeSheetRowProps<A extends TreeItemData>
{
    readonly Node: A;
    readonly Level: number;
    readonly HasChildren: boolean;
    readonly IsExpanded: boolean;
    readonly IsSelected: boolean;
    readonly OnToggleExpand: () => void;
    readonly OnSelect: () => void;
}

const TreeSheetRow = <A extends TreeItemData,>({
    Node,
    Level,
    HasChildren,
    IsExpanded,
    IsSelected,
    OnToggleExpand,
    OnSelect
}: TreeSheetRowProps<A>): React.JSX.Element =>
{
    const MutedColor = UseColor(Semantic.Muted);

    return (
        <MenuItem
            Icon={ (
                <View style={ Styles.RowLeading }>
                    { HasChildren
                        ? <TouchableOpacity
                            accessibilityLabel={ IsExpanded ? "Collapse" : "Expand" }
                            accessibilityRole="button"
                            hitSlop={ 8 }
                            onPress={ OnToggleExpand }
                            style={ Styles.ExpandButton }>
                            { IsExpanded
                                ? <ChevronDown
                                    color={ MutedColor }
                                    size={ 14 }
                                />
                                : <ChevronRight
                                    color={ MutedColor }
                                    size={ 14 }
                                /> }
                        </TouchableOpacity>
                        : <View style={ Styles.ExpandButton } /> }
                    <IconBlock
                        Icon={ DefaultIcon(Node, HasChildren) }
                        Size="Small"
                    />
                </View>
            ) }
            Label={ Node.Title }
            OnPress={ OnSelect }
            Style={ { paddingLeft: 8 + (Level * IndentWidth) } }>
            { IsSelected && <MenuItemCheck /> }
        </MenuItem>
    );
};

/** {@inheritDoc TreeSheet} */
export interface TreeSheetProps<A extends TreeItemData = TreeItemData> extends
    Pick<BottomSheetProps, "OnDismiss" | "Ref">
{
    readonly Items: ReadonlyArray<A>;
    readonly Title?: string;
    readonly Value?: string | undefined;
    readonly OnValueChange?: ((Id: string) => void) | undefined;
    readonly Placeholder?: string;
    readonly EmptyLabel?: string;
    readonly TestID?: string;
}

export/**
       * A searchable, expandable page/database picker bottom sheet — backs
       * `ParentPicker`/`PagePicker`/`DatabasePicker`-shaped call sites without
       * being tied to any one of them. See the file header comment for how
       * this relates to `@notion-kit/ui`'s `tree/` block.
       *
       * @category Component
       * @since 1.0.0
       */
const TreeSheet = <A extends TreeItemData,>({
    OnDismiss,
    Ref,
    Items,
    Title = "Select a page",
    Value,
    OnValueChange,
    Placeholder = "Search pages…",
    EmptyLabel = "No pages found",
    TestID
}: TreeSheetProps<A>): React.JSX.Element =>
{
    const [ Query, SetQuery ] = React.useState("");
    const [ ExpandedIds, SetExpandedIds ] = React.useState<ReadonlySet<string>>(new Set());

    const Entity = React.useMemo(() => BuildTree(Items), [ Items ]);
    const IsSearching = Query.trim().length > 0;

    const ToggleExpand = React.useCallback((Id: string) =>
    {
        SetExpandedIds((Previous: ReadonlySet<string>) =>
        {
            const Next = new Set(Previous);

            if (Next.has(Id))
            {
                Next.delete(Id);
            }
            else
            {
                Next.add(Id);
            }

            return Next;
        });
    }, [ ]);

    const Rows: ReadonlyArray<VisibleRow> = React.useMemo(() =>
    {
        if (!IsSearching)
        {
            return FlattenVisibleRows(Entity, ExpandedIds);
        }

        const NormalizedQuery = Query.trim().toLowerCase();
        const Matches: Array<VisibleRow> = [ ];

        for (const Node of Entity.Nodes.values())
        {
            if (Matches.length >= MaxSearchResults)
            {
                break;
            }

            if (Node.Item.Title.toLowerCase().includes(NormalizedQuery))
            {
                Matches.push({ HasChildren: false, Id: Node.Item.Id, Level: 0 });
            }
        }

        return Matches;
    }, [ IsSearching, Query, Entity, ExpandedIds ]);

    const HorizontalPadding = useSpacing(Spacing.SheetHorizontal);

    return (
        <BottomSheet
            { ...{ OnDismiss, Ref } }
            { ...(TestID === undefined ? { } : { TestId: TestID }) }>
            <BottomSheetHeader Style={ [ Styles.Header, { paddingHorizontal: HorizontalPadding } ] }>
                <Heading3 Style={ Styles.HeaderTitle }>{ Title }</Heading3>
                <Input
                    Clear
                    OnCancel={ () => SetQuery("") }
                    OnChangeText={ SetQuery }
                    Placeholder={ Placeholder }
                    Search
                    Value={ Query }
                />
            </BottomSheetHeader>
            <BottomSheetScrollView style={ Styles.List }>
                { Rows.length === 0
                    ? <Body
                        Color={ Semantic.Muted }
                        Style={ Styles.Empty }>
                        { EmptyLabel }
                    </Body>
                    : Rows.map((Row: VisibleRow) =>
                    {
                        const Node = Entity.Nodes.get(Row.Id);

                        if (Node === undefined)
                        {
                            return null;
                        }

                        return (
                            <TreeSheetRow
                                HasChildren={ Row.HasChildren }
                                IsExpanded={ ExpandedIds.has(Row.Id) }
                                IsSelected={ Row.Id === Value }
                                Level={ Row.Level }
                                Node={ Node.Item }
                                OnSelect={ () => OnValueChange?.(Row.Id) }
                                OnToggleExpand={ () => ToggleExpand(Row.Id) }
                                key={ Row.Id }
                            />
                        );
                    }) }
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const Styles = StyleSheet.create({
    Empty:
    {
        paddingVertical: 32,
        textAlign: "center"
    },
    ExpandButton:
    {
        alignItems: "center",
        height: 20,
        justifyContent: "center",
        width: 20
    },
    Header:
    {
        gap: 12,
        paddingBottom: 8
    },
    HeaderTitle:
    {
        textAlign: "center"
    },
    List:
    {
        flex: 1
    },
    RowLeading:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 4
    }
});
