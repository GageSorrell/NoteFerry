/**
 * `PageDraft` — local, unsaved quick-entry state: what the user has typed
 * into a destination's form before it becomes a command sent to the
 * NoteFerry API. This is a NoteFerry-shaped value, never Notion-shaped JSON.
 *
 * @module @noteferry/domain/PageDraft
 *
 * @file      PageDraft.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { PropertyInput } from "./Property/Input.js";
import { Schema } from "effect";

export/**
       * The value the user has entered for a single property, paired with the
       * property it belongs to.
       *
       * @category PageDraft
       * @since 1.0.0
       */
const PropertyInputValue = Schema.Struct({
    PropertyId: Id.NotionPropertyId,
    Value: PropertyInput
});

/** {@inheritDoc PropertyInputValue} */
export type PropertyInputValue = Schema.Schema.Type<typeof PropertyInputValue>;

export/**
       * Local, unsaved state for one in-progress quick-entry page.
       *
       * @category PageDraft
       * @since 1.0.0
       */
const PageDraft = Schema.Struct({
    Body: Schema.optional(Schema.String),
    DestinationId: Id.DestinationId,
    Title: Schema.optional(Schema.String),
    UpdatedAt: Schema.DateFromString,
    Values: Schema.Array(PropertyInputValue)
});

/** {@inheritDoc PageDraft} */
export type PageDraft = Schema.Schema.Type<typeof PageDraft>;
