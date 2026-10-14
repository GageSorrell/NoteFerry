import * as React from "react";
import { View, type ViewStyle } from "react-native";

/**
 * The host integration seam for the editor's toolbar (its Mobile Action Bar).
 *
 * By default the editor renders its toolbar itself, as an overlay inside its
 * own view — which scrolls away with the body when the editor sits in a
 * `ScrollView`. A host that wants the toolbar pinned to the screen instead
 * wraps the screen in `NotionMarkdownToolbarProvider` and renders one
 * `NotionMarkdownToolbarOutlet` wherever the toolbar belongs, normally as the
 * last child of a full-height column, below the scrolling content. Any editor
 * under the same provider then hands its toolbar to that outlet.
 *
 * React Native has no portal, so the editor publishes its toolbar element to
 * a small store and the outlet renders whatever is published.
 */

/** Who compensates for the on-screen keyboard. */
export type KeyboardAvoidance =
  /** The package raises the toolbar by the keyboard's height. Use when the host layout does not react to the keyboard. */
  | "Package"
  /** The host layout already ends at the keyboard's top edge (a resizing window, a `KeyboardAvoidingView`, …), so the package adds nothing. */
  | "Host";

export interface ToolbarLayout {
  readonly Placement: "Overlay" | "InFlow";
  readonly KeyboardAvoidance: KeyboardAvoidance;
  /** Space kept below the toolbar while no keyboard covers the bottom edge — typically the bottom safe-area inset. */
  readonly BottomInset: number;
}

export const DefaultToolbarLayout: ToolbarLayout = { Placement: "Overlay", KeyboardAvoidance: "Package", BottomInset: 0 };

/** Set by the outlet for the toolbar it renders; `KeyboardToolbarHost` reads it for its layout defaults. */
export const ToolbarLayoutContext = React.createContext<ToolbarLayout>(DefaultToolbarLayout);

interface ToolbarSlot {
  readonly Subscribe: (Listener: () => void) => () => void;
  readonly GetNode: () => React.ReactNode;
  readonly GetHasOutlet: () => boolean;
  readonly Publish: (Owner: object, Node: React.ReactNode) => void;
  readonly Clear: (Owner: object) => void;
  readonly RegisterOutlet: () => () => void;
}

function CreateToolbarSlot(): ToolbarSlot {
  const Listeners = new Set<() => void>();
  let Node: React.ReactNode = null;
  let Owner: object | null = null;
  let OutletCount = 0;
  const Notify = (): void => Listeners.forEach((Listener) => Listener());

  return {
    Subscribe: (Listener) => {
      Listeners.add(Listener);
      return () => Listeners.delete(Listener);
    },
    GetNode: () => Node,
    GetHasOutlet: () => OutletCount > 0,
    Publish: (NextOwner, NextNode) => {
      // With several editors under one provider, an editor with nothing to show never displaces another editor's toolbar.
      if (NextNode === null && Owner !== NextOwner) return;
      Owner = NextNode === null ? null : NextOwner;
      Node = NextNode;
      Notify();
    },
    Clear: (PreviousOwner) => {
      if (Owner !== PreviousOwner) return;
      Owner = null;
      Node = null;
      Notify();
    },
    RegisterOutlet: () => {
      OutletCount += 1;
      Notify();
      return () => {
        OutletCount -= 1;
        Notify();
      };
    },
  };
}

const ToolbarSlotContext = React.createContext<ToolbarSlot | null>(null);

export interface NotionMarkdownToolbarProviderProps {
  readonly children?: React.ReactNode;
}

/** Connects the editors beneath it to a `NotionMarkdownToolbarOutlet` beneath it. */
export function NotionMarkdownToolbarProvider({ children }: NotionMarkdownToolbarProviderProps): React.ReactElement {
  const [Slot] = React.useState(CreateToolbarSlot);
  return <ToolbarSlotContext.Provider value={Slot}>{children}</ToolbarSlotContext.Provider>;
}

export interface NotionMarkdownToolbarOutletProps {
  /** Defaults to `"Package"`. Pass `"Host"` when the surrounding layout already moves with the keyboard, so the offset is not applied twice. */
  readonly KeyboardAvoidance?: KeyboardAvoidance | undefined;
  /** Space kept below the toolbar while the keyboard is hidden — typically the bottom safe-area inset. */
  readonly BottomInset?: number | undefined;
  readonly Style?: ViewStyle | undefined;
}

/**
 * Renders the toolbar of the editor under the same provider, in normal layout
 * flow. Place it at the bottom edge of the screen, outside any scroll view.
 * It takes no space while no editor has a toolbar to show.
 */
export function NotionMarkdownToolbarOutlet({ KeyboardAvoidance = "Package", BottomInset = 0, Style }: NotionMarkdownToolbarOutletProps): React.ReactElement | null {
  const Slot = React.useContext(ToolbarSlotContext);
  if (Slot === null) throw new Error("NotionMarkdownToolbarOutlet must be rendered inside a NotionMarkdownToolbarProvider.");

  React.useEffect(() => Slot.RegisterOutlet(), [Slot]);
  const Node = React.useSyncExternalStore(Slot.Subscribe, Slot.GetNode, Slot.GetNode);
  const Layout = React.useMemo((): ToolbarLayout => ({ Placement: "InFlow", KeyboardAvoidance, BottomInset }), [KeyboardAvoidance, BottomInset]);

  if (Node === null) return null;
  return (
    <ToolbarLayoutContext.Provider value={Layout}>
      <View style={Style}>{Node}</View>
    </ToolbarLayoutContext.Provider>
  );
}

/**
 * For the editor: hands `Node` to the outlet when one is mounted. Returns
 * whether it did — when `false`, the editor renders the toolbar itself.
 */
export function usePublishedToolbar(Node: React.ReactNode): boolean {
  const Slot = React.useContext(ToolbarSlotContext);
  const [Owner] = React.useState(() => ({}));
  const HasOutlet = React.useSyncExternalStore(
    Slot?.Subscribe ?? SubscribeToNothing,
    Slot?.GetHasOutlet ?? GetFalse,
    Slot?.GetHasOutlet ?? GetFalse,
  );
  const Published = Slot !== null && HasOutlet;

  // No dependency list: the toolbar element closes over the editor's current
  // state, so every editor render republishes it.
  React.useLayoutEffect(() => {
    if (Published) Slot.Publish(Owner, Node);
  });

  React.useLayoutEffect(() => {
    if (!Published) return undefined;
    return () => Slot.Clear(Owner);
  }, [Published, Slot, Owner]);

  return Published;
}

const SubscribeToNothing = (): (() => void) => () => undefined;
const GetFalse = (): boolean => false;
