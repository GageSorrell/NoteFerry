This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Windows

## Visual Studio requirements

Building `windows/Windows.sln` needs **Visual Studio 2022** (17.x), not Visual Studio 2026 (18.x, installed at `...\Microsoft Visual Studio\18\...`) — even though `@react-native-windows/cli@0.84.0`'s own default `MinimumVisualStudioVersion` is `18.6.0` and will happily pick a VS 2026 install over a VS 2022 one if both are present. This app's generated `.vcxproj`s (and every autolinked native module's, e.g. `react-native-svg`) still target the `v143` platform toolset, and **VS 2026 doesn't ship `v143` at all** (it ships `v145`) — so a build under VS 2026 fails at compile time with `MSB8020: The build tools for 'v143' ... cannot be found`, no matter what workloads/components are installed there. `npm run start`'s `start` script pins `MinimumVisualStudioVersion=17.0` so the CLI's VS-instance search only considers `[17.0, 18.0)` (i.e. VS 2022), rather than requiring 18.6.0+. Once `react-native-windows` officially supports the `v145` toolset, that pin (and this note) can go away.

In your VS 2022 install, the classic **"Universal Windows Platform development"** workload was folded into **"WinUI application development"** starting in 17.10 — on the Workloads tab, check **WinUI application development**, then in its **Installation details** pane check **"C++ (v143) Universal Windows Platform tools"** (plus a matching Windows 10 SDK, e.g. `10.0.19041.0`, under Individual components if it isn't already selected).

## VS Code debugging (`Script/PatchReactNativeTools`)

The installed **React Native Tools** VS Code extension (`msjsdiag.vscode-react-native`) has two
Windows-only bugs that break RNW debugging in this monorepo. `Script/PatchReactNativeTools` works
around both automatically, wired via `.vscode/tasks.json` to run on every folder open and as a
`preLaunchTask` before both RNW debug configs in `.vscode/launch.json`. See
`Script/PatchReactNativeTools/Source/index.ts` for details.

1. **`spawn EINVAL`** — the extension spawns `react-native.cmd` without `{ shell: true }`, which
   throws `spawn EINVAL` on Windows since a Node.js security patch from April 2024
   ([CVE-2024-27980](https://github.com/microsoft/vscode-react-native/issues/2180)). Breaks both
   "Run Windows" and, indirectly, the packager auto-start used by "Attach to packager" — still
   present in the extension's current latest release, with no settings-only workaround. The
   script patches the extension's bundled JS on disk (adding `shell: true` on Windows only). That
   patch lives outside this repo (in `%USERPROFILE%\.vscode\extensions\...`), so it's wiped out
   whenever VS Code auto-updates the extension — if that happens, the task re-patches it and pops
   a native modal telling you to reload the window before retrying.

2. **`OpnPackagerLocationNotFound`** — before starting the packager, the extension also looks for
   the `open` npm package via a hardcoded `<project>/node_modules/open/index.js` check, with no
   awareness of npm workspaces hoisting `open` to this repo's root `node_modules` instead. The
   script creates a directory junction at `Application/Windows/node_modules/open` pointing at the
   real, hoisted copy. This takes effect immediately (no VS Code reload needed), so it never
   blocks the launch — unless `open` isn't installed anywhere at all, which means `npm install`
   needs to be run.

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
