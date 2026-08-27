/**
 * `PropertyDefinition` — "what this Notion property is". One struct per
 * Notion property type, discriminated by `Type`, plus the `PropertyDefinition`
 * union of all of them.
 *
 * Deliberately kept separate from {@link Property.Input} ("what the user
 * wants to put into it") and from Notion's own API representation.
 *
 * @module @noteferry/domain/Property/Definition
 *
 * @file      Definition.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "../Id.js";
import { PropertyOption, StatusGroup } from "./Option.js";
import * as Schema from "effect/Schema";

/**
 * Fields every property definition carries regardless of type.
 *
 * @category Property
 * @since 1.0.0
 */
const Base =
    {
        Id: Id.NotionPropertyId,
        Name: Schema.String
    };

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const TitlePropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Title")
});

/** {@inheritDoc TitlePropertyDefinition} */
export type TitlePropertyDefinition = Schema.Schema.Type<typeof TitlePropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const RichTextPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("RichText")
});

/** {@inheritDoc RichTextPropertyDefinition} */
export type RichTextPropertyDefinition = Schema.Schema.Type<typeof RichTextPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const NumberPropertyDefinition = Schema.Struct({
    ...Base,
    Format: Schema.String,
    Type: Schema.tag("Number")
});

/** {@inheritDoc NumberPropertyDefinition} */
export type NumberPropertyDefinition = Schema.Schema.Type<typeof NumberPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const CheckboxPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Checkbox")
});

/** {@inheritDoc CheckboxPropertyDefinition} */
export type CheckboxPropertyDefinition = Schema.Schema.Type<typeof CheckboxPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const DatePropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Date")
});

/** {@inheritDoc DatePropertyDefinition} */
export type DatePropertyDefinition = Schema.Schema.Type<typeof DatePropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const SelectPropertyDefinition = Schema.Struct({
    ...Base,
    Options: Schema.Array(PropertyOption),
    Type: Schema.tag("Select")
});

/** {@inheritDoc SelectPropertyDefinition} */
export type SelectPropertyDefinition = Schema.Schema.Type<typeof SelectPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const MultiSelectPropertyDefinition = Schema.Struct({
    ...Base,
    Options: Schema.Array(PropertyOption),
    Type: Schema.tag("MultiSelect")
});

/** {@inheritDoc MultiSelectPropertyDefinition} */
export type MultiSelectPropertyDefinition = Schema.Schema.Type<typeof MultiSelectPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const StatusPropertyDefinition = Schema.Struct({
    ...Base,
    Groups: Schema.optional(Schema.Array(StatusGroup)),
    Options: Schema.Array(PropertyOption),
    Type: Schema.tag("Status")
});

/** {@inheritDoc StatusPropertyDefinition} */
export type StatusPropertyDefinition = Schema.Schema.Type<typeof StatusPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const RelationPropertyDefinition = Schema.Struct({
    ...Base,
    RelatedDataSourceId: Id.NotionDataSourceId,
    Type: Schema.tag("Relation")
});

/** {@inheritDoc RelationPropertyDefinition} */
export type RelationPropertyDefinition = Schema.Schema.Type<typeof RelationPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const PeoplePropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("People")
});

/** {@inheritDoc PeoplePropertyDefinition} */
export type PeoplePropertyDefinition = Schema.Schema.Type<typeof PeoplePropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const UrlPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Url")
});

/** {@inheritDoc UrlPropertyDefinition} */
export type UrlPropertyDefinition = Schema.Schema.Type<typeof UrlPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const EmailPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Email")
});

/** {@inheritDoc EmailPropertyDefinition} */
export type EmailPropertyDefinition = Schema.Schema.Type<typeof EmailPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const PhoneNumberPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("PhoneNumber")
});

/** {@inheritDoc PhoneNumberPropertyDefinition} */
export type PhoneNumberPropertyDefinition = Schema.Schema.Type<typeof PhoneNumberPropertyDefinition>;

export/**
       * TODO Write description.
       *
       * @category Property
       * @since 1.0.0
       */
const FilesPropertyDefinition = Schema.Struct({
    ...Base,
    Type: Schema.tag("Files")
});

/** {@inheritDoc FilesPropertyDefinition} */
export type FilesPropertyDefinition = Schema.Schema.Type<typeof FilesPropertyDefinition>;

export/**
       * "What this Notion property is" — the normalized, NoteFerry-owned
       * representation of a single property on a data source's schema.
       *
       * @category Property
       * @since 1.0.0
       */
const PropertyDefinition = Schema.Union([
    TitlePropertyDefinition,
    RichTextPropertyDefinition,
    NumberPropertyDefinition,
    CheckboxPropertyDefinition,
    DatePropertyDefinition,
    SelectPropertyDefinition,
    MultiSelectPropertyDefinition,
    StatusPropertyDefinition,
    RelationPropertyDefinition,
    PeoplePropertyDefinition,
    UrlPropertyDefinition,
    EmailPropertyDefinition,
    PhoneNumberPropertyDefinition,
    FilesPropertyDefinition
]);

/** {@inheritDoc PropertyDefinition} */
export type PropertyDefinition = Schema.Schema.Type<typeof PropertyDefinition>;
