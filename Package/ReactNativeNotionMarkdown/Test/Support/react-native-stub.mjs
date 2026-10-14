/**
 * A minimal stand-in for `react-native`, so the package's components can be
 * rendered under plain Node (see `harness.mjs`). It models only the behavior
 * the editor depends on:
 *
 * - `TextInput` focus is exclusive, and `focus()` / `blur()` fire `onFocus` /
 *   `onBlur` the way the native side does.
 * - `Keyboard.dismiss()` blurs the focused input, as it does on a device.
 * - A disabled `Pressable` never receives `onPress`.
 *
 * Everything else renders as an inert host element that carries its props,
 * so tests can find elements by role or label and invoke their handlers.
 */

import * as React from "react";

const Host = (Type) => {
  const Component = ({ children, ...Props }) => React.createElement(Type, Props, children);
  Component.displayName = Type;
  return Component;
};

export const View = Host("rn-view");
export const Text = Host("rn-text");
export const ScrollView = Host("rn-scrollview");

export function Pressable({ children, disabled, onPress, ...Props }) {
  return React.createElement("rn-pressable", { ...Props, disabled, onPress: disabled ? undefined : onPress }, children);
}

let FocusedInput = null;

export function TextInput({ ref, autoFocus, ...Props }) {
  const Latest = React.useRef(Props);
  Latest.current = Props;

  const Handle = React.useMemo(() => {
    const Self = {
      focus: () => {
        if (FocusedInput === Self) return;
        FocusedInput?.blur();
        FocusedInput = Self;
        Latest.current.onFocus?.();
      },
      blur: () => {
        if (FocusedInput !== Self) return;
        FocusedInput = null;
        Latest.current.onBlur?.();
      },
      isFocused: () => FocusedInput === Self,
    };
    return Self;
  }, []);

  React.useImperativeHandle(ref, () => Handle, [Handle]);

  React.useEffect(() => {
    if (autoFocus) Handle.focus();
    // Unmounting a focused native input does not send a blur event to JavaScript.
    return () => {
      if (FocusedInput === Handle) FocusedInput = null;
    };
  }, [Handle, autoFocus]);

  return React.createElement("rn-textinput", { ...Props, __Handle: Handle });
}

const KeyboardListeners = new Map();

const Emit = (Name, Event) => {
  for (const Listener of [...(KeyboardListeners.get(Name) ?? [])]) Listener(Event);
};

export const Keyboard = {
  addListener: (Name, Listener) => {
    if (!KeyboardListeners.has(Name)) KeyboardListeners.set(Name, new Set());
    KeyboardListeners.get(Name).add(Listener);
    return { remove: () => KeyboardListeners.get(Name).delete(Listener) };
  },
  dismiss: () => {
    FocusedInput?.blur();
    Emit("keyboardDidHide", {});
  },
};

/** Test controls; not part of the real `react-native` API. */
export const TestKeyboard = {
  Show: (Height) => Emit("keyboardDidShow", { endCoordinates: { height: Height } }),
  Hide: () => Emit("keyboardDidHide", {}),
  Reset: () => {
    FocusedInput = null;
    KeyboardListeners.clear();
  },
};

export const StyleSheet = {
  create: (Styles) => Styles,
  hairlineWidth: 1,
  flatten: (Style) => Flatten(Style),
};

export const Platform = {
  OS: "android",
  select: (Options) => Options.android ?? Options.default,
};

function Flatten(Style) {
  if (Array.isArray(Style)) return Object.assign({}, ...Style.map(Flatten));
  return Style ?? {};
}
