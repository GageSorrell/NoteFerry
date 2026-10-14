import * as React from "react";
import { Keyboard, StyleSheet, View, type TextInput } from "react-native";
import { useNotionMarkdownTheme } from "./Theme.js";
import { ToolbarLayoutContext, type KeyboardAvoidance } from "./ToolbarSlot.js";

export type KeyboardToolbarPanel = "none" | "blockType" | "color" | "link";

export interface KeyboardToolbarRenderProps {
  readonly Panel: KeyboardToolbarPanel;
  readonly KeyboardHeight: number;
  readonly KeyboardVisible: boolean;
  readonly OpenPanel: (Panel: Exclude<KeyboardToolbarPanel, "none">) => void;
  readonly ClosePanel: () => void;
  readonly TogglePanel: (Panel: Exclude<KeyboardToolbarPanel, "none">) => void;
  readonly DismissKeyboard: () => void;
}

export interface KeyboardToolbarHostHandle {
  /** Closes any open panel without returning focus to the input. */
  readonly ClosePanel: () => void;
}

export interface KeyboardToolbarHostProps {
  readonly Render: (State: KeyboardToolbarRenderProps) => React.ReactNode;
  readonly PanelContent?: ((State: KeyboardToolbarRenderProps) => React.ReactNode) | undefined;
  /** A state request is useful for editor events such as typing `/`, which occur outside the toolbar. */
  readonly PanelRequest?: KeyboardToolbarPanel | undefined;
  readonly InputRef?: React.RefObject<TextInput | null> | undefined;
  /**
   * Called synchronously with every panel change, before the keyboard is
   * dismissed for a panel that replaces it — so the owner already knows a
   * panel is open when the input's resulting blur event arrives. `Refocus`
   * is true when the host is about to return focus to `InputRef` (a panel
   * closed from the toolbar), false when it will not (an imperative close,
   * or the keyboard reappearing for whatever the user tapped).
   */
  readonly OnPanelChange?: ((Panel: KeyboardToolbarPanel, Refocus: boolean) => void) | undefined;
  /** `"Overlay"` pins the toolbar to the bottom of its positioned ancestor; `"InFlow"` leaves it in normal layout. Defaults to the enclosing outlet's choice, else `"Overlay"`. */
  readonly Placement?: "Overlay" | "InFlow" | undefined;
  /** Defaults to the enclosing outlet's choice, else `"Package"`. */
  readonly KeyboardAvoidance?: KeyboardAvoidance | undefined;
  /** Space kept below the toolbar while no keyboard covers the bottom edge. Defaults to the enclosing outlet's choice, else 0. */
  readonly BottomInset?: number | undefined;
  readonly Style?: object | undefined;
  readonly ref?: React.Ref<KeyboardToolbarHostHandle> | undefined;
}

const DefaultKeyboardHeight = 300;

/** The link panel holds a text field of its own, so it rides above the keyboard; the other panels take the keyboard's place. */
const ReplacesKeyboard = (Panel: KeyboardToolbarPanel): boolean => Panel === "blockType" || Panel === "color";

/** Pins a toolbar above the OS keyboard and swaps a custom panel into the keyboard's last-known region. */
export function KeyboardToolbarHost({
  Render,
  PanelContent,
  PanelRequest,
  InputRef,
  OnPanelChange,
  Placement,
  KeyboardAvoidance: KeyboardAvoidanceProp,
  BottomInset: BottomInsetProp,
  Style,
  ref,
}: KeyboardToolbarHostProps): React.ReactElement {
  const Theme = useNotionMarkdownTheme();
  const Layout = React.useContext(ToolbarLayoutContext);
  const ResolvedPlacement = Placement ?? Layout.Placement;
  const ResolvedAvoidance = KeyboardAvoidanceProp ?? Layout.KeyboardAvoidance;
  const BottomInset = BottomInsetProp ?? Layout.BottomInset;

  const [Panel, SetPanelState] = React.useState<KeyboardToolbarPanel>("none");
  const [KeyboardHeight, SetKeyboardHeight] = React.useState(DefaultKeyboardHeight);
  const [KeyboardVisible, SetKeyboardVisible] = React.useState(false);

  const PanelRef = React.useRef<KeyboardToolbarPanel>("none");
  const OnPanelChangeRef = React.useRef(OnPanelChange);
  OnPanelChangeRef.current = OnPanelChange;

  const SetPanel = React.useCallback((Next: KeyboardToolbarPanel, Refocus = false): void => {
    if (PanelRef.current === Next) return;
    PanelRef.current = Next;
    OnPanelChangeRef.current?.(Next, Refocus);
    SetPanelState(Next);
  }, []);

  React.useEffect(() => {
    const ShowSubscription = Keyboard.addListener("keyboardDidShow", (Event) => {
      SetKeyboardHeight(Event.endCoordinates.height);
      SetKeyboardVisible(true);
      // The keyboard coming back (the user tapped into a block) reclaims the region a keyboard-replacing panel was occupying.
      if (ReplacesKeyboard(PanelRef.current)) SetPanel("none");
    });
    const HideSubscription = Keyboard.addListener("keyboardDidHide", () => SetKeyboardVisible(false));
    return () => {
      ShowSubscription.remove();
      HideSubscription.remove();
    };
  }, [SetPanel]);

  const FocusInput = React.useCallback((): void => {
    requestAnimationFrame(() => InputRef?.current?.focus());
  }, [InputRef]);

  const OpenPanel = React.useCallback((NextPanel: Exclude<KeyboardToolbarPanel, "none">): void => {
    SetPanel(NextPanel);
    if (ReplacesKeyboard(NextPanel)) Keyboard.dismiss();
  }, [SetPanel]);

  const ClosePanel = React.useCallback((): void => {
    SetPanel("none", true);
    FocusInput();
  }, [FocusInput, SetPanel]);

  const TogglePanel = React.useCallback((NextPanel: Exclude<KeyboardToolbarPanel, "none">): void => {
    if (PanelRef.current === NextPanel) ClosePanel();
    else OpenPanel(NextPanel);
  }, [ClosePanel, OpenPanel]);

  React.useEffect(() => {
    if (PanelRequest === undefined || PanelRequest === "none") return;
    OpenPanel(PanelRequest);
  }, [PanelRequest, OpenPanel]);

  React.useImperativeHandle(ref, () => ({ ClosePanel: () => SetPanel("none") }), [SetPanel]);

  const DismissKeyboard = React.useCallback((): void => Keyboard.dismiss(), []);
  const State: KeyboardToolbarRenderProps = { Panel, KeyboardHeight, KeyboardVisible, OpenPanel, ClosePanel, TogglePanel, DismissKeyboard };

  // The keyboard covers the bottom edge only while it is up and no panel has taken its place.
  const KeyboardCoversBottom = KeyboardVisible && !ReplacesKeyboard(Panel);
  const KeyboardOffset = ResolvedAvoidance === "Package" && KeyboardCoversBottom ? KeyboardHeight : 0;
  const PositionStyle = ResolvedPlacement === "Overlay" ? [Styles.Overlay, { bottom: KeyboardOffset }] : { marginBottom: KeyboardOffset };
  const ContentStyle = {
    backgroundColor: Theme.Surface,
    borderColor: Theme.Border,
    paddingBottom: KeyboardCoversBottom ? 0 : BottomInset,
  };

  return (
    <View pointerEvents="box-none" style={[PositionStyle, Style]}>
      <View style={[Styles.Content, ContentStyle]}>
        {Render(State)}
        {Panel !== "none" ? (
          <View style={[Styles.Panel, { backgroundColor: Theme.Surface, borderTopColor: Theme.Border }, ReplacesKeyboard(Panel) ? { height: KeyboardHeight } : null]}>
            {PanelContent?.(State)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const Styles = StyleSheet.create({
  Overlay: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  Content: {
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
  Panel: {
    borderTopWidth: 1,
  },
});
