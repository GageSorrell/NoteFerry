/**
 * Public entry point for `@noteferry/domain`.
 *
 * Portable Effect `Schema` definitions shared across NoteFerry: branded ids,
 * the Notion property/data-source/connection/destination model, local
 * quick-entry drafts, and the tagged error vocabulary. This package must
 * never import Expo, Supabase, or the Notion SDK.
 *
 * @module @noteferry/domain
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * as Id from "./Id.js";
export * as Property from "./Property/index.js";
export * as Behavior from "./Behavior.js";
export * as DataSource from "./DataSource.js";
export * as NotionConnection from "./NotionConnection.js";
export * as Destination from "./Destination.js";
export * as Profile from "./Profile.js";
export * as Settings from "./Settings.js";
export * as PageDraft from "./PageDraft.js";
export * as Command from "./Command.js";
export * as Error from "./Error.js";
export * as Subscription from "./Subscription.js";
