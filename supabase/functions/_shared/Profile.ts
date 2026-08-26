/**
 * Server-only profile access (Deno + Effect). A profile is NoteFerry-specific
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
 * @module noteferry/functions/_shared/Profile
 *
 * @file      Profile.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { AdminClient, PrivateSchema } from "./Database.ts";
import { Effect, Schema } from "effect";

const DecodeSettings = Schema.decodeSync(Domain.Settings.AppSettings);
const EncodeSettings = Schema.encodeSync(Domain.Settings.AppSettings);

type SettingsEncoded = (typeof Domain.Settings.AppSettings)["Encoded"];

/* eslint-disable-next-line jsdoc/require-jsdoc */
const DecodeFailed = (Error_: unknown): Domain.Error.DatabaseError =>
    new Domain.Error.DatabaseError({ Message: `Profile settings codec failed: ${String(Error_)}` });

/* eslint-disable-next-line jsdoc/require-jsdoc */
const RowToProfile = (Row: Record<string, unknown>): Domain.Profile.Profile =>
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
};

const ApplyEffectiveSettings = (
    Profile: Domain.Profile.Profile,
    IsPro: boolean
): Domain.Profile.Profile =>
{
    if (IsPro) return Profile;

    return {
        ...Profile,
        Settings: {
            Contrast: Profile.Settings.Contrast,
            DatabaseOrder: [ ],
            HomeScreenLayout: "1",
            LaunchBehavior: { Type: "Home" },
            NotifyOnOfflineSubmit: Profile.Settings.NotifyOnOfflineSubmit,
            NotifyOnSubscriptionSales: Profile.Settings.NotifyOnSubscriptionSales,
            QuickActionDataSourceIds: Profile.Settings.QuickActionDataSourceIds?.slice(0, 1),
            SelectedConnectionId: Profile.Settings.SelectedConnectionId,
            ShowAllWorkspaceDatabases: Profile.Settings.ShowAllWorkspaceDatabases
        }
    };
};

/**
 * The current user's profile. Every authenticated user has exactly one row,
 * auto-provisioned by the `on_auth_user_created` trigger on sign-up.
 *
 * @category Profile
 * @since 1.0.0
 */
export const GetForUser = (UserId: string) =>
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

        const Profile = yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToProfile(data as Record<string, unknown>)
        });
        const { data: IsPro } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("user_has_pro", { p_user_id: UserId }));

        /* Return an effective Free projection while retaining all stored Pro
         * preferences in the row for instant restoration after re-upgrade. */
        return ApplyEffectiveSettings(Profile, IsPro === true);
    });
};

/**
 * Merges a partial settings update into the current value and persists it.
 * Fields omitted from `Patch` keep their current value; this is a merge, not
 * a replace.
 *
 * @category Profile
 * @since 1.0.0
 */
export const UpdateSettingsForUser = (UserId: string, Patch: Domain.Settings.AppSettings) =>
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
        const { data: IsPro } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("user_has_pro", { p_user_id: UserId }));

        const Merged: Domain.Settings.AppSettings = {
            Contrast: Patch.Contrast ?? Current.Contrast,
            DatabaseOrder: IsPro === true
                ? Patch.DatabaseOrder ?? Current.DatabaseOrder
                : Current.DatabaseOrder,
            HomeScreenLayout: IsPro === true
                ? Patch.HomeScreenLayout ?? Current.HomeScreenLayout
                : Current.HomeScreenLayout,
            LaunchBehavior: IsPro === true
                ? Patch.LaunchBehavior ?? Current.LaunchBehavior
                : Current.LaunchBehavior,
            NotifyOnOfflineSubmit: Patch.NotifyOnOfflineSubmit ?? Current.NotifyOnOfflineSubmit,
            NotifyOnSubscriptionSales: Patch.NotifyOnSubscriptionSales
                ?? Current.NotifyOnSubscriptionSales,
            QuickActionDataSourceIds: IsPro === true
                ? Patch.QuickActionDataSourceIds ?? Current.QuickActionDataSourceIds
                : Patch.QuickActionDataSourceIds?.[0]
                    ? [
                        Patch.QuickActionDataSourceIds[0],
                        ...(Current.QuickActionDataSourceIds ?? []).filter((Id) =>
                            Id !== Patch.QuickActionDataSourceIds?.[0])
                    ]
                    : Current.QuickActionDataSourceIds,
            SelectedConnectionId: Patch.SelectedConnectionId ?? Current.SelectedConnectionId,
            ShowAllWorkspaceDatabases: Patch.ShowAllWorkspaceDatabases
                ?? Current.ShowAllWorkspaceDatabases
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

        const Profile = yield* Effect.try({
            catch: DecodeFailed,
            try: () => RowToProfile(data as Record<string, unknown>)
        });

        return ApplyEffectiveSettings(Profile, IsPro === true);
    });
};
