/**
 * `PropertyOption` — a single selectable value of a select, multi-select or
 * status property, shared between {@link Property.Definition} (what options
 * exist) and {@link Property.Input} (which option a user picked).
 *
 * @module @noteferry/domain/Property/Option
 *
 * @file      Option.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "../Id.js";
import * as Schema from "effect/Schema";

export/**
       * Notion's fixed set of semantic tag colors.
       *
       * @category Property
       * @since 1.0.0
       */
const PropertyOptionColor = Schema.Literals([
    "Default",
    "Gray",
    "Brown",
    "Orange",
    "Yellow",
    "Green",
    "Blue",
    "Purple",
    "Pink",
    "Red"
]);

/** {@inheritDoc PropertyOptionColor} */
export type PropertyOptionColor = Schema.Schema.Type<typeof PropertyOptionColor>;

export/**
       * One option belonging to a select, multi-select or status property.
       *
       * @category Property
       * @since 1.0.0
       */
const PropertyOption = Schema.Struct({
    Color: PropertyOptionColor,
    Id: Id.NotionOptionId,
    Name: Schema.String
});

/** {@inheritDoc PropertyOption} */
export type PropertyOption = Schema.Schema.Type<typeof PropertyOption>;

export/**
       * One of the ordered groups that organizes a Notion status property's
       * options.
       *
       * @category Property
       * @since 1.0.0
       */
const StatusGroup = Schema.Struct({
    Color: PropertyOptionColor,
    Id: Schema.String,
    Name: Schema.String,
    OptionIds: Schema.Array(Id.NotionOptionId)
});

/** {@inheritDoc StatusGroup} */
export type StatusGroup = Schema.Schema.Type<typeof StatusGroup>;
