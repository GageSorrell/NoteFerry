/**
 * Notion-aligned typography primitives for screen chrome, editor content,
 * menus, settings, empty states, controls, and supporting copy.
 *
 * @module @noteferry/ui/Primitive/Text
 *
 * @file      Text.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Color from "../Token/Color.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Typography from "../Token/Typography.js";
import {
    Text as RNText,
    type TextProps as RNTextProps,
    type StyleProp,
    type TextStyle
} from "react-native";
import type { ReadonlyRecord } from "effect/Record";
import { useToken } from "../ThemeProvider.js";

/**
 * Semantic text roles observed throughout Notion's mobile UI and editor.
 *
 * @category Typography
 * @since 1.0.0
 */
export type TextVariant =
    | "PageTitle"
    | "ScreenTitle"
    | "HeroTitle"
    | "Heading1"
    | "Heading2"
    | "Heading3"
    | "SectionTitle"
    | "EmptyStateTitle"
    | "ModalTitle"
    | "NavigationTitle"
    | "ItemTitle"
    | "Body"
    | "BodyCompact"
    | "MenuItem"
    | "ButtonLabel"
    | "Label"
    | "Description"
    | "Overline"
    | "Caption";

/**
 * Notion's page typeface choices. `Default` uses Roboto while `Serif` and
 * `Mono` use the platform serif and monospace families.
 *
 * @category Typography
 * @since 1.0.0
 */
export type TextFamily =
    | "Default"
    | "Serif"
    | "Mono";

/**
 * Tracks whether the current render is nested inside a `@noteferry/ui` `Text`
 * (or one of its fixed-`Variant` wrappers below) rather than React Native's
 * own `Text`. `Link` reads this via {@link useIsInsideText} to switch its
 * `Subtle` appearance to underlined when used inline within prose.
 */
const InsideTextContext = React.createContext(false);

export/**
       * Whether the calling component is rendered as a descendant of
       * `@noteferry/ui`'s `Text` component (including any of its fixed-`Variant`
       * wrappers, such as `Description` or `Caption`) — as opposed to being
       * unwrapped, or nested only inside React Native's own `Text`.
       *
       * @category Hook
       * @since 1.0.0
       */
const useIsInsideText = (): boolean => React.useContext(InsideTextContext);

const VariantToken: ReadonlyRecord<TextVariant, Typography.Typography> =
    {
        Body: Typography.Body,
        BodyCompact: Typography.BodyCompact,
        ButtonLabel: Typography.ButtonLabel,
        Caption: Typography.Caption,
        Description: Typography.Description,
        EmptyStateTitle: Typography.EmptyStateTitle,
        Heading1: Typography.Heading1,
        Heading2: Typography.Heading2,
        Heading3: Typography.Heading3,
        HeroTitle: Typography.HeroTitle,
        ItemTitle: Typography.ItemTitle,
        Label: Typography.Label,
        MenuItem: Typography.MenuItem,
        ModalTitle: Typography.ModalTitle,
        NavigationTitle: Typography.NavigationTitle,
        Overline: Typography.Overline,
        PageTitle: Typography.PageTitle,
        ScreenTitle: Typography.ScreenTitle,
        SectionTitle: Typography.SectionTitle
    };

/** {@inheritDoc Text} */
export interface TextProps extends Omit<RNTextProps, "style" | "numberOfLines">
{
    /** The semantic typography role to render. */
    readonly Variant: TextVariant;

    /** The Notion page typeface family. Defaults to `Default`. */
    readonly Family?: TextFamily;

    /** Overrides the role's default font weight. */
    readonly Weight?: TextStyle["fontWeight"];

    /**
     * A `Token.Color.*` / `Token.Semantic.*` symbol, or a raw color string.
     * Defaults to `Semantic.Primary`.
     */
    readonly Color?:
        | Color.Color
        | Semantic.Semantic
        | string
        | undefined;

    readonly NumberOfLines?: number;
    readonly Style?: StyleProp<TextStyle>;
}

const ResolveFontFamily = (Family: TextFamily): string =>
{
    switch (Family)
    {
        case "Serif":
            return "serif";
        case "Mono":
            return "monospace";
        case "Default":
        default:
            return "Roboto Flex";
    }
};

export/**
       * Base typography component with a semantic Notion text role.
       *
       * @category Component
       * @since 1.0.0
       */
const Text = ({
    Variant,
    Family = "Default",
    Weight,
    Color: ColorProp,
    NumberOfLines,
    Style,
    children,
    ...RestProps
}: TextProps): React.ReactNode =>
{
    const { [ VariantToken[Variant] ]: ResolvedTypography } = useToken(VariantToken[Variant]);
    const TokenColorArgument = typeof ColorProp === "symbol" ? ColorProp : Semantic.Primary;
    const { [ TokenColorArgument ]: ResolvedTokenColor } = useToken(TokenColorArgument);
    const FinalColor = typeof ColorProp === "string" ? ColorProp : ResolvedTokenColor;
    const EffectiveWeight = Weight ?? ResolvedTypography.FontWeight;

    return (
        <RNText
            numberOfLines={ NumberOfLines }
            style={ [
                {
                    color: FinalColor,
                    fontFamily: ResolveFontFamily(Family),
                    fontSize: ResolvedTypography.FontSize,
                    fontWeight: EffectiveWeight,
                    lineHeight: ResolvedTypography.LineHeight
                },
                Style
            ] }
            { ...RestProps }>
            <InsideTextContext.Provider value={ true }>
                { children }
            </InsideTextContext.Provider>
        </RNText>
    );
};

interface InvariantTextProps extends Omit<TextProps, "Variant"> { }

/** {@inheritDoc PageTitle} */
export interface PageTitleProps extends InvariantTextProps { }

/** {@inheritDoc ScreenTitle} */
export interface ScreenTitleProps extends InvariantTextProps { }

/** {@inheritDoc HeroTitle} */
export interface HeroTitleProps extends InvariantTextProps { }

/** {@inheritDoc Heading1} */
export interface Heading1Props extends InvariantTextProps { }

/** {@inheritDoc Heading2} */
export interface Heading2Props extends InvariantTextProps { }

/** {@inheritDoc Heading3} */
export interface Heading3Props extends InvariantTextProps { }

/** {@inheritDoc SectionTitle} */
export interface SectionTitleProps extends InvariantTextProps { }

/** {@inheritDoc EmptyStateTitle} */
export interface EmptyStateTitleProps extends InvariantTextProps { }

/** {@inheritDoc ModalTitle} */
export interface ModalTitleProps extends InvariantTextProps { }

/** {@inheritDoc NavigationTitle} */
export interface NavigationTitleProps extends InvariantTextProps { }

/** {@inheritDoc ItemTitle} */
export interface ItemTitleProps extends InvariantTextProps { }

/** {@inheritDoc Body} */
export interface BodyProps extends InvariantTextProps { }

/** {@inheritDoc BodyCompact} */
export interface BodyCompactProps extends InvariantTextProps { }

/** {@inheritDoc MenuItemText} */
export interface MenuItemTextProps extends InvariantTextProps { }

/** {@inheritDoc ButtonLabel} */
export interface ButtonLabelProps extends InvariantTextProps { }

/** {@inheritDoc LabelText} */
export interface LabelTextProps extends InvariantTextProps { }

/** {@inheritDoc Description} */
export interface DescriptionProps extends InvariantTextProps { }

/** {@inheritDoc Overline} */
export interface OverlineProps extends InvariantTextProps { }

/** {@inheritDoc Caption} */
export interface CaptionProps extends InvariantTextProps { }

export/**
       * Notion editor page title text.
       *
       * @category Component
       * @since 1.0.0
       */
const PageTitle = ({ children, ...Props }: PageTitleProps): React.ReactNode =>
    <Text
        Variant="PageTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Large screen-level title text, such as Notion's search heading.
       *
       * @category Component
       * @since 1.0.0
       */
const ScreenTitle = ({ children, ...Props }: ScreenTitleProps): React.ReactNode =>
    <Text
        Variant="ScreenTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Compact hero title text used on authentication and onboarding screens.
       *
       * @category Component
       * @since 1.0.0
       */
const HeroTitle = ({ children, ...Props }: HeroTitleProps): React.ReactNode =>
    <Text
        Variant="HeroTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Level-one editor heading text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading1 = ({ children, ...Props }: Heading1Props): React.ReactNode =>
    <Text
        Variant="Heading1"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Level-two editor heading text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading2 = ({ children, ...Props }: Heading2Props): React.ReactNode =>
    <Text
        Variant="Heading2"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Level-three editor heading text.
       *
       * @category Component
       * @since 1.0.0
       */
const Heading3 = ({ children, ...Props }: Heading3Props): React.ReactNode =>
    <Text
        Variant="Heading3"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Major settings or grouped-content section title.
       *
       * @category Component
       * @since 1.0.0
       */
const SectionTitle = ({ children, ...Props }: SectionTitleProps): React.ReactNode =>
    <Text
        Variant="SectionTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Title for a centered empty state.
       *
       * @category Component
       * @since 1.0.0
       */
const EmptyStateTitle = ({ children, ...Props }: EmptyStateTitleProps): React.ReactNode =>
    <Text
        Variant="EmptyStateTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Bottom-sheet, dialog, and modal title text.
       *
       * @category Component
       * @since 1.0.0
       */
const ModalTitle = ({ children, ...Props }: ModalTitleProps): React.ReactNode =>
    <Text
        Variant="ModalTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Compact title centered in a mobile navigation bar.
       *
       * @category Component
       * @since 1.0.0
       */
const NavigationTitle = ({ children, ...Props }: NavigationTitleProps): React.ReactNode =>
    <Text
        Variant="NavigationTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Card, search-result, and list-row title text.
       *
       * @category Component
       * @since 1.0.0
       */
const ItemTitle = ({ children, ...Props }: ItemTitleProps): React.ReactNode =>
    <Text
        Variant="ItemTitle"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Notion editor body text.
       *
       * @category Component
       * @since 1.0.0
       */
const Body = ({ children, ...Props }: BodyProps): React.ReactNode =>
    <Text
        Variant="Body"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Compact body text for properties and dense controls.
       *
       * @category Component
       * @since 1.0.0
       */
const BodyCompact = ({ children, ...Props }: BodyCompactProps): React.ReactNode =>
    <Text
        Variant="BodyCompact"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Action text for menu and action-sheet rows.
       *
       * @category Component
       * @since 1.0.0
       */
const MenuItemText = ({ children, ...Props }: MenuItemTextProps): React.ReactNode =>
    <Text
        Variant="MenuItem"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Semibold text used in buttons and call-to-action controls.
       *
       * @category Component
       * @since 1.0.0
       */
const ButtonLabel = ({ children, ...Props }: ButtonLabelProps): React.ReactNode =>
    <Text
        Variant="ButtonLabel"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Label text for settings rows, fields, and compact controls.
       *
       * @category Component
       * @since 1.0.0
       */
const LabelText = ({ children, ...Props }: LabelTextProps): React.ReactNode =>
    <Text
        Variant="Label"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Supporting copy, muted by default like Notion's settings descriptions.
       *
       * @category Component
       * @since 1.0.0
       */
const Description = ({
    Color = Semantic.Secondary,
    children,
    ...Props
}: DescriptionProps): React.ReactNode =>
    <Text
        Color={ Color }
        Variant="Description"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Muted grouping label, such as `Today`, `Recents`, or `Private`.
       *
       * @category Component
       * @since 1.0.0
       */
const Overline = ({ Color = Semantic.Secondary, children, ...Props }: OverlineProps): React.ReactNode =>
    <Text
        Color={ Color }
        Variant="Overline"
        { ...Props }>
        { children }
    </Text>;

export/**
       * Small muted legal, metadata, and footer text.
       *
       * @category Component
       * @since 1.0.0
       */
const Caption = ({ Color = Semantic.Secondary, children, ...Props }: CaptionProps): React.ReactNode =>
    <Text
        Color={ Color }
        Variant="Caption"
        { ...Props }>
        { children }
    </Text>;
