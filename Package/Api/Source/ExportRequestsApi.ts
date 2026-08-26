/**
 * The `ExportRequests` group: asking NoteFerry to prepare an export of the
 * current user's account data. Requests are fulfilled manually — creating one
 * only records the request and notifies NoteFerry.
 *
 * @module @noteferry/api/ExportRequestsApi
 *
 * @file      ExportRequestsApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export/**
       * Record a request for the current user's account data.
       *
       * @category ExportRequests
       * @since 1.0.0
       */
const Create = HttpApiEndpoint.post(
    "Create",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ]
    }
);

export/**
       * The `ExportRequests` resource group of the NoteFerry API.
       *
       * @category ExportRequests
       * @since 1.0.0
       */
const ExportRequestsApi = HttpApiGroup.make("ExportRequests").add(Create);
