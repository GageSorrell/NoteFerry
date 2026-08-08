var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// Package/Api/Distribution/ConnectionsApi.js
var ConnectionsApi_exports = {};
__export(ConnectionsApi_exports, {
  ConnectionsApi: () => ConnectionsApi,
  Disconnect: () => Disconnect,
  List: () => List,
  StartAuthorization: () => StartAuthorization,
  StartAuthorizationResult: () => StartAuthorizationResult
});
import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";
var StartAuthorizationResult = Schema.Struct({
  AuthorizationUrl: Schema.String
});
var List = HttpApiEndpoint.get("List", "/", {
  error: [
    Domain.Error.AuthenticationRequired,
    Domain.Error.DatabaseError
  ],
  success: Schema.Array(Domain.NotionConnection.NotionConnection)
});
var StartAuthorization = HttpApiEndpoint.post("StartAuthorization", "/Notion/Start", {
  error: [
    Domain.Error.AuthenticationRequired,
    Domain.Error.DatabaseError
  ],
  success: StartAuthorizationResult
});
var Disconnect = HttpApiEndpoint.delete("Disconnect", "/:ConnectionId", {
  error: [
    Domain.Error.AuthenticationRequired,
    Domain.Error.NotionConnectionNotFound,
    Domain.Error.DatabaseError
  ],
  params: {
    ConnectionId: Domain.Id.NotionConnectionId
  }
});
var ConnectionsApi = HttpApiGroup.make("Connections").add(List, StartAuthorization, Disconnect);

// Package/Api/Distribution/DataSourcesApi.js
var DataSourcesApi_exports = {};
__export(DataSourcesApi_exports, {
  DataSourcesApi: () => DataSourcesApi,
  Get: () => Get,
  List: () => List2,
  Refresh: () => Refresh,
  RefreshDataSourcePayload: () => RefreshDataSourcePayload,
  Search: () => Search
});
import * as Domain2 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint2, HttpApiGroup as HttpApiGroup2 } from "effect/unstable/httpapi";
import { Schema as Schema2 } from "effect";
var RefreshDataSourcePayload = Schema2.Struct({
  ConnectionId: Domain2.Id.NotionConnectionId,
  DataSourceId: Domain2.Id.NotionDataSourceId
});
var Search = HttpApiEndpoint2.get("Search", "/Search/:ConnectionId", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.NotionConnectionNotFound,
    Domain2.Error.NotionConnectionRevoked,
    Domain2.Error.NotionUnauthorized,
    Domain2.Error.NotionRateLimited,
    Domain2.Error.NotionUnavailable,
    Domain2.Error.DatabaseError
  ],
  params: {
    ConnectionId: Domain2.Id.NotionConnectionId
  },
  success: Schema2.Array(Domain2.DataSource.DiscoveredDataSource)
});
var List2 = HttpApiEndpoint2.get("List", "/", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.DatabaseError
  ],
  success: Schema2.Array(Domain2.DataSource.CachedDataSourceSchema)
});
var Refresh = HttpApiEndpoint2.post("Refresh", "/Refresh", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.NotionConnectionNotFound,
    Domain2.Error.NotionConnectionRevoked,
    Domain2.Error.DataSourceNotFound,
    Domain2.Error.NotionResourceNotShared,
    Domain2.Error.NotionUnauthorized,
    Domain2.Error.NotionRateLimited,
    Domain2.Error.NotionUnavailable,
    Domain2.Error.DatabaseError
  ],
  payload: RefreshDataSourcePayload,
  success: Domain2.DataSource.CachedDataSourceSchema
});
var Get = HttpApiEndpoint2.get("Get", "/:DataSourceId", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.DataSourceNotFound,
    Domain2.Error.DatabaseError
  ],
  params: {
    DataSourceId: Domain2.Id.NotionDataSourceId
  },
  success: Domain2.DataSource.CachedDataSourceSchema
});
var DataSourcesApi = HttpApiGroup2.make("DataSources").add(Search, List2, Refresh, Get);

// Package/Api/Distribution/DestinationsApi.js
var DestinationsApi_exports = {};
__export(DestinationsApi_exports, {
  Create: () => Create,
  CreateDestinationPayload: () => CreateDestinationPayload,
  Delete: () => Delete,
  DestinationsApi: () => DestinationsApi,
  List: () => List3,
  Update: () => Update,
  UpdateDestinationPayload: () => UpdateDestinationPayload
});
import * as Domain3 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint3, HttpApiGroup as HttpApiGroup3 } from "effect/unstable/httpapi";
import { Schema as Schema3 } from "effect";
var CreateDestinationPayload = Schema3.Struct({
  ConnectionId: Domain3.Id.NotionConnectionId,
  DataSourceId: Domain3.Id.NotionDataSourceId,
  FieldConfiguration: Domain3.Destination.FieldConfiguration,
  Icon: Schema3.optional(Schema3.String),
  Name: Schema3.String,
  Position: Schema3.Number,
  Template: Domain3.Destination.DestinationTemplate
});
var UpdateDestinationPayload = Schema3.Struct({
  FieldConfiguration: Schema3.optional(Domain3.Destination.FieldConfiguration),
  Icon: Schema3.optional(Schema3.String),
  Name: Schema3.optional(Schema3.String),
  Position: Schema3.optional(Schema3.Number),
  Template: Schema3.optional(Domain3.Destination.DestinationTemplate)
});
var List3 = HttpApiEndpoint3.get("List", "/", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DatabaseError
  ],
  success: Schema3.Array(Domain3.Destination.Destination)
});
var Create = HttpApiEndpoint3.post("Create", "/", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.NotionConnectionNotFound,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.DatabaseError
  ],
  payload: CreateDestinationPayload,
  success: Domain3.Destination.Destination
});
var Update = HttpApiEndpoint3.patch("Update", "/:DestinationId", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DestinationNotFound,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.DataSourceSchemaChanged,
    Domain3.Error.DatabaseError
  ],
  params: {
    DestinationId: Domain3.Id.DestinationId
  },
  payload: UpdateDestinationPayload,
  success: Domain3.Destination.Destination
});
var Delete = HttpApiEndpoint3.delete("Delete", "/:DestinationId", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DatabaseError
  ],
  params: {
    DestinationId: Domain3.Id.DestinationId
  }
});
var DestinationsApi = HttpApiGroup3.make("Destinations").add(List3, Create, Update, Delete);

// Package/Api/Distribution/Api.js
import { HttpApi } from "effect/unstable/httpapi";

// Package/Api/Distribution/PagesApi.js
var PagesApi_exports = {};
__export(PagesApi_exports, {
  Create: () => Create2,
  PagesApi: () => PagesApi
});
import * as Domain4 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint4, HttpApiGroup as HttpApiGroup4 } from "effect/unstable/httpapi";
var Create2 = HttpApiEndpoint4.post("Create", "/", {
  error: [
    Domain4.Error.AuthenticationRequired,
    Domain4.Error.NotionConnectionNotFound,
    Domain4.Error.NotionConnectionRevoked,
    Domain4.Error.DataSourceNotFound,
    Domain4.Error.DataSourceSchemaChanged,
    Domain4.Error.InvalidPageDraft,
    Domain4.Error.NotionUnauthorized,
    Domain4.Error.NotionRateLimited,
    Domain4.Error.NotionValidationError,
    Domain4.Error.NotionUnavailable,
    Domain4.Error.DatabaseError
  ],
  payload: Domain4.Command.CreatePageCommand,
  success: Domain4.Command.CreatePageResult
});
var PagesApi = HttpApiGroup4.make("Pages").add(Create2);

// Package/Api/Distribution/Api.js
var NotivexApi = HttpApi.make("NotivexApi").add(ConnectionsApi.prefix("/Connections"), DataSourcesApi.prefix("/DataSources"), DestinationsApi.prefix("/Destinations"), PagesApi.prefix("/Pages"));
export {
  ConnectionsApi_exports as ConnectionsApi,
  DataSourcesApi_exports as DataSourcesApi,
  DestinationsApi_exports as DestinationsApi,
  NotivexApi,
  PagesApi_exports as PagesApi
};
/**
 * The `Connections` group: starting Notion's OAuth authorization flow,
 * listing a user's authorized Notion connections, and disconnecting one.
 * See `ArchitectureInitialDraft.md` §16-17 — the OAuth token exchange itself
 * happens in the separate, unauthenticated `notion-oauth-callback` Edge
 * Function, not here.
 *
 * @module @notivex/api/ConnectionsApi
 *
 * @file      ConnectionsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `DataSources` group: reading and refreshing the normalized, cached
 * Notion data-source schemas that drive Notivex's quick-add forms. See
 * `ArchitectureInitialDraft.md` §11-12 and §26-27.
 *
 * @module @notivex/api/DataSourcesApi
 *
 * @file      DataSourcesApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Destinations` group: creating, reading, updating and deleting a
 * user's quick-entry destinations. See `ArchitectureInitialDraft.md` §24-25.
 *
 * @module @notivex/api/DestinationsApi
 *
 * @file      DestinationsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Pages` group: creating a Notion page from a destination. This is the
 * one place the wire contract accepts a Notivex-shaped
 * {@link Domain.Command.CreatePageCommand} rather than Notion's own request
 * body — only the server-side Notion adapter ever constructs that. See
 * `ArchitectureInitialDraft.md` §20-21.
 *
 * @module @notivex/api/PagesApi
 *
 * @file      PagesApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The complete Notivex API contract: every group, endpoint, payload, success and
 * error schema the Expo app and the `api` Supabase Edge Function agree on.
 *
 * This module only *describes* the API. Implementing each group's handlers
 * (`HttpApiBuilder.group`) and deriving a client (`HttpApiClient.make`) both
 * happen elsewhere, against this same value.
 *
 * @module @notivex/api/Api
 *
 * @file      Api.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * Public entry point for `@notivex/api`.
 *
 * The Effect `HttpApi` contract shared between the Expo app and the
 * Notivex Supabase Edge Function: request/response schemas built on top of
 * `@notivex/domain`, one module per resource group.
 *
 * @module @notivex/api
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
