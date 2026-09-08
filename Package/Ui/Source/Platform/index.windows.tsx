/**
 * Windows variant of the `Platform` seam — see `index.tsx`'s header comment
 * for what this context is for. Two capabilities need Windows-specific
 * defaults here:
 *
 * - `PickImage`: there is no built-in Windows default the way
 *   `expo-image-picker` is the built-in mobile default, so this file's
 *   default throws a documented "not implemented" error until
 *   `Application/Windows` mounts a `PlatformAdapterProvider` with a real
 *   `PickImage` backed by its native `Windows.Storage.Pickers` Turbo Module
 *   (`FileOpenPicker`, constrained to image extensions, initialized against
 *   the app's `HWND` via `IInitializeWithWindow::Initialize` — required
 *   because this is a Win32/WinUI3 desktop app, not UWP).
 * - `KeyValueStore`: `@react-native-async-storage/async-storage`'s own
 *   Windows native module (`windows/ReactNativeAsyncStorage.vcxproj` in that
 *   package) turned out to be a real build-fragility point in this app's
 *   MSBuild pipeline, and the only consumer (`IconMenu`'s "Recent" chips) is
 *   a non-critical nicety — so rather than depend on that native module at
 *   all here, this file's default is a plain in-memory `Map`. It works
 *   immediately, adds no native dependency, and just doesn't survive an app
 *   restart; swap in a real persisted implementation later via
 *   `PlatformAdapterProvider` if that's ever worth a native module. See
 *   `Application/Windows/react-native.config.js`, which excludes
 *   `@react-native-async-storage/async-storage` from Windows autolinking
 *   entirely so it's never even built for this platform.
 *
 * Until the `PickImage` module lands, the stub below keeps the rest of the
 * package (and `IconMenu.windows.tsx`/`CoverPicker.windows.tsx`
 * specifically) working everywhere except the actual "Choose from Photos"
 * action.
 *
 * @module @noteferry/ui/Platform
 *
 * @file      index.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";

/** The result of a successful `PlatformAdapter.PickImage()` call. */
export interface PickedImage
{
    readonly Uri: string;
}

/**
 * A small persisted key/value store — this package's only need is a short
 * most-recently-used id list (`IconMenu`'s "Recent" emoji/icon chips), so
 * this is deliberately not a general `AsyncStorage`-shaped API.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export interface KeyValueStore
{
    /** Resolves `undefined` if `Key` was never set. */
    readonly GetItem: (Key: string) => Promise<string | undefined>;
    readonly SetItem: (Key: string, Value: string) => Promise<void>;
}

/**
 * The platform-specific capabilities this package can't resolve via a
 * build-time `.windows.tsx` file swap alone.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export interface PlatformAdapter
{
    /** Resolves `undefined` if the user cancels or denies permission. */
    readonly PickImage: () => Promise<PickedImage | undefined>;
    readonly KeyValueStore: KeyValueStore;
}

const NotImplementedPickImage = (): Promise<PickedImage | undefined> =>
    Promise.reject(new Error(
        "[@noteferry/ui] `PickImage` is not implemented on this Windows build yet. " +
        "Mount a `PlatformAdapterProvider` (from `@noteferry/ui/Platform`) near the app root " +
        "with a `PickImage` backed by the native `Windows.Storage.Pickers` Turbo Module."
    ));

/* Module-level, not per-adapter-instance: mirrors AsyncStorage's own
 * single-app-wide-store behavior on Windows (no scoped/instance storages),
 * and survives for the life of the process — just not across restarts. */
const MemoryStore = new Map<string, string>();

const InMemoryKeyValueStore: KeyValueStore = Object.freeze({
    GetItem: async (Key: string) => MemoryStore.get(Key),
    SetItem: async (Key: string, Value: string) =>
    {
        MemoryStore.set(Key, Value);
    }
});

const DefaultPlatformAdapter: PlatformAdapter = Object.freeze({
    KeyValueStore: InMemoryKeyValueStore,
    PickImage: NotImplementedPickImage
});

const PlatformAdapterContext = React.createContext<PlatformAdapter>(DefaultPlatformAdapter);

/** {@inheritDoc PlatformAdapterProvider} */
export interface PlatformAdapterProviderProps extends React.PropsWithChildren
{
    readonly Adapter: PlatformAdapter;
}

export/**
       * Overrides the `PlatformAdapter` seen by `usePlatformAdapter()` for the
       * wrapped subtree. `Application/Windows` mounts this once, near the app
       * root, with a real `PickImage` once the native module lands.
       *
       * @category Provider
       * @since 1.0.0
       */
const PlatformAdapterProvider = ({ Adapter, children }: PlatformAdapterProviderProps): React.JSX.Element =>
    <PlatformAdapterContext.Provider value={ Adapter }>
        { children }
    </PlatformAdapterContext.Provider>;

export/**
       * Returns the active `PlatformAdapter` — a "not implemented" stub unless
       * overridden by a `PlatformAdapterProvider`.
       *
       * @category Hook
       * @since 1.0.0
       */
const usePlatformAdapter = (): PlatformAdapter => React.useContext(PlatformAdapterContext);
