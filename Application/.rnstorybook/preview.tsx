/**
 *
 *
 * @module notivex/.rnstorybook/preview
 *
 * @file      preview.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ThemeProvider } from "@notivex/ui";
import type { Decorator, Preview } from "@storybook/react-native";
import { StyleSheet, View } from "react-native";
import type { PartialStoryFn } from "storybook/internal/types";

// Every story here renders a `@notivex/ui` component, and every one of
// those reads design tokens via `ThemeProvider`'s hooks (`useColor`,
// `useTypography`, ...) — so every story needs a `ThemeProvider` ancestor,
// applied once here rather than repeated in each `.stories.tsx` file.
const withNotivexTheme: Decorator = (Story: PartialStoryFn) => (
    <ThemeProvider>
        <View style={ styles.stage }>
            <Story />
        </View>
    </ThemeProvider>
);

const preview: Preview =
    {
        decorators: [ withNotivexTheme ],
        parameters:
        {
            controls:
            {
                matchers:
                {
                    color: /(background|color)$/i,
                    date: /Date$/
                }
            }
        }
    };

export default preview;

const styles = StyleSheet.create({
    stage:
    {
        alignItems: "center",
        flex: 1,
        gap: 16,
        justifyContent: "center",
        padding: 24
    }
});
