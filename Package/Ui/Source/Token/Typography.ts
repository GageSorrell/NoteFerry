/**
 * Semantic typography roles modeled after Notion's mobile UI and editor.
 * Roles are deliberately more specific than a simple heading/body scale so
 * screen chrome, page content, menus, settings, empty states, and supporting
 * copy can share measurements without losing their intent.
 *
 * @module @notivex/ui/Token/Typography
 *
 * @file      Typography.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeGetSymbolKey } from "../Utility/index.js";

const TypeId = "~notivex/ui/Token/Typography" as const;

type TypeId = typeof TypeId;

const GetSymbolKey = MakeGetSymbolKey(TypeId);

export/**
       * The typography token for an editor page title.
       *
       * @category Token
       * @since 1.0.0
       */
const PageTitle: unique symbol = Symbol.for(GetSymbolKey("PageTitle"));

/** {@inheritDoc PageTitle} */
export type PageTitle = typeof PageTitle;

export/**
       * The typography token for a large screen-level title.
       *
       * @category Token
       * @since 1.0.0
       */
const ScreenTitle: unique symbol = Symbol.for(GetSymbolKey("ScreenTitle"));

/** {@inheritDoc ScreenTitle} */
export type ScreenTitle = typeof ScreenTitle;

export/**
       * The typography token for a compact hero title.
       *
       * @category Token
       * @since 1.0.0
       */
const HeroTitle: unique symbol = Symbol.for(GetSymbolKey("HeroTitle"));

/** {@inheritDoc HeroTitle} */
export type HeroTitle = typeof HeroTitle;

export/**
       * The typography token for a level-one editor heading.
       *
       * @category Token
       * @since 1.0.0
       */
const Heading1: unique symbol = Symbol.for(GetSymbolKey("Heading1"));

/** {@inheritDoc Heading1} */
export type Heading1 = typeof Heading1;

export/**
       * The typography token for a level-two editor heading.
       *
       * @category Token
       * @since 1.0.0
       */
const Heading2: unique symbol = Symbol.for(GetSymbolKey("Heading2"));

/** {@inheritDoc Heading2} */
export type Heading2 = typeof Heading2;

export/**
       * The typography token for a level-three editor heading.
       *
       * @category Token
       * @since 1.0.0
       */
const Heading3: unique symbol = Symbol.for(GetSymbolKey("Heading3"));

/** {@inheritDoc Heading3} */
export type Heading3 = typeof Heading3;

export/**
       * The typography token for a major content section title.
       *
       * @category Token
       * @since 1.0.0
       */
const SectionTitle: unique symbol = Symbol.for(GetSymbolKey("SectionTitle"));

/** {@inheritDoc SectionTitle} */
export type SectionTitle = typeof SectionTitle;

export/**
       * The typography token for an empty-state title.
       *
       * @category Token
       * @since 1.0.0
       */
const EmptyStateTitle: unique symbol = Symbol.for(GetSymbolKey("EmptyStateTitle"));

/** {@inheritDoc EmptyStateTitle} */
export type EmptyStateTitle = typeof EmptyStateTitle;

export/**
       * The typography token for a dialog, modal, or sheet title.
       *
       * @category Token
       * @since 1.0.0
       */
const ModalTitle: unique symbol = Symbol.for(GetSymbolKey("ModalTitle"));

/** {@inheritDoc ModalTitle} */
export type ModalTitle = typeof ModalTitle;

export/**
       * The typography token for a compact navigation-bar title.
       *
       * @category Token
       * @since 1.0.0
       */
const NavigationTitle: unique symbol = Symbol.for(GetSymbolKey("NavigationTitle"));

/** {@inheritDoc NavigationTitle} */
export type NavigationTitle = typeof NavigationTitle;

export/**
       * The typography token for a card, result, or list-row title.
       *
       * @category Token
       * @since 1.0.0
       */
const ItemTitle: unique symbol = Symbol.for(GetSymbolKey("ItemTitle"));

/** {@inheritDoc ItemTitle} */
export type ItemTitle = typeof ItemTitle;

export/**
       * The typography token for standard body copy.
       *
       * @category Token
       * @since 1.0.0
       */
const Body: unique symbol = Symbol.for(GetSymbolKey("Body"));

/** {@inheritDoc Body} */
export type Body = typeof Body;

export/**
       * The typography token for body copy in dense layouts.
       *
       * @category Token
       * @since 1.0.0
       */
const BodyCompact: unique symbol = Symbol.for(GetSymbolKey("BodyCompact"));

/** {@inheritDoc BodyCompact} */
export type BodyCompact = typeof BodyCompact;

export/**
       * The typography token for a menu or action-sheet item.
       *
       * @category Token
       * @since 1.0.0
       */
const MenuItem: unique symbol = Symbol.for(GetSymbolKey("MenuItem"));

/** {@inheritDoc MenuItem} */
export type MenuItem = typeof MenuItem;

export/**
       * The typography token for button and call-to-action labels.
       *
       * @category Token
       * @since 1.0.0
       */
const ButtonLabel: unique symbol = Symbol.for(GetSymbolKey("ButtonLabel"));

/** {@inheritDoc ButtonLabel} */
export type ButtonLabel = typeof ButtonLabel;

export/**
       * The typography token for a field or settings-row label.
       *
       * @category Token
       * @since 1.0.0
       */
const Label: unique symbol = Symbol.for(GetSymbolKey("Label"));

/** {@inheritDoc Label} */
export type Label = typeof Label;

export/**
       * The typography token for supporting descriptive copy.
       *
       * @category Token
       * @since 1.0.0
       */
const Description: unique symbol = Symbol.for(GetSymbolKey("Description"));

/** {@inheritDoc Description} */
export type Description = typeof Description;

export/**
       * The typography token for a muted grouping label.
       *
       * @category Token
       * @since 1.0.0
       */
const Overline: unique symbol = Symbol.for(GetSymbolKey("Overline"));

/** {@inheritDoc Overline} */
export type Overline = typeof Overline;

export/**
       * The typography token for legal, metadata, and footer copy.
       *
       * @category Token
       * @since 1.0.0
       */
const Caption: unique symbol = Symbol.for(GetSymbolKey("Caption"));

/** {@inheritDoc Caption} */
export type Caption = typeof Caption;

/**
 * Any semantic typography-role token.
 *
 * @category Token
 * @since 1.0.0
 */
export type Typography =
    | PageTitle
    | ScreenTitle
    | HeroTitle
    | Heading1
    | Heading2
    | Heading3
    | SectionTitle
    | EmptyStateTitle
    | ModalTitle
    | NavigationTitle
    | ItemTitle
    | Body
    | BodyCompact
    | MenuItem
    | ButtonLabel
    | Label
    | Description
    | Overline
    | Caption;

/**
 * The font weight (of some text).
 *
 * @category Token
 * @since 1.0.0
 */
export type FontWeight =
    | "400"
    | "500"
    | "600"
    | "700";

/**
 * The collection of style properties used to style text in `@notivex/ui`.
 *
 * @category Token
 * @since 1.0.0
 */
export interface TypographyValue
{
    /**
     * The font size in density-independent pixels.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly FontSize: number;

    /**
     * The font weight used by the typography role.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly FontWeight: FontWeight;

    /**
     * The line height in density-independent pixels.
     *
     * @category Token
     * @since 1.0.0
     */
    readonly LineHeight: number;
}

/* Preserve the public typography-role order above in the internal value record. */
/* eslint-disable sort-keys */
const Value = Object.freeze({
    [ PageTitle ]:
    {
        FontSize: 40,
        FontWeight: "700",
        LineHeight: 48
    },
    [ ScreenTitle ]:
    {
        FontSize: 30,
        FontWeight: "700",
        LineHeight: 38
    },
    [ HeroTitle ]:
    {
        FontSize: 24,
        FontWeight: "700",
        LineHeight: 30
    },
    [ Heading1 ]:
    {
        FontSize: 30,
        FontWeight: "700",
        LineHeight: 38
    },
    [ Heading2 ]:
    {
        FontSize: 24,
        FontWeight: "700",
        LineHeight: 32
    },
    [ Heading3 ]:
    {
        FontSize: 20,
        FontWeight: "600",
        LineHeight: 28
    },
    [ SectionTitle ]:
    {
        FontSize: 20,
        FontWeight: "700",
        LineHeight: 28
    },
    [ EmptyStateTitle ]:
    {
        FontSize: 22,
        FontWeight: "700",
        LineHeight: 28
    },
    [ ModalTitle ]:
    {
        FontSize: 18,
        FontWeight: "600",
        LineHeight: 24
    },
    [ NavigationTitle ]:
    {
        FontSize: 16,
        FontWeight: "600",
        LineHeight: 22
    },
    [ ItemTitle ]:
    {
        FontSize: 16,
        FontWeight: "500",
        LineHeight: 22
    },
    [ Body ]:
    {
        FontSize: 16,
        FontWeight: "400",
        LineHeight: 24
    },
    [ BodyCompact ]:
    {
        FontSize: 16,
        FontWeight: "400",
        LineHeight: 20
    },
    [ MenuItem ]:
    {
        FontSize: 16,
        FontWeight: "400",
        LineHeight: 24
    },
    [ ButtonLabel ]:
    {
        FontSize: 16,
        FontWeight: "600",
        LineHeight: 20
    },
    [ Label ]:
    {
        FontSize: 15,
        FontWeight: "600",
        LineHeight: 22
    },
    [ Description ]:
    {
        FontSize: 14,
        FontWeight: "400",
        LineHeight: 20
    },
    [ Overline ]:
    {
        FontSize: 14,
        FontWeight: "500",
        LineHeight: 20
    },
    [ Caption ]:
    {
        FontSize: 12,
        FontWeight: "400",
        LineHeight: 16
    }
} as const);
/* eslint-enable sort-keys */

export/**
       * Resolve a `Typography` token to its value.
       *
       * @internal
       * @category Token
       * @since 1.0.0
       */
const Resolve =
    (Token: Typography): TypographyValue | undefined => Value[Token];
