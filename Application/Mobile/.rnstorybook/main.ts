/**
 * @module noteferry/.rnstorybook/main
 * @internal
 *
 * @file      main.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig =
    {
        deviceAddons: [ "@storybook/addon-ondevice-controls", "@storybook/addon-ondevice-actions" ],
        stories: [ "./stories/**/*.stories.?(ts|tsx|js|jsx)" ]
    };

export default main;
