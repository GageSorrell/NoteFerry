/**
 * Root theme/token provider for `@notivex/ui`.
 *
 * Internally this resolves every design token (`Token.Color`,
 * `Token.Semantic`, `Token.Size`, `Token.Spacing`, `Token.Radii`,
 * `Token.Typography`, `Token.Shadow`) against the current light/dark mode using `effect`
 * (`Context.Tag` + `Effect.gen`) — but that is strictly an implementation
 * detail. Nothing exported from this module ever returns an `Effect`,
 * `Layer`, `Context.Tag`, or any other `effect` type; every hook below
 * returns a plain string, number, or object.
 *
 * `ThemeProvider` also embeds React Navigation's own `ThemeProvider` (from
 * `expo-router`) and feeds it a background color resolved from the
 * `Semantic.BackgroundMain` token, so the app-wide navigation background tracks
 * light/dark mode automatically. Apps wrap with this provider alone and must
 * not additionally mount `expo-router`'s `ThemeProvider`.
 *
 * @module @notivex/ui/ThemeProvider
 *
 * @file      ThemeProvider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Color from "./Token/Color.js";
import * as ColorValue from "./Token/ColorValue.js";
import type * as Radii from "./Token/Radii.js";
import * as RadiiValue from "./Token/RadiiValue.js";
import * as React from "react";
import * as Semantic from "./Token/Semantic.js";
import * as SemanticValue from "./Token/SemanticValue.js";
import type * as Shadow from "./Token/Shadow.js";
import * as ShadowValue from "./Token/ShadowValue.js";
import type * as Size from "./Token/Size.js";
import * as SizeValue from "./Token/SizeValue.js";
import type * as Spacing from "./Token/Spacing.js";
import * as SpacingValue from "./Token/SpacingValue.js";
import type * as Typography from "./Token/Typography.js";
import * as TypographyValue from "./Token/TypographyValue.js";
import { Context, Effect } from "effect";
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    ThemeProvider as NavigationThemeProvider
} from "expo-router";
import { useColorScheme } from "react-native";

type ThemeMode =
    | "Light"
    | "Dark";

/** The live theme mode, threaded through the resolution program via `Context.Service`. */
class ThemeModeTag extends
    Context.Service<ThemeModeTag, ThemeMode>()("@notivex/ui/ThemeProvider/ThemeMode") { }

interface TokenResolver
{
    readonly ResolveColor: (Token: Color.Color | Semantic.Semantic) => string | undefined;
    readonly ResolveSize: (Token: Size.Size) => number | undefined;
    readonly ResolveSpacing: (Token: Spacing.Spacing) => number | undefined;
    readonly ResolveRadii: (Token: Radii.Radii) => number | undefined;
    readonly ResolveTypography: (Token: Typography.Typography) => TypographyValue.TypographyValue | undefined;
    readonly ResolveShadow: (Token: Shadow.Shadow) => ShadowValue.ShadowValue | undefined;
}

const BuildResolver: Effect.Effect<TokenResolver, never, ThemeModeTag> = Effect.gen(function* ()
{
    const Mode = yield* ThemeModeTag;

    const ResolveColor: TokenResolver["ResolveColor"] = (Token: Color.Color | Semantic.Semantic) =>
        ColorValue.Resolve(Token as Color.Color) ?? SemanticValue.Resolve(Token as Semantic.Semantic, Mode);

    return {
        ResolveColor,
        ResolveRadii: RadiiValue.Resolve,
        ResolveShadow: ShadowValue.Resolve,
        ResolveSize: SizeValue.Resolve,
        ResolveSpacing: SpacingValue.Resolve,
        ResolveTypography: TypographyValue.Resolve
    } as const;
});

const ResolveTokensForMode = (Mode: ThemeMode): TokenResolver =>
    Effect.runSync(Effect.provideService(BuildResolver, ThemeModeTag, Mode));

const TokenResolverContext = React.createContext<TokenResolver | undefined>(undefined);

interface ThemeState
{
    readonly Mode: ThemeMode;
    readonly SetMode: (Mode: ThemeMode | "System") => void;
}

const ThemeContext = React.createContext<ThemeState | undefined>(undefined);

/** {@inheritDoc ThemeProvider} */
export interface ThemeProviderProps extends React.PropsWithChildren
{
    /**
     * `"Light"` / `"Dark"` pin the theme; `"System"` (the default) follows
     * the device's `Appearance` setting and can still be overridden at
     * runtime via `useTheme().SetMode`.
     */
    readonly ColorScheme?: ThemeMode | "System";
}

export/**
       * Root provider for `@notivex/ui`. Wrap your app once, near the root.
       *
       * This also mounts React Navigation's `ThemeProvider` internally, with its
       * `colors.background` bound to the `Semantic.BackgroundMain` token, so the
       * app-wide screen background is theme-aware out of the box. Consumers must
       * therefore NOT also render their own `<ThemeProvider>` from `expo-router`.
       *
       * @category Provider
       * @since 1.0.0
       */
const ThemeProvider = ({ ColorScheme = "System", children }: ThemeProviderProps): React.JSX.Element =>
{
    const SystemColorScheme = useColorScheme();
    const [ Override, SetOverride ] = React.useState<ThemeMode | undefined>(
        ColorScheme === "System" ? undefined : ColorScheme
    );

    React.useEffect(() =>
    {
        if (ColorScheme !== "System")
        {
            SetOverride(ColorScheme);
        }
    }, [ ColorScheme ]);

    const Mode: ThemeMode = Override ?? (SystemColorScheme === "dark" ? "Dark" : "Light");

    const Resolver = React.useMemo(() => ResolveTokensForMode(Mode), [ Mode ]);

    /* The embedded React Navigation theme (see the wrapper below). We derive its
     * `colors.background` from our own `Semantic.BackgroundMain` token so the
     * app-wide screen background stays in lock-step with the design system and
     * flips with light/dark mode, instead of React Navigation's stock white/black. */
    const NavigationTheme = React.useMemo(() =>
    {
        const Base = Mode === "Dark" ? NavigationDarkTheme : NavigationDefaultTheme;
        const Background = Resolver.ResolveColor(Semantic.BackgroundMain);

        return {
            ...Base,
            colors: {
                ...Base.colors,
                background: Background ?? Base.colors.background
            }
        };
    }, [ Mode, Resolver ]);

    const SetMode = React.useCallback((NextMode: ThemeMode | "System") =>
    {
        SetOverride(NextMode === "System" ? undefined : NextMode);
    }, [ ]);

    const ThemeState = React.useMemo<ThemeState>(() => ({ Mode, SetMode }), [ Mode, SetMode ]);

    /* This provider embeds React Navigation's `ThemeProvider` so that the
     * app-wide navigation background is driven by our `Semantic.BackgroundMain`
     * token (via `NavigationTheme` above). Because of this, apps should NOT mount
     * their own `<ThemeProvider>` from `expo-router` — wrapping in this single
     * `@notivex/ui` provider is sufficient. */
    return (
        <TokenResolverContext.Provider value={ Resolver }>
            <ThemeContext.Provider value={ ThemeState }>
                <NavigationThemeProvider value={ NavigationTheme }>
                    { children }
                </NavigationThemeProvider>
            </ThemeContext.Provider>
        </TokenResolverContext.Provider>
    );
};

const useTokenResolver = (): TokenResolver =>
{
    const Resolver = React.useContext(TokenResolverContext);

    if (Resolver === undefined)
    {
        throw new Error("[@notivex/ui] A `Token` hook was used outside of `<ThemeProvider>`.");
    }

    return Resolver;
};

export/**
       * The current resolved theme mode, plus a setter to override light/dark/system.
       */
const UseTheme = (): ThemeState =>
{
    const Value = React.useContext(ThemeContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] `useTheme` was used outside of `<ThemeProvider>`.");
    }

    return Value;
};

export/**
       * Resolves a `Token.Color.*` or `Token.Semantic.*` symbol to an RN-compatible color string.
       */
const UseColor = (Token: Color.Color | Semantic.Semantic): string =>
{
    const Resolved = useTokenResolver().ResolveColor(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown color token.");
    }

    return Resolved;
};

export/**
       * Resolves a `Token.Size.*` symbol to a pixel number.
       */
const useSize = (Token: Size.Size): number =>
{
    const Resolved = useTokenResolver().ResolveSize(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown size token.");
    }

    return Resolved;
};

export/**
       * Resolves a `Token.Spacing.*` symbol to a pixel number.
       */
const useSpacing = (Token: Spacing.Spacing): number =>
{
    const Resolved = useTokenResolver().ResolveSpacing(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown spacing token.");
    }

    return Resolved;
};

export/**
       * Resolves a `Token.Radii.*` symbol to a pixel number.
       */
const useRadii = (Token: Radii.Radii): number =>
{
    const Resolved = useTokenResolver().ResolveRadii(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown radii token.");
    }

    return Resolved;
};

export/**
       * Resolves a `Token.Shadow.*` symbol to an RN shadow/border style object.
       */
const useShadow = (Token: Shadow.Shadow): ShadowValue.ShadowValue =>
{
    const Resolved = useTokenResolver().ResolveShadow(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown shadow token.");
    }

    return Resolved;
};

export/**
       * Resolves a `Token.Typography.*` symbol to `{ FontSize, LineHeight, FontWeight }`.
       */
const useTypography = (Token: Typography.Typography): TypographyValue.TypographyValue =>
{
    const Resolved = useTokenResolver().ResolveTypography(Token);

    if (Resolved === undefined)
    {
        throw new Error("[@notivex/ui] Unknown typography token.");
    }

    return Resolved;
};
