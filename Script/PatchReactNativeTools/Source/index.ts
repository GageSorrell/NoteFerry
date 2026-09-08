/**
 * Works around two Windows-only problems that break RNW debugging via the
 * "React Native Tools" VS Code extension (msjsdiag.vscode-react-native) in
 * this monorepo. Both are idempotent, silent no-ops once fixed; see
 * `Application/Windows/README.md` for the user-facing explanation. Run
 * automatically (see `.vscode/tasks.json`, wired to `runOn: folderOpen` and
 * as a `preLaunchTask` on the RNW debug configs in `.vscode/launch.json`)
 * rather than being one-time fixes, since both get undone by things outside
 * this repo's control (an extension auto-update; an `npm install`).
 *
 * 1. `patchExtensionSpawnEinval` — the extension spawns `react-native.cmd`
 *    via `child_process.spawn()` without `{ shell: true }`. Since a Node.js
 *    security patch from April 2024 (CVE-2024-27980, see
 *    https://github.com/microsoft/vscode-react-native/issues/2180), spawning
 *    a .cmd/.bat file that way throws `spawn EINVAL` instead of working.
 *    Still present in 1.13.0 (the current latest release as of this
 *    writing) — there's no settings-only workaround, since the extension
 *    unconditionally appends `.cmd` to whatever command it runs on Windows.
 *    Patches the extension's bundled `dist/rn-extension.js` on disk, adding
 *    `shell: true` (Windows only) to the single low-level
 *    `ChildProcess.spawn()` wrapper all of its CLI-spawning code funnels
 *    through. Lives outside this repo (in
 *    `%USERPROFILE%\.vscode\extensions\...`) and is wiped out the next time
 *    VS Code auto-updates the extension into a fresh versioned folder — this
 *    requires reloading the VS Code window to take effect (the extension's
 *    JS is already loaded into the extension host's memory), so this step
 *    blocks (non-zero exit, native modal) when it just had to patch.
 *
 * 2. `ensureOpenPackageJunction` — before starting the packager itself, the
 *    extension also always runs a step that "monkey-patches" the `open` npm
 *    package (used by the React Native CLI to open URLs/browsers) so it can
 *    intercept that call. It finds `open` via a *hardcoded* path check —
 *    `<project>/node_modules/open/index.js` — with no fallback for hoisted
 *    monorepo dependencies. npm workspaces hoists `open` to this repo's root
 *    `node_modules` (nothing conflicts with it), so that hardcoded check
 *    fails and the extension throws `OpnPackagerLocationNotFound`. Creates a
 *    directory junction at `Application/Windows/node_modules/open` pointing
 *    at the real, hoisted copy at the repo root. Takes effect immediately —
 *    no VS Code reload needed — so this step never blocks the launch, just
 *    fixes it silently inline (unless `open` isn't installed anywhere at
 *    all, in which case it's a real `npm install` problem and does block).
 *
 * 3. `ensureReactDevToolsSettingsManagerStub` — this react-native version's
 *    `Libraries/Core/setUpReactDevTools.js` (only reached in dev builds)
 *    unconditionally requires
 *    `src/private/devsupport/rndevtools/ReactDevToolsSettingsManager`, which
 *    only ships `.ios.js`/`.android.js` variants upstream — no generic/
 *    Windows fallback — so Metro fails with "Unable to resolve module" when
 *    bundling for windows. The `.ios.js` implementation only calls into
 *    react-native's cross-platform `Settings` module (which RNW does provide
 *    an implementation for), so it's safe to reuse verbatim as a
 *    platform-agnostic `ReactDevToolsSettingsManager.js`. Writes that file
 *    into `node_modules/react-native/...` if it's missing. Takes effect on
 *    the next bundle — no VS Code reload needed — so, like fix 2, this never
 *    blocks the launch.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXTENSION_ID = "msjsdiag.vscode-react-native";
const BUNDLE_RELATIVE_PATH = ["dist", "rn-extension.js"];

// The exact, unpatched fragment of the extension's minified `ChildProcess.spawn()`
// wrapper that every CLI-spawning code path (run-windows, packager start, etc.)
// funnels through.
const NEEDLE =
  "spawn(e,t=[],r={},n=!1){const o=this.childProcess.spawn(e,t,r),i=new Promise";

// The same fragment with the fix applied: force `shell: true` when spawning on
// Windows, leaving every other platform's behavior untouched.
const REPLACEMENT =
  'spawn(e,t=[],r={},n=!1){const o=this.childProcess.spawn(e,t,"win32"===process.platform?Object.assign({},r,{shell:!0}):r),i=new Promise';

// A fragment unique to the applied patch, used to detect "already patched"
// idempotently without re-deriving it from NEEDLE/REPLACEMENT.
const MARKER = '"win32"===process.platform?Object.assign({},r,{shell:!0}):r';

interface InstalledExtensionEntry {
  identifier?: { id?: string };
  relativeLocation?: string;
}

function findInstalledExtensionDir(): string | undefined {
  const extensionsDir = join(homedir(), ".vscode", "extensions");
  const manifestPath = join(extensionsDir, "extensions.json");

  if (!existsSync(manifestPath)) {
    return undefined;
  }

  let entries: InstalledExtensionEntry[];
  try {
    entries = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return undefined;
  }

  const entry = entries.find(
    (candidate) => candidate.identifier?.id?.toLowerCase() === EXTENSION_ID
  );

  if (!entry?.relativeLocation) {
    return undefined;
  }

  return join(extensionsDir, entry.relativeLocation);
}

function showNativeModal(title: string, body: string): void {
  // A literal PowerShell here-string (`@' ... '@`) avoids needing to escape
  // quotes/special characters in `body`; it must not itself contain a line
  // consisting of just `'@`, which none of our messages do.
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(@'
${body}
'@, '${title}', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
`;

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
      stdio: "ignore",
    });
  } catch (error) {
    console.warn(`Could not show native modal: ${(error as Error).message}`);
  }
}

/**
 * Fix 1: patch the extension's bundled JS so it spawns react-native.cmd with
 * `shell: true` on Windows. Sets `process.exitCode = 1` (blocking the debug
 * launch via preLaunchTask) whenever it just had to change something, since
 * that requires a VS Code window reload to take effect.
 */
function patchExtensionSpawnEinval(): void {
  const extensionDir = findInstalledExtensionDir();
  if (!extensionDir) {
    // Extension isn't installed on this machine — nothing to do. Don't
    // bother developers who never installed it (e.g. Expo/Mac-only work).
    return;
  }

  const bundlePath = join(extensionDir, ...BUNDLE_RELATIVE_PATH);
  if (!existsSync(bundlePath)) {
    console.warn(
      `React Native Tools extension found at ${extensionDir}, but its bundle is missing at ${bundlePath}. Skipping.`
    );
    return;
  }

  const content = readFileSync(bundlePath, "utf8");

  if (content.includes(MARKER)) {
    console.log("React Native Tools extension: already patched for spawn EINVAL. OK.");
    return;
  }

  if (content.includes(NEEDLE)) {
    const backupPath = `${bundlePath}.orig-backup`;
    if (!existsSync(backupPath)) {
      copyFileSync(bundlePath, backupPath);
    }

    const patched = content.replace(NEEDLE, REPLACEMENT);
    writeFileSync(bundlePath, patched, "utf8");

    const message =
      "The React Native Tools VS Code extension was just patched to fix a " +
      "Windows-only \"spawn EINVAL\" bug (Node.js CVE-2024-27980) that " +
      "breaks Run Windows / Attach to packager.\n\n" +
      "Reload the VS Code window now (Ctrl+Shift+P -> \"Developer: Reload " +
      "Window\"), then try again.";

    console.log("React Native Tools extension: patched. Reload the VS Code window before retrying.");
    showNativeModal("NoteFerry — React Native Tools patched", message);
    process.exitCode = 1;
    return;
  }

  // Neither the patched marker nor the expected unpatched fragment was
  // found: a newer extension release likely restructured this code, and
  // it's not safe to guess at a replacement. Surface this loudly rather
  // than silently doing nothing (which would leave the bug unfixed) or
  // guessing (which could corrupt the file).
  const message =
    "The React Native Tools VS Code extension could not be automatically " +
    "patched for the Windows \"spawn EINVAL\" bug: its bundled code no " +
    "longer matches what Script/PatchReactNativeTools expects (the " +
    "extension was probably updated). This needs manual review — see " +
    "Script/PatchReactNativeTools/Source/index.ts.";

  console.error(
    `React Native Tools extension: could not locate the patch target in ${bundlePath}. Manual review needed.`
  );
  showNativeModal("NoteFerry — React Native Tools patch failed", message);
  process.exitCode = 1;
}

/**
 * Fix 2: ensure `Application/Windows/node_modules/open` resolves, by
 * junctioning it to the hoisted root copy if needed. Takes effect
 * immediately (no VS Code reload needed), so this never blocks the launch —
 * except if `open` isn't installed anywhere at all, which is a real
 * `npm install` problem the launch would fail on regardless.
 */
function ensureOpenPackageJunction(repoRoot: string): void {
  const appWindowsNodeModules = resolve(repoRoot, "Application", "Windows", "node_modules");
  const openDir = join(appWindowsNodeModules, "open");
  const openIndexPath = join(openDir, "index.js");

  if (existsSync(openIndexPath)) {
    console.log("Application/Windows node_modules/open: already resolvable. OK.");
    return;
  }

  const hoistedOpenIndexPath = join(repoRoot, "node_modules", "open", "index.js");
  if (!existsSync(hoistedOpenIndexPath)) {
    const message =
      "The \"open\" npm package (needed by the React Native Tools VS Code " +
      "extension to start the packager) isn't installed anywhere in this " +
      "monorepo. Run `npm install` from the repo root, then try again.";

    console.error(
      "open package not found in Application/Windows/node_modules or the hoisted root node_modules. Run npm install."
    );
    showNativeModal("NoteFerry — open package missing", message);
    process.exitCode = 1;
    return;
  }

  // Something's at openDir but doesn't resolve to a working index.js — only
  // remove it if it's a link/junction we can safely recreate. Never delete
  // a real directory; that could be a legitimate (if broken) npm install.
  if (existsSync(openDir)) {
    if (!lstatSync(openDir).isSymbolicLink()) {
      console.warn(
        `${openDir} exists but doesn't contain a working index.js, and isn't a junction this script created. Leaving it alone — try npm install.`
      );
      return;
    }
    rmSync(openDir, { force: true });
  }

  mkdirSync(appWindowsNodeModules, { recursive: true });
  symlinkSync(resolve(repoRoot, "node_modules", "open"), openDir, "junction");

  if (existsSync(openIndexPath)) {
    console.log("Application/Windows node_modules/open: junctioned to the hoisted root copy. OK.");
  } else {
    console.warn(`Created a junction at ${openDir}, but ${openIndexPath} still doesn't resolve.`);
  }
}

// Verbatim copy of react-native's own
// src/private/devsupport/rndevtools/ReactDevToolsSettingsManager.ios.js — it
// only calls into the cross-platform `Settings` module, so it's safe to use
// as-is as the generic (no platform suffix) fallback that RNW needs but
// upstream doesn't ship.
const REACT_DEV_TOOLS_SETTINGS_MANAGER_STUB = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 *
 * Generic (no platform suffix) fallback for Windows/macOS, added by
 * Script/PatchReactNativeTools since upstream only ships .ios.js/.android.js
 * variants of this file. Verbatim copy of ReactDevToolsSettingsManager.ios.js
 * — it only calls into the cross-platform Settings module, so it's safe to
 * reuse as-is.
 */

import Settings from '../../../../Libraries/Settings/Settings';

const GLOBAL_HOOK_SETTINGS = 'ReactDevTools::HookSettings';

export function setGlobalHookSettings(settings: string) {
  Settings.set({
    [GLOBAL_HOOK_SETTINGS]: settings,
  });
}

export function getGlobalHookSettings(): ?string {
  const value = Settings.get(GLOBAL_HOOK_SETTINGS);
  if (typeof value === 'string') {
    return value;
  }
  return null;
}
`;

/**
 * Fix 3: write a generic ReactDevToolsSettingsManager.js fallback next to the
 * .ios.js/.android.js variants react-native ships, so Metro can resolve it
 * when bundling for windows. Takes effect on the next bundle — no VS Code
 * reload needed — so this never blocks the launch.
 */
function ensureReactDevToolsSettingsManagerStub(repoRoot: string): void {
  const rndevtoolsDir = resolve(
    repoRoot,
    "Application",
    "Windows",
    "node_modules",
    "react-native",
    "src",
    "private",
    "devsupport",
    "rndevtools"
  );
  const stubPath = join(rndevtoolsDir, "ReactDevToolsSettingsManager.js");

  if (existsSync(stubPath)) {
    console.log("react-native ReactDevToolsSettingsManager.js fallback: already present. OK.");
    return;
  }

  if (!existsSync(rndevtoolsDir)) {
    // This react-native version restructured things enough that our fixed
    // target directory doesn't exist. Not safe to guess at a new location.
    console.warn(
      `${rndevtoolsDir} doesn't exist — react-native's internal layout may have changed. Skipping the ReactDevToolsSettingsManager.js fallback; see Script/PatchReactNativeTools/Source/index.ts.`
    );
    return;
  }

  writeFileSync(stubPath, REACT_DEV_TOOLS_SETTINGS_MANAGER_STUB, "utf8");
  console.log("react-native ReactDevToolsSettingsManager.js fallback: created. OK.");
}

function main(): void {
  if (process.platform !== "win32") {
    // Both fixes, and this whole script, are Windows-only.
    return;
  }

  // Script/PatchReactNativeTools/Source/index.ts -> repo root, resolved from
  // this file's own location rather than process.cwd() so it works the same
  // whether invoked via the VS Code task (cwd = ${workspaceFolder}) or
  // manually via `npm run start -w @noteferry/patch-react-native-tools`
  // (cwd = this workspace's own folder).
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, "..", "..", "..");

  ensureOpenPackageJunction(repoRoot);
  ensureReactDevToolsSettingsManagerStub(repoRoot);
  patchExtensionSpawnEinval();
}

main();
