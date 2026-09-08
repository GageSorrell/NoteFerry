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
    githubRepoUrl: "https://github.com/GageSorrell/NoteFerry",
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
    { href: "/privacy", label: "Privacy" },
    { href: "/delete-account", label: "Delete Account" }
];

export/**
       * Destination URLs for every store NoteFerry targets. NoteFerry has
       * not shipped to any of them yet, so all four are `"#"`
       * placeholders — replace each with its real listing URL once that
       * build is published. {@link Platforms} (the landing page's
       * platforms table) treats a `"#"` value as "coming soon"
       * automatically, so swapping a URL in here is the only change
       * needed to flip that row to "available".
       */
const storeUrls = {
    // TODO: replace once published to the App Store (iOS).
    appStore: "#",
    // TODO: replace once published to the Mac App Store.
    macAppStore: "#",
    // TODO: replace once published to the Microsoft Store.
    microsoftStore: "#",
    // TODO: replace once published to the Google Play Store.
    playStore: "#"
};
