/**
 * Applies a user's saved `DatabaseOrder` setting to a list of cached
 * databases. Shared by the home screen (ordering the database cards) and the
 * database settings screen (ordering — and, via its edit mode, letting the
 * user rearrange — the same list), so both agree on exactly one notion of
 * "the" database order.
 *
 * @module noteferry/Domain/Utility/DatabaseOrder
 *
 * @file      DatabaseOrder.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";

export/**
       * Sorts `DataSources` by `DatabaseOrder`. Sources the stored order does
       * not mention (newly added, or from before ordering existed) follow in a
       * deterministic title/id order, so a cache refresh cannot reshuffle
       * their cards. Stale and duplicate ids in `DatabaseOrder` are harmless.
       *
       * @category Utility
       * @since 1.0.0
       */
const OrderDataSources = (
    DataSources: readonly Domain.DataSource.CachedDataSourceSchema[],
    DatabaseOrder: readonly Domain.Id.NotionDataSourceId[]
): readonly Domain.DataSource.CachedDataSourceSchema[] =>
{
    const RankByDataSourceId = new Map<Domain.Id.NotionDataSourceId, number>();

    for (const [ Index, Id ] of DatabaseOrder.entries())
    {
        if (!RankByDataSourceId.has(Id))
        {
            RankByDataSourceId.set(Id, Index);
        }
    }

    return [ ...DataSources ].sort((Left, Right) =>
    {
        const LeftRank = RankByDataSourceId.get(Left.DataSourceId);
        const RightRank = RankByDataSourceId.get(Right.DataSourceId);

        if (LeftRank !== undefined || RightRank !== undefined)
        {
            if (LeftRank === undefined) return 1;
            if (RightRank === undefined) return -1;
            if (LeftRank !== RightRank) return LeftRank - RightRank;
        }

        const ByTitle = Left.Title.localeCompare(Right.Title, undefined, { sensitivity: "base" });

        if (ByTitle !== 0) return ByTitle;

        const ByDataSourceId = Left.DataSourceId.localeCompare(Right.DataSourceId);

        return ByDataSourceId !== 0
            ? ByDataSourceId
            : Left.ConnectionId.localeCompare(Right.ConnectionId);
    });
};
