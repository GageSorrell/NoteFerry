/**
 * `PropertyInput` — "what the user wants to put into it". A parallel,
 * smaller union to {@link Property.Definition}: only the property types a
 * Notivex form can actually collect a value for, and only the fields needed
 * to express that value — never Notion's request-body shape.
 *
 * @module @notivex/domain/Property/Input
 *
 * @file      Input.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "../Id.js";
import { Schema } from "effect";

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const TitlePropertyInput = Schema.Struct({
    Type: Schema.tag("Title"),
    Value: Schema.String
});

/** {@inheritDoc TitlePropertyInput} */
export type TitlePropertyInput = Schema.Schema.Type<typeof TitlePropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const RichTextPropertyInput = Schema.Struct({
    Type: Schema.tag("RichText"),
    Value: Schema.String
});

/** {@inheritDoc RichTextPropertyInput} */
export type RichTextPropertyInput = Schema.Schema.Type<typeof RichTextPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const NumberPropertyInput = Schema.Struct({
    Type: Schema.tag("Number"),
    Value: Schema.Number
});

/** {@inheritDoc NumberPropertyInput} */
export type NumberPropertyInput = Schema.Schema.Type<typeof NumberPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const CheckboxPropertyInput = Schema.Struct({
    Type: Schema.tag("Checkbox"),
    Value: Schema.Boolean
});

/** {@inheritDoc CheckboxPropertyInput} */
export type CheckboxPropertyInput = Schema.Schema.Type<typeof CheckboxPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const DatePropertyInput = Schema.Struct({
    End: Schema.optional(Schema.DateFromString),
    Start: Schema.DateFromString,
    Type: Schema.tag("Date")
});

/** {@inheritDoc DatePropertyInput} */
export type DatePropertyInput = Schema.Schema.Type<typeof DatePropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const SelectPropertyInput = Schema.Struct({
    OptionId: Id.NotionOptionId,
    Type: Schema.tag("Select")
});

/** {@inheritDoc SelectPropertyInput} */
export type SelectPropertyInput = Schema.Schema.Type<typeof SelectPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const MultiSelectPropertyInput = Schema.Struct({
    OptionIds: Schema.Array(Id.NotionOptionId),
    Type: Schema.tag("MultiSelect")
});

/** {@inheritDoc MultiSelectPropertyInput} */
export type MultiSelectPropertyInput = Schema.Schema.Type<typeof MultiSelectPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const StatusPropertyInput = Schema.Struct({
    OptionId: Id.NotionOptionId,
    Type: Schema.tag("Status")
});

/** {@inheritDoc StatusPropertyInput} */
export type StatusPropertyInput = Schema.Schema.Type<typeof StatusPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const RelationPropertyInput = Schema.Struct({
    PageIds: Schema.Array(Id.NotionPageId),
    Type: Schema.tag("Relation")
});

/** {@inheritDoc RelationPropertyInput} */
export type RelationPropertyInput = Schema.Schema.Type<typeof RelationPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const PeoplePropertyInput = Schema.Struct({
    Type: Schema.tag("People"),
    UserIds: Schema.Array(Schema.String)
});

/** {@inheritDoc PeoplePropertyInput} */
export type PeoplePropertyInput = Schema.Schema.Type<typeof PeoplePropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const UrlPropertyInput = Schema.Struct({
    Type: Schema.tag("Url"),
    Value: Schema.String
});

/** {@inheritDoc UrlPropertyInput} */
export type UrlPropertyInput = Schema.Schema.Type<typeof UrlPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const EmailPropertyInput = Schema.Struct({
    Type: Schema.tag("Email"),
    Value: Schema.String
});

/** {@inheritDoc EmailPropertyInput} */
export type EmailPropertyInput = Schema.Schema.Type<typeof EmailPropertyInput>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const PhoneNumberPropertyInput = Schema.Struct({
    Type: Schema.tag("PhoneNumber"),
    Value: Schema.String
});

/** {@inheritDoc PhoneNumberPropertyInput} */
export type PhoneNumberPropertyInput = Schema.Schema.Type<typeof PhoneNumberPropertyInput>;

export/**
       * "What the user wants to put into it" — the value a Notivex form collects
       * for a single property, before it is translated into a Notion API request
       * body.
       *
       * @category Property
       * @since 1.0.0
       */
const PropertyInput = Schema.Union([
    TitlePropertyInput,
    RichTextPropertyInput,
    NumberPropertyInput,
    CheckboxPropertyInput,
    DatePropertyInput,
    SelectPropertyInput,
    MultiSelectPropertyInput,
    StatusPropertyInput,
    RelationPropertyInput,
    PeoplePropertyInput,
    UrlPropertyInput,
    EmailPropertyInput,
    PhoneNumberPropertyInput
]);

/** {@inheritDoc PropertyInput} */
export type PropertyInput = Schema.Schema.Type<typeof PropertyInput>;
