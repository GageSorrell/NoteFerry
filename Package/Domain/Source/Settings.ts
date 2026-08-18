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

import * as Behavior from "./Behavior.js";
import * as Id from "./Id.js";
import { Schema } from "effect";

/**
 * The maximum number of databases Notivex will expose as
 * `expo-quick-actions` shortcuts. Both Android and iOS recommend a limit of
 * four, but Android accepts up to `maxCount` (typically ~15); six is a
 * deliberately conservative shared cap.
 *
 * @category Settings
 * @since 1.0.0
 */
export const MaxQuickActionCount = 6;

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
    DatabaseOrder: Schema.optional(Schema.Array(Id.NotionDataSourceId)),
    LaunchBehavior: Schema.optional(Behavior.LaunchBehavior),
    NotifyOnOfflineSubmit: Schema.optional(Schema.Boolean),
    QuickActionDataSourceIds: Schema.optional(Schema.Array(Id.NotionDataSourceId))
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
    readonly DatabaseOrder: ReadonlyArray<Id.NotionDataSourceId>;
    readonly LaunchBehavior: Behavior.LaunchBehavior;
    readonly NotifyOnOfflineSubmit: boolean;
    readonly QuickActionDataSourceIds: ReadonlyArray<Id.NotionDataSourceId>;
}

/**
 * The settings a brand-new profile (or an empty `{}` blob) resolves to.
 *
 * @category Settings
 * @since 1.0.0
 */
export const DefaultAppSettings: ResolvedAppSettings = {
    DatabaseOrder: [ ],
    LaunchBehavior: { Type: "Home" },
    NotifyOnOfflineSubmit: true,
    QuickActionDataSourceIds: [ ]
};

/**
 * Fills every unset field of a stored settings blob with its default,
 * mirroring how `Destination.ReconcileFieldConfiguration` self-heals a
 * partial or stale value rather than requiring every caller to null-check.
 *
 * @category Settings
 * @since 1.0.0
 */
export function WithDefaults(Stored: AppSettings): ResolvedAppSettings
{
    return {
        DatabaseOrder: Stored.DatabaseOrder ?? DefaultAppSettings.DatabaseOrder,
        LaunchBehavior: Stored.LaunchBehavior ?? DefaultAppSettings.LaunchBehavior,
        NotifyOnOfflineSubmit: Stored.NotifyOnOfflineSubmit
            ?? DefaultAppSettings.NotifyOnOfflineSubmit,
        QuickActionDataSourceIds: (Stored.QuickActionDataSourceIds
            ?? DefaultAppSettings.QuickActionDataSourceIds).slice(0, MaxQuickActionCount)
    };
}
