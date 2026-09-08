/**
 * @react-native-community/cli project config.
 *
 * Both entries below exclude a package from Windows autolinking
 * (`dependency.platforms.windows = null`, the standard, documented
 * `@react-native-community/cli` mechanism) without touching the dependency
 * itself. Both packages stay real dependencies of `@noteferry/ui` for the
 * Expo/mobile build; Windows autolinking doesn't care about direct vs.
 * transitive — it walks the whole installed dependency tree — so without
 * these overrides it would still try to autolink each one's Windows native
 * module even though this app never installs either directly.
 *
 * - `@react-native-async-storage/async-storage`: used by `@noteferry/ui`'s
 *   `Platform` seam on the Expo/mobile build (see
 *   `Package/Ui/Source/Platform/index.tsx`). Its Windows native module
 *   (`ReactNativeAsyncStorage.vcxproj`) was a real MSBuild-fragility point
 *   in this app and is unnecessary here regardless: the Windows build's
 *   `Platform` adapter (`Package/Ui/Source/Platform/index.windows.tsx`)
 *   never calls into it — its `KeyValueStore` default is a plain in-memory
 *   store.
 * - `react-native-svg`: used directly by `@noteferry/ui`'s mobile-only
 *   files (`Button.tsx`, `Meter.tsx`, `Spinner.tsx`) and by
 *   `lucide-react-native` (its own peer dependency). Its Windows native
 *   module doesn't currently build on this app's Fabric/New-Architecture
 *   toolchain — see the confirmed, open upstream issue at
 *   https://github.com/software-mansion/react-native-svg/issues/2745 — so
 *   every `.windows.tsx` file that would otherwise need it (`Icon.windows.tsx`,
 *   `Button.windows.tsx`, `Meter.windows.tsx`, `Spinner.windows.tsx`) renders
 *   through RNW's own native SVG support instead (RN core `Image`
 *   recognizing an SVG payload via WinUI's `SvgImageSource`) — see
 *   `Icon.windows.tsx`'s header comment for the full story.
 */
module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        windows: null,
      },
    },
    'react-native-svg': {
      platforms: {
        windows: null,
      },
    },
  },
};
