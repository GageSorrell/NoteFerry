/**
 * Content for the `/delete-account` route — the web-based account-deletion
 * page Google Play requires alongside the app's own in-app deletion. Kept
 * as plain typed data, matching `privacy-content.ts`/`terms-content.ts`'s
 * "no CMS" convention.
 *
 * The "what's deleted" / "what's retained" copy is deliberately the same
 * language already live in the Privacy Policy's "Data Retention and
 * Deletion" section (`privacy-content.ts`, id `retention`), so the two
 * pages never say different things about the same behavior.
 *
 * @file      delete-account-content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/** The numbered steps shown to request deletion. */
const deletionSteps: ReadonlyArray<string> = [
    "Sign in with the Notion account you use with NoteFerry, using the "
        + "button below.",
    "Review what will be deleted, listed below.",
    "Select \"Delete my account\" and confirm. This happens immediately "
        + "and can't be undone."
];

export/** What deleting the account removes, immediately and permanently. */
const dataDeleted: ReadonlyArray<string> = [
    "Your NoteFerry profile",
    "Your Notion connection, including the stored OAuth access and "
        + "refresh tokens",
    "Cached data-source schemas for any Notion database you connected",
    "Your destination settings",
    "Your full operation history, including the content of pages you've "
        + "previously submitted through NoteFerry"
];

export/**
 * What isn't deleted by this action, and why — the retention-period
 * disclosure Google Play requires.
 */
const dataRetained: ReadonlyArray<string> = [
    "Deletion is immediate — NoteFerry doesn't hold any of the data above "
        + "for an additional retention period afterward.",
    "Pages already created in your Notion workspace are untouched: "
        + "NoteFerry doesn't own that content and deleting your NoteFerry "
        + "account doesn't remove anything from Notion.",
    "App stores and RevenueCat may separately retain transaction or "
        + "customer records under their own policies, for accounting, "
        + "fraud prevention, legal compliance, and purchase restoration."
];

export/** How to reach the same deletion from inside the app, as an alternative. */
const inAppAlternative =
    "You can also delete your account from inside the app: NoteFerry → "
    + "Settings → Account settings → Delete my account.";
