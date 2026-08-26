/**
 * Converts every SVG file in `Source/Scribble` into a sibling TSX module that
 * exports a `react-native-svg` component rendering the same drawing.
 *
 * The source SVGs express their fill via a `<defs><style>` block of CSS classes
 * (`.cls-1{fill:#231f20;}`), which `react-native-svg` does not support, so this
 * script resolves each `class="cls-N"` to an inline `fill` attribute and maps
 * the raw SVG tags (`svg`, `g`, `path`, `polygon`) to their RN-SVG components.
 * A `Source/Scribble/index.ts` barrel is regenerated to re-export every icon.
 *
 * Usage: `node Scripts/generate-scribble.mjs` (run from the Icons package root).
 *
 * @module @noteferry/icons/scripts/generate-scribble
 *
 * @file      generate-scribble.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ScriptDir  = dirname(fileURLToPath(import.meta.url));
const SourceDir  = resolve(ScriptDir, "..", "Source", "Scribble");
const Indent     = "    ";

/** RN-SVG component name for each supported SVG tag. */
const TagMap =
{
    svg:     "Svg",
    g:       "G",
    path:    "Path",
    polygon: "Polygon",
    rect:    "Rect",
    circle:  "Circle",
    ellipse: "Ellipse",
    line:    "Line",
    polyline: "Polyline",
};

/** SVG attributes that carry no meaning in RN-SVG and are dropped. */
const DropAttributes = new Set([ "xmlns", "id", "data-name", "style", "class" ]);

/**
 * The component name is the SVG's basename (extension removed), which is assumed
 * to already be a valid TypeScript identifier. A warning is emitted if it is not,
 * or if it does not start with an uppercase letter (required for JSX usage).
 */
const toComponentName = (fileName) =>
{
    const name = fileName.replace(/\.svg$/i, "");

    if (!/^[A-Za-z_$][\w$]*$/.test(name))
    {
        console.warn(`Warning: "${fileName}" is not a valid TypeScript identifier.`);
    }
    else if (!/^[A-Z]/.test(name))
    {
        console.warn(`Warning: "${name}" must start with an uppercase letter to work as a JSX component.`);
    }

    return name;
};

/** Parses a `<style>` block into a `{ "cls-1": "#231f20" }` fill map. */
const parseStyleMap = (svg) =>
{
    const map    = {};
    const styles = svg.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [];

    for (const block of styles)
    {
        const body = block.replace(/<\/?style[^>]*>/gi, "");
        const rule = /\.([\w-]+)\s*\{([^}]*)\}/g;
        let m;
        while ((m = rule.exec(body)) !== null)
        {
            const fill = m[2].match(/fill\s*:\s*([^;]+)/i);
            if (fill) map[m[1]] = fill[1].trim();
        }
    }

    return map;
};

/** kebab-case attribute name to camelCase (leaves `data-*` alone; those drop). */
const toCamel = (name) =>
    name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Parses an attribute-list string into `{ name, value }` pairs, preserving
 * source order.
 */
const parseAttributes = (raw) =>
{
    const attrs = [];
    const re    = /([\w:-]+)(?:\s*=\s*"([^"]*)")?/g;
    let m;
    while ((m = re.exec(raw)) !== null)
    {
        if (m[1]) attrs.push({ name: m[1], value: m[2] ?? "" });
    }
    return attrs;
};

/** Renders one element's attributes as a JSX attribute string. */
const renderAttributes = (attrs, styleMap) =>
{
    const parts = [];

    for (const { name, value } of attrs)
    {
        if (name === "class")
        {
            // Every fill is driven by the themeable `color` prop, so the whole
            // (monochrome) icon recolors as one. `styleMap[value]` is only
            // checked so unknown classes are dropped rather than left fill-less.
            if (styleMap[value]) parts.push("fill={color}");
            continue;
        }
        if (DropAttributes.has(name) || name.startsWith("xmlns")) continue;

        parts.push(`${toCamel(name)}="${value}"`);
    }

    return parts.length ? " " + parts.join(" ") : "";
};

/**
 * Transforms the SVG markup into indented RN-SVG JSX. `<defs>`, `<style>` and
 * `<title>` are stripped first (their fills are folded into `styleMap`).
 */
const toJsx = (svg, styleMap) =>
{
    const cleaned = svg
        .replace(/<defs[\s\S]*?<\/defs>/gi, "")
        .replace(/<title[\s\S]*?<\/title>/gi, "");

    const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*"[^"]*")?)*)\s*(\/?)\s*>/g;
    const lines = [];
    const used  = new Set();
    let depth   = 0;
    let m;

    while ((m = tagRe.exec(cleaned)) !== null)
    {
        const [ , closing, rawName, rawAttrs, selfClose ] = m;
        const name = TagMap[rawName.toLowerCase()];
        if (!name) continue; // Unknown/unsupported tag — skip it.

        used.add(name);

        if (closing)
        {
            depth = Math.max(0, depth - 1);
            lines.push(`${Indent.repeat(depth + 1)}</${name}>`);
            continue;
        }

        const attrs = renderAttributes(parseAttributes(rawAttrs), styleMap);
        const pad   = Indent.repeat(depth + 1);

        if (selfClose)
        {
            lines.push(`${pad}<${name}${attrs} />`);
        }
        else
        {
            lines.push(`${pad}<${name}${attrs}>`);
            depth += 1;
        }
    }

    return { jsx: lines.join("\n"), used };
};

/**
 * Orders imported component names so `Svg` (the root) comes first, then the
 * rest alphabetically — deterministic output regardless of tag order.
 */
const orderImports = (used) =>
    [ ...used ].sort();

/** Builds the full TSX module text for one icon. */
const renderModule = (componentName, jsx, used) => `/**
 * Auto-generated from "${componentName}" — do not edit by hand.
 * Regenerate with \`node Scripts/generate-scribble.mjs\`.
 *
 * @module @noteferry/icons/Scribble/${componentName}
 *
 * @file      ${componentName}.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable */

import { ${orderImports(used).join(", ")} } from "react-native-svg";
import type { JSX } from "react";
import type { NoteFerryIconProps } from "../Icon.Types";

export const ${componentName} = ({ color = "#231F20", ...Tail }: NoteFerryIconProps): JSX.Element =>
(
${jsx.replace(/^(\s*)<Svg([^>]*)>/, "$1<Svg$2 { ...Tail }>")}
);
`;

/** Regenerates the barrel that re-exports every generated icon. */
const renderBarrel = (names) => `/**
 * Barrel of every Scribble icon. Auto-generated — do not edit by hand.
 * Regenerate with \`node Scripts/generate-scribble.mjs\`.
 *
 * @module @noteferry/icons/Scribble
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

${names.map((n) => `export { ${n} } from "./${n}";`).join("\n")}
`;

const main = () =>
{
    const files = readdirSync(SourceDir)
        .filter((f) => f.toLowerCase().endsWith(".svg"))
        .sort((a, b) => a.localeCompare(b));

    const names = [];

    for (const file of files)
    {
        const svg           = readFileSync(join(SourceDir, file), "utf8");
        const name          = toComponentName(file);
        const styleMap      = parseStyleMap(svg);
        const { jsx, used } = toJsx(svg, styleMap);

        writeFileSync(join(SourceDir, `${name}.tsx`), renderModule(name, jsx, used), "utf8");
        names.push(name);
    }

    writeFileSync(join(SourceDir, "index.ts"), renderBarrel(names), "utf8");

    console.log(`Generated ${names.length} icon module(s) in ${SourceDir}`);
};

main();
