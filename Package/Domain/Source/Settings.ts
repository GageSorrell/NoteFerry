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

import * as Behavior from "./Behavior.js";
import * as Id from "./Id.js";
import { Schema } from "effect";

/**
 * The maximum number of databases NoteFerry will expose as
 * `expo-quick-actions` shortcuts. Both Android and iOS recommend a limit of
 * four, but Android accepts up to `maxCount` (typically ~15); six is a
 * deliberately conservative shared cap.
 *
 * @category Settings
 * @since 1.0.0
 */
export const MaxQuickActionCount = 6;

export/**
       * How the home screen arranges database cards: `"1"` is the default
       * full-width row per database; `"2"` is a two-column grid of square
       * cards (a lone card on the final row sits in the left column).
       *
       * @category Settings
       * @since 1.0.0
       */
const HomeScreenLayout = Schema.Literals([ "1", "2" ]);

/** {@inheritDoc HomeScreenLayout} */
export type HomeScreenLayout = Schema.Schema.Type<typeof HomeScreenLayout>;

export/**
       * The app's contrast setting: `"System"` (the default) follows the
       * OS's own increase-contrast accessibility setting; `"Standard"` and
       * `"High"` pin `@noteferry/ui`'s `ThemeProvider`'s `HighContrast` prop
       * regardless of the OS setting.
       *
       * @category Settings
       * @since 1.0.0
       */
const Contrast = Schema.Literals([ "System", "Standard", "High" ]);

/** {@inheritDoc Contrast} */
export type Contrast = Schema.Schema.Type<typeof Contrast>;

export/**
       * The settings blob as it is actually stored: every field optional, so a
       * profile row with an empty or partial `settings` JSONB value decodes
       * cleanly. Resolve it to {@link ResolvedAppSettings} with
       * {@link WithDefaults} before using it.
       *
       * @category Settings
       * @since 1.0.0
       */
const AppSettings = Schema.Struct({
    Contrast: Schema.optional(Contrast),
    DatabaseOrder: Schema.optional(Schema.Array(Id.NotionDataSourceId)),
    HomeScreenLayout: Schema.optional(HomeScreenLayout),
    LaunchBehavior: Schema.optional(Behavior.LaunchBehavior),
    NotifyOnOfflineSubmit: Schema.optional(Schema.Boolean),
    NotifyOnSubscriptionSales: Schema.optional(Schema.Boolean),
    QuickActionDataSourceIds: Schema.optional(Schema.Array(Id.NotionDataSourceId)),
    SelectedConnectionId: Schema.optional(Id.NotionConnectionId),
    ShowAllWorkspaceDatabases: Schema.optional(Schema.Boolean)
});

/** {@inheritDoc AppSettings} */
export type AppSettings = Schema.Schema.Type<typeof AppSettings>;

/**
 * {@link AppSettings} with every field resolved to a concrete value — what
 * the rest of the app actually reads.
 *
 * @category Settings
 * @since 1.0.0
 */
export interface ResolvedAppSettings
{
    readonly Contrast: Contrast;
    readonly DatabaseOrder: ReadonlyArray<Id.NotionDataSourceId>;
    readonly HomeScreenLayout: HomeScreenLayout;
    readonly LaunchBehavior: Behavior.LaunchBehavior;
    readonly NotifyOnOfflineSubmit: boolean;
    readonly NotifyOnSubscriptionSales: boolean;
    readonly QuickActionDataSourceIds: ReadonlyArray<Id.NotionDataSourceId>;
    readonly SelectedConnectionId: Id.NotionConnectionId | undefined;
    readonly ShowAllWorkspaceDatabases: boolean;
}

/**
 * The settings a brand-new profile (or an empty `{}` blob) resolves to.
 *
 * @category Settings
 * @since 1.0.0
 */
export const DefaultAppSettings: ResolvedAppSettings = {
    Contrast: "System",
    DatabaseOrder: [ ],
    HomeScreenLayout: "1",
    LaunchBehavior: { Type: "Home" },
    NotifyOnOfflineSubmit: true,
    NotifyOnSubscriptionSales: false,
    QuickActionDataSourceIds: [ ],
    SelectedConnectionId: undefined,
    ShowAllWorkspaceDatabases: false
};

/**
 * Fills every unset field of a stored settings blob with its default,
 * mirroring how `Destination.ReconcileFieldConfiguration` self-heals a
 * partial or stale value rather than requiring every caller to null-check.
 *
 * @category Settings
 * @since 1.0.0
 */
export const WithDefaults = (Stored: AppSettings): ResolvedAppSettings =>
{
    return {
        Contrast: Stored.Contrast ?? DefaultAppSettings.Contrast,
        DatabaseOrder: Stored.DatabaseOrder ?? DefaultAppSettings.DatabaseOrder,
        HomeScreenLayout: Stored.HomeScreenLayout ?? DefaultAppSettings.HomeScreenLayout,
        LaunchBehavior: Stored.LaunchBehavior ?? DefaultAppSettings.LaunchBehavior,
        NotifyOnOfflineSubmit: Stored.NotifyOnOfflineSubmit
            ?? DefaultAppSettings.NotifyOnOfflineSubmit,
        NotifyOnSubscriptionSales: Stored.NotifyOnSubscriptionSales
            ?? DefaultAppSettings.NotifyOnSubscriptionSales,
        QuickActionDataSourceIds: (Stored.QuickActionDataSourceIds
            ?? DefaultAppSettings.QuickActionDataSourceIds).slice(0, MaxQuickActionCount),
        SelectedConnectionId: Stored.SelectedConnectionId,
        ShowAllWorkspaceDatabases: Stored.ShowAllWorkspaceDatabases
            ?? DefaultAppSettings.ShowAllWorkspaceDatabases
    };
}
