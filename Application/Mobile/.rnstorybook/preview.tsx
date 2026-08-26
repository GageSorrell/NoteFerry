/**
 * @module noteferry/.rnstorybook/preview
 * @internal
 *
 * @file      preview.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Decorator, Preview } from "@storybook/react-native";
import { MakeStyles, ThemeProvider, ViewStyle } from "@noteferry/ui";
import type { PartialStoryFn, StoryContext } from "storybook/internal/types";
import { View } from "react-native";

/**
 * Renders one story inside its themed stage. A separate component from
 * `withNoteFerryTheme` on purpose — `useStyles` (like any `@noteferry/ui` token
 * hook) needs a `ThemeProvider` ancestor, and a component can't read a
 * context it renders for the first time in its own body; only descendants
 * (like this one) see it.
 */
const StoryStage = ({
    Fullscreen,
    Story
}: {
    readonly Fullscreen: boolean;
    readonly Story: PartialStoryFn;
}): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ Fullscreen ? Styles.Fullscreen : Styles.Stage }>
            <Story />
        </View>
    );
};

// Every story here renders a `@noteferry/ui` component, and every one of
// those reads design tokens via `ThemeProvider`'s hooks (`useColor`,
// `useTypography`, ...) — so every story needs a `ThemeProvider` ancestor,
// applied once here rather than repeated in each `.stories.tsx` file.
const withNoteFerryTheme: Decorator = (
    Story: PartialStoryFn,
    Context: StoryContext
) => (
    <ThemeProvider>
        <StoryStage
            Fullscreen={ Context.parameters.layout === "fullscreen" }
            Story={ Story }
        />
    </ThemeProvider>
);

const preview: Preview =
    {
        decorators: [ withNoteFerryTheme ],
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

const useStyles = MakeStyles({
    Fullscreen: ViewStyle({
        flex: 1,
        width: "100%"
    }),
    Stage: ViewStyle({
        alignItems: "center",
        flex: 1,
        gap: 16,
        justifyContent: "center",
        padding: 24
    })
});
