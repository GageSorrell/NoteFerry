/**
 * `rnw-dev-processes` — lists and kills this repo's React Native Windows dev
 * processes: the Metro packager that `Application/Windows`'s VS Code
 * debug/attach flow spawns, the same kind of stuck/stale process that had to
 * be hunted down and killed by hand more than once while getting RNW
 * debugging working in this monorepo (see `Script/PatchReactNativeTools` and
 * `Application/Windows/README.md`).
 *
 * @module @noteferry/rnw-dev-processes
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as ProcessManager from "./ProcessManager.js";
import { Argument, Command } from "effect/unstable/cli";
import { Console, Effect } from "effect";
import { NodeRuntime, NodeServices } from "@effect/platform-node";

const RnwDevProcessesCommand = Command.make("rnw-dev-processes").pipe(
    Command.withDescription(
        "Lists and kills this repo's React Native Windows dev processes — the Metro " +
        "packager, MSBuild, and the deployed app itself, all spawned by building and " +
        "running Application/Windows."
    )
);

/** "M/DD HH:MM am/pm", in local time — e.g. "9/07 07:05 am". */
const FormatStartedAt = (StartedAt: Date): string =>
{
    const Month = StartedAt.getMonth() + 1;
    const Day = String(StartedAt.getDate()).padStart(2, "0");
    const Meridiem = StartedAt.getHours() >= 12 ? "pm" : "am";
    const Hour12 = StartedAt.getHours() % 12 === 0 ? 12 : StartedAt.getHours() % 12;
    const Hour = String(Hour12).padStart(2, "0");
    const Minute = String(StartedAt.getMinutes()).padStart(2, "0");

    return `${Month}/${Day} ${Hour}:${Minute} ${Meridiem}`;
};

/** Right-pads every cell to its column's widest cell, for aligned plain-text table output. */
const FormatTable = (Rows: ReadonlyArray<ReadonlyArray<string>>): ReadonlyArray<string> =>
{
    const [Header] = Rows;
    if (!Header)
    {
        return [];
    }

    const Widths = Header.map((_, ColumnIndex) =>
        Math.max(...Rows.map((Row) => Row[ColumnIndex]?.length ?? 0)));

    return Rows.map((Row) =>
        Row.map((Cell, ColumnIndex) => Cell.padEnd(Widths[ColumnIndex] ?? 0)).join("  ").trimEnd());
};

const LsCommand = Command.make(
    "ls",
    {},
    Effect.fn(function* ()
    {
        const Running = yield* ProcessManager.List();

        if (Running.length === 0)
        {
            yield* Console.log("No RNW dev processes running.");
            return;
        }

        const Table = FormatTable([
            ["PID", "STARTED", "TYPE"],
            ...Running.map((Process) => [
                String(Process.Pid),
                FormatStartedAt(Process.StartedAt),
                Process.Type
            ])
        ]);

        for (const Line of Table)
        {
            yield* Console.log(Line);
        }
    })
).pipe(
    Command.withDescription(
        "Lists every running RNW dev process: Metro, MSBuild, and the deployed app."
    ),
    Command.withExamples([
        {
            command: "rnw-dev-processes ls",
            description: "List every running RNW dev process."
        },
        {
            command: "npm run rnw:ls",
            description: "The same thing, via the npm script."
        }
    ])
);

const PidArgument = Argument.integer("pid").pipe(
    Argument.withDescription(
        "The process ID to kill, from `ls`. When invoked via `npm run rnw:kill`, pass it " +
        "after `--` (e.g. `npm run rnw:kill -- 12345`) so npm forwards it through instead " +
        "of consuming it itself; running the built CLI directly needs no `--`."
    )
);

const KillCommand = Command.make(
    "kill",
    { Pid: PidArgument },
    Effect.fn(function* ({ Pid }: { Pid: number })
    {
        yield* ProcessManager.Kill(Pid);
        yield* Console.log(`Killed RNW dev process ${Pid}.`);
    })
).pipe(
    Command.withDescription(
        "Kills a single RNW dev process by PID, refusing if that PID isn't a running RNW " +
        "dev process."
    ),
    Command.withExamples([
        {
            command: "rnw-dev-processes kill 12345",
            description: "Kill the RNW dev process with PID 12345."
        },
        {
            command: "npm run rnw:kill -- 12345",
            description: "The same thing, via the npm script — note the `--` before the PID."
        }
    ])
);

const KillAllCommand = Command.make(
    "kill-all",
    {},
    Effect.fn(function* ()
    {
        const Count = yield* ProcessManager.KillAll();

        yield* Console.log(
            Count === 0
                ? "No RNW dev processes running."
                : `Killed ${Count} RNW dev process${Count === 1 ? "" : "es"}.`
        );
    })
).pipe(
    Command.withDescription("Kills every running RNW dev process."),
    Command.withExamples([
        {
            command: "rnw-dev-processes kill-all",
            description: "Kill every running RNW dev process."
        },
        {
            command: "npm run rnw:kill-all",
            description: "The same thing, via the npm script."
        }
    ])
);

RnwDevProcessesCommand.pipe(
    Command.withSubcommands([LsCommand, KillCommand, KillAllCommand]),
    Command.run({ version: "1.0.0" }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
