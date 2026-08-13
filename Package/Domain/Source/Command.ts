/**
 * `CreatePageCommand` — a Notivex-shaped request to create a Notion page,
 * distinct from both {@link PageDraft.PageDraft} (local, still-editable
 * state) and Notion's own Create Page request body, which only the
 * server-side Notion adapter ever constructs — see
 * `ArchitectureInitialDraft.md` §20-21.
 *
 * @module @notivex/domain/Command
 *
 * @file      Command.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import { PropertyInputValue } from "./PageDraft.js";
import { Schema } from "effect";

export/**
       * A request to create a page in a destination's data source. The client
       * generates {@link Id.OperationId} before sending so the same attempt can
       * be recognized if it is retried after a crash or timeout.
       *
       * @category Command
       * @since 1.0.0
       */
const CreatePageCommand = Schema.Struct({
    Body: Schema.optional(Schema.String),
    DestinationId: Id.DestinationId,
    OperationId: Id.OperationId,
    Title: Schema.optional(Schema.String),
    Values: Schema.Array(PropertyInputValue)
});

/** {@inheritDoc CreatePageCommand} */
export type CreatePageCommand = Schema.Schema.Type<typeof CreatePageCommand>;

export/**
       * The result of a successfully completed {@link CreatePageCommand}.
       *
       * @category Command
       * @since 1.0.0
       */
const CreatePageResult = Schema.Struct({
    NotionPageId: Id.NotionPageId,
    OperationId: Id.OperationId
});

/** {@inheritDoc CreatePageResult} */
export type CreatePageResult = Schema.Schema.Type<typeof CreatePageResult>;
