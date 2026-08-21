/**
 * Server-only profile access (Deno + Effect). A profile is Notivex-specific
 * user information — today, just the cross-device
 * {@link Domain.Settings.AppSettings} blob — that does not belong in
 * Supabase's own `auth.users` table.
 *
 * `settings` is *encoded and decoded through Effect Schema*, the same
 * pattern `_shared/Destinations.ts` uses for its `configuration` blob: every
 * field is optional in `Domain.Settings.AppSettings`, so a brand-new or
 * partial value decodes cleanly, and `Domain.Settings.WithDefaults` fills the
 * gaps for callers.
 *
 * @module notivex/functions/_shared/Profile
 *
 * @file      Profile.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { AdminClient } from "./Database.ts";
import { Effect, Schema } from "effect";

const DecodeSettings = Schema.decodeSync(Domain.Settings.AppSettings);
const EncodeSettings = Schema.encodeSync(Domain.Settings.AppSettings);

type SettingsEncoded = (typeof Domain.Settings.AppSettings)["Encoded"];

/* eslint-disable-next-line jsdoc/require-jsdoc */
const DecodeFailed = (Error_: unknown): Domain.Error.DatabaseError =>
    new Domain.Error.DatabaseError({ Message: `Profile settings codec failed: ${String(Error_)}` });

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RowToProfile(Row: Record<string, unknown>): Domain.Profile.Profile
{
    const Settings = DecodeSettings(Row.settings as SettingsEncoded);
    const DisplayName = Row.display_name as string | null;

    return {
        CreatedAt: new Date(Row.created_at as string),
        ...(DisplayName ? { DisplayName } : {}),
        Settings,
        UpdatedAt: new Date(Row.updated_at as string),
        UserId: Row.user_id as Domain.Id.UserId
    };
}

/**
 * The current user's profile. Every authenticated user has exactly one row,
 * auto-provisioned by the `on_auth_user_created` trigger on sign-up.
 *
 * @category Profile
 * @since 1.0.0
 */
export function GetForUser(UserId: string)
{
    return Effect.gen(function* ()
    {
        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("profiles")
                .select("*")
                .eq("user_id", UserId)
                .single());

        if (error || !data)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: error?.message ?? "No profile row for this user."
            }));
        }

        return yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToProfile(data as Record<string, unknown>)
        });
    });
}

/**
 * Merges a partial settings update into the current value and persists it.
 * Fields omitted from `Patch` keep their current value; this is a merge, not
 * a replace.
 *
 * @category Profile
 * @since 1.0.0
 */
export function UpdateSettingsForUser(UserId: string, Patch: Domain.Settings.AppSettings)
{
    return Effect.gen(function* ()
    {
        const { data: Existing, error: ExistingError } = yield* Effect.promise(async () =>
            await AdminClient
                .from("profiles")
                .select("settings")
                .eq("user_id", UserId)
                .single());

        if (ExistingError || !Existing)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: ExistingError?.message ?? "No profile row for this user."
            }));
        }

        const Current = yield* Effect.try({
            catch: DecodeFailed,
            try: () => DecodeSettings(Existing.settings as SettingsEncoded)
        });

        const Merged: Domain.Settings.AppSettings = {
            Contrast: Patch.Contrast ?? Current.Contrast,
            DatabaseOrder: Patch.DatabaseOrder ?? Current.DatabaseOrder,
            HomeScreenLayout: Patch.HomeScreenLayout ?? Current.HomeScreenLayout,
            LaunchBehavior: Patch.LaunchBehavior ?? Current.LaunchBehavior,
            NotifyOnOfflineSubmit: Patch.NotifyOnOfflineSubmit ?? Current.NotifyOnOfflineSubmit,
            QuickActionDataSourceIds: Patch.QuickActionDataSourceIds
                ?? Current.QuickActionDataSourceIds
        };

        const SettingsJson = yield* Effect.try({
            catch: DecodeFailed,
            try: () => EncodeSettings(Merged)
        });

        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("profiles")
                .update({ settings: SettingsJson })
                .eq("user_id", UserId)
                .select("*")
                .single());

        if (error || !data)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: error?.message ?? "Update returned no row."
            }));
        }

        return yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToProfile(data as Record<string, unknown>)
        });
    });
}
