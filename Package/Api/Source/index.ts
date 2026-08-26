/**
 * Public entry point for `@noteferry/api`.
 *
 * The Effect `HttpApi` contract shared between the Expo app and the
 * NoteFerry Supabase Edge Function: request/response schemas built on top of
 * `@noteferry/domain`, one module per resource group.
 *
 * @module @noteferry/api
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * from "./Api.js";
export * as AccountApi from "./AccountApi.js";
export * as ConnectionsApi from "./ConnectionsApi.js";
export * as DataSourcesApi from "./DataSourcesApi.js";
export * as DestinationsApi from "./DestinationsApi.js";
export * as ExportRequestsApi from "./ExportRequestsApi.js";
export * as FeedbackApi from "./FeedbackApi.js";
export * as PagesApi from "./PagesApi.js";
export * as ProfileApi from "./ProfileApi.js";
export * as SubscriptionsApi from "./SubscriptionsApi.js";
