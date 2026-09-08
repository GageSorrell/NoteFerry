module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // @react-native/babel-preset doesn't include this on its own. @noteferry/ui
  // (a dependency, not transpiled by this app's own babel.config.js — Metro
  // only applies this config to source under this app's own root, but it
  // still runs the SAME preset over @noteferry/ui's precompiled
  // Distribution/*.js output as it bundles) uses `export * as X from "...";`
  // (e.g. Core.ts's `export * as Token from "./Token/index.js"`) — valid
  // ES2020+ syntax that `tsc` passes through unchanged when compiling that
  // package, but which needs this plugin to reach Hermes bytecode. The
  // Expo/mobile build never hits this because `babel-preset-expo` already
  // includes it.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
