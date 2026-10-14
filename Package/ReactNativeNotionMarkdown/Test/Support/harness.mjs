/**
 * Renders the package's built components under plain Node: `react-native`
 * is redirected to `react-native-stub.mjs`, and `test-renderer` provides a
 * tree of host elements. Importing this module installs the redirect, so it must
 * be imported before anything under `Distribution/` that touches a component
 * — the `Package` export below does that import for you.
 */

import { registerHooks } from "node:module";

const StubUrl = new URL("./react-native-stub.mjs", import.meta.url).href;

registerHooks({
  resolve(Specifier, Context, NextResolve) {
    if (Specifier === "react-native") return { url: StubUrl, shortCircuit: true };
    return NextResolve(Specifier, Context);
  },
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = (Callback) => setTimeout(Callback, 0);

export const React = await import("react");
export const { TestKeyboard, StyleSheet } = await import("./react-native-stub.mjs");
export const Package = await import("../../Distribution/index.js");
const { createRoot } = await import("test-renderer");

export const { act } = React;

/** Lets queued `requestAnimationFrame` callbacks (the editor's focus calls) and their effects run. */
export async function Settle() {
  await act(async () => {
    await new Promise((Resolve) => setTimeout(Resolve, 5));
  });
}

export async function Render(Element) {
  const Root = createRoot();
  await act(async () => {
    Root.render(Element);
  });
  await Settle();
  return {
    root: Root.container,
    Update: async (Next) => {
      await act(async () => {
        Root.render(Next);
      });
      await Settle();
    },
    Unmount: async () => {
      await act(async () => {
        Root.unmount();
      });
    },
  };
}

export const Flat = (Node) => StyleSheet.flatten(Node.props.style);

export const FindAll = (Root, Predicate) => Root.queryAll(Predicate);

export const ByLabel = (Root, Label) => FindAll(Root, (Node) => Node.props.accessibilityLabel === Label);

export const Inputs = (Root) => FindAll(Root, (Node) => Node.type === "rn-textinput");

/** The pressable rows of blocks that are not being edited, in document order. */
export const StaticBlocks = (Root) => FindAll(Root, (Node) => Node.type === "rn-pressable" && "accessibilityHint" in Node.props);

export async function Press(Node) {
  await act(async () => {
    Node.props.onPress?.();
  });
  await Settle();
}

export async function Type(Root, Text) {
  const [Input] = Inputs(Root);
  await act(async () => {
    Input.props.onChangeText(Text);
  });
}

export function TextOf(Node) {
  if (typeof Node === "string") return Node;
  return (Node.children ?? []).map(TextOf).join("");
}
