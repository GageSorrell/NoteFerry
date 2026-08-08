/**
 * Hook exposing the current user's Notion connections plus a refetch. Thin
 * wrapper over the typed API client; the component tree stays unaware of HTTP.
 *
 * @module notivex/Domain/Connection/UseConnections
 *
 * @file      UseConnections.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { useCallback, useEffect, useState } from "react";
import { ListConnections } from "@/Domain/Runtime/NotivexApi";

/** The state returned by {@link useConnections}. */
export interface UseConnections
{
    readonly Connections: ReadonlyArray<Domain.NotionConnection.NotionConnection>;
    readonly IsLoading: boolean;
    readonly Refetch: () => Promise<void>;
}

/**
 * Loads the current user's Notion connections on mount and exposes a refetch.
 *
 * @category Connections
 * @since 1.0.0
 */
export function useConnections(): UseConnections
{
    const [ Connections, SetConnections ] =
        useState<ReadonlyArray<Domain.NotionConnection.NotionConnection>>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(true);

    const Refetch = useCallback(async () =>
    {
        SetIsLoading(true);

        try
        {
            SetConnections(await ListConnections());
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to list Notion connections", Error);
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ ]);

    useEffect(() => void Refetch(), [ Refetch ]);

    return { Connections, IsLoading, Refetch };
}
