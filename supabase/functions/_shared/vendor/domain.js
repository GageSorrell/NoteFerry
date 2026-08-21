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
import { Schema as Schema5 } from "effect";
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
  DiscoveredDataSource: () => DiscoveredDataSource,
  OnboardingDatabase: () => OnboardingDatabase,
  OnboardingDiscovery: () => OnboardingDiscovery,
  OnboardingPage: () => OnboardingPage
});
import { Schema as Schema6 } from "effect";
var CachedDataSourceSchemaVersion = Schema6.Literal(1);
var DiscoveredDataSource = Schema6.Struct({
  ConnectionId: NotionConnectionId,
  CoverUrl: Schema6.optional(Schema6.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema6.optional(Schema6.String),
  IconType: Schema6.optional(Schema6.Literals(["Emoji", "Image", "Native"])),
  Title: Schema6.String
});
var OnboardingPage = Schema6.Struct({
  Icon: Schema6.optional(Schema6.String),
  IconType: Schema6.optional(Schema6.Literals(["Emoji", "Image", "Native"])),
  Id: NotionPageId,
  Title: Schema6.String
});
var OnboardingDatabase = Schema6.Struct({
  ConnectionId: NotionConnectionId,
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  HasMoreThan100Pages: Schema6.Boolean,
  Icon: Schema6.optional(Schema6.String),
  IconType: Schema6.optional(Schema6.Literals(["Emoji", "Image", "Native"])),
  PageCount: Schema6.Number,
  Title: Schema6.String
});
var OnboardingDiscovery = Schema6.Struct({
  DatabaseCount: Schema6.Number,
  Databases: Schema6.Array(OnboardingDatabase),
  PageCount: Schema6.Number,
  Pages: Schema6.Array(OnboardingPage)
});
var CachedDataSourceSchema = Schema6.Struct({
  Access: Schema6.Literals(["Available", "Locked"]),
  ConnectionId: NotionConnectionId,
  CoverUrl: Schema6.optional(Schema6.String),
  DataSourceId: NotionDataSourceId,
  DatabaseId: NotionDatabaseId,
  Icon: Schema6.optional(Schema6.String),
  IconType: Schema6.optional(Schema6.Literals(["Emoji", "Image", "Native"])),
  NotionLastEditedTime: Schema6.DateFromString,
  Properties: Schema6.Array(PropertyDefinition),
  RefreshedAt: Schema6.DateFromString,
  SchemaHash: Schema6.String,
  Title: Schema6.String,
  Version: CachedDataSourceSchemaVersion
});

// Package/Domain/Distribution/NotionConnection.js
var NotionConnection_exports = {};
__export(NotionConnection_exports, {
  NotionConnection: () => NotionConnection,
  NotionConnectionStatus: () => NotionConnectionStatus
});
import { Schema as Schema7 } from "effect";
var NotionConnectionStatus = Schema7.Literals(["Active", "Revoked"]);
var NotionConnection = Schema7.Struct({
  BotId: Schema7.String,
  ConnectedAt: Schema7.DateFromString,
  Id: NotionConnectionId,
  LastUsedAt: Schema7.optional(Schema7.DateFromString),
  NotionOwnerAvatarUrl: Schema7.optional(Schema7.String),
  NotionOwnerUserId: Schema7.optional(Schema7.String),
  RevokedAt: Schema7.optional(Schema7.DateFromString),
  Status: NotionConnectionStatus,
  UserId,
  WorkspaceIconUrl: Schema7.optional(Schema7.String),
  WorkspaceId: NotionWorkspaceId,
  WorkspaceName: Schema7.String
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
  ResolvePostCreationBehavior: () => ResolvePostCreationBehavior
});
import { Schema as Schema8 } from "effect";
var DestinationTemplate = Schema8.Union([
  Schema8.Struct({ Type: Schema8.tag("None") }),
  Schema8.Struct({ Type: Schema8.tag("Default") }),
  Schema8.Struct({
    TemplateId: NotionTemplateId,
    Type: Schema8.tag("Specific")
  })
]);
var FieldSetting = Schema8.Struct({
  Default: Schema8.optional(PropertyInput),
  PropertyId: NotionPropertyId,
  Required: Schema8.Boolean,
  Visible: Schema8.Boolean
});
var FieldConfigurationVersion = Schema8.Literal(1);
var FieldConfiguration = Schema8.Struct({
  FieldOrder: Schema8.Array(NotionPropertyId),
  Fields: Schema8.Array(FieldSetting),
  Version: FieldConfigurationVersion
});
function IsQuickEntryProperty(Property) {
  return !["People", "Relation"].includes(Property.Type);
}
function ReconcileFieldConfiguration(Current, Properties) {
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
}
var Destination = Schema8.Struct({
  ConnectionId: NotionConnectionId,
  CreatedAt: Schema8.DateFromString,
  DataSourceId: NotionDataSourceId,
  FieldConfiguration,
  Icon: Schema8.optional(Schema8.String),
  Id: DestinationId,
  Name: Schema8.String,
  Position: Schema8.Number,
  PostCreationBehavior: Schema8.optional(PostCreationBehavior),
  Template: DestinationTemplate,
  UpdatedAt: Schema8.DateFromString,
  UserId
});
function ResolvePostCreationBehavior(Destination2) {
  return Destination2.PostCreationBehavior ?? { Type: "Home" };
}

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
import { Schema as Schema9 } from "effect";
var MaxQuickActionCount = 6;
var HomeScreenLayout = Schema9.Literals(["1", "2"]);
var Contrast = Schema9.Literals(["System", "Standard", "High"]);
var AppSettings = Schema9.Struct({
  Contrast: Schema9.optional(Contrast),
  DatabaseOrder: Schema9.optional(Schema9.Array(NotionDataSourceId)),
  HomeScreenLayout: Schema9.optional(HomeScreenLayout),
  LaunchBehavior: Schema9.optional(LaunchBehavior),
  NotifyOnOfflineSubmit: Schema9.optional(Schema9.Boolean),
  NotifyOnSubscriptionSales: Schema9.optional(Schema9.Boolean),
  QuickActionDataSourceIds: Schema9.optional(Schema9.Array(NotionDataSourceId))
});
var DefaultAppSettings = {
  Contrast: "System",
  DatabaseOrder: [],
  HomeScreenLayout: "1",
  LaunchBehavior: { Type: "Home" },
  NotifyOnOfflineSubmit: true,
  NotifyOnSubscriptionSales: false,
  QuickActionDataSourceIds: []
};
function WithDefaults(Stored) {
  return {
    Contrast: Stored.Contrast ?? DefaultAppSettings.Contrast,
    DatabaseOrder: Stored.DatabaseOrder ?? DefaultAppSettings.DatabaseOrder,
    HomeScreenLayout: Stored.HomeScreenLayout ?? DefaultAppSettings.HomeScreenLayout,
    LaunchBehavior: Stored.LaunchBehavior ?? DefaultAppSettings.LaunchBehavior,
    NotifyOnOfflineSubmit: Stored.NotifyOnOfflineSubmit ?? DefaultAppSettings.NotifyOnOfflineSubmit,
    NotifyOnSubscriptionSales: Stored.NotifyOnSubscriptionSales ?? DefaultAppSettings.NotifyOnSubscriptionSales,
    QuickActionDataSourceIds: (Stored.QuickActionDataSourceIds ?? DefaultAppSettings.QuickActionDataSourceIds).slice(0, MaxQuickActionCount)
  };
}

// Package/Domain/Distribution/Profile.js
import { Schema as Schema10 } from "effect";
var Profile = Schema10.Struct({
  CreatedAt: Schema10.DateFromString,
  DisplayName: Schema10.optional(Schema10.String),
  Settings: AppSettings,
  UpdatedAt: Schema10.DateFromString,
  UserId
});

// Package/Domain/Distribution/PageDraft.js
var PageDraft_exports = {};
__export(PageDraft_exports, {
  PageDraft: () => PageDraft,
  PropertyInputValue: () => PropertyInputValue
});
import { Schema as Schema11 } from "effect";
var PropertyInputValue = Schema11.Struct({
  PropertyId: NotionPropertyId,
  Value: PropertyInput
});
var PageDraft = Schema11.Struct({
  Body: Schema11.optional(Schema11.String),
  DestinationId,
  Title: Schema11.optional(Schema11.String),
  UpdatedAt: Schema11.DateFromString,
  Values: Schema11.Array(PropertyInputValue)
});

// Package/Domain/Distribution/Command.js
var Command_exports = {};
__export(Command_exports, {
  CreatePageCommand: () => CreatePageCommand,
  CreatePageResult: () => CreatePageResult,
  PageCoverInput: () => PageCoverInput,
  PageIconInput: () => PageIconInput
});
import { Schema as Schema12 } from "effect";
var PageIconInput = Schema12.Union([
  Schema12.Struct({ Emoji: Schema12.String, Type: Schema12.tag("Emoji") }),
  Schema12.Struct({ Type: Schema12.tag("External"), Url: Schema12.String }),
  Schema12.Struct({
    Base64: Schema12.String,
    MimeType: Schema12.optional(Schema12.String),
    Name: Schema12.String,
    Type: Schema12.tag("Upload")
  })
]);
var PageCoverInput = Schema12.Union([
  Schema12.Struct({ Name: Schema12.String, Type: Schema12.tag("External"), Url: Schema12.String }),
  Schema12.Struct({
    Base64: Schema12.String,
    MimeType: Schema12.optional(Schema12.String),
    Name: Schema12.String,
    Type: Schema12.tag("Upload")
  })
]);
var CreatePageCommand = Schema12.Struct({
  Body: Schema12.optional(Schema12.String),
  Cover: Schema12.optional(PageCoverInput),
  DestinationId,
  OperationId,
  Icon: Schema12.optional(PageIconInput),
  Title: Schema12.optional(Schema12.String),
  Values: Schema12.Array(PropertyInputValue)
});
var CreatePageResult = Schema12.Struct({
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
  NotionValidationError: () => NotionValidationError
});
import { Schema as Schema13 } from "effect";
var AuthenticationRequired = class extends Schema13.TaggedError()("AuthenticationRequired", {}, { httpApiStatus: 401 }) {
};
var NotionConnectionNotFound = class extends Schema13.TaggedError()("NotionConnectionNotFound", { ConnectionId: NotionConnectionId }, { httpApiStatus: 404 }) {
};
var NotionConnectionRevoked = class extends Schema13.TaggedError()("NotionConnectionRevoked", { ConnectionId: NotionConnectionId }, { httpApiStatus: 409 }) {
};
var NotionResourceNotShared = class extends Schema13.TaggedError()("NotionResourceNotShared", { DataSourceId: Schema13.optional(NotionDataSourceId) }, { httpApiStatus: 403 }) {
};
var NotionUnauthorized = class extends Schema13.TaggedError()("NotionUnauthorized", { Message: Schema13.optional(Schema13.String) }, { httpApiStatus: 502 }) {
};
var NotionRateLimited = class extends Schema13.TaggedError()("NotionRateLimited", { RetryAfterSeconds: Schema13.optional(Schema13.Number) }, { httpApiStatus: 429 }) {
};
var NotionValidationError = class extends Schema13.TaggedError()("NotionValidationError", { Message: Schema13.String }, { httpApiStatus: 422 }) {
};
var NotionUnavailable = class extends Schema13.TaggedError()("NotionUnavailable", { Message: Schema13.optional(Schema13.String) }, { httpApiStatus: 503 }) {
};
var DataSourceNotFound = class extends Schema13.TaggedError()("DataSourceNotFound", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 404 }) {
};
var DataSourceSchemaChanged = class extends Schema13.TaggedError()("DataSourceSchemaChanged", { DataSourceId: NotionDataSourceId }, { httpApiStatus: 409 }) {
};
var DestinationNotFound = class extends Schema13.TaggedError()("DestinationNotFound", { DestinationId }, { httpApiStatus: 404 }) {
};
var InvalidPageDraft = class extends Schema13.TaggedError()("InvalidPageDraft", { Message: Schema13.String }, { httpApiStatus: 422 }) {
};
var DatabaseError = class extends Schema13.TaggedError()("DatabaseError", { Message: Schema13.String }, { httpApiStatus: 500 }) {
};
var NetworkError = class extends Schema13.TaggedError()("NetworkError", { Message: Schema13.String }, { httpApiStatus: 502 }) {
};
var FeatureGateError = class extends Schema13.TaggedError()("FeatureGateError", { Feature: Schema13.String }, { httpApiStatus: 403 }) {
};
var FreeCreationWindowExceeded = class extends Schema13.TaggedError()("FreeCreationWindowExceeded", { NextAvailableAt: Schema13.DateFromString }, { httpApiStatus: 429 }) {
};
var FreeDatabaseLimitReached = class extends Schema13.TaggedError()("FreeDatabaseLimitReached", { Limit: Schema13.Number }, { httpApiStatus: 409 }) {
};
var DomainError = Schema13.Union([
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
  NetworkError,
  FeatureGateError,
  FreeCreationWindowExceeded,
  FreeDatabaseLimitReached
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
import { Schema as Schema14 } from "effect";
var ProEntitlementId = "pro";
var FreeCreationLimit = 5;
var FreeCreationWindowMinutes = 30;
var FreeDatabaseLimit = 3;
var SubscriptionTier = Schema14.Literals(["Free", "Pro"]);
var ProductTerm = Schema14.Literals(["Monthly", "Yearly", "Lifetime"]);
var PurchaseStore = Schema14.Literals(["AppStore", "PlayStore", "Unknown"]);
var EntitlementState = Schema14.Literals([
  "Active",
  "GracePeriod",
  "BillingIssue",
  "Expired",
  "Free"
]);
var SubscriptionStatus = Schema14.Struct({
  Active: Schema14.Boolean,
  EnforcementEnabled: Schema14.Boolean,
  Expiration: Schema14.optional(Schema14.DateFromString),
  ManagementUrl: Schema14.optional(Schema14.String),
  ProductId: Schema14.optional(Schema14.String),
  Renews: Schema14.Boolean,
  State: EntitlementState,
  Store: PurchaseStore,
  Term: Schema14.optional(ProductTerm),
  Tier: SubscriptionTier,
  VerifiedAt: Schema14.optional(Schema14.DateFromString)
});
var CreationAllowance = Schema14.Struct({
  Limit: Schema14.Number,
  NextAvailableAt: Schema14.optional(Schema14.DateFromString),
  Remaining: Schema14.Number,
  Used: Schema14.Number,
  WindowMinutes: Schema14.Number
});
var ActiveSale = Schema14.Struct({
  CampaignId: Schema14.String,
  Copy: Schema14.String,
  DeepLink: Schema14.String,
  EndsAt: Schema14.DateFromString,
  OfferingIdentifier: Schema14.String,
  StartsAt: Schema14.DateFromString,
  TargetedPackages: Schema14.Array(ProductTerm)
});
var ActiveSaleResponse = Schema14.Struct({
  Sale: Schema14.NullOr(ActiveSale)
});
var ResourceAccess = Schema14.Literals(["Available", "Locked"]);
var DevicePlatform = Schema14.Literals(["Ios", "Android"]);
export {
  Behavior_exports as Behavior,
  Command_exports as Command,
  DataSource_exports as DataSource,
  Destination_exports as Destination,
  Error_exports as Error,
  Id_exports as Id,
  NotionConnection_exports as NotionConnection,
  PageDraft_exports as PageDraft,
  Profile_exports as Profile,
  Property_exports as Property,
  Settings_exports as Settings,
  Subscription_exports as Subscription
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
 * Shared "what happens next" choices used by both a destination's
 * post-creation behavior and the app's global launch behavior.
 *
 * @module @notivex/domain/Behavior
 *
 * @file      Behavior.ts
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
 * requires updating one mapper.
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
 * a server-only concept and never appear here: the Expo app should know
 * that a user has a Notion connection, but it should never possess the
 * Notion OAuth access token, refresh token, or Notion client secret.
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
 * quick-entry experience for one Notion data source.
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
 * App-wide, cross-device user settings — everything under Notivex's settings
 * screen that is not scoped to one destination (contrast `Destination`'s
 * `FieldConfiguration`/`Template`/`PostCreationBehavior`, which are
 * per-database).
 *
 * @module @notivex/domain/Settings
 *
 * @file      Settings.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `Profile` — Notivex-specific information about a user that does not belong
 * in Supabase's own `auth.users` table, including their cross-device
 * {@link Settings.AppSettings}.
 *
 * @module @notivex/domain/Profile
 *
 * @file      Profile.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
/**
 * `PageDraft` — local, unsaved quick-entry state: what the user has typed
 * into a destination's form before it becomes a command sent to the
 * Notivex API. This is a Notivex-shaped value, never Notion-shaped JSON.
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
 * server-side Notion adapter ever constructs.
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
 * status code.
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
 * never import Expo, Supabase, or the Notion SDK.
 *
 * @module @notivex/domain
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */
