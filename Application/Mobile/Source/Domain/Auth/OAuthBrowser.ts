/**
 * Shared native OAuth browser launcher.
 *
 * @module noteferry/Domain/Auth/OAuthBrowser
 *
 * @file      OAuthBrowser.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as WebBrowser from "expo-web-browser";
import type {
    AuthSessionOpenOptions,
    WebBrowserAuthSessionResult
} from "expo-web-browser";
import { Platform } from "react-native";

const BaseOptions: AuthSessionOpenOptions =
    Object.freeze({
        createTask: true,
        showTitle: true,
        /* Lifted from the Notion integration web page. */
        toolbarColor: "#F9F8F7",
        useProxyActivity: true
    } as const);

let AndroidOptions: Promise<AuthSessionOpenOptions> | null = null;

/** Resolves a real Custom Tabs provider instead of leaving the intent implicit. */
const GetAuthBrowserOptions = (): Promise<AuthSessionOpenOptions> =>
{
    if (Platform.OS !== "android")
    {
        return Promise.resolve(BaseOptions);
    }

    AndroidOptions ??= WebBrowser.getCustomTabsSupportingBrowsersAsync()
        .then((Browsers: WebBrowser.WebBrowserCustomTabsResults): AuthSessionOpenOptions =>
        {
            const browserPackage = Browsers.preferredBrowserPackage
                ?? Browsers.defaultBrowserPackage
                ?? Browsers.servicePackages.find(Browsers.browserPackages.includes);

            return browserPackage === undefined
                ? BaseOptions
                : { ...BaseOptions, browserPackage };
        })
        .catch((): AuthSessionOpenOptions => BaseOptions);

    return AndroidOptions;
};

export/**
       * Opens one OAuth URL in the platform auth browser. Android is pinned to
       * a browser that advertises Custom Tabs support, while iOS continues to
       * use the native authentication session.
       *
       * @category Auth
       * @since 1.0.0
       */
const OpenAuthSession = async (
    Url: string,
    ReturnUrl: string
): Promise<WebBrowserAuthSessionResult> => WebBrowser.openAuthSessionAsync(
    Url,
    ReturnUrl,
    await GetAuthBrowserOptions()
);
