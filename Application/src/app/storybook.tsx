/**
 * The in-app dev route for Storybook (`/storybook`, guarded to `__DEV__` in
 * `_layout.tsx`). This intentionally does NOT re-export `.rnstorybook/index.ts`:
 * that file is the *native entry-swap* target for `npm run storybook`
 * (`metro.config.js`'s `withStorybook` substitutes it for `expo-router/entry`
 * itself when `STORYBOOK_ENABLED=true`, so expo-router never loads at all in
 * that mode) and calls `registerRootComponent` as a side effect of being
 * imported. Importing it from here — a normal route, rendered inside the
 * already-running expo-router app — would re-run that
 * `registerRootComponent` call and could re-register the app's native root.
 * This route builds its own `StorybookUIRoot` from the same
 * `storybook.requires` instead, with no such side effect.
 *
 * @module notivex/app/storybook
 *
 * @file      storybook.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { view } from "../../.rnstorybook/storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
    shouldPersistSelection: true,
    storage:
    {
        getItem: AsyncStorage.getItem,
        setItem: AsyncStorage.setItem
    }
});

export default StorybookUIRoot;
