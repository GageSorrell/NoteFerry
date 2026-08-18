/**
 * @module notivex/.rnstorybook
 * @internal
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerRootComponent } from "expo";
import { view } from "./storybook.requires";

/**
 * This file is user-editable.
 *
 * Use it as your React Native Storybook entrypoint and wrap `StorybookUIRoot`
 * with application decorators/providers (theme, i18n, state, navigation, etc).
 */
const StorybookUIRoot = view.getStorybookUI({
    shouldPersistSelection: true,
    storage:
    {
        getItem: AsyncStorage.getItem,
        setItem: AsyncStorage.setItem
    }
});

registerRootComponent(StorybookUIRoot);
