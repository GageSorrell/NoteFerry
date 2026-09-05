/**
 * Windows variant of the root theme/token provider for `@noteferry/ui`.
 *
 * Identical to `ThemeProvider.tsx` except it does not embed React
 * Navigation's `ThemeProvider` (from `expo-router`) — a bare React Native for
 * Windows app is not assumed to run React Navigation at all, and
 * `expo-router` is not resolvable there. The nav-theme wrapper below is a
 * plain passthrough instead.
 *
 * @module @noteferry/ui/ThemeProvider
 *
 * @file      ThemeProvider.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "./Token/Color.js";
import * as Radii from "./Token/Radii.js";
import * as React from "react";
import * as Semantic from "./Token/Semantic.js";
import * as Shadow from "./Token/Shadow.js";
import * as Size from "./Token/Size.js";
import * as Spacing from "./Token/Spacing.js";
import * as Typography from "./Token/Typography.js";
import type * as Array from "effect/Array";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Record from "effect/Record";
import type { ReadonlyRecord } from "effect/Record";
import { useColorScheme } from "react-native";

/** A color-scheme mode understood by `ThemeProvider`. */
export type ThemeMode =
    | "Light"
    | "Dark";

type SymbolTokenKeys<Tokens extends object> = {
    [Name in keyof Tokens]: Tokens[Name] extends symbol ? Name : never
}[keyof Tokens];

type NestedTokenCategoryKeys<Tokens extends object> = {
    [Category in keyof Tokens]:
    Tokens[Category] extends (...Arguments: ReadonlyArray<never>) => unknown
        ? never
        : Tokens[Category] extends object
            ? Category
            : never
}[keyof Tokens];

/** The resolved string values for every `Token.Color` entry. */
export type ResolvedColorTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Color>]: string }>;

/** The resolved string values for every `Token.Semantic` entry. */
export type ResolvedSemanticTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Semantic>]: string }>;

/** The resolved numeric values for every `Token.Radii` entry. */
export type ResolvedRadiiTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Radii>]: number }>;

/** The resolved shadow-style values for every `Token.Shadow` entry. */
export type ResolvedShadowTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Shadow>]: Shadow.ShadowValue }>;

/** The resolved numeric values for every nested `Token.Size` entry. */
export type ResolvedSizeTokens = Readonly<{
    [Category in NestedTokenCategoryKeys<typeof Size>]: Readonly<{
        [Name in SymbolTokenKeys<Extract<(typeof Size)[Category], object>>]: number
    }>
}>;

/** The resolved numeric values for every `Token.Spacing` entry. */
export type ResolvedSpacingTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Spacing>]: number }>;

/** The resolved text-style values for every `Token.Typography` entry. */
export type ResolvedTypographyTokens =
    Readonly<{ [Name in SymbolTokenKeys<typeof Typography>]: Typography.TypographyValue }>;

/**
 * All resolved design-token categories returned by `useTheme`.
 * Each token is selected through normal property access, for example
 * `useTheme().Semantic.BackgroundMain`.
 */
export interface ResolvedTheme
{
    /** Theme-invariant Notion palette colors. */
    readonly Color: ResolvedColorTokens;

    /** Corner-radius values in pixels. */
    readonly Radii: ResolvedRadiiTokens;

    /** Theme-aware semantic UI colors. */
    readonly Semantic: ResolvedSemanticTokens;

    /** React Native shadow and border style records. */
    readonly Shadow: ResolvedShadowTokens;

    /** Nested component-size values in pixels. */
    readonly Size: ResolvedSizeTokens;

    /** Empty-space values in pixels. */
    readonly Spacing: ResolvedSpacingTokens;

    /** Font size, weight, and line-height records. */
    readonly Typography: ResolvedTypographyTokens;
}

/** The resolved design tokens and active color-scheme controls. */
export interface Theme extends ResolvedTheme
{
    /** The active light or dark color-scheme mode. */
    readonly Mode: ThemeMode;

    /** Pins a color scheme or returns color-scheme selection to the system. */
    readonly SetMode: (Mode: ThemeMode | "System") => void;

    /**
     * Whether `ThemeProvider`'s `HighContrast` prop is currently enabled.
     * `Semantic` tokens with a high-contrast entry (dividers, button
     * borders, ...) resolve to that entry instead of their ordinary
     * `Light`/`Dark` value while this is `true`.
     */
    readonly HighContrast: boolean;
}

/** Any design-token symbol that can be resolved by `useToken`. */
export type ResolvableToken =
    | Color.Color
    | Radii.Radii
    | Semantic.Semantic
    | Shadow.Shadow
    | Size.Size
    | Spacing.Spacing
    | Typography.Typography;

/** The resolved value type for a particular design token. */
export type ResolvedTokenValue<Token extends ResolvableToken> =
    Token extends Color.Color | Semantic.Semantic
        ? string
        : Token extends Radii.Radii | Size.Size | Spacing.Spacing
            ? number
            : Token extends Shadow.Shadow
                ? Shadow.ShadowValue
                : Token extends Typography.Typography
                    ? Typography.TypographyValue
                    : never;

type ResolvedTokenEntry<Token extends ResolvableToken> =
    Token extends ResolvableToken
        ? ReadonlyRecord<Token, ResolvedTokenValue<Token>>
        : never;

type UnionToIntersection<Union> =
    (Union extends unknown ? (Value: Union) => void : never) extends
    (Value: infer Intersection) => void
        ? Intersection
        : never;

/** A readonly record that maps token symbols to their resolved values. */
export type ResolvedTokenRecord<Token extends ResolvableToken> =
    UnionToIntersection<ResolvedTokenEntry<Token>>;

/** The live theme mode, threaded through the resolution program via `Context.Service`. */
class ThemeModeTag extends
    Context.Service<ThemeModeTag, ThemeMode>()("@noteferry/ui/ThemeProvider/ThemeMode") { }

/** The live high-contrast flag, threaded through the resolution program via `Context.Service`. */
class HighContrastTag extends
    Context.Service<HighContrastTag, boolean>()("@noteferry/ui/ThemeProvider/HighContrast") { }

interface TokenResolver
{
    readonly ResolveColor: (Token: Color.Color | Semantic.Semantic) => string | undefined;
    readonly ResolveSize: (Token: Size.Size) => number | undefined;
    readonly ResolveSpacing: (Token: Spacing.Spacing) => number | undefined;
    readonly ResolveRadii: (Token: Radii.Radii) => number | undefined;
    readonly ResolveTypography: (Token: Typography.Typography) => Typography.TypographyValue | undefined;
    readonly ResolveShadow: (Token: Shadow.Shadow) => Shadow.ShadowValue | undefined;
}

const BuildResolver: Effect.Effect<TokenResolver, never, ThemeModeTag | HighContrastTag> =
    Effect.gen(function* ()
    {
        const Mode = yield* ThemeModeTag;
        const HighContrast = yield* HighContrastTag;

        const ResolveColor: TokenResolver["ResolveColor"] = (Token: Color.Color | Semantic.Semantic) =>
            Color.Resolve(Token as Color.Color) ?? Semantic.Resolve(Token as Semantic.Semantic, Mode, HighContrast);

        return {
            ResolveColor,
            ResolveRadii: Radii.Resolve,
            ResolveShadow: Shadow.Resolve,
            ResolveSize: Size.Resolve,
            ResolveSpacing: Spacing.Resolve,
            ResolveTypography: Typography.Resolve
        } as const;
    });

const ResolveTokensForMode = (Mode: ThemeMode, HighContrast: boolean): TokenResolver =>
    Effect.runSync(Effect.provideService(
        Effect.provideService(BuildResolver, ThemeModeTag, Mode),
        HighContrastTag,
        HighContrast
    ));

type ResolvedCategoryRecord<Tokens extends object, Value> =
    Readonly<{ [Name in SymbolTokenKeys<Tokens>]: Value }>;

const ResolveTokenRecord = <Tokens extends object, Value>(
    Tokens: Tokens,
    Resolve: (Token: Extract<Tokens[keyof Tokens], symbol>) => Value | undefined
): ResolvedCategoryRecord<Tokens, Value> =>
    Object.freeze(Object.fromEntries(Object.entries(Tokens)
        .filter((Entry: [ string, unknown ]): Entry is [ string, symbol ] => typeof Entry[1] === "symbol")
        .map(([ Name, Token ]: [ string, symbol ]) =>
        {
            const Value = Resolve(Token as Extract<Tokens[keyof Tokens], symbol>);

            if (Value === undefined)
            {
                throw new Error(`[@noteferry/ui] Unknown ${ Name } token.`);
            }

            return [ Name, Value ];
        }))) as ResolvedCategoryRecord<Tokens, Value>;

const ResolveNestedTokenRecord = <Tokens extends object, TokenValue extends symbol, Value>(
    Tokens: Tokens,
    Resolve: (Token: TokenValue) => Value | undefined
): Readonly<{
    [Category in NestedTokenCategoryKeys<Tokens>]:
    ResolvedCategoryRecord<Extract<Tokens[Category], object>, Value>
}> =>
    Object.freeze(Object.fromEntries(Object.entries(Tokens)
        .filter((Entry: [ string, unknown ]): Entry is [ string, object ] =>
            Entry[1] !== null && typeof Entry[1] === "object")
        .map(([ Category, CategoryTokens ]: [ string, object ]) =>
            [ Category, ResolveTokenRecord(CategoryTokens, (Token: symbol) =>
                Resolve(Token as TokenValue)) ]))) as Readonly<{
        [Category in NestedTokenCategoryKeys<Tokens>]:
        ResolvedCategoryRecord<Extract<Tokens[Category], object>, Value>
    }>;

const BuildResolvedTheme = (Resolver: TokenResolver): ResolvedTheme => Object.freeze({
    Color: ResolveTokenRecord(Color, Resolver.ResolveColor),
    Radii: ResolveTokenRecord(Radii, Resolver.ResolveRadii),
    Semantic: ResolveTokenRecord(Semantic, Resolver.ResolveColor),
    Shadow: ResolveTokenRecord(Shadow, Resolver.ResolveShadow),
    Size: ResolveNestedTokenRecord(Size, Resolver.ResolveSize),
    Spacing: ResolveTokenRecord(Spacing, Resolver.ResolveSpacing),
    Typography: ResolveTokenRecord(Typography, Resolver.ResolveTypography)
});

const TokenResolverContext = React.createContext<TokenResolver | undefined>(undefined);

const ThemeContext = React.createContext<Theme | undefined>(undefined);

/**
 * An abstraction over the {@link ThemeMode} that the Provider returns.
 *
 * @category Provider
 * @since 1.0.0
 */
export type ColorScheme =
    | ThemeMode
    | "System";

/** {@inheritDoc ThemeProvider} */
export interface ThemeProviderProps extends React.PropsWithChildren
{
    /**
     * `"Light"` / `"Dark"` pin the theme; `"System"` (the default) follows
     * the device's `Appearance` setting and can still be overridden at
     * runtime via `useTheme().SetMode`.
     */
    readonly ColorScheme?: ColorScheme;

    /**
     * Enables Notion-style high-contrast styling — more opaque dividers and
     * button borders, plus a "0"/"1" state label on `Switch` — for every
     * `Semantic` token that defines a high-contrast entry. Defaults to
     * `false`. Resolving "follow the system's high-contrast setting" (e.g.
     * via React Native's `AccessibilityInfo`) is the caller's
     * responsibility; `ThemeProvider` only consumes the resolved boolean.
     */
    readonly HighContrast?: boolean;
}

/* On Windows there is no `expo-router` (and, generally, no assumption that
 * the host app runs React Navigation at all), so the nav-theme wrapper the
 * mobile `ThemeProvider` embeds is a plain passthrough here instead. */
const NavigationThemeProvider = ({ children }: React.PropsWithChildren): React.JSX.Element =>
    <>{ children }</>;

export/**
       * Root provider for `@noteferry/ui`. Wrap your app once, near the root.
       *
       * Unlike the mobile build, the Windows build does not mount React
       * Navigation's `ThemeProvider` — there is no `expo-router` dependency
       * available, and a bare RNW app isn't assumed to run React Navigation.
       *
       * @category Provider
       * @since 1.0.0
       */
const ThemeProvider = ({
    ColorScheme = "System",
    HighContrast = false,
    children
}: ThemeProviderProps): React.JSX.Element =>
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

    const Resolver = React.useMemo(
        () => ResolveTokensForMode(Mode, HighContrast),
        [ Mode, HighContrast ]
    );
    const ResolvedTheme = React.useMemo(() => BuildResolvedTheme(Resolver), [ Resolver ]);

    const SetMode = React.useCallback((NextMode: ThemeMode | "System") =>
    {
        SetOverride(NextMode === "System" ? undefined : NextMode);
    }, [ ]);

    const ThemeValue = React.useMemo<Theme>(() => ({
        ...ResolvedTheme,
        HighContrast,
        Mode,
        SetMode
    }), [ HighContrast, Mode, ResolvedTheme, SetMode ]);

    return (
        <TokenResolverContext.Provider value={ Resolver }>
            <ThemeContext.Provider value={ ThemeValue }>
                <NavigationThemeProvider>
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
        throw new Error("[@noteferry/ui] A `Token` hook was used outside of `<ThemeProvider>`.");
    }

    return Resolver;
};

export/**
       * Returns every resolved token category, the active theme mode, and its setter.
       *
       * @example
       * ```tsx
       * const Theme = useTheme();
       *
       * return <View style={ {
       *     backgroundColor: Theme.Semantic.BackgroundMain,
       *     borderRadius: Theme.Radii.Medium,
       *     padding: Theme.Spacing.Large
       * } } />;
       * ```
       *
       * @throws {Error} When called outside `ThemeProvider`.
       *
       * @category Hook
       * @since 1.0.0
       */
const useTheme = (): Theme =>
{
    const Value = React.useContext(ThemeContext);

    if (Value === undefined)
    {
        throw new Error("[@noteferry/ui] `useTheme` was used outside of `<ThemeProvider>`.");
    }

    return Value;
};

const ResolveToken = <Token extends ResolvableToken>(
    Resolver: TokenResolver,
    Token: Token
): ResolvedTokenValue<Token> =>
{
    const Resolved = Resolver.ResolveColor(Token as Color.Color | Semantic.Semantic)
        ?? Resolver.ResolveSize(Token as Size.Size)
        ?? Resolver.ResolveSpacing(Token as Spacing.Spacing)
        ?? Resolver.ResolveRadii(Token as Radii.Radii)
        ?? Resolver.ResolveShadow(Token as Shadow.Shadow)
        ?? Resolver.ResolveTypography(Token as Typography.Typography);

    if (Resolved === undefined)
    {
        throw new Error("[@noteferry/ui] Unknown token.");
    }

    return Resolved as ResolvedTokenValue<Token>;
};

export/**
       * Resolves one or more design-token symbols and returns a frozen,
       * readonly record keyed by those symbols.
       *
       * @example
       * ```tsx
       * const Tokens = useToken(Token.Semantic.Primary, Token.Radii.Medium);
       * const PrimaryColor = Tokens[Token.Semantic.Primary];
       * const MediumRadius = Tokens[Token.Radii.Medium];
       * ```
       *
       * @throws {Error} When called outside `ThemeProvider` or passed an unknown token.
       *
       * @category Hook
       * @since 1.0.0
       */
const useToken = <const Tokens extends Array.NonEmptyReadonlyArray<ResolvableToken>>(
    ...Tokens: Tokens
): ResolvedTokenRecord<typeof Tokens[number]> =>
{
    const Resolver = useTokenResolver();

    return Object.freeze(Record.fromIterableWith(Tokens, (Token: Tokens[number]) =>
        [ Token, ResolveToken(Resolver, Token) ])) as ResolvedTokenRecord<Tokens[number]>;
};
