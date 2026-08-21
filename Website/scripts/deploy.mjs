#!/usr/bin/env node
/**
 * Builds and deploys the website to Vercel production, run via
 * `npm run deploy` from this workspace (or `npm run deploy
 * --workspace=Website` from the repo root).
 *
 * Wraps three steps that can't just be a `vercel deploy` one-liner:
 *
 * 1. `vercel build --prod` — run from the repo root, since this project's
 *    local `.vercel` link lives there (Root Directory is a server-side
 *    project setting resolved relative to the repo root, not wherever
 *    `.vercel` happens to be linked from — linking it inside `Website/`
 *    directly causes Vercel to resolve `Website/Website` and fail).
 *
 * 2. Dereferencing symlinks in `.vercel/output/functions` — Next.js
 *    dedupes byte-identical function bundles (e.g. a route's RSC segment
 *    output when it's identical to the page's own) with symlinks, and
 *    `vercel deploy --prebuilt` has been observed to drop at least one of
 *    these during upload, producing a server-side
 *    `ENOENT: .../__PAGE__.segment.rsc.func` at deploy time. Replacing
 *    each symlink with a real copy of its target sidesteps that
 *    entirely, at the cost of a few extra MB in the output.
 *
 * 3. `vercel deploy --prebuilt --prod` — uploads the already-built
 *    `.vercel/output` (a few MB) instead of the full monorepo source
 *    tree, which includes ~1.5 GB of unrelated native app projects
 *    (`Application/`) that a source-upload deploy would otherwise
 *    include; there's no way to `.vercelignore` those away since the
 *    root `package.json` still lists them as npm workspaces.
 *
 * @file      deploy.mjs
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { spawnSync } from "node:child_process";
import { cpSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(websiteDir, "..");
const outputDir = join(repoRoot, ".vercel", "output");

/** Runs a command, streaming output, and exits the process if it fails. */
function run(command, args)
{
    const commandLine = `${ command } ${ args.join(" ") }`;
    console.log(`\n$ ${ commandLine }`);

    // `shell: true` is needed on Windows to resolve the npm-global `.cmd`
    // shim (spawning it directly without a shell fails with EINVAL). Folding
    // the whole invocation into one string, rather than passing `args` as
    // a separate array alongside `shell: true`, avoids Node's array-args
    // shell-escaping deprecation warning — safe here since every argument
    // is a hardcoded literal, never user input.
    const result = spawnSync(commandLine, [], { cwd: repoRoot, shell: true, stdio: "inherit" });

    if (result.status !== 0)
    {
        console.error(`\n"${ commandLine }" failed (exit ${ result.status }).`);
        process.exit(result.status ?? 1);
    }
}

/**
 * Recursively replaces every symlink under `dir` with a real copy of
 * whatever it resolves to. See the file header for why this is needed.
 */
function dereferenceSymlinks(dir)
{
    let count = 0;

    for (const entry of readdirSync(dir, { withFileTypes: true }))
    {
        const entryPath = join(dir, entry.name);

        if (entry.isSymbolicLink())
        {
            const target = realpathSync(entryPath);

            if (target === entryPath)
            {
                console.warn(`Skipping self-referential symlink: ${ entryPath }`);
                continue;
            }

            rmSync(entryPath, { force: true, recursive: true });
            cpSync(target, entryPath, { recursive: true });
            count++;
        }
        else if (entry.isDirectory())
        {
            count += dereferenceSymlinks(entryPath);
        }
    }

    return count;
}

run("vercel", [ "build", "--prod" ]);

const functionsDir = join(outputDir, "functions");
console.log(`\nDereferencing symlinks in ${ functionsDir }...`);
const dereferenced = dereferenceSymlinks(functionsDir);
console.log(`Dereferenced ${ dereferenced } symlink(s).`);

run("vercel", [ "deploy", "--prebuilt", "--prod" ]);

console.log("\nDeployed.");
