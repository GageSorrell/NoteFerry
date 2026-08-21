/**
 * The `Pages` group: creating a Notion page from a destination. This is the
 * one place the wire contract accepts a Notivex-shaped
 * {@link Domain.Command.CreatePageCommand} rather than Notion's own request
 * body — only the server-side Notion adapter ever constructs that.
 *
 * @module @notivex/api/PagesApi
 *
 * @file      PagesApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export/**
       * Create a page in a destination's data source. The server records the
       * operation before calling Notion so an ambiguous timed-out request can be
       * distinguished from one that never reached Notion.
       *
       * @category Pages
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
            Domain.Error.NotionConnectionRevoked,
            Domain.Error.DataSourceNotFound,
            Domain.Error.DataSourceSchemaChanged,
            Domain.Error.InvalidPageDraft,
            Domain.Error.NotionUnauthorized,
            Domain.Error.NotionRateLimited,
            Domain.Error.NotionValidationError,
            Domain.Error.NotionUnavailable,
            Domain.Error.FreeCreationWindowExceeded,
            Domain.Error.FeatureGateError,
            Domain.Error.DatabaseError
        ],
        payload: Domain.Command.CreatePageCommand,
        success: Domain.Command.CreatePageResult
    }
);

export/**
       * The `Pages` resource group of the Notivex API.
       *
       * @category Pages
       * @since 1.0.0
       */
const PagesApi = HttpApiGroup.make("Pages").add(Create);
