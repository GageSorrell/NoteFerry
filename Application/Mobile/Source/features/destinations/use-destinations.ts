/**
 * Hook backing the destination-config screen: the destinations already
 * configured for one cached data source, plus create/delete. Thin wrapper over
 * the typed API client.
 *
 * @module noteferry/features/destinations/use-destinations
 *
 * @file      use-destinations.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import {
    CreateDestination,
    type CreateDestinationInput,
    DeleteDestination,
    ListDestinations,
    UpdateDestination,
    type UpdateDestinationInput
} from "@/Domain/Runtime/NoteFerryApi";
import { useCallback, useEffect, useState } from "react";

/** The state returned by {@link useDestinations}. */
export interface UseDestinations
{
    readonly Destinations: ReadonlyArray<Domain.Destination.Destination>;
    readonly IsLoading: boolean;
    readonly Refetch: () => Promise<void>;
    readonly Create: (Input: CreateDestinationInput) => Promise<void>;
    readonly Update: (DestinationId: Domain.Id.DestinationId, Input: UpdateDestinationInput) => Promise<void>;
    readonly Remove: (DestinationId: Domain.Id.DestinationId) => Promise<void>;
}

/**
 * Loads the destinations configured for one data source and exposes create /
 * delete, each refetching afterward.
 *
 * @category Destinations
 * @since 1.0.0
 */
export const useDestinations = (DataSourceId: Domain.Id.NotionDataSourceId): UseDestinations =>
{
    const [ Destinations, SetDestinations ] =
        useState<ReadonlyArray<Domain.Destination.Destination>>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(true);

    const Refetch = useCallback(async () =>
    {
        SetIsLoading(true);

        try
        {
            const All = await ListDestinations();

            SetDestinations(All.filter((Entry: Domain.Destination.Destination) =>
                Entry.DataSourceId === DataSourceId));
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to list destinations", Error);
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ DataSourceId ]);

    const Create = useCallback(async (Input: CreateDestinationInput) =>
    {
        await CreateDestination(Input);
        await Refetch();
    }, [ Refetch ]);

    const Update = useCallback(async (
        DestinationId: Domain.Id.DestinationId,
        Input: UpdateDestinationInput
    ) =>
    {
        await UpdateDestination(DestinationId, Input);
        await Refetch();
    }, [ Refetch ]);

    const Remove = useCallback(async (DestinationId: Domain.Id.DestinationId) =>
    {
        await DeleteDestination(DestinationId);
        await Refetch();
    }, [ Refetch ]);

    useEffect(() =>
    {
        void Refetch();
    }, [ Refetch ]);

    return { Create, Destinations, IsLoading, Refetch, Remove, Update };
};
