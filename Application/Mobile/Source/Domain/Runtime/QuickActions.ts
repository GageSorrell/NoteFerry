/**
 * Home-screen quick action (Android app-shortcut / iOS 3D-touch) registration.
 * Driven by the user's `QuickActionDataSourceIds` setting, defaulting to the
 * first six databases (in home-screen order) when unset. Registered wherever
 * the current data sources and settings are already loaded (the home and
 * settings screens), independent of dev vs. production builds, so shortcuts
 * are testable on a real launcher long-press.
 *
 * @module notivex/Domain/Runtime/QuickActions
 *
 * @file      QuickActions.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as QuickActions from "expo-quick-actions";

/** One quick action's `params`, read back in the tap handler. */
export interface QuickActionParams
{
    readonly dataSourceId: string;
}

/** Chooses which data sources become quick actions: the setting, or a default. */
function ResolveQuickActionDataSources(
    DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>,
    Settings: Domain.Settings.ResolvedAppSettings
): ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>
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
}

export/**
       * Sets Notivex's quick action shortcuts from the current data sources and
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
        id: Source.DataSourceId,
        params: { dataSourceId: Source.DataSourceId } satisfies QuickActionParams,
        title: Source.Title
    })));
};
