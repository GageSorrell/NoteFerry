/**
 * Public entry point for `@notivex/domain`.
 *
 * Portable Effect `Schema` definitions shared across Notivex: branded ids,
 * the Notion property/data-source/connection/destination model, local
 * quick-entry drafts, and the tagged error vocabulary. This package must
 * never import Expo, Supabase, or the Notion SDK — see
 * `ArchitectureInitialDraft.md` §35.
 *
 * @module @notivex/domain
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * as Id from "./Id.js";
export * as Property from "./Property/index.js";
export * as DataSource from "./DataSource.js";
export * as NotionConnection from "./NotionConnection.js";
export * as Destination from "./Destination.js";
export * as PageDraft from "./PageDraft.js";
export * as Error from "./Error.js";
