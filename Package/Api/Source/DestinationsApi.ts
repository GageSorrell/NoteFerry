/**
 * The `Destinations` group: creating, reading, updating and deleting a
 * user's quick-entry destinations. See `ArchitectureInitialDraft.md` §24-25.
 *
 * @module @notivex/api/DestinationsApi
 *
 * @file      DestinationsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";

export/**
       * The fields a client supplies to create a new destination. `Id`,
       * `UserId`, `CreatedAt` and `UpdatedAt` are server-assigned.
       *
       * @category Destinations
       * @since 1.0.0
       */
const CreateDestinationPayload = Schema.Struct({
    ConnectionId: Domain.Id.NotionConnectionId,
    DataSourceId: Domain.Id.NotionDataSourceId,
    FieldConfiguration: Domain.Destination.FieldConfiguration,
    Icon: Schema.optional(Schema.String),
    Name: Schema.String,
    Position: Schema.Number,
    PostCreationBehavior: Schema.optional(Domain.Behavior.PostCreationBehavior),
    Template: Domain.Destination.DestinationTemplate
});

/** {@inheritDoc CreateDestinationPayload} */
export type CreateDestinationPayload = typeof CreateDestinationPayload.Type;

export/**
       * The fields a client may change on an existing destination. A destination's
       * `ConnectionId` and `DataSourceId` are fixed at creation time — recreate the
       * destination instead of repointing it.
       *
       * @category Destinations
       * @since 1.0.0
       */
const UpdateDestinationPayload = Schema.Struct({
    FieldConfiguration: Schema.optional(Domain.Destination.FieldConfiguration),
    Icon: Schema.optional(Schema.String),
    Name: Schema.optional(Schema.String),
    Position: Schema.optional(Schema.Number),
    PostCreationBehavior: Schema.optional(Domain.Behavior.PostCreationBehavior),
    Template: Schema.optional(Domain.Destination.DestinationTemplate)
});

/** {@inheritDoc UpdateDestinationPayload} */
export type UpdateDestinationPayload = typeof UpdateDestinationPayload.Type;

export/**
       * Every destination configured by the current user.
       *
       * @category Destinations
       * @since 1.0.0
       */
const List = HttpApiEndpoint.get(
    "List",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        success: Schema.Array(Domain.Destination.Destination)
    }
);

export/**
       * Create a new destination.
       *
       * @category Destinations
       * @since 1.0.0
       */
const Create = HttpApiEndpoint.post(
    "Create",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.NotionConnectionNotFound,
            Domain.Error.DataSourceNotFound,
            Domain.Error.DatabaseError
        ],
        payload: CreateDestinationPayload,
        success: Domain.Destination.Destination
    }
);

export/**
       * Update an existing destination's presentation and field configuration.
       *
       * @category Destinations
       * @since 1.0.0
       */
const Update = HttpApiEndpoint.patch(
    "Update",
    "/:DestinationId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DestinationNotFound,
            Domain.Error.DataSourceNotFound,
            Domain.Error.DataSourceSchemaChanged,
            Domain.Error.DatabaseError
        ],
        params:
        {
            DestinationId: Domain.Id.DestinationId
        },
        payload: UpdateDestinationPayload,
        success: Domain.Destination.Destination
    }
);

export/**
       * Delete a destination.
       *
       * @category Destinations
       * @since 1.0.0
       */
const Delete = HttpApiEndpoint.delete(
    "Delete",
    "/:DestinationId",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        params:
        {
            DestinationId: Domain.Id.DestinationId
        }
    }
);

export/**
       * The `Destinations` resource group of the Notivex API.
       *
       * @category Destinations
       * @since 1.0.0
       */
const DestinationsApi = HttpApiGroup.make("Destinations").add(List, Create, Update, Delete);
