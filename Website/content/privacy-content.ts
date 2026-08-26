/**
 * Privacy Policy content for the `/privacy` route.
 *
 * This is the real, final Privacy Policy for NoteFerry — not scaffolding.
 * It was drafted by AI at the site owner's direction and grounded directly
 * in the app's Supabase schema and edge functions (what's actually stored,
 * for how long, and who it's shared with — including that submitted page
 * content is retained in `app.operations` until account deletion, with no
 * automatic purge), but it is not a substitute for review by a licensed
 * attorney before being relied on commercially.
 *
 * @file      privacy-content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { LegalSection } from "@/content/legal-section";

export/** The effective date shown at the top of the Privacy page. */
const privacyEffectiveDate = "August 21, 2026";

export/** The ordered sections of the Privacy Policy. */
const privacySections: ReadonlyArray<LegalSection> = [
    {
        heading: "1. Overview and Scope",
        id: "overview",
        paragraphs: [
            "This Privacy Policy explains how NoteFerry (the \"App\"), a companion "
            + "mobile app for Notion, and this website collect, use, share, and "
            + "protect information. NoteFerry is operated by Gage Sorrell (\"we,\" "
            + "\"us,\" or \"our\"). By using the App or this website, you agree to "
            + "the practices described here. This Policy should be read together "
            + "with our Terms of Service."
        ]
    },
    {
        heading: "2. Information We Collect",
        id: "information-we-collect",
        paragraphs: [
            "Account information — when you sign in, we create an account record, "
            + "which may include an optional display name.",
            "Notion connection details — when you connect a Notion workspace, we "
            + "store metadata about that connection: your Notion workspace name and "
            + "icon, an internal integration identifier, the connected Notion "
            + "user's identifier, and the connection's status and timestamps.",
            "Notion OAuth tokens — we store the access and refresh tokens issued by "
            + "Notion's OAuth flow, so the App can act on your behalf without "
            + "requiring you to sign in every time.",
            "Notion database structure — when you pick a Notion database to use "
            + "with NoteFerry, we cache its schema (its title, icon, and property/"
            + "field definitions) so the App can build a quick-entry form without "
            + "querying Notion every time. We do not cache the rows or page "
            + "content already inside that database.",
            "Destination settings — the name, icon, field visibility, and template "
            + "settings you configure for each destination.",
            "Page-creation content — when you submit a new page through the "
            + "quick-entry form, the property values you enter are sent to us and "
            + "stored as an \"operation\" record, along with its status and, once "
            + "created, the resulting Notion page id. We keep this so the request "
            + "can be retried if it fails or you're offline, and so you have a "
            + "history of what you've submitted. See \"Data Retention and "
            + "Deletion\" below for how long this is kept.",
            "Advertising identifiers — Google AdMob, which serves ads in the App, "
            + "may collect device and advertising identifiers and other technical "
            + "information. See \"Advertising\" below.",
            "Purchase information — RevenueCat, Apple, and Google process purchases. "
            + "We receive product and subscription identifiers, transaction metadata, "
            + "purchase and expiration dates, entitlement and renewal state, store, and "
            + "a pseudonymous identifier based on your NoteFerry account. We never receive "
            + "your complete payment-card details.",
            "Notification information — if you separately opt in to subscription-sale "
            + "notifications, we store your Expo push token, device and platform "
            + "identifier, preference, last-seen time, campaign delivery tickets and "
            + "receipts, and invalid-token status. Operational notification permission "
            + "does not by itself enroll you in promotional notifications."
        ]
    },
    {
        heading: "3. How We Use Your Information",
        id: "how-we-use-information",
        paragraphs: [
            "We use the information above to operate and maintain your account and "
            + "Notion connection; build the quick-entry form for your chosen "
            + "databases; create pages in Notion at your request, including "
            + "retrying that request if it initially fails or you were offline; "
            + "maintain a history of your operations so you can see what was "
            + "submitted and its status; respond to support and data requests you "
            + "make; enforce feature entitlements and usage limits; prevent purchase "
            + "fraud; provide billing support; send subscription-sale notices only when "
            + "you opt in; and serve advertising to confirmed Free accounts through "
            + "Google AdMob.",
            "We do not use the content of the Notion pages you create through "
            + "NoteFerry for any purpose other than creating the page you asked us "
            + "to create."
        ]
    },
    {
        heading: "4. Notion Account Data",
        id: "notion-account-data",
        paragraphs: [
            "NoteFerry connects to Notion through Notion's official OAuth flow. We "
            + "never receive, see, or store your Notion password. The App only "
            + "requests the minimum Notion API scopes needed to browse your "
            + "databases and create pages on your behalf."
        ]
    },
    {
        heading: "5. Supabase (Backend Infrastructure)",
        id: "supabase",
        paragraphs: [
            "NoteFerry uses Supabase, a third-party backend provider, for "
            + "authentication, database storage, and the server-side functions "
            + "described in this Policy, including the Notion OAuth token "
            + "exchange. Supabase processes this data on our behalf and maintains "
            + "its own security and privacy practices, available at supabase.com."
        ]
    },
    {
        heading: "6. Advertising",
        id: "advertising",
        paragraphs: [
            "NoteFerry is offered free of charge and is supported by advertising "
            + "served through Google AdMob. AdMob and its partners may collect "
            + "device and advertising identifiers, IP address, and other "
            + "technical information to serve and measure ads, in accordance with "
            + "Google's own privacy policy.",
            "You can review and adjust ad-personalization and tracking "
            + "preferences through your device's operating system settings (for "
            + "example, iOS App Tracking Transparency or Android ad settings). We "
            + "do not control the specific ads AdMob serves."
        ]
    },
    {
        heading: "7. Cookies and Tracking Technologies",
        id: "cookies",
        paragraphs: [
            "This marketing website does not currently set tracking or "
            + "advertising cookies. If that changes — for example, to add "
            + "privacy-respecting page-view analytics — this section will be "
            + "updated to disclose it."
        ]
    },
    {
        heading: "8. Data Sharing and Disclosure",
        id: "data-sharing",
        paragraphs: [
            "We do not sell your personal information.",
            "We share information only as needed to operate NoteFerry: with Notion, "
            + "to create pages on your behalf; with Supabase, our backend "
            + "infrastructure provider; with Google AdMob, to serve ads to Free "
            + "accounts; with RevenueCat, Apple, and Google, to process purchases "
            + "and maintain entitlements; with Expo Push Service, APNs, and FCM, "
            + "to deliver requested notifications; and with "
            + "Resend, an email delivery service we use to notify ourselves (not "
            + "you) when you submit an in-app data request, so we can fulfill it — "
            + "that notification includes your account and request identifiers, "
            + "not your Notion content.",
            "We may also disclose information if required by law or legal "
            + "process, to protect our rights or the safety of others, or in "
            + "connection with a merger, acquisition, or sale of assets, in which "
            + "case we would notify you."
        ]
    },
    {
        heading: "9. Data Storage and Security",
        id: "data-storage",
        paragraphs: [
            "Notion OAuth tokens and your other account data are stored "
            + "server-side using Supabase's secure infrastructure, not on your "
            + "device in plain text. We apply industry-standard safeguards, "
            + "though no method of transmission or storage is ever 100% secure."
        ]
    },
    {
        heading: "10. Data Retention and Deletion",
        id: "retention",
        paragraphs: [
            "You can disconnect your Notion workspace, or delete your NoteFerry "
            + "account entirely, at any time from the App's account settings.",
            "Deleting your account is immediate and permanent: it removes your "
            + "profile, Notion connection and credentials, cached data-source "
            + "schemas, destinations, and operation history — including the "
            + "content of pages you've previously submitted — from our operational "
            + "systems. Store providers and RevenueCat may retain transaction or "
            + "customer records as required for accounting, fraud prevention, legal "
            + "compliance, and purchase restoration under their own policies.",
            "Short of deleting your account, we retain your operation history, "
            + "including submitted page content, so you can see your submission "
            + "history and so failed or offline submissions can be retried. We do "
            + "not currently delete individual operations automatically after a "
            + "fixed period; if that changes, this section will be updated. Push tokens "
            + "are removed on logout, account reassignment, account deletion, opt-out, "
            + "or when a push provider reports that the device is unregistered. Campaign "
            + "delivery records are retained only as needed for deduplication, receipt "
            + "handling, abuse prevention, and support."
        ]
    },
    {
        heading: "11. Your Rights and Choices",
        id: "your-rights",
        paragraphs: [
            "Depending on where you live, you may have rights to access, "
            + "correct, delete, or receive a copy of personal information we "
            + "hold about you, and to object to certain processing — for "
            + "example, under the GDPR if you are in the European Economic Area, "
            + "or the CCPA/CPRA if you are a California resident.",
            "You can request a copy of your account data from within the App "
            + "(account settings), which notifies us so we can prepare and send "
            + "it to you. You can delete your account and all associated data at "
            + "any time from the App's account settings, as described above. For "
            + "any other request, contact us using the details below.",
            "You can withdraw consent for subscription-sale notifications at any time "
            + "in Settings > Notifications. Turning off operating-system notification "
            + "permission also stops delivery, but using the in-app switch lets us "
            + "remove the promotional push registration promptly."
        ]
    },
    {
        heading: "12. Children's Privacy",
        id: "childrens-privacy",
        paragraphs: [
            "NoteFerry is not directed at children under 13, and we do not "
            + "knowingly collect personal information from children under 13. If "
            + "you believe a child has provided us with personal information, "
            + "please contact us so we can remove it."
        ]
    },
    {
        heading: "13. International Data Transfers",
        id: "international-transfers",
        paragraphs: [
            "NoteFerry's backend infrastructure (Supabase) is hosted in the United "
            + "States. If you access the App from outside the United States, "
            + "your information will be transferred to, stored, and processed in "
            + "the United States, which may have different data protection laws "
            + "than your country."
        ]
    },
    {
        heading: "14. Changes to This Policy",
        id: "changes",
        paragraphs: [
            "We may update this Privacy Policy from time to time. Material "
            + "changes will be reflected by an updated effective date at the top "
            + "of this page, and where practical, we will provide additional "
            + "notice within the App."
        ]
    },
    {
        heading: "15. Contact",
        id: "contact",
        paragraphs: [
            "Questions about this Privacy Policy, or requests regarding your "
            + "data, can be sent to gage@sorrell.sh, or filed as an issue on the "
            + "project's GitHub repository."
        ]
    }
];
