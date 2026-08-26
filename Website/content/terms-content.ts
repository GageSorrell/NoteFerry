/**
 * Terms of Service content for the `/terms` route.
 *
 * This is the real, final Terms of Service for NoteFerry — not scaffolding.
 * It was drafted by AI at the site owner's direction and grounded in how
 * the app actually works (Notion OAuth via a Supabase Edge Function,
 * Google AdMob advertising and store-processed purchases), but it is not a substitute for
 * review by a licensed attorney before being relied on commercially.
 *
 * @file      terms-content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { LegalSection } from "@/content/legal-section";

export/** The effective date shown at the top of the Terms page. */
const termsEffectiveDate = "August 21, 2026";

export/** The ordered sections of the Terms of Service. */
const termsSections: ReadonlyArray<LegalSection> = [
    {
        heading: "1. Acceptance of Terms",
        id: "acceptance",
        paragraphs: [
            "By downloading, installing, or using NoteFerry (the \"App\"), you agree to be "
            + "bound by these Terms of Service (\"Terms\"). These Terms form a binding "
            + "agreement between you and Gage Sorrell, an individual doing business as "
            + "NoteFerry (\"we,\" \"us,\" or \"our\"). If you do not agree to these Terms, "
            + "do not download, access, or use the App.",
            "We may update these Terms from time to time to reflect changes to the App "
            + "or applicable law. If we make material changes, we will update the "
            + "effective date at the top of this page. Your continued use of the App "
            + "after changes take effect constitutes your acceptance of the revised "
            + "Terms."
        ]
    },
    {
        heading: "2. Description of Service",
        id: "description",
        paragraphs: [
            "NoteFerry is a companion mobile application for Notion. It lets you quickly "
            + "create new pages in Notion databases you already own or have access to, "
            + "using a streamlined \"quick-entry\" form, home-screen quick actions, and "
            + "per-database destination settings that let you control which fields "
            + "appear and which are required.",
            "NoteFerry requires an active Notion account and workspace access to "
            + "function. The App offers a limited, advertising-supported Free tier and "
            + "one paid NoteFerry Pro entitlement. Free currently includes three active "
            + "databases and five page creations in each rolling thirty-minute window. "
            + "Pro removes those product-level limits, removes ads, and unlocks the "
            + "customization features identified in the App's plan comparison. Security, "
            + "accessibility, core Notion properties, and account controls are available "
            + "on both tiers. NoteFerry is not affiliated "
            + "with, endorsed by, or sponsored by Notion Labs, Inc. \"Notion\" is a "
            + "trademark of Notion Labs, Inc."
        ]
    },
    {
        heading: "3. Eligibility and Accounts",
        id: "eligibility",
        paragraphs: [
            "You must be at least 13 years old to use NoteFerry. If you are between 13 "
            + "and 18 years old, you may only use the App with the involvement and "
            + "consent of a parent or legal guardian, who agrees to be bound by these "
            + "Terms on your behalf.",
            "To use NoteFerry, you must connect a Notion account in good standing. You "
            + "are responsible for maintaining the security of that Notion account and "
            + "of the device on which the App is installed, and for all activity that "
            + "occurs through your connected account, whether initiated by you or by "
            + "anyone else using your device."
        ]
    },
    {
        heading: "4. Notion Integration and Third-Party Services",
        id: "third-party-services",
        paragraphs: [
            "NoteFerry connects to your Notion workspace using Notion's official OAuth "
            + "authorization flow. The token exchange happens server-side through a "
            + "Supabase Edge Function we operate — the App itself never receives, "
            + "transmits, or stores your Notion password or any other Notion account "
            + "credentials.",
            "NoteFerry uses Supabase, a third-party backend provider, for "
            + "authentication, session management, and the infrastructure that runs "
            + "this OAuth exchange. Your use of NoteFerry is also subject to Notion's "
            + "and Supabase's own terms of service and privacy policies for any data "
            + "those platforms process on our behalf, and we are not responsible for "
            + "their acts or omissions.",
            "We may add, change, or discontinue integrations with Notion, Supabase, "
            + "or other third-party services at any time, including in response to "
            + "changes those providers make to their own APIs, pricing, or policies."
        ]
    },
    {
        heading: "5. NoteFerry Pro Purchases",
        id: "purchases",
        paragraphs: [
            "NoteFerry Pro is offered as an automatically renewing monthly subscription, "
            + "an automatically renewing yearly subscription, or a lifetime one-time "
            + "purchase. Prices shown in the App are localized store prices and may "
            + "include or exclude taxes as determined by Apple or Google. Apple or "
            + "Google bills you, controls payment methods, and applies its purchase and "
            + "refund rules; NoteFerry does not receive your complete payment-card details.",
            "Monthly and yearly plans renew automatically unless canceled through your "
            + "App Store or Google Play account before renewal. A cancellation remains "
            + "active through the paid period. Billing grace periods and restoration are "
            + "handled through the store and our purchase processor. You can restore "
            + "eligible purchases in the App. Deleting your NoteFerry account or deleting "
            + "the App does not cancel an external store subscription; cancel it in your "
            + "store account first.",
            "A lifetime purchase means access for the supported lifetime of the NoteFerry "
            + "service, not your lifetime and not a promise that NoteFerry will operate "
            + "forever. We may change future prices or features, subject to store rules "
            + "and applicable notice requirements. Existing paid access will be honored "
            + "through its then-current paid period, grace period, or valid lifetime term."
        ]
    },
    {
        heading: "6. Advertising",
        id: "advertising",
        paragraphs: [
            "The Free tier is supported by advertising served "
            + "through Google AdMob, a mobile advertising service operated by Google. "
            + "AdMob and its partners may collect and use device and advertising "
            + "identifiers, and other information, to serve and measure ads, in "
            + "accordance with Google's own policies.",
            "You can review and adjust your ad-personalization and tracking "
            + "preferences through your device's operating system settings. We do not "
            + "control the specific ads AdMob serves and are not responsible for the "
            + "content of third-party advertisements shown within the App. Confirmed Pro "
            + "accounts do not receive ads."
        ]
    },
    {
        heading: "7. User Content and Data Ownership",
        id: "user-content",
        paragraphs: [
            "You retain full ownership of the content and pages you create in Notion "
            + "through the App. NoteFerry acts only as a capture tool: it transmits the "
            + "page data you submit to the Notion API on your behalf. NoteFerry also stores "
            + "the submitted operation payload, status, and resulting Notion page id as "
            + "operation history until the account is deleted or a disclosed retention "
            + "period applies, as described in the Privacy Policy.",
            "You are solely responsible for the content you create through NoteFerry, "
            + "including ensuring that it complies with Notion's own content and "
            + "acceptable-use policies, and with any other legal obligations that "
            + "apply to you."
        ]
    },
    {
        heading: "8. Acceptable Use",
        id: "acceptable-use",
        paragraphs: [
            "You agree not to use NoteFerry to: violate any applicable law or "
            + "regulation; infringe the intellectual property, privacy, or other "
            + "rights of any third party; interfere with, disrupt, or attempt to gain "
            + "unauthorized access to the App or the systems it relies on (including "
            + "Notion's or Supabase's infrastructure); or reverse-engineer, decompile, "
            + "or extract the App's source code, except to the extent such "
            + "restriction is prohibited by applicable law.",
            "We reserve the right to investigate and take appropriate action, "
            + "including suspending or terminating access to the App, against anyone "
            + "who violates this section."
        ]
    },
    {
        heading: "9. Intellectual Property",
        id: "intellectual-property",
        paragraphs: [
            "The NoteFerry name, logo, and the App's design, look, and feel are the "
            + "property of Gage Sorrell. Except for the limited license to use the "
            + "App as intended, these Terms do not grant you any rights to our "
            + "trademarks, logos, or other intellectual property.",
            "\"Notion\" and the Notion logo are trademarks of Notion Labs, Inc., "
            + "referenced here solely to describe NoteFerry's integration with Notion "
            + "and not to imply any endorsement, affiliation, or sponsorship."
        ]
    },
    {
        heading: "10. Termination",
        id: "termination",
        paragraphs: [
            "You may stop using NoteFerry and disconnect your Notion workspace at any "
            + "time from the App's account settings, and may delete the App from your "
            + "device at any time. Account or app deletion does not cancel a store "
            + "subscription.",
            "We may suspend or terminate your access to the App, without notice, if "
            + "we believe you have violated these Terms, if required to comply with "
            + "legal process, or if we discontinue the App. Sections of these Terms "
            + "that by their nature should survive termination — including User "
            + "Content and Data Ownership, Disclaimers, Limitation of Liability, "
            + "Indemnification, and Governing Law — will survive."
        ]
    },
    {
        heading: "11. Disclaimers and Warranties",
        id: "disclaimers",
        paragraphs: [
            "NoteFerry is provided \"as is\" and \"as available,\" without warranties "
            + "of any kind, whether express, implied, or statutory, including implied "
            + "warranties of merchantability, fitness for a particular purpose, "
            + "title, and non-infringement.",
            "We do not warrant that the App will be uninterrupted, timely, secure, "
            + "or error-free, that any content submitted through the App will reach "
            + "Notion successfully in every case, or that the App will continue to "
            + "function if Notion, Supabase, or Google AdMob change or discontinue "
            + "the services NoteFerry relies on."
        ]
    },
    {
        heading: "12. Limitation of Liability",
        id: "liability",
        paragraphs: [
            "To the fullest extent permitted by applicable law, in no event will "
            + "Gage Sorrell be liable for any indirect, incidental, special, "
            + "consequential, exemplary, or punitive damages, or any loss of data, "
            + "profits, or goodwill, arising out of or related to your use of, or "
            + "inability to use, the App, even if advised of the possibility of such "
            + "damages.",
            "To the fullest extent permitted by applicable law, our total aggregate "
            + "liability to you for any claim arising out of or relating to these "
            + "Terms or the App will not exceed the greater of fifty U.S. dollars "
            + "($50) or the amounts you paid for NoteFerry during the twelve months "
            + "immediately preceding the event giving rise to the claim."
        ]
    },
    {
        heading: "13. Indemnification",
        id: "indemnification",
        paragraphs: [
            "You agree to indemnify and hold harmless Gage Sorrell from and against "
            + "any claims, damages, losses, liabilities, and expenses (including "
            + "reasonable attorneys' fees) arising out of or related to your use of "
            + "the App, your violation of these Terms, or your violation of any "
            + "rights of a third party."
        ]
    },
    {
        heading: "14. Changes to These Terms",
        id: "changes",
        paragraphs: [
            "We may revise these Terms at any time. Material changes will be "
            + "reflected by an updated effective date at the top of this page, and "
            + "where practical, we will provide additional notice within the App. "
            + "Your continued use of NoteFerry after a revision takes effect means you "
            + "accept the updated Terms."
        ]
    },
    {
        heading: "15. Governing Law",
        id: "governing-law",
        paragraphs: [
            "These Terms are governed by the laws of the State of Indiana, United "
            + "States, without regard to its conflict-of-laws principles. You agree "
            + "that any dispute arising out of or relating to these Terms or the App "
            + "will be brought exclusively in the state or federal courts located in "
            + "Allen County, Indiana, and you consent to the personal jurisdiction of "
            + "those courts."
        ]
    },
    {
        heading: "16. Severability",
        id: "severability",
        paragraphs: [
            "If any provision of these Terms is found to be unenforceable or invalid "
            + "under applicable law, that provision will be limited or eliminated to "
            + "the minimum extent necessary, and the remaining provisions will remain "
            + "in full force and effect."
        ]
    },
    {
        heading: "17. Entire Agreement",
        id: "entire-agreement",
        paragraphs: [
            "These Terms, together with our Privacy Policy, constitute the entire "
            + "agreement between you and Gage Sorrell regarding your use of NoteFerry, "
            + "and supersede any prior agreements between you and us regarding the "
            + "App."
        ]
    },
    {
        heading: "18. Contact",
        id: "contact",
        paragraphs: [
            "Questions about these Terms can be sent to gage@sorrell.sh, or filed as "
            + "an issue on the project's GitHub repository."
        ]
    }
];
