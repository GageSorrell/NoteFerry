/**
 * Dev-only dummy-data generation for the quick-entry page form: lorem ipsum
 * for text-like properties, a random number, a checked checkbox, a random
 * Select/Status option, a random-sized random subset of MultiSelect
 * options, today for Date, and a bundled stock photo for Files. Relation and
 * People are left alone — Notivex's quick-entry form doesn't collect them at
 * all (`Domain.Destination.IsQuickEntryProperty` excludes both), so there's
 * no reachable value to generate one for.
 *
 * Only ever invoked from the "Fill with dummy data" dev-menu item
 * `create-page.tsx` registers while it has focus.
 *
 * @module notivex/features/page-creation/dummy-page-data
 *
 * @file      dummy-page-data.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import type { FileMediaValue } from "./file-media-property-field";
import { Asset } from "expo-asset";

const LoremWords: ReadonlyArray<string> = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
    "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
    "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
    "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
    "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
    "in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "eu",
    "fugiat", "nulla", "pariatur"
];

/** A random integer in `[Min, Max]`, inclusive of both ends. */
function RandomInt(Min: number, Max: number): number
{
    return Min + Math.floor(Math.random() * (Max - Min + 1));
}

/** One random element of `Items`, or `undefined` if it's empty. */
function PickRandom<Item>(Items: ReadonlyArray<Item>): Item | undefined
{
    return Items.length === 0 ? undefined : Items[Math.floor(Math.random() * Items.length)];
}

/** `Count` random, distinct elements of `Items` (order not preserved). */
function PickRandomSubset<Item>(Items: ReadonlyArray<Item>, Count: number): ReadonlyArray<Item>
{
    return [ ...Items ]
        .sort(() => Math.random() - 0.5)
        .slice(0, Count);
}

/** `WordCount` random lorem ipsum words, as one capitalized, punctuated sentence. */
function LoremIpsum(WordCount: number): string
{
    const Words = Array.from(
        { length: WordCount },
        () => PickRandom(LoremWords) ?? "lorem"
    );
    const Sentence = Words.join(" ");

    return `${ Sentence.charAt(0).toUpperCase() }${ Sentence.slice(1) }.`;
}

export/**
       * `SentenceCount` lorem ipsum sentences joined into one paragraph —
       * for the page body, which wants more than one property's worth of
       * text.
       *
       * @category Development
       * @since 1.0.0
       */
const GenerateLoremIpsumParagraph = (SentenceCount: number): string =>
    Array.from(
        { length: SentenceCount },
        () => LoremIpsum(RandomInt(6, 14))
    ).join(" ");

/* The require target is a static string literal, as Metro's bundler needs —
 * kept in sync with the actual file by hand. */
const StockPhotoModule = require("../../../Resource/DevTools/StockPhoto.jpg");

let StockPhotoUriPromise: Promise<string> | undefined;

/** Resolves the bundled stock photo to a real, loadable URI, once per session. */
function GetStockPhotoUri(): Promise<string>
{
    StockPhotoUriPromise ??= Asset.fromModule(StockPhotoModule)
        .downloadAsync()
        .then((StockAsset: Asset) => StockAsset.localUri ?? StockAsset.uri);

    return StockPhotoUriPromise;
}

export/**
       * The bundled stock photo as a `Files` property value, resolving its
       * on-device URI on first use.
       *
       * @category Development
       * @since 1.0.0
       */
const GetStockPhotoFileValue = async (): Promise<FileMediaValue> => ({
    MimeType: "image/jpeg",
    Name: "StockPhoto.jpg",
    Type: "Local",
    Uri: await GetStockPhotoUri()
});

/** A property's current dummy-fill-relevant value, as stored in `create-page.tsx`'s form state. */
export type DummyableValue =
    | boolean
    | Domain.Property.DatePropertyInput
    | FileMediaValue
    | string
    | ReadonlyArray<Domain.Id.NotionOptionId>;

export/**
       * Whether a property's current value counts as unfilled — mirrors
       * `create-page.tsx`'s own `IsDirty` check, so "empty" means the same
       * thing here as it does everywhere else in that form.
       *
       * @category Development
       * @since 1.0.0
       */
const IsFieldEmpty = (Value: DummyableValue | undefined): boolean =>
{
    if (Value === undefined)
    {
        return true;
    }

    if (typeof Value === "boolean")
    {
        return Value !== true;
    }

    if (typeof Value === "string")
    {
        return Value.trim() === "";
    }

    if (Array.isArray(Value))
    {
        return Value.length === 0;
    }

    /* A `DatePropertyInput` or `FileMediaValue` object — either one's mere
       presence means a value was chosen. */
    return false;
};

export/**
       * Generates a dummy value appropriate for one property's type, or
       * `undefined` when none can be generated (an option-based property
       * with no options defined, or a `Files` property when `StockPhoto`
       * wasn't resolved because none was needed).
       *
       * @category Development
       * @since 1.0.0
       */
const GenerateDummyValue = (
    Property: Domain.Property.PropertyDefinition,
    StockPhoto: FileMediaValue | undefined
): DummyableValue | undefined =>
{
    switch (Property.Type)
    {
        case "Title":
        case "RichText":
            return LoremIpsum(RandomInt(3, 8));
        case "Number":
            return String(RandomInt(0, 1000));
        case "Checkbox":
            return true;
        case "Date":
            return { Start: new Date(), Type: "Date" } as const;
        case "Select":
        case "Status":
            return PickRandom(Property.Options)?.Id;
        case "MultiSelect":
            return Property.Options.length === 0
                ? undefined
                : PickRandomSubset(
                    Property.Options,
                    RandomInt(1, Property.Options.length)
                ).map((Option: Domain.Property.PropertyOption) => Option.Id);
        case "Url":
            return "https://example.com/lorem-ipsum";
        case "Email":
            return "lorem.ipsum@example.com";
        case "PhoneNumber":
            return "+1 555 0100";
        case "Files":
            return StockPhoto;
        case "Relation":
        case "People":
        default:
            return undefined;
    }
};
