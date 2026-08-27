/**
 * Diffs every translation namespace in `es-419`/`ko`/`ja`/`de` against the
 * `en-US` source of truth and reports any missing or extra key. Runnable
 * directly (`npm run i18n:check`, non-zero exit on mismatch) or required as a
 * module from `i18n-key-parity.test.ts` so `npm test` catches drift too.
 *
 * @file      check-i18n-keys.js
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ResourcesDirectory = path.join(__dirname, "..", "Source", "Domain", "Localization", "Resources");
const SourceLocale = "en-US";
const TargetLocales = [ "es-419", "ko", "ja", "de" ];
const Namespaces = [
    "common",
    "settings",
    "onboarding",
    "subscription",
    "pageCreation",
    "feedback",
    "component",
    "errors",
    "home"
];

/** Flattens a nested translation object into dotted key paths, e.g. `{ a: { b: 1 } }` -> `[ "a.b" ]`. */
const FlattenKeys = (Value, Prefix = "") =>
{
    if (typeof Value !== "object" || Value === null || Array.isArray(Value))
    {
        return [ Prefix ];
    }

    return Object.keys(Value).flatMap((Key) => FlattenKeys(Value[ Key ], Prefix ? `${ Prefix }.${ Key }` : Key));
};

/** Reads and flattens one namespace file. */
const ReadKeys = (Locale, Namespace) =>
{
    const FilePath = path.join(ResourcesDirectory, Locale, `${ Namespace }.json`);
    const Contents = JSON.parse(fs.readFileSync(FilePath, "utf8"));

    return new Set(FlattenKeys(Contents).filter((Key) => Key.length > 0));
};

/**
 * Compares every namespace × target-locale pair against `en-US`. Returns one
 * entry per mismatch found (empty array means everything is in parity).
 */
const FindKeyMismatches = () =>
{
    const Mismatches = [ ];

    for (const Namespace of Namespaces)
    {
        const SourceKeys = ReadKeys(SourceLocale, Namespace);

        for (const Locale of TargetLocales)
        {
            const TargetKeys = ReadKeys(Locale, Namespace);
            const Missing = [ ...SourceKeys ].filter((Key) => !TargetKeys.has(Key));
            const Extra = [ ...TargetKeys ].filter((Key) => !SourceKeys.has(Key));

            if (Missing.length > 0 || Extra.length > 0)
            {
                Mismatches.push({ Extra, Locale, Missing, Namespace });
            }
        }
    }

    return Mismatches;
};

const Main = () =>
{
    const Mismatches = FindKeyMismatches();

    for (const Mismatch of Mismatches)
    {
        console.error(`\n[${ Mismatch.Namespace }] ${ Mismatch.Locale } is out of sync with ${ SourceLocale }:`);

        if (Mismatch.Missing.length > 0)
        {
            console.error(`  Missing: ${ Mismatch.Missing.join(", ") }`);
        }

        if (Mismatch.Extra.length > 0)
        {
            console.error(`  Extra:   ${ Mismatch.Extra.join(", ") }`);
        }
    }

    if (Mismatches.length > 0)
    {
        process.exit(1);
    }

    console.log("i18n key parity OK — all locales match en-US across every namespace.");
};

module.exports = { FindKeyMismatches };

if (require.main === module)
{
    Main();
}
