/**
 * `Profile` — NoteFerry-specific information about a user that does not belong
 * in Supabase's own `auth.users` table, including their cross-device
 * {@link Settings.AppSettings}.
 *
 * @module @noteferry/domain/Profile
 *
 * @file      Profile.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import * as Settings from "./Settings.js";
import * as Schema from "effect/Schema";

export/**
       * A NoteFerry user's profile: display metadata plus their app-wide
       * settings.
       *
       * @category Profile
       * @since 1.0.0
       */
const Profile = Schema.Struct({
    CreatedAt: Schema.DateFromString,
    DisplayName: Schema.optional(Schema.String),
    Settings: Settings.AppSettings,
    UpdatedAt: Schema.DateFromString,
    UserId: Id.UserId
});

/** {@inheritDoc Profile} */
export type Profile = Schema.Schema.Type<typeof Profile>;
