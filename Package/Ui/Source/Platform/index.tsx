/**
 * A narrow, `React.createContext`-based seam for the handful of behaviors
 * across this package that a build-time `.windows.tsx` file swap can't
 * express by itself, because each has no shared cross-platform API:
 *
 * - Picking an image file (`expo-image-picker` on the Expo/mobile build,
 *   `Windows.Storage.Pickers` on Windows).
 * - Small persisted key/value reads and writes (`@react-native-async-storage/
 *   async-storage` on the Expo/mobile build; Windows has no equivalent
 *   dependency wired up — see `index.windows.tsx`).
 *
 * Everything else in `@noteferry/ui` resolves per-platform via Metro's file
 * resolution alone — this context exists solely so `IconMenu.tsx`/
 * `IconMenu.windows.tsx`/`CoverPicker.windows.tsx` can call
 * `usePlatformAdapter()` and let the host app decide how.
 *
 * This module's own default (used when no `PlatformAdapterProvider` wraps
 * the tree) already works out of the box on the Expo/mobile build via
 * `expo-image-picker`/`@react-native-async-storage/async-storage` — see
 * `index.windows.tsx` for the Windows build's defaults instead.
 *
 * @module @noteferry/ui/Platform
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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

const DefaultPickImage = async (): Promise<PickedImage | undefined> =>
{
    const Permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!Permission.granted)
    {
        return undefined;
    }

    const Result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ "images" ],
        quality: 0.9
    });

    const Asset = Result.canceled ? undefined : Result.assets[ 0 ];

    return Asset === undefined ? undefined : { Uri: Asset.uri };
};

const DefaultKeyValueStore: KeyValueStore = Object.freeze({
    GetItem: async (Key: string) => (await AsyncStorage.getItem(Key)) ?? undefined,
    SetItem: (Key: string, Value: string) => AsyncStorage.setItem(Key, Value)
});

const DefaultPlatformAdapter: PlatformAdapter = Object.freeze({
    KeyValueStore: DefaultKeyValueStore,
    PickImage: DefaultPickImage
});

const PlatformAdapterContext = React.createContext<PlatformAdapter>(DefaultPlatformAdapter);

/** {@inheritDoc PlatformAdapterProvider} */
export interface PlatformAdapterProviderProps extends React.PropsWithChildren
{
    readonly Adapter: PlatformAdapter;
}

export/**
       * Overrides the `PlatformAdapter` seen by `usePlatformAdapter()` for the
       * wrapped subtree. The Expo/mobile build never needs this — its default
       * already works — but a Windows host app mounts this once, near the app
       * root, with a real `PickImage` backed by its native `Windows.Storage.Pickers`
       * module.
       *
       * @category Provider
       * @since 1.0.0
       */
const PlatformAdapterProvider = ({ Adapter, children }: PlatformAdapterProviderProps): React.JSX.Element =>
    <PlatformAdapterContext.Provider value={ Adapter }>
        { children }
    </PlatformAdapterContext.Provider>;

export/**
       * Returns the active `PlatformAdapter` — the default `expo-image-picker`-backed
       * one on the Expo/mobile build unless overridden by a `PlatformAdapterProvider`.
       *
       * @category Hook
       * @since 1.0.0
       */
const usePlatformAdapter = (): PlatformAdapter => React.useContext(PlatformAdapterContext);
