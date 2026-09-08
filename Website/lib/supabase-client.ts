/**
 * The browser Supabase client for `/delete-account` — the only page on the
 * site that talks to the backend. Points at the same NoteFerry Supabase
 * project the mobile app uses; session persistence is `supabase-js`'s
 * default `localStorage` handling, which is the standard choice for a web
 * sign-in (the mobile app's encrypted secure-store adapter,
 * `Application/Mobile/Source/Domain/Runtime/SecureSessionStore.ts`, has no
 * browser equivalent and isn't needed here).
 *
 * @file      supabase-client.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createClient } from "@supabase/supabase-js";

/* `createClient` throws synchronously if the URL is empty. Next.js evaluates
 * this module during server-side prerendering of the page that imports it,
 * even though the client is only ever called from browser event handlers
 * (`delete-account-action.tsx`'s `useEffect`/`useCallback`) — so a build run
 * without the env vars set (e.g. before they're configured in Vercel) must
 * not fail here. Fall back to a syntactically valid placeholder; real values
 * are only needed once code actually runs in the browser. */
const SupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export/** The shared browser Supabase client. */
const Supabase = createClient(SupabaseUrl, SupabaseAnonKey);
