/**
 * Home-screen quick action (Android app-shortcut / iOS 3D-touch) registration.
 * Driven by the user's `QuickActionDataSourceIds` setting, defaulting to the
 * first six databases (in home-screen order) when unset. Registered wherever
 * the current data sources and settings are already loaded (the home and
 * settings screens), independent of dev vs. production builds, so shortcuts
 * are testable on a real launcher long-press.
 *
 * Icons are best-effort, not a literal copy of the database's icon --
 * `expo-quick-actions` can only reference icons already compiled into the
 * app, so a database's actual (dynamic, per-user) emoji or uploaded image
 * can't be used. See `ResolveQuickActionIcon`.
 *
 * @module noteferry/Domain/Runtime/QuickActions
 *
 * @file      QuickActions.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import * as QuickActions from "expo-quick-actions";
import { Platform } from "react-native";
import { ResolveNativeIconSymbol } from "@/Domain/Utility/DatabaseIcon";

/** One quick action's `params`, read back in the tap handler. */
export interface QuickActionParams
{
    readonly dataSourceId: string;
}

/**
 * Bundled Android adaptive icon (see the `expo-quick-actions` plugin config
 * in `app.json`) shown for every shortcut on Android, since `setItems`'
 * `icon` can only reference an icon already compiled into the app -- there's
 * no way to hand it a database's actual (dynamic, per-user) icon at runtime.
 */
const AndroidFallbackIcon = "noteferry_quick_action";

/**
 * Generic SF Symbol shown on iOS when a database's icon has no direct
 * match: an Emoji or Image icon (Apple's shortcut icon API has no runtime-
 * image path either, only system icons/SF Symbols/bundled assets), or a
 * Native icon absent from `LucideToSfSymbol`.
 */
const IosFallbackIcon = "symbol:square.grid.2x2";

/**
 * Picks a quick action's icon from its database's icon. Notion's own
 * ("Native") icons are a small, known set already mapped to Lucide names
 * elsewhere in the app, so on iOS they resolve to a real matching SF Symbol;
 * everything else falls back to a generic per-OS icon -- see
 * `AndroidFallbackIcon`/`IosFallbackIcon` for why a database's actual icon
 * can't be used more broadly.
 */
const ResolveQuickActionIcon = (Source: Domain.DataSource.CachedDataSourceSchema): string =>
{
    if (Platform.OS === "ios" && Source.IconType === "Native" && Source.Icon)
    {
        const Symbol = ResolveNativeIconSymbol(Source.Icon);

        if (Symbol)
        {
            return `symbol:${ Symbol }`;
        }
    }

    return Platform.OS === "ios" ? IosFallbackIcon : AndroidFallbackIcon;
};

/** Chooses which data sources become quick actions: the setting, or a default. */
const ResolveQuickActionDataSources = (
    DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>,
    Settings: Domain.Settings.ResolvedAppSettings
): ReadonlyArray<Domain.DataSource.CachedDataSourceSchema> =>
{
    const ByDataSourceId = new Map(DataSources.map((
        Source: Domain.DataSource.CachedDataSourceSchema
    ) => [ Source.DataSourceId, Source ] as const));

    if (Settings.QuickActionDataSourceIds.length > 0)
    {
        return Settings.QuickActionDataSourceIds
            .map((Id: Domain.Id.NotionDataSourceId) => ByDataSourceId.get(Id))
            .filter((
                Source: Domain.DataSource.CachedDataSourceSchema | undefined
            ): Source is Domain.DataSource.CachedDataSourceSchema => Source !== undefined);
    }

    const Ordered = Settings.DatabaseOrder.length === 0
        ? DataSources
        : [
            ...Settings.DatabaseOrder
                .map((Id: Domain.Id.NotionDataSourceId) => ByDataSourceId.get(Id))
                .filter((
                    Source: Domain.DataSource.CachedDataSourceSchema | undefined
                ): Source is Domain.DataSource.CachedDataSourceSchema => Source !== undefined),
            ...DataSources.filter((Source: Domain.DataSource.CachedDataSourceSchema) =>
                !Settings.DatabaseOrder.includes(Source.DataSourceId))
        ];

    return Ordered.slice(0, Domain.Settings.MaxQuickActionCount);
};

export/**
       * Sets NoteFerry's quick action shortcuts from the current data sources and
       * settings.
       *
       * @category Runtime
       * @since 1.0.0
       */
const RegisterQuickActions = async (
    DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>,
    Settings: Domain.Settings.ResolvedAppSettings
): Promise<void> =>
{
    const Selected = ResolveQuickActionDataSources(DataSources, Settings);

    await QuickActions.setItems(Selected.map((
        Source: Domain.DataSource.CachedDataSourceSchema
    ) => ({
        icon: ResolveQuickActionIcon(Source),
        id: Source.DataSourceId,
        params: { dataSourceId: Source.DataSourceId } satisfies QuickActionParams,
        title: Source.Title
    })));
};
