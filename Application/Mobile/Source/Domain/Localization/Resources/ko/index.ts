/**
 * @module noteferry/Domain/Localization/Resources/ko
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import Common from "./common.json";
import Component from "./component.json";
import Errors from "./errors.json";
import Feedback from "./feedback.json";
import Home from "./home.json";
import Onboarding from "./onboarding.json";
import PageCreation from "./pageCreation.json";
import Settings from "./settings.json";
import Subscription from "./subscription.json";

const Ko = {
    common: Common,
    component: Component,
    errors: Errors,
    feedback: Feedback,
    home: Home,
    onboarding: Onboarding,
    pageCreation: PageCreation,
    settings: Settings,
    subscription: Subscription
} as const;

export default Ko;
