/**
 * Adds a new Notion workspace to the current user's account: runs the OAuth
 * connect flow, then identifies which connection it just created so the
 * caller can send the user straight into selecting that workspace's
 * databases.
 *
 * @module noteferry/Domain/Connection/AddWorkspace
 *
 * @file      AddWorkspace.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { ConnectNotion } from "@/Domain/Connection/Connect";
import { ListConnections } from "@/Domain/Runtime/NoteFerryApi";

export/**
       * Runs {@link ConnectNotion} and resolves to the connection it created, or
       * `null` if the user cancelled or the flow otherwise did not complete. The
       * new connection is identified by diffing a fresh connection list against
       * `ExistingConnections`; if nothing is new (the user re-authorized an
       * existing workspace, which upserts its row in place server-side rather than
       * inserting one), the most recently connected row is used instead.
       *
       * @category Connections
       * @since 1.0.0
       */
const AddWorkspace = async (
    ExistingConnections: ReadonlyArray<Domain.NotionConnection.NotionConnection>
): Promise<Domain.NotionConnection.NotionConnection | null> =>
{
    const Succeeded = await ConnectNotion();

    if (!Succeeded)
    {
        return null;
    }

    const ExistingIds = new Set(ExistingConnections.map((
        Connection: Domain.NotionConnection.NotionConnection
    ) => Connection.Id));
    const NextConnections = await ListConnections();
    const NewConnection = NextConnections.find((Connection: Domain.NotionConnection.NotionConnection) =>
        !ExistingIds.has(Connection.Id));

    if (NewConnection !== undefined)
    {
        return NewConnection;
    }

    const ByMostRecentlyConnected = [ ...NextConnections ].sort((
        Left: Domain.NotionConnection.NotionConnection,
        Right: Domain.NotionConnection.NotionConnection
    ) => Right.ConnectedAt.getTime() - Left.ConnectedAt.getTime());

    return ByMostRecentlyConnected[0] ?? null;
};
