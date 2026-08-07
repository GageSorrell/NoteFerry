/**
 * A Supabase Auth storage adapter that keeps the session out of plaintext on
 * the device (ArchitectureInitialDraft.md §6, §19: "favor SecureStore for
 * sensitive native session material").
 *
 * A Supabase session can exceed the ~2048-byte value size that `expo-secure-
 * store` may reject on some platforms, so this uses the Supabase-recommended
 * "large secure store" pattern: a per-entry AES key is held in the encrypted
 * keychain/keystore via `expo-secure-store`, and the (much larger) ciphertext
 * is held in `AsyncStorage`. Neither store alone reveals the session.
 *
 * @module notivex/runtime/secure-session-store
 *
 * @file      secure-session-store.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as AesJs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    /* eslint-disable-next-line jsdoc/require-jsdoc */
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

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    private async Decrypt(Key: string, Value: string): Promise<string | null>
    {
        const EncryptionKeyHex = await SecureStore.getItemAsync(Key);

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
        const Encrypted = await AsyncStorage.getItem(Key);

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
