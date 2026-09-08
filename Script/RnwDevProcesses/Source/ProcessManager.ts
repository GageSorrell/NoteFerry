/**
 * Finds, lists, and kills the "RNW dev processes" that building and running
 * `Application/Windows` via the React Native Windows debug/attach flow spawns:
 *
 * - `Metro`      — the Node packager process (`react-native/cli.js start ...`).
 * - `MSBuild`     — MSBuild.exe processes building this repo's `windows/Windows.sln`.
 * - `NoteFerry.exe` — the deployed native app itself. (Its window title, from
 *   `app.json`, is "NoteFerryWin" — but the actual built binary, per
 *   `windows/Windows/Windows.vcxproj`'s `ProjectName`/`RootNamespace`, is
 *   `NoteFerry.exe`; confirmed against the real files under
 *   `windows/x64/Debug/` and `windows/Windows.Package/bin/`.)
 *
 * Every process is scoped to THIS repo specifically (by command line or
 * executable path), so this never touches an unrelated project's Metro
 * server, build, or app running on the same machine.
 *
 * @module @noteferry/rnw-dev-processes/ProcessManager
 *
 * @file      ProcessManager.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect } from "effect";
import { CliError } from "effect/unstable/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The kind of RNW dev process. */
export type RnwProcessType = "Metro" | "MSBuild" | "NoteFerry.exe";

/** A detected RNW dev process. */
export interface RnwProcess
{
    readonly Pid: number;
    readonly CommandLine: string;
    readonly StartedAt: Date;
    readonly Type: RnwProcessType;
}

interface RawProcess
{
    readonly ProcessId: number;
    readonly Name: string;
    readonly CommandLine: string | null;
    readonly ExecutablePath: string | null;
    /** WMI's legacy `/Date(<epoch-ms>)/` wire format, as returned by PowerShell's ConvertTo-Json. */
    readonly CreationDate: string | null;
}

// Source/ProcessManager.ts -> repo root, resolved from this file's own
// location rather than process.cwd(), so it works the same no matter where
// this CLI is invoked from (built entry point, `npm run start`, or the npm
// scripts at the repo root).
const ScriptDir = dirname(fileURLToPath(import.meta.url));
const RepoRoot = resolve(ScriptDir, "..", "..", "..");
const AppWindowsDir = resolve(RepoRoot, "Application", "Windows");
const AppWindowsDirLower = AppWindowsDir.toLowerCase();

const RequireWindows = Effect.fn("ProcessManager.RequireWindows")(function* ()
{
    if (process.platform !== "win32")
    {
        return yield* new CliError.UserError({
            cause: new Error(`Unsupported platform: ${process.platform}`),
            userMessage: "rnw-dev-processes only supports Windows — react-native-windows dev processes only exist there."
        });
    }
});

/** WMI's `/Date(<epoch-ms>)/` wire format -> a real Date, or undefined if unparsable. */
const ParseWmiDate = (Wire: string | null): Date | undefined =>
{
    const Match = Wire?.match(/^\/Date\((\d+)\)\/$/);

    return Match ? new Date(Number(Match[1])) : undefined;
};

/** Classifies a raw process into an RNW dev process type, or undefined if it isn't one. */
const ClassifyProcess = (Raw: RawProcess): RnwProcessType | undefined =>
{
    const CommandLineLower = Raw.CommandLine?.toLowerCase() ?? "";
    const ExecutablePathLower = Raw.ExecutablePath?.toLowerCase() ?? "";

    switch (Raw.Name.toLowerCase())
    {
        case "node.exe":
            // The Metro packager for THIS app: react-native's CLI, "start"ed,
            // with a command line under Application/Windows.
            return CommandLineLower.includes(AppWindowsDirLower)
                && CommandLineLower.includes("react-native")
                && CommandLineLower.includes("cli.js")
                && /\bstart\b/.test(CommandLineLower)
                ? "Metro"
                : undefined;

        case "msbuild.exe":
            // Any MSBuild process building something under Application/Windows
            // (windows/Windows.sln, its projects, or their dependents).
            return CommandLineLower.includes(AppWindowsDirLower) ? "MSBuild" : undefined;

        case "noteferry.exe":
            // The deployed native app itself. Scoped by its own executable
            // path (not just its name) so an unrelated NoteFerry.exe
            // elsewhere on the machine is never mistaken for this one.
            return ExecutablePathLower.includes(AppWindowsDirLower) ? "NoteFerry.exe" : undefined;

        default:
            return undefined;
    }
};

/** Lists every RNW dev process (Metro, MSBuild, or the deployed app) currently running. */
export const List = Effect.fn("ProcessManager.List")(function* ()
{
    yield* RequireWindows();

    const Spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const Output = yield* Spawner.string(
        ChildProcess.make("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "@(Get-CimInstance Win32_Process -Filter " +
            "\"Name='node.exe' OR Name='MSBuild.exe' OR Name='NoteFerry.exe'\" | " +
            "Select-Object ProcessId, Name, CommandLine, ExecutablePath, CreationDate) | " +
            // Wrapped in @(...) rather than relying on ConvertTo-Json's
            // -AsArray (not available on Windows PowerShell 5.1, only
            // pwsh 7+) so a single match still serializes as a one-element
            // array instead of a bare object.
            "ConvertTo-Json -Compress"
        ])
    ).pipe(
        Effect.mapError((Cause) => new CliError.UserError({
            cause: Cause,
            userMessage: "Could not list Windows processes (powershell.exe failed to run)."
        }))
    );

    const Raw = yield* Effect.try({
        try: () => JSON.parse(Output) as ReadonlyArray<RawProcess>,
        catch: (Cause) => new CliError.UserError({
            cause: Cause,
            userMessage: "Could not parse the process list powershell.exe returned."
        })
    });

    const Results: Array<RnwProcess> = [];

    for (const Process of Raw)
    {
        const Type = ClassifyProcess(Process);
        if (!Type)
        {
            continue;
        }

        Results.push({
            Pid: Process.ProcessId,
            CommandLine: Process.CommandLine ?? "",
            StartedAt: ParseWmiDate(Process.CreationDate) ?? new Date(0),
            Type
        });
    }

    return Results;
});

/** Kills one RNW dev process by PID, after confirming it's actually one of ours. */
export const Kill = Effect.fn("ProcessManager.Kill")(function* (Pid: number)
{
    yield* RequireWindows();

    const Running = yield* List();
    const Match = Running.find((Process) => Process.Pid === Pid);

    if (!Match)
    {
        return yield* new CliError.UserError({
            cause: new Error(`PID ${Pid} is not a running RNW dev process.`),
            userMessage: `PID ${Pid} is not a running RNW dev process. Run "ls" to see what's running.`
        });
    }

    const Spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const ExitCode = yield* Spawner.exitCode(
        // /T also kills any child processes; /F forces the kill without
        // prompting — the same combination the React Native Tools VS Code
        // extension itself uses to stop the packager.
        ChildProcess.make("taskkill", ["/PID", String(Pid), "/T", "/F"])
    ).pipe(
        Effect.mapError((Cause) => new CliError.UserError({
            cause: Cause,
            userMessage: `Could not run taskkill for PID ${Pid}.`
        }))
    );

    if (ExitCode !== ChildProcessSpawner.ExitCode(0))
    {
        return yield* new CliError.UserError({
            cause: new Error(`taskkill exited with code ${ExitCode} for PID ${Pid}.`),
            userMessage: `taskkill failed for PID ${Pid} (exit code ${ExitCode}). It may have already exited.`
        });
    }
});

/** Kills every currently running RNW dev process. Returns how many were killed. */
export const KillAll = Effect.fn("ProcessManager.KillAll")(function* ()
{
    yield* RequireWindows();

    const Running = yield* List();

    for (const Process of Running)
    {
        yield* Kill(Process.Pid);
    }

    return Running.length;
});
