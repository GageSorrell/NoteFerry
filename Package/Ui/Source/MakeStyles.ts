/**
 * `StyleSheet.create`-equivalent for `@noteferry/ui`, shaped after Fluent UI's
 * `makeStyles` / `mergeClasses` (`@fluentui/react-components`) but adapted
 * for React Native, which has no CSS cascade and no single generic "style"
 * type — every slot is one of `ViewStyle`, `TextStyle`, or `ImageStyle`.
 *
 * A config passed to `MakeStyles` is a record of slots, each wrapped in the
 * {@link ViewStyle}, {@link TextStyle}, or {@link ImageStyle} constructor for
 * the RN style shape that slot is meant for — these constructors are
 * identity at runtime; they exist purely so `MakeStyles` can type (and
 * enforce) which properties are legal in a given slot, the same role
 * `cva()`/`makeStyles()` slot functions play elsewhere. Any `string`-typed
 * property may additionally hold a {@link ColorToken} (`Token.Color.*` /
 * `Token.Semantic.*`), and any `number`-typed property may additionally hold
 * a {@link NumberToken} (`Token.Radii.*` / `Token.Size.*` / `Token.Spacing.*`)
 * in place of a literal — this typing is necessarily approximate for
 * properties whose declared type is a string union that isn't really a
 * color (`position`, `fontWeight`, ...); nothing stops a caller from putting
 * a token there, it's just meaningless in practice.
 *
 * `MakeStyles` returns a hook. Calling it resolves every token against the
 * live theme and memoizes the result on `Theme.Mode` and `Theme.HighContrast`
 * — the returned styles object keeps its identity across re-renders until
 * the color scheme or contrast level actually changes, the same
 * referential-stability property `StyleSheet.create`'s output has, while
 * still reacting to light/dark mode and high contrast without a second,
 * separately-allocated inline style object.
 *
 * `MergeStyles` is the `mergeClasses` counterpart: React Native's `style`
 * prop already accepts arrays (and RN flattens them, falsy entries and all),
 * so it's rarely required, but it's here for call sites that need a single
 * merged object instead of an array.
 *
 * @module @noteferry/ui/MakeStyles
 *
 * @file      MakeStyles.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "./Token/Color.js";
import * as Radii from "./Token/Radii.js";
import * as React from "react";
import * as Semantic from "./Token/Semantic.js";
import * as Size from "./Token/Size.js";
import * as Spacing from "./Token/Spacing.js";
import type {
    ImageStyle as RnImageStyle,
    TextStyle as RnTextStyle,
    ViewStyle as RnViewStyle
} from "react-native";
import type { ThemeMode } from "./ThemeProvider.js";
import { useTheme } from "./ThemeProvider.js";

/**
 * Any design token accepted by a `string`-typed style property.
 *
 * @category Style
 * @since 1.0.0
 */
export type ColorToken =
    | Color.Color
    | Semantic.Semantic;

/**
 * Any design token accepted by a `number`-typed style property.
 *
 * @category Style
 * @since 1.0.0
 */
export type NumberToken =
    | Radii.Radii
    | Size.Size
    | Spacing.Spacing;

/**
 * Any design token `MakeStyles` knows how to resolve.
 *
 * @category Style
 * @since 1.0.0
 */
export type StyleToken =
    | ColorToken
    | NumberToken;

/**
 * `Style` with every property whose declared type accepts a plain `number`
 * (`gap`, `padding*`, `width`, ...) additionally allowed to hold a
 * {@link NumberToken}, and every property whose declared type accepts a
 * plain `string` (`color`, `backgroundColor`, ...) additionally allowed to
 * hold a {@link ColorToken}. A property typed as a narrow string-literal
 * union (`flexDirection`, `position`, `fontWeight`, ...) does *not* accept
 * `string` itself, so tokens are correctly excluded there — only genuinely
 * color/size-ish properties gain a token option.
 *
 * @category Style
 * @since 1.0.0
 */
export type Tokenized<Style extends object> =
    {
        [Key in keyof Style]?:
        | Style[Key]
        | (number extends Style[Key] ? NumberToken : never)
        | (string extends Style[Key] ? ColorToken : never);
    };

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- phantom brand, used only via `typeof` */
declare const ViewStyleTypeId: unique symbol;

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- phantom brand, used only via `typeof` */
declare const TextStyleTypeId: unique symbol;

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- phantom brand, used only via `typeof` */
declare const ImageStyleTypeId: unique symbol;

/**
 * A `MakeStyles` slot definition for a `View`'s `style` prop.
 *
 * @category Style
 * @since 1.0.0
 */
export type ViewStyleSlot<Style extends Tokenized<RnViewStyle> = Tokenized<RnViewStyle>> =
    Style & Readonly<Record<typeof ViewStyleTypeId, "View">>;

/**
 * A `MakeStyles` slot definition for a `Text`'s `style` prop.
 *
 * @category Style
 * @since 1.0.0
 */
export type TextStyleSlot<Style extends Tokenized<RnTextStyle> = Tokenized<RnTextStyle>> =
    Style & Readonly<Record<typeof TextStyleTypeId, "Text">>;

/**
 * A `MakeStyles` slot definition for an `Image`'s `style` prop.
 *
 * @category Style
 * @since 1.0.0
 */
export type ImageStyleSlot<Style extends Tokenized<RnImageStyle> = Tokenized<RnImageStyle>> =
    Style & Readonly<Record<typeof ImageStyleTypeId, "Image">>;

/**
 * Any slot definition accepted by `MakeStyles`.
 *
 * @category Style
 * @since 1.0.0
 */
export type StyleSlot =
    | ViewStyleSlot
    | TextStyleSlot
    | ImageStyleSlot;

export/**
       * Marks a style object as a `View`'s `style` prop for `MakeStyles`.
       * Identity at runtime — exists purely as a compile-time indicator of
       * which RN style shape the slot resolves to.
       *
       * @category Style
       * @since 1.0.0
       */
const ViewStyle = <Style extends Tokenized<RnViewStyle>>(Style: Style): ViewStyleSlot<Style> =>
    Style as ViewStyleSlot<Style>;

export/**
       * Marks a style object as a `Text`'s `style` prop for `MakeStyles`.
       * Identity at runtime — exists purely as a compile-time indicator of
       * which RN style shape the slot resolves to.
       *
       * @category Style
       * @since 1.0.0
       */
const TextStyle = <Style extends Tokenized<RnTextStyle>>(Style: Style): TextStyleSlot<Style> =>
    Style as TextStyleSlot<Style>;

export/**
       * Marks a style object as an `Image`'s `style` prop for `MakeStyles`.
       * Identity at runtime — exists purely as a compile-time indicator of
       * which RN style shape the slot resolves to.
       *
       * @category Style
       * @since 1.0.0
       */
const ImageStyle = <Style extends Tokenized<RnImageStyle>>(Style: Style): ImageStyleSlot<Style> =>
    Style as ImageStyleSlot<Style>;

type ResolvedSlot<Slot extends StyleSlot> =
    Slot extends ViewStyleSlot
        ? RnViewStyle
        : Slot extends TextStyleSlot
            ? RnTextStyle
            : Slot extends ImageStyleSlot
                ? RnImageStyle
                : never;

/**
 * A record of `MakeStyles` slot definitions, as passed to `MakeStyles`.
 *
 * @category Style
 * @since 1.0.0
 */
export type StylesConfig = Readonly<Record<string, StyleSlot>>;

/**
 * The theme-resolved styles returned by a hook created with `MakeStyles`.
 *
 * @category Style
 * @since 1.0.0
 */
export type ResolvedStyles<Config extends StylesConfig> =
    {
        readonly [ Key in keyof Config]: ResolvedSlot<Config[Key]>;
    };

/* RN's own `ColorValue` type (`string | OpaqueColorValue`, e.g. from
 * `PlatformColor()`/`DynamicColorIOS()`) is itself backed by real runtime
 * symbols, so a bare `typeof Value === "symbol"` check would misidentify an
 * opaque platform color as one of ours. Recognize only symbols that actually
 * came from `Token.*` instead. */
const CollectSymbols = (Namespace: object): ReadonlyArray<symbol> =>
    Object.values(Namespace).flatMap((Value: unknown) =>
    {
        if (typeof Value === "symbol")
        {
            return [ Value ];
        }

        return typeof Value === "object" && Value !== null ? CollectSymbols(Value) : [ ];
    });

const KnownStyleTokens: ReadonlySet<symbol> = new Set([
    ...CollectSymbols(Color),
    ...CollectSymbols(Semantic),
    ...CollectSymbols(Radii),
    ...CollectSymbols(Size),
    ...CollectSymbols(Spacing)
]);

const IsStyleToken = (Value: unknown): Value is StyleToken =>
    typeof Value === "symbol" && KnownStyleTokens.has(Value);

const ResolveStyleToken = (
    Token: StyleToken,
    Mode: ThemeMode,
    HighContrast: boolean
): string | number | undefined =>
    Color.Resolve(Token as Color.Color)
        ?? Semantic.Resolve(Token as Semantic.Semantic, Mode, HighContrast)
        ?? Radii.Resolve(Token as Radii.Radii)
        ?? Size.Resolve(Token as Size.Size)
        ?? Spacing.Resolve(Token as Spacing.Spacing);

const ResolveSlot = (
    Slot: Readonly<Record<string, unknown>>,
    Mode: ThemeMode,
    HighContrast: boolean
): Record<string, unknown> =>
    Object.fromEntries(Object.entries(Slot).map(([ Key, Value ]: [ string, unknown ]) =>
        [ Key, IsStyleToken(Value) ? ResolveStyleToken(Value, Mode, HighContrast) : Value ]));

export/**
       * `StyleSheet.create`-equivalent for `@noteferry/ui`. Converts a record of
       * `ViewStyle`/`TextStyle`/`ImageStyle`-tagged slots (whose color and
       * size-ish properties may hold design tokens in place of literals) into
       * a hook that returns theme-resolved React Native style objects.
       *
       * @example
       * ```tsx
       * const useStyles = MakeStyles({
       *     Row: ViewStyle({
       *         alignItems: "center",
       *         backgroundColor: Token.Semantic.BackgroundModal,
       *         borderRadius: Token.Radii.Large,
       *         gap: Token.Spacing.M
       *     }),
       *     Label: TextStyle({ color: Token.Semantic.Primary })
       * });
       *
       * const Row = (): React.JSX.Element =>
       * {
       *     const Styles = useStyles();
       *
       *     return (
       *         <View style={ Styles.Row }>
       *             <Text style={ Styles.Label }>Hi</Text>
       *         </View>
       *     );
       * };
       * ```
       *
       * @category Style
       * @since 1.0.0
       */
const MakeStyles = <Config extends StylesConfig>(Config: Config): () => ResolvedStyles<Config> =>
{
    const Entries = Object.entries(Config) as ReadonlyArray<[ string, Readonly<Record<string, unknown>> ]>;

    return (): ResolvedStyles<Config> =>
    {
        const { HighContrast, Mode } = useTheme();

        return React.useMemo(
            () =>
            {
                const Resolved = Entries.map((
                    [ Key, Slot ]: [ string, Readonly<Record<string, unknown>> ]
                ) => [ Key, ResolveSlot(Slot, Mode, HighContrast) ]);

                return Object.fromEntries(Resolved) as unknown as ResolvedStyles<Config>;
            },
            [ HighContrast, Mode ]
        );
    };
};

/**
 * Any resolved React Native style object `MergeStyles` can combine.
 *
 * @category Style
 * @since 1.0.0
 */
export type Style =
    | RnViewStyle
    | RnTextStyle
    | RnImageStyle;

export/**
       * `mergeClasses`-equivalent for `@noteferry/ui`. Left-to-right shallow-
       * merges its non-falsy arguments into a single style object (later
       * arguments win), skipping `false`/`null`/`undefined` so conditional
       * styles can be passed inline: `MergeStyles(Styles.Row, Pressed &&
       * Styles.RowPressed)`. React Native's `style` prop already accepts an
       * array directly — reach for `MergeStyles` only when a single merged
       * object is actually required.
       *
       * @category Style
       * @since 1.0.0
       */
const MergeStyles = <StyleType extends Style>(
    ...Styles: ReadonlyArray<StyleType | false | null | undefined>
): StyleType =>
{
    const IsPresent = (Candidate: StyleType | false | null | undefined): Candidate is StyleType =>
        Boolean(Candidate);

    return Object.assign({ }, ...Styles.filter(IsPresent)) as StyleType;
};
