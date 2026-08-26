/**
 * The complete NoteFerry API contract: every group, endpoint, payload, success and
 * error schema the Expo app and the `api` Supabase Edge Function agree on.
 *
 * This module only *describes* the API.  Implementing each group's handlers
 * (`HttpApiBuilder.group`) and deriving a client (`HttpApiClient.make`) both
 * happen elsewhere, against this same value.
 *
 * @module @noteferry/api/Api
 *
 * @file      Api.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { AccountApi } from "./AccountApi.js";
import { ConnectionsApi } from "./ConnectionsApi.js";
import { DataSourcesApi } from "./DataSourcesApi.js";
import { DestinationsApi } from "./DestinationsApi.js";
import { ExportRequestsApi } from "./ExportRequestsApi.js";
import { FeedbackApi } from "./FeedbackApi.js";
import { HttpApi } from "effect/unstable/httpapi";
import { PagesApi } from "./PagesApi.js";
import { ProfileApi } from "./ProfileApi.js";
import { SubscriptionsApi } from "./SubscriptionsApi.js";

/**
 * The union of every domain error any `NoteFerryApi` endpoint can produce.
 * Also gives the declaration emitter a local binding through which it can
 * name each tagged error class embedded in `NoteFerryApi`'s inferred type
 * (TS2883), without a hand-written type annotation for the whole `HttpApi`
 * value.
 *
 * @category Api
 * @since 1.0.0
 */
export type NoteFerryApiError = Domain.Error.DomainError;

export/**
       * The complete NoteFerry HTTP API: `Connections`, `DataSources`,
       * `Destinations`, `Pages`, `Profile`, `Account`, `ExportRequests` and
       * `Feedback`, each prefixed under its own resource path.
       *
       * @category Api
       * @since 1.0.0
       */
const NoteFerryApi = HttpApi.make("NoteFerryApi").add(
    ConnectionsApi.prefix("/Connections"),
    DataSourcesApi.prefix("/DataSources"),
    DestinationsApi.prefix("/Destinations"),
    PagesApi.prefix("/Pages"),
    ProfileApi.prefix("/Profile"),
    AccountApi.prefix("/Account"),
    ExportRequestsApi.prefix("/ExportRequests"),
    SubscriptionsApi.prefix("/Subscriptions"),
    FeedbackApi.prefix("/Feedback")
);
