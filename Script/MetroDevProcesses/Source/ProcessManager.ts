/**
 * Finds, lists, and kills the Metro/Expo dev server processes that
 * `Application/Mobile`'s `npm run dev` (and its siblings — `dev:clean`,
 * `android`, `ios`, `storybook`, `storybook:ios`, `storybook:android`, all
 * of which are `expo start ...` variants) spawn.
 *
 * Confirmed empirically (not guessed) against a real running instance: its
 * `Win32_Process.CommandLine` looks like
 * `"node"   "E:\NoteFerry\node_modules\.bin\..\expo\bin\cli" start --dev-client`
 * — note it does NOT contain "Application\Mobile" anywhere (`expo` resolves
 * from the hoisted root `node_modules`, per npm workspaces), which is why
 * this classifies by the repo root path instead, the way
 * `@noteferry/rnw-dev-processes` classifies its own Metro by
 * `Application\Windows` — same idea, different anchor path because the two
 * process trees genuinely look different on this repo.
 *
 * Scoped to this repo specifically (by command line), so this never touches
 * an unrelated project's Metro/Expo server running on the same machine.
 *
 * @module @noteferry/metro-dev-processes/ProcessManager
 *
 * @file      ProcessManager.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Effect } from "effect";
import { CliError } from "effect/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** A detected Metro/Expo dev server process. */
export interface MetroProcess
{
    readonly Pid: number;
    readonly CommandLine: string;
    readonly StartedAt: Date;
}

interface RawProcess
{
    readonly ProcessId: number;
    readonly Name: string;
    readonly CommandLine: string | null;
    /** WMI's legacy `/Date(<epoch-ms>)/` wire format, as returned by PowerShell's ConvertTo-Json. */
    readonly CreationDate: string | null;
}

// Source/ProcessManager.ts -> repo root, resolved from this file's own
// location rather than process.cwd(), so it works the same no matter where
// this CLI is invoked from (built entry point, `npm run start`, or the npm
// scripts at the repo root).
const ScriptDir = dirname(fileURLToPath(import.meta.url));
const RepoRoot = resolve(ScriptDir, "..", "..", "..");
const RepoRootLower = RepoRoot.toLowerCase();

const RequireWindows = Effect.fn("ProcessManager.RequireWindows")(function* ()
{
    if (process.platform !== "win32")
    {
        return yield* new CliError.UserError({
            cause: new Error(`Unsupported platform: ${process.platform}`),
            userMessage: "metro-dev-processes only supports Windows (it shells out to powershell.exe and taskkill)."
        });
    }
});

/** WMI's `/Date(<epoch-ms>)/` wire format -> a real Date, or undefined if unparsable. */
const ParseWmiDate = (Wire: string | null): Date | undefined =>
{
    const Match = Wire?.match(/^\/Date\((\d+)\)\/$/);

    return Match ? new Date(Number(Match[1])) : undefined;
};

/** Whether a raw `node.exe` process is this repo's Mobile-app Metro/Expo dev server. */
const IsMetroProcess = (Raw: RawProcess): boolean =>
{
    if (Raw.Name.toLowerCase() !== "node.exe")
    {
        return false;
    }

    const CommandLineLower = Raw.CommandLine?.toLowerCase() ?? "";

    return CommandLineLower.includes(RepoRootLower)
        && CommandLineLower.includes("expo")
        && /\bstart\b/.test(CommandLineLower);
};

/** Lists every running Metro/Expo dev server process for this repo's Mobile app. */
export const List = Effect.fn("ProcessManager.List")(function* ()
{
    yield* RequireWindows();

    const Spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const Output = yield* Spawner.string(
        ChildProcess.make("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | " +
            "Select-Object ProcessId, Name, CommandLine, CreationDate) | " +
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

    return Raw.filter(IsMetroProcess).map((Process): MetroProcess => ({
        Pid: Process.ProcessId,
        CommandLine: Process.CommandLine ?? "",
        StartedAt: ParseWmiDate(Process.CreationDate) ?? new Date(0)
    }));
});

/** Kills one Metro/Expo dev server process by PID, after confirming it's actually one of ours. */
export const Kill = Effect.fn("ProcessManager.Kill")(function* (Pid: number)
{
    yield* RequireWindows();

    const Running = yield* List();
    const Match = Running.find((Process) => Process.Pid === Pid);

    if (!Match)
    {
        return yield* new CliError.UserError({
            cause: new Error(`PID ${Pid} is not a running Metro/Expo dev server for this repo.`),
            userMessage: `PID ${Pid} is not a running Metro/Expo dev server for this repo. Run "ls" to see what's running.`
        });
    }

    const Spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const ExitCode = yield* Spawner.exitCode(
        // /T also kills any child processes; /F forces the kill without prompting.
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

/** Kills every currently running Metro/Expo dev server process for this repo. Returns how many were killed. */
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
