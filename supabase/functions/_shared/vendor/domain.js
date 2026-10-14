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
import * as Schema from "effect/Schema";
import { pipe } from "effect/Function";
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
  FilesPropertyInput: () => FilesPropertyInput,
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
import * as Schema2 from "effect/Schema";
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
import * as Schema3 from "effect/Schema";
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
import * as Schema4 from "effect/Schema";
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
var FilesPropertyInput = Schema4.Struct({
  Type: Schema4.tag("Files"),
  Value: Schema4.Union([
    Schema4.Struct({
      Name: Schema4.String,
      Type: Schema4.tag("External"),
      Url: Schema4.String
    }),
    Schema4.Struct({
      Base64: Schema4.String,
      MimeType: Schema4.optional(Schema4.String),
      Name: Schema4.String,
      Type: Schema4.tag("Upload")
    })
  ])
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
  PhoneNumberPropertyInput,
  FilesPropertyInput
]);

// Package/Domain/Distribution/Behavior.js
var Behavior_exports = {};
__export(Behavior_exports, {
  LaunchBehavior: () => LaunchBehavior,
  PostCreationBehavior: () => PostCreationBehavior
});
import * as Schema5 from "effect/Schema";
var LaunchBehavior = Schema5.Union([
  Schema5.Struct({ Type: Schema5.tag("Home") }),
  Schema5.Struct({
    DataSourceId: NotionDataSourceId,
    Type: Schema5.tag("SelectedDatabase")
  })
]);
var PostCreationBehavior = Schema5.Union([
  Schema5.Struct({ Type: Schema5.tag("Home") }),
  Schema5.Struct({
    DataSourceId: NotionDataSourceId,
    Type: Schema5.tag("SelectedDatabase")
  }),
  Schema5.Struct({ Type: Schema5.tag("CloseApp") })
]);

// Package/Domain/Distribution/DataSource.js
var DataSource_exports = {};
__export(DataSource_exports, {
  CachedDataSourceSchema: () => CachedDataSourceSchema,
  CachedDataSourceSchemaVersion: () => CachedDataSourceSchemaVersion,
  CachedDataSourceTemplate: () => CachedDataSourceTemplate,
  DiscoveredDataSource: () => DiscoveredDataSource,
  OnboardingDatabase: () => OnboardingDatabase,
  OnboardingDiscovery: () => OnboardingDiscovery,
  OnboardingPage: () => OnboardingPage
});

// Package/Domain/Distribution/PageDraft.js
var PageDraft_exports = {};
__export(PageDraft_exports, {
  PageDraft: () => PageDraft,
  PropertyInputValue: () => PropertyInputValue
});
import * as Schema6 from "effect/Schema";
var PropertyInputValue = Schema6.Struct({
  PropertyId: NotionPropertyId,
  Value: PropertyInput
});
var PageDraft = Schema6.Struct({
  Body: Schema6.optional(Schema6.String),
  DestinationId,
  Title: Schema6.optional(Schema6.String),
  UpdatedAt: Schema6.DateFromString,
  Values: Schema6.Array(PropertyInputValue)
});

// Package/Domain/Distribution/DataSource.js
import * as Schema7 from "effect/Schema";
var CachedDataSourceSchemaVersion = Schema7.Literal(2);
var DiscoveredDataSource = Schema7.Struct({
  ConnectionId: NotionConnectionId,
  CoverUrl: Schema7.optional(Schema7.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema7.optional(Schema7.String),
  IconType: Schema7.optional(Schema7.Literals(["Emoji", "Image", "Native"])),
  Title: Schema7.String
});
var OnboardingPage = Schema7.Struct({
  Icon: Schema7.optional(Schema7.String),
  IconType: Schema7.optional(Schema7.Literals(["Emoji", "Image", "Native"])),
  Id: NotionPageId,
  Title: Schema7.String
});
var OnboardingDatabase = Schema7.Struct({
  ConnectionId: NotionConnectionId,
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  HasMoreThan100Pages: Schema7.Boolean,
  Icon: Schema7.optional(Schema7.String),
  IconType: Schema7.optional(Schema7.Literals(["Emoji", "Image", "Native"])),
  PageCount: Schema7.Number,
  Title: Schema7.String
});
var OnboardingDiscovery = Schema7.Struct({
  DatabaseCount: Schema7.Number,
  Databases: Schema7.Array(OnboardingDatabase),
  PageCount: Schema7.Number,
  Pages: Schema7.Array(OnboardingPage)
});
var CachedDataSourceTemplate = Schema7.Struct({
  Icon: Schema7.optional(Schema7.String),
  IconType: Schema7.optional(Schema7.Literals(["Emoji", "Image", "Native"])),
  IsNotionDefault: Schema7.Boolean,
  Name: Schema7.String,
  NotionLastEditedTime: Schema7.DateFromString,
  Properties: Schema7.Array(PropertyInputValue),
  TemplateId: NotionTemplateId
});
var CachedDataSourceSchema = Schema7.Struct({
  Access: Schema7.Literals(["Available", "Locked"]),
  ConnectionId: NotionConnectionId,
  CoverSvg: Schema7.optional(Schema7.String),
  CoverUrl: Schema7.optional(Schema7.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema7.optional(Schema7.String),
  IconSvg: Schema7.optional(Schema7.String),
  IconType: Schema7.optional(Schema7.Literals(["Emoji", "Image", "Native"])),
  NotionLastEditedTime: Schema7.DateFromString,
  Properties: Schema7.Array(PropertyDefinition),
  RefreshedAt: Schema7.DateFromString,
  SchemaHash: Schema7.String,
  Templates: Schema7.Array(CachedDataSourceTemplate),
  Title: Schema7.String,
  Version: CachedDataSourceSchemaVersion
});

// Package/Domain/Distribution/NotionConnection.js
var NotionConnection_exports = {};
__export(NotionConnection_exports, {
  NotionConnection: () => NotionConnection,
  NotionConnectionStatus: () => NotionConnectionStatus
});
import * as Schema8 from "effect/Schema";
var NotionConnectionStatus = Schema8.Literals(["Active", "Revoked"]);
var NotionConnection = Schema8.Struct({
  BotId: Schema8.String,
  ConnectedAt: Schema8.DateFromString,
  Id: NotionConnectionId,
  LastUsedAt: Schema8.optional(Schema8.DateFromString),
  NotionOwnerAvatarUrl: Schema8.optional(Schema8.String),
  NotionOwnerUserId: Schema8.optional(Schema8.String),
  RevokedAt: Schema8.optional(Schema8.DateFromString),
  Status: NotionConnectionStatus,
  UserId,
  WorkspaceIconUrl: Schema8.optional(Schema8.String),
  WorkspaceId: NotionWorkspaceId,
  WorkspaceName: Schema8.String
});

// Package/Domain/Distribution/Destination.js
var Destination_exports = {};
__export(Destination_exports, {
  Destination: () => Destination,
  DestinationTemplate: () => DestinationTemplate,
  FieldConfiguration: () => FieldConfiguration,
  FieldConfigurationVersion: () => FieldConfigurationVersion,
  FieldSetting: () => FieldSetting,
  IsQuickEntryProperty: () => IsQuickEntryProperty,
  ReconcileFieldConfiguration: () => ReconcileFieldConfiguration,
  ReconcileTemplateConfiguration: () => ReconcileTemplateConfiguration,
  ResolvePostCreationBehavior: () => ResolvePostCreationBehavior,
  ResolveSelectedTemplate: () => ResolveSelectedTemplate,
  ResolveTemplateConfiguration: () => ResolveTemplateConfiguration,
  TemplateConfiguration: () => TemplateConfiguration,
  TemplateConfigurationVersion: () => TemplateConfigurationVersion
});
import * as Schema9 from "effect/Schema";
var DestinationTemplate = Schema9.Union([
  Schema9.Struct({ Type: Schema9.tag("None") }),
  Schema9.Struct({
    TemplateId: NotionTemplateId,
    Type: Schema9.tag("Specific")
  })
]);
var FieldSetting = Schema9.Struct({
  Default: Schema9.optional(PropertyInput),
  PropertyId: NotionPropertyId,
  Required: Schema9.Boolean,
  Visible: Schema9.Boolean
});
var FieldConfigurationVersion = Schema9.Literal(1);
var FieldConfiguration = Schema9.Struct({
  FieldOrder: Schema9.Array(NotionPropertyId),
  Fields: Schema9.Array(FieldSetting),
  Version: FieldConfigurationVersion
});
var IsQuickEntryProperty = (Property) => {
  return !["People", "Relation"].includes(Property.Type);
};
var ReconcileFieldConfiguration = (Current, Properties) => {
  const PropertyById = new Map(Properties.map((Property) => [Property.Id, Property]));
  const SettingById = new Map(Current.Fields.map((Field) => [Field.PropertyId, Field]));
  const SeenIds = /* @__PURE__ */ new Set();
  const FieldOrder = [];
  for (const PropertyId of Current.FieldOrder) {
    if (PropertyById.has(PropertyId) && !SeenIds.has(PropertyId)) {
      SeenIds.add(PropertyId);
      FieldOrder.push(PropertyId);
    }
  }
  for (const Property of Properties) {
    if (!SeenIds.has(Property.Id)) {
      SeenIds.add(Property.Id);
      FieldOrder.push(Property.Id);
    }
  }
  const Fields = FieldOrder.map((PropertyId) => {
    const Property = PropertyById.get(PropertyId);
    const Existing = SettingById.get(PropertyId);
    if (Existing === void 0) {
      return {
        PropertyId,
        Required: Property.Type === "Title",
        Visible: IsQuickEntryProperty(Property)
      };
    }
    const CompatibleDefault = Existing.Default !== void 0 && Existing.Default.Type === Property.Type ? Existing.Default : void 0;
    return {
      ...CompatibleDefault === void 0 ? {} : { Default: CompatibleDefault },
      PropertyId,
      Required: Property.Type === "Title" || Existing.Required,
      Visible: Existing.Visible
    };
  });
  return { FieldOrder, Fields, Version: 1 };
};
var TemplateConfigurationVersion = Schema9.Literal(1);
var TemplateConfiguration = Schema9.Struct({
  Hidden: Schema9.Array(NotionTemplateId),
  TemplateOrder: Schema9.Array(NotionTemplateId),
  Version: TemplateConfigurationVersion
});
var EmptyTemplateConfiguration = { Hidden: [], TemplateOrder: [], Version: 1 };
var ReconcileTemplateConfiguration = (Current, Templates) => {
  const KnownIds = new Set(Templates.map((Template) => Template.TemplateId));
  const SeenIds = /* @__PURE__ */ new Set();
  const TemplateOrder = [];
  for (const TemplateId of Current.TemplateOrder) {
    if (KnownIds.has(TemplateId) && !SeenIds.has(TemplateId)) {
      SeenIds.add(TemplateId);
      TemplateOrder.push(TemplateId);
    }
  }
  for (const Template of Templates) {
    if (!SeenIds.has(Template.TemplateId)) {
      SeenIds.add(Template.TemplateId);
      TemplateOrder.push(Template.TemplateId);
    }
  }
  const Hidden = Current.Hidden.filter((TemplateId) => KnownIds.has(TemplateId));
  return { Hidden, TemplateOrder, Version: 1 };
};
var Destination = Schema9.Struct({
  ConnectionId: NotionConnectionId,
  CreatedAt: Schema9.DateFromString,
  DataSourceId: NotionDataSourceId,
  FieldConfiguration,
  Icon: Schema9.optional(Schema9.String),
  Id: DestinationId,
  Name: Schema9.String,
  Position: Schema9.Number,
  PostCreationBehavior: Schema9.optional(PostCreationBehavior),
  Template: DestinationTemplate,
  TemplateConfiguration: Schema9.optional(TemplateConfiguration),
  UpdatedAt: Schema9.DateFromString,
  UserId
});
var ResolvePostCreationBehavior = (Destination2) => {
  return Destination2.PostCreationBehavior ?? { Type: "Home" };
};
var ResolveTemplateConfiguration = (Destination2) => {
  return Destination2.TemplateConfiguration ?? EmptyTemplateConfiguration;
};
var ResolveSelectedTemplate = (Destination2, Templates) => {
  const Selection = Destination2.Template;
  if (Selection.Type !== "Specific") {
    return void 0;
  }
  return Templates.find((Template) => Template.TemplateId === Selection.TemplateId);
};

// Package/Domain/Distribution/Profile.js
var Profile_exports = {};
__export(Profile_exports, {
  Profile: () => Profile
});

// Package/Domain/Distribution/Settings.js
var Settings_exports = {};
__export(Settings_exports, {
  AppSettings: () => AppSettings,
  Contrast: () => Contrast,
  DefaultAppSettings: () => DefaultAppSettings,
  HomeScreenLayout: () => HomeScreenLayout,
  MaxQuickActionCount: () => MaxQuickActionCount,
  WithDefaults: () => WithDefaults
});
import * as Schema10 from "effect/Schema";
var MaxQuickActionCount = 6;
var HomeScreenLayout = Schema10.Literals(["1", "2"]);
var Contrast = Schema10.Literals(["System", "Standard", "High"]);
var AppSettings = Schema10.Struct({
  Contrast: Schema10.optional(Contrast),
  DatabaseOrder: Schema10.optional(Schema10.Array(NotionDataSourceId)),
  HomeScreenLayout: Schema10.optional(HomeScreenLayout),
  LaunchBehavior: Schema10.optional(LaunchBehavior),
  NotifyOnOfflineSubmit: Schema10.optional(Schema10.Boolean),
  NotifyOnSubscriptionSales: Schema10.optional(Schema10.Boolean),
  QuickActionDataSourceIds: Schema10.optional(Schema10.Array(NotionDataSourceId)),
  SelectedConnectionId: Schema10.optional(NotionConnectionId),
  ShowAllWorkspaceDatabases: Schema10.optional(Schema10.Boolean),
  ShowRecentPageCovers: Schema10.optional(Schema10.Boolean),
  ShowRecentPageDatabaseName: Schema10.optional(Schema10.Boolean),
  ShowRecentPages: Schema10.optional(Schema10.Boolean)
});
var DefaultAppSettings = {
  Contrast: "System",
  DatabaseOrder: [],
  HomeScreenLayout: "1",
  LaunchBehavior: { Type: "Home" },
  NotifyOnOfflineSubmit: true,
  NotifyOnSubscriptionSales: false,
  QuickActionDataSourceIds: [],
  SelectedConnectionId: void 0,
  ShowAllWorkspaceDatabases: false,
  ShowRecentPageCovers: false,
  ShowRecentPageDatabaseName: false,
  ShowRecentPages: true
};
var WithDefaults = (Stored) => {
  return {
    Contrast: Stored.Contrast ?? DefaultAppSettings.Contrast,
    DatabaseOrder: Stored.DatabaseOrder ?? DefaultAppSettings.DatabaseOrder,
    HomeScreenLayout: Stored.HomeScreenLayout ?? DefaultAppSettings.HomeScreenLayout,
    LaunchBehavior: Stored.LaunchBehavior ?? DefaultAppSettings.LaunchBehavior,
    NotifyOnOfflineSubmit: Stored.NotifyOnOfflineSubmit ?? DefaultAppSettings.NotifyOnOfflineSubmit,
    NotifyOnSubscriptionSales: Stored.NotifyOnSubscriptionSales ?? DefaultAppSettings.NotifyOnSubscriptionSales,
    QuickActionDataSourceIds: (Stored.QuickActionDataSourceIds ?? DefaultAppSettings.QuickActionDataSourceIds).slice(0, MaxQuickActionCount),
    SelectedConnectionId: Stored.SelectedConnectionId,
    ShowAllWorkspaceDatabases: Stored.ShowAllWorkspaceDatabases ?? DefaultAppSettings.ShowAllWorkspaceDatabases,
    ShowRecentPageCovers: Stored.ShowRecentPageCovers ?? DefaultAppSettings.ShowRecentPageCovers,
    ShowRecentPageDatabaseName: Stored.ShowRecentPageDatabaseName ?? DefaultAppSettings.ShowRecentPageDatabaseName,
    ShowRecentPages: Stored.ShowRecentPages ?? DefaultAppSettings.ShowRecentPages
  };
};

// Package/Domain/Distribution/Profile.js
import * as Schema11 from "effect/Schema";
var Profile = Schema11.Struct({
  CreatedAt: Schema11.DateFromString,
  DisplayName: Schema11.optional(Schema11.String),
  Settings: AppSettings,
  UpdatedAt: Schema11.DateFromString,
  UserId
});

// Package/Domain/Distribution/Page.js
var Page_exports = {};
__export(Page_exports, {
  RecentPage: () => RecentPage
});
import * as Schema12 from "effect/Schema";
var RecentPage = Schema12.Struct({
  CoverUrl: Schema12.optional(Schema12.String),
  CreatedAt: Schema12.DateFromString,
  DatabaseName: Schema12.optional(Schema12.String),
  Icon: Schema12.optional(Schema12.String),
  IconType: Schema12.optional(Schema12.Literals(["Emoji", "Image", "Native"])),
  NotionPageId,
  OperationId,
  Title: Schema12.String,
  Url: Schema12.String
});

// Package/Domain/Distribution/Command.js
var Command_exports = {};
__export(Command_exports, {
  CreatePageCommand: () => CreatePageCommand,
  CreatePageResult: () => CreatePageResult,
  PageBodyFormat: () => PageBodyFormat,
  PageCoverInput: () => PageCoverInput,
  PageIconInput: () => PageIconInput
});
import * as Schema13 from "effect/Schema";
var PageIconInput = Schema13.Union([
  Schema13.Struct({ Emoji: Schema13.String, Type: Schema13.tag("Emoji") }),
  Schema13.Struct({ Type: Schema13.tag("External"), Url: Schema13.String }),
  Schema13.Struct({
    Base64: Schema13.String,
    MimeType: Schema13.optional(Schema13.String),
    Name: Schema13.String,
    Type: Schema13.tag("Upload")
  })
]);
var PageCoverInput = Schema13.Union([
  Schema13.Struct({ Name: Schema13.String, Type: Schema13.tag("External"), Url: Schema13.String }),
  Schema13.Struct({
    Base64: Schema13.String,
    MimeType: Schema13.optional(Schema13.String),
    Name: Schema13.String,
    Type: Schema13.tag("Upload")
  })
]);
var PageBodyFormat = Schema13.Literals(["PlainText", "NotionMarkdown"]);
var CreatePageCommand = Schema13.Struct({
  /** The page body, converted to official Notion block children by the server according to {@link PageBodyFormat}. */
  Body: Schema13.optional(Schema13.String),
  /**
   * How `Body` is written. Current clients always send it; a command
   * without it comes from a client that predates the field, and its body
   * keeps the conversion those clients were built against.
   */
  BodyFormat: Schema13.optional(PageBodyFormat),
  Cover: Schema13.optional(PageCoverInput),
  DestinationId,
  OperationId,
  Icon: Schema13.optional(PageIconInput),
  Title: Schema13.optional(Schema13.String),
  Values: Schema13.Array(PropertyInputValue)
});
var CreatePageResult = Schema13.Struct({
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
  FeatureGateError: () => FeatureGateError,
  FreeCreationWindowExceeded: () => FreeCreationWindowExceeded,
  FreeDatabaseLimitReached: () => FreeDatabaseLimitReached,
  InvalidPageDraft: () => InvalidPageDraft,
  NetworkError: () => NetworkError,
  NotionConnectionNotFound: () => NotionConnectionNotFound,
  NotionConnectionRevoked: () => NotionConnectionRevoked,
  NotionRateLimited: () => NotionRateLimited,
  NotionResourceNotShared: () => NotionResourceNotShared,
  NotionUnauthorized: () => NotionUnauthorized,
  NotionUnavailable: () => NotionUnavailable,
  NotionValidationError: () => NotionValidationError,
  PageCreationInProgress: () => PageCreationInProgress,
  RateLimitExceeded: () => RateLimitExceeded
});
import * as Schema14 from "effect/Schema";
var AuthenticationRequired = class extends Schema14.TaggedError()("AuthenticationRequired", {}, { httpApiStatus: 401 }) {
};
var NotionConnectionNotFound = class extends Schema14.TaggedError()("NotionConnectionNotFound", { ConnectionId: NotionConnectionId }, { httpApiStatus: 404 }) {
};
var NotionConnectionRevoked = class extends Schema14.TaggedError()("NotionConnectionRevoked", { ConnectionId: NotionConnectionId }, { httpApiStatus: 409 }) {
};
var NotionResourceNotShared = class extends Schema14.TaggedError()("NotionResourceNotShared", { DataSourceId: Schema14.optional(NotionDataSourceId) }, { httpApiStatus: 403 }) {
};
var NotionUnauthorized = class extends Schema14.TaggedError()("NotionUnauthorized", { Message: Schema14.optional(Schema14.String) }, { httpApiStatus: 502 }) {
};
var NotionRateLimited = class extends Schema14.TaggedError()("NotionRateLimited", { RetryAfterSeconds: Schema14.optional(Schema14.Number) }, { httpApiStatus: 429 }) {
};
var NotionValidationError = class extends Schema14.TaggedError()("NotionValidationError", { Message: Schema14.String }, { httpApiStatus: 422 }) {
};
var NotionUnavailable = class extends Schema14.TaggedError()("NotionUnavailable", { Message: Schema14.optional(Schema14.String) }, { httpApiStatus: 503 }) {
};
var DataSourceNotFound = class extends Schema14.TaggedError()("DataSourceNotFound", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 404 }) {
};
var DataSourceSchemaChanged = class extends Schema14.TaggedError()("DataSourceSchemaChanged", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 409 }) {
};
var DestinationNotFound = class extends Schema14.TaggedError()("DestinationNotFound", { DestinationId }, { httpApiStatus: 404 }) {
};
var InvalidPageDraft = class extends Schema14.TaggedError()("InvalidPageDraft", { Message: Schema14.String }, { httpApiStatus: 422 }) {
};
var PageCreationInProgress = class extends Schema14.TaggedError()("PageCreationInProgress", {}, { httpApiStatus: 409 }) {
};
var DatabaseError = class extends Schema14.TaggedError()("DatabaseError", { Message: Schema14.String }, { httpApiStatus: 500 }) {
};
var NetworkError = class extends Schema14.TaggedError()("NetworkError", { Message: Schema14.String }, { httpApiStatus: 502 }) {
};
var FeatureGateError = class extends Schema14.TaggedError()("FeatureGateError", { Feature: Schema14.String }, { httpApiStatus: 403 }) {
};
var FreeCreationWindowExceeded = class extends Schema14.TaggedError()("FreeCreationWindowExceeded", { NextAvailableAt: Schema14.DateFromString }, { httpApiStatus: 429 }) {
};
var FreeDatabaseLimitReached = class extends Schema14.TaggedError()("FreeDatabaseLimitReached", { Limit: Schema14.Number }, { httpApiStatus: 409 }) {
};
var RateLimitExceeded = class extends Schema14.TaggedError()("RateLimitExceeded", {}, { httpApiStatus: 429 }) {
};
var DomainError = Schema14.Union([
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
  PageCreationInProgress,
  DatabaseError,
  NetworkError,
  FeatureGateError,
  FreeCreationWindowExceeded,
  FreeDatabaseLimitReached,
  RateLimitExceeded
]);

// Package/Domain/Distribution/Subscription.js
var Subscription_exports = {};
__export(Subscription_exports, {
  ActiveSale: () => ActiveSale,
  ActiveSaleResponse: () => ActiveSaleResponse,
  CreationAllowance: () => CreationAllowance,
  DevicePlatform: () => DevicePlatform,
  EntitlementState: () => EntitlementState,
  FreeCreationLimit: () => FreeCreationLimit,
  FreeCreationWindowMinutes: () => FreeCreationWindowMinutes,
  FreeDatabaseLimit: () => FreeDatabaseLimit,
  ProEntitlementId: () => ProEntitlementId,
  ProductTerm: () => ProductTerm,
  PurchaseStore: () => PurchaseStore,
  ResourceAccess: () => ResourceAccess,
  SubscriptionStatus: () => SubscriptionStatus,
  SubscriptionTier: () => SubscriptionTier
});
import * as Schema15 from "effect/Schema";
var ProEntitlementId = "Notivex Pro";
var FreeCreationLimit = 5;
var FreeCreationWindowMinutes = 30;
var FreeDatabaseLimit = 3;
var SubscriptionTier = Schema15.Literals(["Free", "Pro"]);
var ProductTerm = Schema15.Literals(["Monthly", "Yearly", "Lifetime"]);
var PurchaseStore = Schema15.Literals(["AppStore", "PlayStore", "Unknown"]);
var EntitlementState = Schema15.Literals([
  "Active",
  "GracePeriod",
  "BillingIssue",
  "Expired",
  "Free"
]);
var SubscriptionStatus = Schema15.Struct({
  Active: Schema15.Boolean,
  EnforcementEnabled: Schema15.Boolean,
  Expiration: Schema15.optional(Schema15.DateFromString),
  ManagementUrl: Schema15.optional(Schema15.String),
  ProductId: Schema15.optional(Schema15.String),
  Renews: Schema15.Boolean,
  State: EntitlementState,
  Store: PurchaseStore,
  Term: Schema15.optional(ProductTerm),
  Tier: SubscriptionTier,
  VerifiedAt: Schema15.optional(Schema15.DateFromString)
});
var CreationAllowance = Schema15.Struct({
  Limit: Schema15.Number,
  NextAvailableAt: Schema15.optional(Schema15.DateFromString),
  Remaining: Schema15.Number,
  Used: Schema15.Number,
  WindowMinutes: Schema15.Number
});
var ActiveSale = Schema15.Struct({
  CampaignId: Schema15.String,
  Copy: Schema15.String,
  DeepLink: Schema15.String,
  EndsAt: Schema15.DateFromString,
  OfferingIdentifier: Schema15.String,
  StartsAt: Schema15.DateFromString,
  TargetedPackages: Schema15.Array(ProductTerm)
});
var ActiveSaleResponse = Schema15.Struct({
  Sale: Schema15.NullOr(ActiveSale)
});
var ResourceAccess = Schema15.Literals(["Available", "Locked"]);
var DevicePlatform = Schema15.Literals(["Ios", "Android"]);
export {
  Behavior_exports as Behavior,
  Command_exports as Command,
  DataSource_exports as DataSource,
  Destination_exports as Destination,
  Error_exports as Error,
  Id_exports as Id,
  NotionConnection_exports as NotionConnection,
  Page_exports as Page,
  PageDraft_exports as PageDraft,
  Profile_exports as Profile,
  Property_exports as Property,
  Settings_exports as Settings,
  Subscription_exports as Subscription
};
/**
 * Branded string identifiers for every stable identity concept in NoteFerry.
 *
 * Every ID in this module is a `string` at runtime but is nominally distinct
 * at the type level, so e.g. a `NotionPageId` can never be passed where a
 * `DestinationId` is expected even though both decode from plain strings.
 *
 * @module @noteferry/domain/Id
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
 * @module @noteferry/domain/Property/Option
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
 * @module @noteferry/domain/Property/Definition
 *
 * @file      Definition.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PropertyInput` — "what the user wants to put into it". A parallel,
 * smaller union to {@link Property.Definition}: only the property types a
 * NoteFerry form can actually collect a value for, and only the fields needed
 * to express that value — never Notion's request-body shape.
 *
 * @module @noteferry/domain/Property/Input
 *
 * @file      Input.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * Public entry point for the `Property` family of schemas.
 *
 * @module @noteferry/domain/Property
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * Shared "what happens next" choices used by both a destination's
 * post-creation behavior and the app's global launch behavior.
 *
 * @module @noteferry/domain/Behavior
 *
 * @file      Behavior.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
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
/**
 * `CachedDataSourceSchema` — the versioned, normalized representation of a
 * Notion data source's schema that NoteFerry caches locally so its quick-add
 * UI can render without a round trip to Notion on every launch.
 *
 * Notion remains the canonical source of truth; this is deliberately
 * a *normalized* NoteFerry schema rather than an opaque dump of Notion's API
 * response, so that a future change to Notion's representation only
 * requires updating one mapper.
 *
 * @module @noteferry/domain/DataSource
 *
 * @file      DataSource.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `NotionConnection` — the user-visible metadata NoteFerry keeps about one
 * authorized Notion connection.
 *
 * This is deliberately **only** the non-secret metadata a Supabase user is
 * allowed to read about their own connection. Access and refresh tokens are
 * a server-only concept and never appear here: the Expo app should know
 * that a user has a Notion connection, but it should never possess the
 * Notion OAuth access token, refresh token, or Notion client secret.
 *
 * A `NotionConnection` answers "which Notion authorization do I use?" — see
 * {@link Destination} for "how has this user configured a quick-entry
 * experience?" and {@link DataSource} for "which Notion table/schema is
 * this?".
 *
 * @module @noteferry/domain/NotionConnection
 *
 * @file      NotionConnection.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `Destination` — a first-class NoteFerry concept: how a user has configured a
 * quick-entry experience for one Notion data source.
 *
 * A `Destination` answers "how has this NoteFerry user configured a
 * quick-entry experience for this data source?" — see
 * {@link NotionConnection} for "which Notion authorization do I use?" and
 * {@link DataSource} for "which Notion table/schema is this?".
 *
 * @module @noteferry/domain/Destination
 *
 * @file      Destination.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * App-wide, cross-device user settings — everything under NoteFerry's settings
 * screen that is not scoped to one destination (contrast `Destination`'s
 * `FieldConfiguration`/`Template`/`PostCreationBehavior`, which are
 * per-database).
 *
 * @module @noteferry/domain/Settings
 *
 * @file      Settings.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `Profile` — NoteFerry-specific information about a user that does not belong
 * in Supabase's own `auth.users` table, including their cross-device
 * {@link Settings.AppSettings}.
 *
 * @module @noteferry/domain/Profile
 *
 * @file      Profile.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `CreatePageCommand` — a NoteFerry-shaped request to create a Notion page,
 * distinct from both {@link PageDraft.PageDraft} (local, still-editable
 * state) and Notion's own Create Page request body, which only the
 * server-side Notion adapter ever constructs.
 *
 * @module @noteferry/domain/Command
 *
 * @file      Command.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * Schema-backed tagged errors for every failure mode the rest of NoteFerry
 * needs to distinguish. Nothing downstream should ever see a raw exception
 * from Supabase, `fetch`, Deno, or the Notion SDK — adapters translate those
 * into one of these instead, so callers can write
 * `Effect.catchTag("NotionRateLimited", ...)` rather than inspecting an HTTP
 * status code.
 *
 * Each error also carries an `httpApiStatus` annotation. When these errors are
 * used as an `HttpApiEndpoint` failure schema, Effect's HttpApi tooling reads
 * that annotation to choose the response status (equivalent to
 * `HttpApiSchema.status(code)`); without it every tagged error would encode as
 * a 500. The annotation is inert metadata everywhere else — the domain stays
 * free of any HTTP dependency.
 *
 * @module @noteferry/domain/Error
 *
 * @file      Error.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
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
