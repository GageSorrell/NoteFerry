/**
 * Terms of Service content for the `/terms` route.
 *
 * This is the real, final Terms of Service for Notivex — not scaffolding.
 * It was drafted by AI at the site owner's direction and grounded in how
 * the app actually works (Notion OAuth via a Supabase Edge Function,
 * Google AdMob advertising, no payments), but it is not a substitute for
 * review by a licensed attorney before being relied on commercially.
 *
 * @file      terms-content.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { LegalSection } from "@/content/legal-section";

export/** The effective date shown at the top of the Terms page. */
const termsEffectiveDate = "August 19, 2026";

export/** The ordered sections of the Terms of Service. */
const termsSections: ReadonlyArray<LegalSection> = [
    {
        heading: "1. Acceptance of Terms",
        id: "acceptance",
        paragraphs: [
            "By downloading, installing, or using Notivex (the \"App\"), you agree to be "
            + "bound by these Terms of Service (\"Terms\"). These Terms form a binding "
            + "agreement between you and Gage Sorrell, an individual doing business as "
            + "Notivex (\"we,\" \"us,\" or \"our\"). If you do not agree to these Terms, "
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
            "Notivex is a companion mobile application for Notion. It lets you quickly "
            + "create new pages in Notion databases you already own or have access to, "
            + "using a streamlined \"quick-entry\" form, home-screen quick actions, and "
            + "per-database destination settings that let you control which fields "
            + "appear and which are required.",
            "Notivex requires an active Notion account and workspace access to "
            + "function. The App is provided free of charge and is not affiliated "
            + "with, endorsed by, or sponsored by Notion Labs, Inc. \"Notion\" is a "
            + "trademark of Notion Labs, Inc."
        ]
    },
    {
        heading: "3. Eligibility and Accounts",
        id: "eligibility",
        paragraphs: [
            "You must be at least 13 years old to use Notivex. If you are between 13 "
            + "and 18 years old, you may only use the App with the involvement and "
            + "consent of a parent or legal guardian, who agrees to be bound by these "
            + "Terms on your behalf.",
            "To use Notivex, you must connect a Notion account in good standing. You "
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
            "Notivex connects to your Notion workspace using Notion's official OAuth "
            + "authorization flow. The token exchange happens server-side through a "
            + "Supabase Edge Function we operate — the App itself never receives, "
            + "transmits, or stores your Notion password or any other Notion account "
            + "credentials.",
            "Notivex uses Supabase, a third-party backend provider, for "
            + "authentication, session management, and the infrastructure that runs "
            + "this OAuth exchange. Your use of Notivex is also subject to Notion's "
            + "and Supabase's own terms of service and privacy policies for any data "
            + "those platforms process on our behalf, and we are not responsible for "
            + "their acts or omissions.",
            "We may add, change, or discontinue integrations with Notion, Supabase, "
            + "or other third-party services at any time, including in response to "
            + "changes those providers make to their own APIs, pricing, or policies."
        ]
    },
    {
        heading: "5. Advertising",
        id: "advertising",
        paragraphs: [
            "Notivex is offered free of charge and is supported by advertising served "
            + "through Google AdMob, a mobile advertising service operated by Google. "
            + "AdMob and its partners may collect and use device and advertising "
            + "identifiers, and other information, to serve and measure ads, in "
            + "accordance with Google's own policies.",
            "You can review and adjust your ad-personalization and tracking "
            + "preferences through your device's operating system settings. We do not "
            + "control the specific ads AdMob serves and are not responsible for the "
            + "content of third-party advertisements shown within the App."
        ]
    },
    {
        heading: "6. User Content and Data Ownership",
        id: "user-content",
        paragraphs: [
            "You retain full ownership of the content and pages you create in Notion "
            + "through the App. Notivex acts only as a capture tool: it transmits the "
            + "page data you submit directly to the Notion API on your behalf, and it "
            + "does not retain a long-term copy of that page content once it has been "
            + "created in Notion.",
            "You are solely responsible for the content you create through Notivex, "
            + "including ensuring that it complies with Notion's own content and "
            + "acceptable-use policies, and with any other legal obligations that "
            + "apply to you."
        ]
    },
    {
        heading: "7. Acceptable Use",
        id: "acceptable-use",
        paragraphs: [
            "You agree not to use Notivex to: violate any applicable law or "
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
        heading: "8. Intellectual Property",
        id: "intellectual-property",
        paragraphs: [
            "The Notivex name, logo, and the App's design, look, and feel are the "
            + "property of Gage Sorrell. Except for the limited license to use the "
            + "App as intended, these Terms do not grant you any rights to our "
            + "trademarks, logos, or other intellectual property.",
            "\"Notion\" and the Notion logo are trademarks of Notion Labs, Inc., "
            + "referenced here solely to describe Notivex's integration with Notion "
            + "and not to imply any endorsement, affiliation, or sponsorship."
        ]
    },
    {
        heading: "9. Termination",
        id: "termination",
        paragraphs: [
            "You may stop using Notivex and disconnect your Notion workspace at any "
            + "time from the App's account settings, and may delete the App from your "
            + "device at any time.",
            "We may suspend or terminate your access to the App, without notice, if "
            + "we believe you have violated these Terms, if required to comply with "
            + "legal process, or if we discontinue the App. Sections of these Terms "
            + "that by their nature should survive termination — including User "
            + "Content and Data Ownership, Disclaimers, Limitation of Liability, "
            + "Indemnification, and Governing Law — will survive."
        ]
    },
    {
        heading: "10. Disclaimers and Warranties",
        id: "disclaimers",
        paragraphs: [
            "Notivex is provided \"as is\" and \"as available,\" without warranties "
            + "of any kind, whether express, implied, or statutory, including implied "
            + "warranties of merchantability, fitness for a particular purpose, "
            + "title, and non-infringement.",
            "We do not warrant that the App will be uninterrupted, timely, secure, "
            + "or error-free, that any content submitted through the App will reach "
            + "Notion successfully in every case, or that the App will continue to "
            + "function if Notion, Supabase, or Google AdMob change or discontinue "
            + "the services Notivex relies on."
        ]
    },
    {
        heading: "11. Limitation of Liability",
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
            + "Terms or the App will not exceed fifty U.S. dollars ($50), since the "
            + "App is provided to you free of charge."
        ]
    },
    {
        heading: "12. Indemnification",
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
        heading: "13. Changes to These Terms",
        id: "changes",
        paragraphs: [
            "We may revise these Terms at any time. Material changes will be "
            + "reflected by an updated effective date at the top of this page, and "
            + "where practical, we will provide additional notice within the App. "
            + "Your continued use of Notivex after a revision takes effect means you "
            + "accept the updated Terms."
        ]
    },
    {
        heading: "14. Governing Law",
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
        heading: "15. Severability",
        id: "severability",
        paragraphs: [
            "If any provision of these Terms is found to be unenforceable or invalid "
            + "under applicable law, that provision will be limited or eliminated to "
            + "the minimum extent necessary, and the remaining provisions will remain "
            + "in full force and effect."
        ]
    },
    {
        heading: "16. Entire Agreement",
        id: "entire-agreement",
        paragraphs: [
            "These Terms, together with our Privacy Policy, constitute the entire "
            + "agreement between you and Gage Sorrell regarding your use of Notivex, "
            + "and supersede any prior agreements between you and us regarding the "
            + "App."
        ]
    },
    {
        heading: "17. Contact",
        id: "contact",
        paragraphs: [
            "Questions about these Terms can be sent to gage@sorrell.sh, or filed as "
            + "an issue on the project's GitHub repository."
        ]
    }
];
