var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// Package/Domain/Distribution/Id.js
var Id_exports = {};
__export(Id_exports, {
  DestinationId: () => DestinationId,
  NotionConnectionId: () => NotionConnectionId,
  NotionDataSourceId: () => NotionDataSourceId,
  NotionDatabaseId: () => NotionDatabaseId,
  NotionOptionId: () => NotionOptionId,
  NotionPageId: () => NotionPageId,
  NotionPropertyId: () => NotionPropertyId,
  NotionTemplateId: () => NotionTemplateId,
  NotionWorkspaceId: () => NotionWorkspaceId,
  OperationId: () => OperationId,
  UserId: () => UserId
});
import { Schema, pipe } from "effect";
var UserId = pipe(Schema.String, Schema.brand("UserId"));
var NotionConnectionId = pipe(Schema.String, Schema.brand("NotionConnectionId"));
var NotionWorkspaceId = pipe(Schema.String, Schema.brand("NotionWorkspaceId"));
var NotionDatabaseId = pipe(Schema.String, Schema.brand("NotionDatabaseId"));
var NotionDataSourceId = pipe(Schema.String, Schema.brand("NotionDataSourceId"));
var NotionPageId = pipe(Schema.String, Schema.brand("NotionPageId"));
var NotionPropertyId = pipe(Schema.String, Schema.brand("NotionPropertyId"));
var NotionOptionId = pipe(Schema.String, Schema.brand("NotionOptionId"));
var NotionTemplateId = pipe(Schema.String, Schema.brand("NotionTemplateId"));
var DestinationId = pipe(Schema.String, Schema.brand("DestinationId"));
var OperationId = pipe(Schema.String, Schema.brand("OperationId"));

// Package/Domain/Distribution/Property/index.js
var Property_exports = {};
__export(Property_exports, {
  CheckboxPropertyDefinition: () => CheckboxPropertyDefinition,
  CheckboxPropertyInput: () => CheckboxPropertyInput,
  DatePropertyDefinition: () => DatePropertyDefinition,
  DatePropertyInput: () => DatePropertyInput,
  EmailPropertyDefinition: () => EmailPropertyDefinition,
  EmailPropertyInput: () => EmailPropertyInput,
  FilesPropertyDefinition: () => FilesPropertyDefinition,
  MultiSelectPropertyDefinition: () => MultiSelectPropertyDefinition,
  MultiSelectPropertyInput: () => MultiSelectPropertyInput,
  NumberPropertyDefinition: () => NumberPropertyDefinition,
  NumberPropertyInput: () => NumberPropertyInput,
  PeoplePropertyDefinition: () => PeoplePropertyDefinition,
  PeoplePropertyInput: () => PeoplePropertyInput,
  PhoneNumberPropertyDefinition: () => PhoneNumberPropertyDefinition,
  PhoneNumberPropertyInput: () => PhoneNumberPropertyInput,
  PropertyDefinition: () => PropertyDefinition,
  PropertyInput: () => PropertyInput,
  PropertyOption: () => PropertyOption,
  PropertyOptionColor: () => PropertyOptionColor,
  RelationPropertyDefinition: () => RelationPropertyDefinition,
  RelationPropertyInput: () => RelationPropertyInput,
  RichTextPropertyDefinition: () => RichTextPropertyDefinition,
  RichTextPropertyInput: () => RichTextPropertyInput,
  SelectPropertyDefinition: () => SelectPropertyDefinition,
  SelectPropertyInput: () => SelectPropertyInput,
  StatusGroup: () => StatusGroup,
  StatusPropertyDefinition: () => StatusPropertyDefinition,
  StatusPropertyInput: () => StatusPropertyInput,
  TitlePropertyDefinition: () => TitlePropertyDefinition,
  TitlePropertyInput: () => TitlePropertyInput,
  UrlPropertyDefinition: () => UrlPropertyDefinition,
  UrlPropertyInput: () => UrlPropertyInput
});

// Package/Domain/Distribution/Property/Option.js
import { Schema as Schema2 } from "effect";
var PropertyOptionColor = Schema2.Literals([
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
var PropertyOption = Schema2.Struct({
  Color: PropertyOptionColor,
  Id: NotionOptionId,
  Name: Schema2.String
});
var StatusGroup = Schema2.Struct({
  Color: PropertyOptionColor,
  Id: Schema2.String,
  Name: Schema2.String,
  OptionIds: Schema2.Array(NotionOptionId)
});

// Package/Domain/Distribution/Property/Definition.js
import { Schema as Schema3 } from "effect";
var Base = {
  Id: NotionPropertyId,
  Name: Schema3.String
};
var TitlePropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Title")
});
var RichTextPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("RichText")
});
var NumberPropertyDefinition = Schema3.Struct({
  ...Base,
  Format: Schema3.String,
  Type: Schema3.tag("Number")
});
var CheckboxPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Checkbox")
});
var DatePropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Date")
});
var SelectPropertyDefinition = Schema3.Struct({
  ...Base,
  Options: Schema3.Array(PropertyOption),
  Type: Schema3.tag("Select")
});
var MultiSelectPropertyDefinition = Schema3.Struct({
  ...Base,
  Options: Schema3.Array(PropertyOption),
  Type: Schema3.tag("MultiSelect")
});
var StatusPropertyDefinition = Schema3.Struct({
  ...Base,
  Groups: Schema3.optional(Schema3.Array(StatusGroup)),
  Options: Schema3.Array(PropertyOption),
  Type: Schema3.tag("Status")
});
var RelationPropertyDefinition = Schema3.Struct({
  ...Base,
  RelatedDataSourceId: NotionDataSourceId,
  Type: Schema3.tag("Relation")
});
var PeoplePropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("People")
});
var UrlPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Url")
});
var EmailPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Email")
});
var PhoneNumberPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("PhoneNumber")
});
var FilesPropertyDefinition = Schema3.Struct({
  ...Base,
  Type: Schema3.tag("Files")
});
var PropertyDefinition = Schema3.Union([
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

// Package/Domain/Distribution/Property/Input.js
import { Schema as Schema4 } from "effect";
var TitlePropertyInput = Schema4.Struct({
  Type: Schema4.tag("Title"),
  Value: Schema4.String
});
var RichTextPropertyInput = Schema4.Struct({
  Type: Schema4.tag("RichText"),
  Value: Schema4.String
});
var NumberPropertyInput = Schema4.Struct({
  Type: Schema4.tag("Number"),
  Value: Schema4.Number
});
var CheckboxPropertyInput = Schema4.Struct({
  Type: Schema4.tag("Checkbox"),
  Value: Schema4.Boolean
});
var DatePropertyInput = Schema4.Struct({
  End: Schema4.optional(Schema4.DateFromString),
  Start: Schema4.DateFromString,
  Type: Schema4.tag("Date")
});
var SelectPropertyInput = Schema4.Struct({
  OptionId: NotionOptionId,
  Type: Schema4.tag("Select")
});
var MultiSelectPropertyInput = Schema4.Struct({
  OptionIds: Schema4.Array(NotionOptionId),
  Type: Schema4.tag("MultiSelect")
});
var StatusPropertyInput = Schema4.Struct({
  OptionId: NotionOptionId,
  Type: Schema4.tag("Status")
});
var RelationPropertyInput = Schema4.Struct({
  PageIds: Schema4.Array(NotionPageId),
  Type: Schema4.tag("Relation")
});
var PeoplePropertyInput = Schema4.Struct({
  Type: Schema4.tag("People"),
  UserIds: Schema4.Array(Schema4.String)
});
var UrlPropertyInput = Schema4.Struct({
  Type: Schema4.tag("Url"),
  Value: Schema4.String
});
var EmailPropertyInput = Schema4.Struct({
  Type: Schema4.tag("Email"),
  Value: Schema4.String
});
var PhoneNumberPropertyInput = Schema4.Struct({
  Type: Schema4.tag("PhoneNumber"),
  Value: Schema4.String
});
var PropertyInput = Schema4.Union([
  TitlePropertyInput,
  RichTextPropertyInput,
  NumberPropertyInput,
  CheckboxPropertyInput,
  DatePropertyInput,
  SelectPropertyInput,
  MultiSelectPropertyInput,
  StatusPropertyInput,
  RelationPropertyInput,
  PeoplePropertyInput,
  UrlPropertyInput,
  EmailPropertyInput,
  PhoneNumberPropertyInput
]);

// Package/Domain/Distribution/DataSource.js
var DataSource_exports = {};
__export(DataSource_exports, {
  CachedDataSourceSchema: () => CachedDataSourceSchema,
  CachedDataSourceSchemaVersion: () => CachedDataSourceSchemaVersion,
  DiscoveredDataSource: () => DiscoveredDataSource,
  OnboardingDatabase: () => OnboardingDatabase,
  OnboardingDiscovery: () => OnboardingDiscovery,
  OnboardingPage: () => OnboardingPage
});
import { Schema as Schema5 } from "effect";
var CachedDataSourceSchemaVersion = Schema5.Literal(1);
var DiscoveredDataSource = Schema5.Struct({
  ConnectionId: NotionConnectionId,
  CoverUrl: Schema5.optional(Schema5.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema5.optional(Schema5.String),
  IconType: Schema5.optional(Schema5.Literals(["Emoji", "Image", "Native"])),
  Title: Schema5.String
});
var OnboardingPage = Schema5.Struct({
  Id: NotionPageId,
  Title: Schema5.String
});
var OnboardingDatabase = Schema5.Struct({
  ConnectionId: NotionConnectionId,
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  HasMoreThan100Pages: Schema5.Boolean,
  Icon: Schema5.optional(Schema5.String),
  IconType: Schema5.optional(Schema5.Literals(["Emoji", "Image", "Native"])),
  PageCount: Schema5.Number,
  Title: Schema5.String
});
var OnboardingDiscovery = Schema5.Struct({
  DatabaseCount: Schema5.Number,
  Databases: Schema5.Array(OnboardingDatabase),
  PageCount: Schema5.Number,
  Pages: Schema5.Array(OnboardingPage)
});
var CachedDataSourceSchema = Schema5.Struct({
  ConnectionId: NotionConnectionId,
  CoverUrl: Schema5.optional(Schema5.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema5.optional(Schema5.String),
  IconType: Schema5.optional(Schema5.Literals(["Emoji", "Image", "Native"])),
  NotionLastEditedTime: Schema5.DateFromString,
  Properties: Schema5.Array(PropertyDefinition),
  RefreshedAt: Schema5.DateFromString,
  SchemaHash: Schema5.String,
  Title: Schema5.String,
  Version: CachedDataSourceSchemaVersion
});

// Package/Domain/Distribution/NotionConnection.js
var NotionConnection_exports = {};
__export(NotionConnection_exports, {
  NotionConnection: () => NotionConnection,
  NotionConnectionStatus: () => NotionConnectionStatus
});
import { Schema as Schema6 } from "effect";
var NotionConnectionStatus = Schema6.Literals(["Active", "Revoked"]);
var NotionConnection = Schema6.Struct({
  BotId: Schema6.String,
  ConnectedAt: Schema6.DateFromString,
  Id: NotionConnectionId,
  LastUsedAt: Schema6.optional(Schema6.DateFromString),
  NotionOwnerUserId: Schema6.optional(Schema6.String),
  RevokedAt: Schema6.optional(Schema6.DateFromString),
  Status: NotionConnectionStatus,
  UserId,
  WorkspaceIconUrl: Schema6.optional(Schema6.String),
  WorkspaceId: NotionWorkspaceId,
  WorkspaceName: Schema6.String
});

// Package/Domain/Distribution/Destination.js
var Destination_exports = {};
__export(Destination_exports, {
  Destination: () => Destination,
  DestinationTemplate: () => DestinationTemplate,
  FieldConfiguration: () => FieldConfiguration,
  FieldConfigurationVersion: () => FieldConfigurationVersion,
  FieldSetting: () => FieldSetting
});
import { Schema as Schema7 } from "effect";
var DestinationTemplate = Schema7.Union([
  Schema7.Struct({ Type: Schema7.tag("None") }),
  Schema7.Struct({ Type: Schema7.tag("Default") }),
  Schema7.Struct({
    TemplateId: NotionTemplateId,
    Type: Schema7.tag("Specific")
  })
]);
var FieldSetting = Schema7.Struct({
  Default: Schema7.optional(PropertyInput),
  PropertyId: NotionPropertyId,
  Required: Schema7.Boolean,
  Visible: Schema7.Boolean
});
var FieldConfigurationVersion = Schema7.Literal(1);
var FieldConfiguration = Schema7.Struct({
  FieldOrder: Schema7.Array(NotionPropertyId),
  Fields: Schema7.Array(FieldSetting),
  Version: FieldConfigurationVersion
});
var Destination = Schema7.Struct({
  ConnectionId: NotionConnectionId,
  CreatedAt: Schema7.DateFromString,
  DataSourceId: NotionDataSourceId,
  FieldConfiguration,
  Icon: Schema7.optional(Schema7.String),
  Id: DestinationId,
  Name: Schema7.String,
  Position: Schema7.Number,
  Template: DestinationTemplate,
  UpdatedAt: Schema7.DateFromString,
  UserId
});

// Package/Domain/Distribution/PageDraft.js
var PageDraft_exports = {};
__export(PageDraft_exports, {
  PageDraft: () => PageDraft,
  PropertyInputValue: () => PropertyInputValue
});
import { Schema as Schema8 } from "effect";
var PropertyInputValue = Schema8.Struct({
  PropertyId: NotionPropertyId,
  Value: PropertyInput
});
var PageDraft = Schema8.Struct({
  DestinationId,
  Title: Schema8.optional(Schema8.String),
  UpdatedAt: Schema8.DateFromString,
  Values: Schema8.Array(PropertyInputValue)
});

// Package/Domain/Distribution/Command.js
var Command_exports = {};
__export(Command_exports, {
  CreatePageCommand: () => CreatePageCommand,
  CreatePageResult: () => CreatePageResult
});
import { Schema as Schema9 } from "effect";
var CreatePageCommand = Schema9.Struct({
  DestinationId,
  OperationId,
  Title: Schema9.optional(Schema9.String),
  Values: Schema9.Array(PropertyInputValue)
});
var CreatePageResult = Schema9.Struct({
  NotionPageId,
  OperationId
});

// Package/Domain/Distribution/Error.js
var Error_exports = {};
__export(Error_exports, {
  AuthenticationRequired: () => AuthenticationRequired,
  DataSourceNotFound: () => DataSourceNotFound,
  DataSourceSchemaChanged: () => DataSourceSchemaChanged,
  DatabaseError: () => DatabaseError,
  DestinationNotFound: () => DestinationNotFound,
  DomainError: () => DomainError,
  InvalidPageDraft: () => InvalidPageDraft,
  NetworkError: () => NetworkError,
  NotionConnectionNotFound: () => NotionConnectionNotFound,
  NotionConnectionRevoked: () => NotionConnectionRevoked,
  NotionRateLimited: () => NotionRateLimited,
  NotionResourceNotShared: () => NotionResourceNotShared,
  NotionUnauthorized: () => NotionUnauthorized,
  NotionUnavailable: () => NotionUnavailable,
  NotionValidationError: () => NotionValidationError
});
import { Schema as Schema10 } from "effect";
var AuthenticationRequired = class extends Schema10.TaggedError()("AuthenticationRequired", {}, { httpApiStatus: 401 }) {
};
var NotionConnectionNotFound = class extends Schema10.TaggedError()("NotionConnectionNotFound", { ConnectionId: NotionConnectionId }, { httpApiStatus: 404 }) {
};
var NotionConnectionRevoked = class extends Schema10.TaggedError()("NotionConnectionRevoked", { ConnectionId: NotionConnectionId }, { httpApiStatus: 409 }) {
};
var NotionResourceNotShared = class extends Schema10.TaggedError()("NotionResourceNotShared", { DataSourceId: Schema10.optional(NotionDataSourceId) }, { httpApiStatus: 403 }) {
};
var NotionUnauthorized = class extends Schema10.TaggedError()("NotionUnauthorized", { Message: Schema10.optional(Schema10.String) }, { httpApiStatus: 502 }) {
};
var NotionRateLimited = class extends Schema10.TaggedError()("NotionRateLimited", { RetryAfterSeconds: Schema10.optional(Schema10.Number) }, { httpApiStatus: 429 }) {
};
var NotionValidationError = class extends Schema10.TaggedError()("NotionValidationError", { Message: Schema10.String }, { httpApiStatus: 422 }) {
};
var NotionUnavailable = class extends Schema10.TaggedError()("NotionUnavailable", { Message: Schema10.optional(Schema10.String) }, { httpApiStatus: 503 }) {
};
var DataSourceNotFound = class extends Schema10.TaggedError()("DataSourceNotFound", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 404 }) {
};
var DataSourceSchemaChanged = class extends Schema10.TaggedError()("DataSourceSchemaChanged", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 409 }) {
};
var DestinationNotFound = class extends Schema10.TaggedError()("DestinationNotFound", { DestinationId }, { httpApiStatus: 404 }) {
};
var InvalidPageDraft = class extends Schema10.TaggedError()("InvalidPageDraft", { Message: Schema10.String }, { httpApiStatus: 422 }) {
};
var DatabaseError = class extends Schema10.TaggedError()("DatabaseError", { Message: Schema10.String }, { httpApiStatus: 500 }) {
};
var NetworkError = class extends Schema10.TaggedError()("NetworkError", { Message: Schema10.String }, { httpApiStatus: 502 }) {
};
var DomainError = Schema10.Union([
  AuthenticationRequired,
  NotionConnectionNotFound,
  NotionConnectionRevoked,
  NotionResourceNotShared,
  NotionUnauthorized,
  NotionRateLimited,
  NotionValidationError,
  NotionUnavailable,
  DataSourceNotFound,
  DataSourceSchemaChanged,
  DestinationNotFound,
  InvalidPageDraft,
  DatabaseError,
  NetworkError
]);
export {
  Command_exports as Command,
  DataSource_exports as DataSource,
  Destination_exports as Destination,
  Error_exports as Error,
  Id_exports as Id,
  NotionConnection_exports as NotionConnection,
  PageDraft_exports as PageDraft,
  Property_exports as Property
};
/**
 * Branded string identifiers for every stable identity concept in Notivex.
 *
 * Every ID in this module is a `string` at runtime but is nominally distinct
 * at the type level, so e.g. a `NotionPageId` can never be passed where a
 * `DestinationId` is expected even though both decode from plain strings.
 *
 * @module @notivex/domain/Id
 *
 * @file      Id.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PropertyOption` — a single selectable value of a select, multi-select or
 * status property, shared between {@link Property.Definition} (what options
 * exist) and {@link Property.Input} (which option a user picked).
 *
 * @module @notivex/domain/Property/Option
 *
 * @file      Option.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PropertyDefinition` — "what this Notion property is". One struct per
 * Notion property type, discriminated by `Type`, plus the `PropertyDefinition`
 * union of all of them.
 *
 * Deliberately kept separate from {@link Property.Input} ("what the user
 * wants to put into it") and from Notion's own API representation.
 *
 * @module @notivex/domain/Property/Definition
 *
 * @file      Definition.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PropertyInput` — "what the user wants to put into it". A parallel,
 * smaller union to {@link Property.Definition}: only the property types a
 * Notivex form can actually collect a value for, and only the fields needed
 * to express that value — never Notion's request-body shape.
 *
 * @module @notivex/domain/Property/Input
 *
 * @file      Input.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * Public entry point for the `Property` family of schemas.
 *
 * @module @notivex/domain/Property
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `CachedDataSourceSchema` — the versioned, normalized representation of a
 * Notion data source's schema that Notivex caches locally so its quick-add
 * UI can render without a round trip to Notion on every launch.
 *
 * Notion remains the canonical source of truth; this is deliberately
 * a *normalized* Notivex schema rather than an opaque dump of Notion's API
 * response, so that a future change to Notion's representation only
 * requires updating one mapper. See `ArchitectureInitialDraft.md` §11-12.
 *
 * @module @notivex/domain/DataSource
 *
 * @file      DataSource.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `NotionConnection` — the user-visible metadata Notivex keeps about one
 * authorized Notion connection.
 *
 * This is deliberately **only** the non-secret metadata a Supabase user is
 * allowed to read about their own connection. Access and refresh tokens are
 * a server-only concept and never appear here — see
 * `ArchitectureInitialDraft.md` §7, §8 and §35 ("the Expo app should know
 * that a user has a Notion connection, but it should never possess the
 * Notion OAuth access token, refresh token, [or] Notion client secret").
 *
 * A `NotionConnection` answers "which Notion authorization do I use?" — see
 * {@link Destination} for "how has this user configured a quick-entry
 * experience?" and {@link DataSource} for "which Notion table/schema is
 * this?".
 *
 * @module @notivex/domain/NotionConnection
 *
 * @file      NotionConnection.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `Destination` — a first-class Notivex concept: how a user has configured a
 * quick-entry experience for one Notion data source. See
 * `ArchitectureInitialDraft.md` §24-25.
 *
 * A `Destination` answers "how has this Notivex user configured a
 * quick-entry experience for this data source?" — see
 * {@link NotionConnection} for "which Notion authorization do I use?" and
 * {@link DataSource} for "which Notion table/schema is this?".
 *
 * @module @notivex/domain/Destination
 *
 * @file      Destination.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PageDraft` — local, unsaved quick-entry state: what the user has typed
 * into a destination's form before it becomes a command sent to the
 * Notivex API. This is a Notivex-shaped value, never Notion-shaped JSON —
 * see `ArchitectureInitialDraft.md` §19-21.
 *
 * @module @notivex/domain/PageDraft
 *
 * @file      PageDraft.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
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
/**
 * Schema-backed tagged errors for every failure mode the rest of Notivex
 * needs to distinguish. Nothing downstream should ever see a raw exception
 * from Supabase, `fetch`, Deno, or the Notion SDK — adapters translate those
 * into one of these instead, so callers can write
 * `Effect.catchTag("NotionRateLimited", ...)` rather than inspecting an HTTP
 * status code. See `ArchitectureInitialDraft.md` §14.
 *
 * Each error also carries an `httpApiStatus` annotation. When these errors are
 * used as an `HttpApiEndpoint` failure schema, Effect's HttpApi tooling reads
 * that annotation to choose the response status (equivalent to
 * `HttpApiSchema.status(code)`); without it every tagged error would encode as
 * a 500. The annotation is inert metadata everywhere else — the domain stays
 * free of any HTTP dependency.
 *
 * @module @notivex/domain/Error
 *
 * @file      Error.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
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
