import type * as Domain from "@noteferry/domain";
import { describe, expect, it } from "@jest/globals";
import { OrderDataSources } from "./DatabaseOrder";

const Source = (
    DataSourceId: string,
    Title: string,
    ConnectionId = "connection-1"
): Domain.DataSource.CachedDataSourceSchema => ({
    ConnectionId,
    DataSourceId,
    Title
} as unknown as Domain.DataSource.CachedDataSourceSchema);

const Ids = (Sources: readonly Domain.DataSource.CachedDataSourceSchema[]): readonly string[] =>
    Sources.map((Entry) => `${Entry.ConnectionId}:${Entry.DataSourceId}`);

describe("OrderDataSources", () =>
{
    it("keeps the saved order regardless of the cache response order", () =>
    {
        const FirstResponse = [ Source("c", "Charlie"), Source("a", "Alpha"), Source("b", "Bravo") ];
        const RefreshedResponse = [ FirstResponse[1], FirstResponse[2], FirstResponse[0] ];
        const SavedOrder = [ "b", "c", "a" ] as unknown as readonly Domain.Id.NotionDataSourceId[];

        expect(Ids(OrderDataSources(FirstResponse, SavedOrder)))
            .toEqual([ "connection-1:b", "connection-1:c", "connection-1:a" ]);
        expect(Ids(OrderDataSources(RefreshedResponse, SavedOrder)))
            .toEqual([ "connection-1:b", "connection-1:c", "connection-1:a" ]);
    });

    it("orders unsaved databases deterministically after saved databases", () =>
    {
        const SavedOrder = [ "saved", "removed" ] as unknown as readonly Domain.Id.NotionDataSourceId[];
        const FirstResponse = [
            Source("z", "Beta"),
            Source("saved", "Saved"),
            Source("a", "Alpha")
        ];
        const RefreshedResponse = [ FirstResponse[2], FirstResponse[0], FirstResponse[1] ];
        const Expected = [ "connection-1:saved", "connection-1:a", "connection-1:z" ];

        expect(Ids(OrderDataSources(FirstResponse, SavedOrder))).toEqual(Expected);
        expect(Ids(OrderDataSources(RefreshedResponse, SavedOrder))).toEqual(Expected);
    });

    it("does not drop sources that share an id or duplicate a repeated saved id", () =>
    {
        const Sources = [
            Source("shared", "Workspace B", "connection-2"),
            Source("shared", "Workspace A", "connection-1")
        ];
        const SavedOrder = [ "shared", "shared" ] as unknown as readonly Domain.Id.NotionDataSourceId[];

        expect(Ids(OrderDataSources(Sources, SavedOrder))).toEqual([
            "connection-1:shared",
            "connection-2:shared"
        ]);
    });
});
