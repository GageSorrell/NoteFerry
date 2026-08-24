/**
 * Resolves which of the user's Notion connections is "current" — the one the
 * home screen and its avatar switcher treat as selected.
 *
 * @module notivex/Domain/Connection/CurrentConnection
 *
 * @file      CurrentConnection.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Predicate } from "@sorrell/effect";

/**
 * Prefers the explicitly selected connection, falling back to the first
 * `Active` connection (then simply the first connection) when there is no
 * selection or the selected one is no longer present — e.g. it was revoked
 * or disconnected since it was chosen. This fallback is the same heuristic
 * the home screen used before per-workspace selection existed, so an unset
 * or stale `SelectedConnectionId` behaves exactly as it did before.
 *
 * @category Connections
 * @since 1.0.0
 */
export const ResolveCurrentConnection = (
    Connections: ReadonlyArray<Domain.NotionConnection.NotionConnection>,
    SelectedConnectionId: Domain.Id.NotionConnectionId | undefined
): Domain.NotionConnection.NotionConnection | undefined =>
{
    if (SelectedConnectionId !== undefined)
    {
        const Selected = Connections.find((Connection: Domain.NotionConnection.NotionConnection) =>
            Connection.Id === SelectedConnectionId);

        if (Selected !== undefined)
        {
            return Selected;
        }
    }

    return Connections.find(Predicate.HasPropertyValue("Status", "Active")) ?? Connections[0];
};
