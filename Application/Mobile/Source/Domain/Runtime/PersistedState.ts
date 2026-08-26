/**
 * App-wide persisted-state reset used by development tooling. AsyncStorage
 * contains ordinary preferences as well as the encrypted Supabase session;
 * the corresponding session encryption keys live separately in SecureStore.
 *
 * @module noteferry/Domain/Runtime/PersistedState
 *
 * @file      PersistedState.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Supabase, SupabaseStorageKey } from "./Supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecureSessionStore } from "./SecureSessionStore";

export/**
       * Removes all app-scoped AsyncStorage values and both halves of every encrypted
       * Supabase Auth entry. The auth keys are removed first while their matching
       * AsyncStorage names are still enumerable.
       *
       * @category Runtime
       * @since 1.0.0
       */
const ClearPersistedState = async (): Promise<void> =>
{
    Supabase.auth.stopAutoRefresh();

    const Keys = await AsyncStorage.getAllKeys();
    const AuthKeys = Keys.filter((Key: string) =>
        Key === SupabaseStorageKey || Key.startsWith(`${ SupabaseStorageKey }-`));
    const SessionStore = new SecureSessionStore();

    try
    {
        await Promise.all(AuthKeys.map((Key: string) => SessionStore.removeItem(Key)));
    }
    finally
    {
        await AsyncStorage.clear();
    }
};
