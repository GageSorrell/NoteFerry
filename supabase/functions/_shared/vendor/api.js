var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// Package/Api/Distribution/AccountApi.js
var AccountApi_exports = {};
__export(AccountApi_exports, {
  AccountApi: () => AccountApi,
  Delete: () => Delete
});
import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
var Delete = HttpApiEndpoint.delete("Delete", "/", {
  error: [
    Domain.Error.AuthenticationRequired,
    Domain.Error.DatabaseError
  ]
});
var AccountApi = HttpApiGroup.make("Account").add(Delete);

// Package/Api/Distribution/ConnectionsApi.js
var ConnectionsApi_exports = {};
__export(ConnectionsApi_exports, {
  ConnectionsApi: () => ConnectionsApi,
  Disconnect: () => Disconnect,
  List: () => List,
  StartAuthorization: () => StartAuthorization,
  StartAuthorizationResult: () => StartAuthorizationResult
});
import * as Domain2 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint2, HttpApiGroup as HttpApiGroup2 } from "effect/unstable/httpapi";
import { Schema } from "effect";
var StartAuthorizationResult = Schema.Struct({
  AuthorizationUrl: Schema.String
});
var List = HttpApiEndpoint2.get("List", "/", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.DatabaseError
  ],
  success: Schema.Array(Domain2.NotionConnection.NotionConnection)
});
var StartAuthorization = HttpApiEndpoint2.post("StartAuthorization", "/Notion/Start", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.DatabaseError
  ],
  success: StartAuthorizationResult
});
var Disconnect = HttpApiEndpoint2.delete("Disconnect", "/:ConnectionId", {
  error: [
    Domain2.Error.AuthenticationRequired,
    Domain2.Error.NotionConnectionNotFound,
    Domain2.Error.DatabaseError
  ],
  params: {
    ConnectionId: Domain2.Id.NotionConnectionId
  }
});
var ConnectionsApi = HttpApiGroup2.make("Connections").add(List, StartAuthorization, Disconnect);

// Package/Api/Distribution/DataSourcesApi.js
var DataSourcesApi_exports = {};
__export(DataSourcesApi_exports, {
  DataSourcesApi: () => DataSourcesApi,
  DiscoverOnboarding: () => DiscoverOnboarding,
  Get: () => Get,
  List: () => List2,
  Refresh: () => Refresh,
  RefreshDataSourcePayload: () => RefreshDataSourcePayload,
  Search: () => Search,
  SwapFreeActivePayload: () => SwapFreeActivePayload
});
import * as Domain3 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint3, HttpApiGroup as HttpApiGroup3 } from "effect/unstable/httpapi";
import { Schema as Schema2 } from "effect";
var RefreshDataSourcePayload = Schema2.Struct({
  ConnectionId: Domain3.Id.NotionConnectionId,
  DataSourceId: Domain3.Id.NotionDataSourceId
});
var Search = HttpApiEndpoint3.get("Search", "/Search/:ConnectionId", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.NotionConnectionNotFound,
    Domain3.Error.NotionConnectionRevoked,
    Domain3.Error.NotionUnauthorized,
    Domain3.Error.NotionRateLimited,
    Domain3.Error.NotionUnavailable,
    Domain3.Error.DatabaseError
  ],
  params: {
    ConnectionId: Domain3.Id.NotionConnectionId
  },
  success: Schema2.Array(Domain3.DataSource.DiscoveredDataSource)
});
var DiscoverOnboarding = HttpApiEndpoint3.get("DiscoverOnboarding", "/Onboarding/:ConnectionId", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.NotionConnectionNotFound,
    Domain3.Error.NotionConnectionRevoked,
    Domain3.Error.NotionUnauthorized,
    Domain3.Error.NotionRateLimited,
    Domain3.Error.NotionUnavailable,
    Domain3.Error.DatabaseError
  ],
  params: {
    ConnectionId: Domain3.Id.NotionConnectionId
  },
  success: Domain3.DataSource.OnboardingDiscovery
});
var List2 = HttpApiEndpoint3.get("List", "/", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DatabaseError
  ],
  success: Schema2.Array(Domain3.DataSource.CachedDataSourceSchema)
});
var Refresh = HttpApiEndpoint3.post("Refresh", "/Refresh", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.NotionConnectionNotFound,
    Domain3.Error.NotionConnectionRevoked,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.NotionResourceNotShared,
    Domain3.Error.NotionUnauthorized,
    Domain3.Error.NotionRateLimited,
    Domain3.Error.NotionUnavailable,
    Domain3.Error.FreeDatabaseLimitReached,
    Domain3.Error.DatabaseError
  ],
  payload: RefreshDataSourcePayload,
  success: Domain3.DataSource.CachedDataSourceSchema
});
var Get = HttpApiEndpoint3.get("Get", "/:DataSourceId", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.DatabaseError
  ],
  params: {
    DataSourceId: Domain3.Id.NotionDataSourceId
  },
  success: Domain3.DataSource.CachedDataSourceSchema
});
var SwapFreeActivePayload = Schema2.Struct({
  ActivateDataSourceId: Domain3.Id.NotionDataSourceId,
  LockDataSourceId: Domain3.Id.NotionDataSourceId
});
var SwapFreeActive = HttpApiEndpoint3.post("SwapFreeActive", "/SwapFreeActive", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.DatabaseError
  ],
  payload: SwapFreeActivePayload,
  success: Schema2.Array(Domain3.DataSource.CachedDataSourceSchema)
});
var Remove = HttpApiEndpoint3.post("Remove", "/:DataSourceId/Remove", {
  error: [
    Domain3.Error.AuthenticationRequired,
    Domain3.Error.DataSourceNotFound,
    Domain3.Error.DatabaseError
  ],
  params: { DataSourceId: Domain3.Id.NotionDataSourceId },
  success: Schema2.Void
});
var DataSourcesApi = HttpApiGroup3.make("DataSources").add(Search, DiscoverOnboarding, List2, Refresh, Get, SwapFreeActive, Remove);

// Package/Api/Distribution/DestinationsApi.js
var DestinationsApi_exports = {};
__export(DestinationsApi_exports, {
  Create: () => Create,
  CreateDestinationPayload: () => CreateDestinationPayload,
  Delete: () => Delete2,
  DestinationsApi: () => DestinationsApi,
  List: () => List3,
  Update: () => Update,
  UpdateDestinationPayload: () => UpdateDestinationPayload
});
import * as Domain4 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint4, HttpApiGroup as HttpApiGroup4 } from "effect/unstable/httpapi";
import { Schema as Schema3 } from "effect";
var CreateDestinationPayload = Schema3.Struct({
  ConnectionId: Domain4.Id.NotionConnectionId,
  DataSourceId: Domain4.Id.NotionDataSourceId,
  FieldConfiguration: Domain4.Destination.FieldConfiguration,
  Icon: Schema3.optional(Schema3.String),
  Name: Schema3.String,
  Position: Schema3.Number,
  PostCreationBehavior: Schema3.optional(Domain4.Behavior.PostCreationBehavior),
  Template: Domain4.Destination.DestinationTemplate,
  TemplateConfiguration: Schema3.optional(Domain4.Destination.TemplateConfiguration)
});
var UpdateDestinationPayload = Schema3.Struct({
  FieldConfiguration: Schema3.optional(Domain4.Destination.FieldConfiguration),
  Icon: Schema3.optional(Schema3.String),
  Name: Schema3.optional(Schema3.String),
  Position: Schema3.optional(Schema3.Number),
  PostCreationBehavior: Schema3.optional(Domain4.Behavior.PostCreationBehavior),
  Template: Schema3.optional(Domain4.Destination.DestinationTemplate),
  TemplateConfiguration: Schema3.optional(Domain4.Destination.TemplateConfiguration)
});
var List3 = HttpApiEndpoint4.get("List", "/", {
  error: [
    Domain4.Error.AuthenticationRequired,
    Domain4.Error.DatabaseError
  ],
  success: Schema3.Array(Domain4.Destination.Destination)
});
var Create = HttpApiEndpoint4.post("Create", "/", {
  error: [
    Domain4.Error.AuthenticationRequired,
    Domain4.Error.NotionConnectionNotFound,
    Domain4.Error.DataSourceNotFound,
    Domain4.Error.FeatureGateError,
    Domain4.Error.DatabaseError
  ],
  payload: CreateDestinationPayload,
  success: Domain4.Destination.Destination
});
var Update = HttpApiEndpoint4.patch("Update", "/:DestinationId", {
  error: [
    Domain4.Error.AuthenticationRequired,
    Domain4.Error.DestinationNotFound,
    Domain4.Error.DataSourceNotFound,
    Domain4.Error.DataSourceSchemaChanged,
    Domain4.Error.FeatureGateError,
    Domain4.Error.DatabaseError
  ],
  params: {
    DestinationId: Domain4.Id.DestinationId
  },
  payload: UpdateDestinationPayload,
  success: Domain4.Destination.Destination
});
var Delete2 = HttpApiEndpoint4.delete("Delete", "/:DestinationId", {
  error: [
    Domain4.Error.AuthenticationRequired,
    Domain4.Error.DatabaseError
  ],
  params: {
    DestinationId: Domain4.Id.DestinationId
  }
});
var DestinationsApi = HttpApiGroup4.make("Destinations").add(List3, Create, Update, Delete2);

// Package/Api/Distribution/ExportRequestsApi.js
var ExportRequestsApi_exports = {};
__export(ExportRequestsApi_exports, {
  Create: () => Create2,
  ExportRequestsApi: () => ExportRequestsApi
});
import * as Domain5 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint5, HttpApiGroup as HttpApiGroup5 } from "effect/unstable/httpapi";
var Create2 = HttpApiEndpoint5.post("Create", "/", {
  error: [
    Domain5.Error.AuthenticationRequired,
    Domain5.Error.DatabaseError
  ]
});
var ExportRequestsApi = HttpApiGroup5.make("ExportRequests").add(Create2);

// Package/Api/Distribution/FeedbackApi.js
var FeedbackApi_exports = {};
__export(FeedbackApi_exports, {
  Create: () => Create3,
  CreateFeedbackPayload: () => CreateFeedbackPayload,
  FeedbackApi: () => FeedbackApi,
  FeedbackKind: () => FeedbackKind
});
import * as Domain6 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint6, HttpApiGroup as HttpApiGroup6 } from "effect/unstable/httpapi";
import { Schema as Schema4 } from "effect";
var FeedbackKind = Schema4.Literals(["Feedback", "BugReport"]);
var CreateFeedbackPayload = Schema4.Struct({
  Kind: FeedbackKind,
  Message: Schema4.String,
  ShareContact: Schema4.Boolean
});
var Create3 = HttpApiEndpoint6.post("Create", "/", {
  error: [
    Domain6.Error.AuthenticationRequired,
    Domain6.Error.RateLimitExceeded,
    Domain6.Error.DatabaseError
  ],
  payload: CreateFeedbackPayload
});
var FeedbackApi = HttpApiGroup6.make("Feedback").add(Create3);

// Package/Api/Distribution/Api.js
import { HttpApi } from "effect/unstable/httpapi";

// Package/Api/Distribution/PagesApi.js
var PagesApi_exports = {};
__export(PagesApi_exports, {
  Create: () => Create4,
  PagesApi: () => PagesApi
});
import * as Domain7 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint7, HttpApiGroup as HttpApiGroup7 } from "effect/unstable/httpapi";
var Create4 = HttpApiEndpoint7.post("Create", "/", {
  error: [
    Domain7.Error.AuthenticationRequired,
    Domain7.Error.NotionConnectionNotFound,
    Domain7.Error.NotionConnectionRevoked,
    Domain7.Error.DataSourceNotFound,
    Domain7.Error.DataSourceSchemaChanged,
    Domain7.Error.InvalidPageDraft,
    Domain7.Error.NotionUnauthorized,
    Domain7.Error.NotionRateLimited,
    Domain7.Error.NotionValidationError,
    Domain7.Error.NotionUnavailable,
    Domain7.Error.FreeCreationWindowExceeded,
    Domain7.Error.FeatureGateError,
    Domain7.Error.DatabaseError
  ],
  payload: Domain7.Command.CreatePageCommand,
  success: Domain7.Command.CreatePageResult
});
var PagesApi = HttpApiGroup7.make("Pages").add(Create4);

// Package/Api/Distribution/ProfileApi.js
var ProfileApi_exports = {};
__export(ProfileApi_exports, {
  Get: () => Get2,
  ProfileApi: () => ProfileApi,
  UpdateSettings: () => UpdateSettings
});
import * as Domain8 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint8, HttpApiGroup as HttpApiGroup8 } from "effect/unstable/httpapi";
var Get2 = HttpApiEndpoint8.get("Get", "/", {
  error: [
    Domain8.Error.AuthenticationRequired,
    Domain8.Error.DatabaseError
  ],
  success: Domain8.Profile.Profile
});
var UpdateSettings = HttpApiEndpoint8.patch("UpdateSettings", "/Settings", {
  error: [
    Domain8.Error.AuthenticationRequired,
    Domain8.Error.DatabaseError
  ],
  payload: Domain8.Settings.AppSettings,
  success: Domain8.Profile.Profile
});
var ProfileApi = HttpApiGroup8.make("Profile").add(Get2, UpdateSettings);

// Package/Api/Distribution/SubscriptionsApi.js
var SubscriptionsApi_exports = {};
__export(SubscriptionsApi_exports, {
  RegisterDevicePayload: () => RegisterDevicePayload,
  RemoveDevicePayload: () => RemoveDevicePayload,
  SubscriptionsApi: () => SubscriptionsApi
});
import * as Domain9 from "@notivex/domain";
import { HttpApiEndpoint as HttpApiEndpoint9, HttpApiGroup as HttpApiGroup9 } from "effect/unstable/httpapi";
import { Schema as Schema5 } from "effect";
var RegisterDevicePayload = Schema5.Struct({
  DeviceId: Schema5.String,
  Platform: Domain9.Subscription.DevicePlatform,
  PushToken: Schema5.String
});
var RemoveDevicePayload = Schema5.Struct({ DeviceId: Schema5.String });
var CommonErrors = [
  Domain9.Error.AuthenticationRequired,
  Domain9.Error.DatabaseError,
  Domain9.Error.NetworkError
];
var Status = HttpApiEndpoint9.get("Status", "/Status", {
  error: CommonErrors,
  success: Domain9.Subscription.SubscriptionStatus
});
var Allowance = HttpApiEndpoint9.get("Allowance", "/Allowance", {
  error: CommonErrors,
  success: Domain9.Subscription.CreationAllowance
});
var Refresh2 = HttpApiEndpoint9.post("Refresh", "/Refresh", {
  error: CommonErrors,
  success: Domain9.Subscription.SubscriptionStatus
});
var Sale = HttpApiEndpoint9.get("Sale", "/Sale", {
  error: CommonErrors,
  success: Domain9.Subscription.ActiveSaleResponse
});
var RegisterDevice = HttpApiEndpoint9.post("RegisterDevice", "/Devices", {
  error: CommonErrors,
  payload: RegisterDevicePayload,
  success: Schema5.Void
});
var RemoveDevice = HttpApiEndpoint9.post("RemoveDevice", "/Devices/Remove", {
  error: CommonErrors,
  payload: RemoveDevicePayload,
  success: Schema5.Void
});
var SubscriptionsApi = HttpApiGroup9.make("Subscriptions").add(Status, Allowance, Refresh2, Sale, RegisterDevice, RemoveDevice);

// Package/Api/Distribution/Api.js
var NotivexApi = HttpApi.make("NotivexApi").add(ConnectionsApi.prefix("/Connections"), DataSourcesApi.prefix("/DataSources"), DestinationsApi.prefix("/Destinations"), PagesApi.prefix("/Pages"), ProfileApi.prefix("/Profile"), AccountApi.prefix("/Account"), ExportRequestsApi.prefix("/ExportRequests"), SubscriptionsApi.prefix("/Subscriptions"), FeedbackApi.prefix("/Feedback"));
export {
  AccountApi_exports as AccountApi,
  ConnectionsApi_exports as ConnectionsApi,
  DataSourcesApi_exports as DataSourcesApi,
  DestinationsApi_exports as DestinationsApi,
  ExportRequestsApi_exports as ExportRequestsApi,
  FeedbackApi_exports as FeedbackApi,
  NotivexApi,
  PagesApi_exports as PagesApi,
  ProfileApi_exports as ProfileApi,
  SubscriptionsApi_exports as SubscriptionsApi
};
/**
 * The `Account` group: permanently deleting the current user's account.
 *
 * @module @notivex/api/AccountApi
 *
 * @file      AccountApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Connections` group: starting Notion's OAuth authorization flow,
 * listing a user's authorized Notion connections, and disconnecting one.
 * The OAuth token exchange itself happens in the separate, unauthenticated
 * `notion-oauth-callback` Edge Function, not here.
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
 * Notion data-source schemas that drive Notivex's quick-add forms.
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
 * user's quick-entry destinations.
 *
 * @module @notivex/api/DestinationsApi
 *
 * @file      DestinationsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `ExportRequests` group: asking Notivex to prepare an export of the
 * current user's account data. Requests are fulfilled manually — creating one
 * only records the request and notifies Notivex.
 *
 * @module @notivex/api/ExportRequestsApi
 *
 * @file      ExportRequestsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Feedback` group: submitting in-app feedback or a bug report. Both
 * share this single endpoint, distinguished by `Kind` — the mobile app's
 * `feedback` screen is one component reused for both, with only its
 * expo-router header text differing. Creating a row emails Notivex via
 * Resend (`supabase/schemas/11_notifications.sql`) and is rate-limited
 * server-side (`supabase/schemas/13_app_feedback_submissions.sql`).
 *
 * @module @notivex/api/FeedbackApi
 *
 * @file      FeedbackApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Pages` group: creating a Notion page from a destination. This is the
 * one place the wire contract accepts a Notivex-shaped
 * {@link Domain.Command.CreatePageCommand} rather than Notion's own request
 * body — only the server-side Notion adapter ever constructs that.
 *
 * @module @notivex/api/PagesApi
 *
 * @file      PagesApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * The `Profile` group: reading the current user's profile and updating their
 * app-wide {@link Domain.Settings.AppSettings}.
 *
 * @module @notivex/api/ProfileApi
 *
 * @file      ProfileApi.ts
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
