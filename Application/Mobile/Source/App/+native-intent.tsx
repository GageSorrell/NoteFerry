/**
 * Prevents OAuth callbacks from being interpreted as Expo Router screens.
 *
 * @module noteferry/App/+native-intent
 *
 * @file      +native-intent.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    GetOAuthCallbackKind,
    SetPendingInitialOAuthCallback
} from "@/Domain/Auth/OAuthRedirect";

/** Input supplied by Expo Router for every incoming native system path. */
interface SystemPathInput
{
    readonly initial: boolean;
    readonly path: string;
}

export/**
       * Lets an already-running `openAuthSessionAsync` consume its own callback.
       * When Android recreated the process, sends the callback to a recovery route
       * because the original browser-session promise no longer exists.
       */
const redirectSystemPath = ({ initial, path }: SystemPathInput): string | null =>
{
    if (GetOAuthCallbackKind(path) === null)
    {
        return path;
    }

    if (!initial)
    {
        return null;
    }

    SetPendingInitialOAuthCallback(path);

    return "/oauth-callback";
};
