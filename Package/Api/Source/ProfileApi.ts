/**
 * The `Profile` group: reading the current user's profile and updating their
 * app-wide {@link Domain.Settings.AppSettings}.
 *
 * @module @noteferry/api/ProfileApi
 *
 * @file      ProfileApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export/**
       * The current user's profile, including their resolved app-wide settings.
       *
       * @category Profile
       * @since 1.0.0
       */
const Get = HttpApiEndpoint.get(
    "Get",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        success: Domain.Profile.Profile
    }
);

export/**
       * Merge a partial settings update into the current user's profile and
       * persist it.
       *
       * @category Profile
       * @since 1.0.0
       */
const UpdateSettings = HttpApiEndpoint.patch(
    "UpdateSettings",
    "/Settings",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ],
        payload: Domain.Settings.AppSettings,
        success: Domain.Profile.Profile
    }
);

export/**
       * The `Profile` resource group of the NoteFerry API.
       *
       * @category Profile
       * @since 1.0.0
       */
const ProfileApi = HttpApiGroup.make("Profile").add(Get, UpdateSettings);
