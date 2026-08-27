/**
 * Types `t()` against the `en-US` translation files (the source of truth for
 * every key) so a typo'd or missing key is a compile error rather than a
 * silent fallback at runtime. The other four locales are checked for key
 * parity against these same files by `scripts/check-i18n-keys.ts`, not by
 * TypeScript.
 *
 * @module noteferry/Domain/Localization/i18next
 *
 * @file      i18next.d.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import "i18next";
import Common from "./Resources/en-US/common.json";
import Component from "./Resources/en-US/component.json";
import Errors from "./Resources/en-US/errors.json";
import Feedback from "./Resources/en-US/feedback.json";
import Home from "./Resources/en-US/home.json";
import Onboarding from "./Resources/en-US/onboarding.json";
import PageCreation from "./Resources/en-US/pageCreation.json";
import Settings from "./Resources/en-US/settings.json";
import Subscription from "./Resources/en-US/subscription.json";

declare module "i18next"
{
    interface CustomTypeOptions
    {
        defaultNS: "common";
        resources: {
            common: typeof Common;
            component: typeof Component;
            errors: typeof Errors;
            feedback: typeof Feedback;
            home: typeof Home;
            onboarding: typeof Onboarding;
            pageCreation: typeof PageCreation;
            settings: typeof Settings;
            subscription: typeof Subscription;
        };
    }
}
