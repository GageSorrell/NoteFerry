/**
 * The single Supabase client for the app. The Expo client talks directly to
 * Supabase Auth (ArchitectureInitialDraft.md §6) using the publishable key,
 * which is safe in a public client because data access is guarded by RLS. The
 * session is persisted through {@link SecureSessionStore} and auto-refreshed
 * while the app is foregrounded.
 *
 * @module notivex/runtime/supabase
 *
 * @file      supabase.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AppState, type AppStateStatus } from "react-native";
import { SecureSessionStore } from "./secure-session-store";
import { createClient } from "@supabase/supabase-js";

const SupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SupabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!SupabaseUrl || !SupabaseKey)
{
    throw new Error(
        "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY. "
        + "Copy Application/.env.example to Application/.env and fill them in."
    );
}

export/**
       * The app-wide Supabase client. Import this rather than constructing clients
       * ad hoc so there is exactly one session/refresh lifecycle.
       *
       * @category Runtime
       * @since 1.0.0
       */
const Supabase = createClient(SupabaseUrl, SupabaseKey, {
    auth:
    {
        autoRefreshToken: true,
        /* Redirects are handled explicitly by the native OAuth flow, not by
         * parsing the initial URL. */
        detectSessionInUrl: false,
        persistSession: true,
        storage: new SecureSessionStore()
    }
});

/* Supabase only refreshes tokens while told the app is active. Tie that to the
 * foreground/background lifecycle so a returning user has a fresh session. */
AppState.addEventListener("change", (State: AppStateStatus) =>
{
    if (State === "active")
    {
        Supabase.auth.startAutoRefresh();
    }
    else
    {
        Supabase.auth.stopAutoRefresh();
    }
});
