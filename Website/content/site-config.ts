/**
 * Site-wide constants: naming, canonical URLs, and navigation. Kept as
 * plain typed data (no CMS) so copy stays trivial to edit.
 *
 * @file      site-config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * Canonical site identity used in page metadata, the navbar, and
       * the footer.
       */
const siteConfig = {
    canonicalUrl: "https://noteferry.sorrell.sh",
    contactEmail: "gage@sorrell.sh",
    description:
        "NoteFerry turns your phone into a fast capture tool for your Notion "
        + "databases. Sign in with Notion, pick a destination, and add a "
        + "new page in seconds.",
    githubIssuesUrl: "https://github.com/GageSorrell/NoteFerry/issues",
    name: "NoteFerry",
    tagline: "Your notes, faster."
};

/**
 * A single top-level navigation link.
 */
export interface NavLink
{
    /** The visible label. */
    readonly label: string;

    /** The route it links to. */
    readonly href: string;
}

export/** Links shown in both the navbar and the footer. */
const navLinks: ReadonlyArray<NavLink> = [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" }
];

export/**
       * App Store / Play Store destination URLs. NoteFerry has not shipped
       * to either store yet, so both are placeholders — replace with the
       * real listing URLs once the app is published.
       */
const storeUrls = {
    // TODO: replace once published to the App Store.
    appStore: "#",
    // TODO: replace once published to the Google Play Store.
    playStore: "#"
};
