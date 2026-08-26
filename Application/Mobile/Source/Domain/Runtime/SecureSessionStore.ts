/**
 * A Supabase Auth storage adapter that keeps the session out of plaintext on
 * the device ("favor SecureStore for sensitive native session material").
 *
 * A Supabase session can exceed the ~2048-byte value size that `expo-secure-
 * store` may reject on some platforms, so this uses the Supabase-recommended
 * "large secure store" pattern: a per-entry AES key is held in the encrypted
 * keychain/keystore via `expo-secure-store`, and the (much larger) ciphertext
 * is held in `AsyncStorage`. Neither store alone reveals the session.
 *
 * @module noteferry/Domain/Runtime/SecureSessionStore
 *
 * @file      SecureSessionStore.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as AesJs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* The longest a single native storage read may take before it is assumed to
 * have been dispatched to a not-yet-ready native module and a fresh attempt is
 * made. Healthy reads resolve in a few milliseconds. */
const ReadTimeoutMs = 1000;

/* How many read attempts to make before treating the value as absent. This
 * covers the cold-start window during which the AsyncStorage/SecureStore native
 * modules can accept a call before they are ready to service it (observed to be
 * up to ~7s on a cold debug build), with headroom so a real session is read
 * rather than prematurely dropped. Once the modules are ready, reads resolve on
 * the first attempt, so a high ceiling costs nothing in the common case. */
const ReadAttempts = 12;

/**
 * Reads a value with a bounded wait, retrying from scratch when a read does not
 * resolve in time. On a cold start the native storage modules can accept a call
 * before they are ready to service it, leaving that promise pending forever; a
 * fresh attempt once they are ready resolves normally. Returns `null` when every
 * attempt fails or times out, so a hung read degrades to "no value" rather than
 * stranding the caller (which would leave the app on a blank gate).
 *
 * @category Runtime
 * @since 1.0.0
 */
const ReadWithRetry = async (Read: () => Promise<string | null>): Promise<string | null> =>
{
    const TimedOut = Symbol("timed-out");

    for (let Attempt = 0; Attempt < ReadAttempts; Attempt += 1)
    {
        const Result = await Promise.race([
            Read().catch((): typeof TimedOut => TimedOut),
            new Promise<typeof TimedOut>((Resolve: (Value: typeof TimedOut) => void): void =>
            {
                setTimeout(() => Resolve(TimedOut), ReadTimeoutMs);
            })
        ]);

        if (Result !== TimedOut)
        {
            return Result;
        }
    }

    return null;
};

/**
 * Encrypts values with a random AES-256-CTR key stored in SecureStore, keeping
 * the ciphertext in AsyncStorage. Implements the small surface Supabase Auth
 * expects of a storage adapter.
 *
 * @category Runtime
 * @since 1.0.0
 */
export class SecureSessionStore
{
    private async Encrypt(Key: string, Value: string): Promise<string>
    {
        const EncryptionKey = Crypto.getRandomBytes(32);
        const Cipher = new AesJs.ModeOfOperation.ctr(
            EncryptionKey,
            new AesJs.Counter(1)
        );
        const EncryptedBytes = Cipher.encrypt(AesJs.utils.utf8.toBytes(Value));

        await SecureStore.setItemAsync(Key, AesJs.utils.hex.fromBytes(EncryptionKey));

        return AesJs.utils.hex.fromBytes(EncryptedBytes);
    }

    private async Decrypt(Key: string, Value: string): Promise<string | null>
    {
        const EncryptionKeyHex = await ReadWithRetry(() => SecureStore.getItemAsync(Key));

        if (!EncryptionKeyHex)
        {
            return null;
        }

        const Cipher = new AesJs.ModeOfOperation.ctr(
            AesJs.utils.hex.toBytes(EncryptionKeyHex),
            new AesJs.Counter(1)
        );
        const DecryptedBytes = Cipher.decrypt(AesJs.utils.hex.toBytes(Value));

        return AesJs.utils.utf8.fromBytes(DecryptedBytes);
    }

    /**
     * Reads and decrypts the value stored under `Key`, or `null` if absent.
     *
     * @category Runtime
     * @since 1.0.0
     */
    public async getItem(Key: string): Promise<string | null>
    {
        const Encrypted = await ReadWithRetry(() => AsyncStorage.getItem(Key));

        if (!Encrypted)
        {
            return null;
        }

        return this.Decrypt(Key, Encrypted);
    }

    /**
     * Encrypts and stores `Value` under `Key`.
     *
     * @category Runtime
     * @since 1.0.0
     */
    public async setItem(Key: string, Value: string): Promise<void>
    {
        const Encrypted = await this.Encrypt(Key, Value);

        await AsyncStorage.setItem(Key, Encrypted);
    }

    /**
     * Removes both the ciphertext and its encryption key.
     *
     * @category Runtime
     * @since 1.0.0
     */
    public async removeItem(Key: string): Promise<void>
    {
        await AsyncStorage.removeItem(Key);
        await SecureStore.deleteItemAsync(Key);
    }
}
