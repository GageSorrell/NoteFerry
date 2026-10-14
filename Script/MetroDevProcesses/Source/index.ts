/**
 * `metro-dev-processes` — lists and kills `Application/Mobile`'s Metro/Expo
 * dev server processes, the ones `npm run dev` (and its siblings —
 * `dev:clean`, `android`, `ios`, `storybook`, `storybook:ios`,
 * `storybook:android`) spawn and which otherwise have to be hunted down by
 * PID (or by whatever happens to be holding port 8081) by hand — the same
 * kind of stuck/stale-process problem `@noteferry/rnw-dev-processes` solves
 * for `Application/Windows`'s Metro.
 *
 * @module @noteferry/metro-dev-processes
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as ProcessManager from "./ProcessManager.js";
import { Argument, Command } from "effect/cli";
import { Console, Effect } from "effect";
import { NodeRuntime, NodeServices } from "@effect/platform-node";

const MetroDevProcessesCommand = Command.make("metro-dev-processes").pipe(
    Command.withDescription(
        "Lists and kills this repo's Application/Mobile Metro/Expo dev server processes — " +
        "the ones `npm run dev` and its siblings (dev:clean, android, ios, storybook, " +
        "storybook:ios, storybook:android) spawn."
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
            yield* Console.log("No Metro/Expo dev server processes running.");
            return;
        }

        const Table = FormatTable([
            ["PID", "STARTED"],
            ...Running.map((Process) => [String(Process.Pid), FormatStartedAt(Process.StartedAt)])
        ]);

        for (const Line of Table)
        {
            yield* Console.log(Line);
        }
    })
).pipe(
    Command.withDescription("Lists every running Metro/Expo dev server process for this repo's Mobile app."),
    Command.withExamples([
        {
            command: "metro-dev-processes ls",
            description: "List every running Metro/Expo dev server process."
        },
        {
            command: "npm run metro:ls",
            description: "The same thing, via the npm script."
        }
    ])
);

const PidArgument = Argument.Int("pid").pipe(
    Argument.withDescription(
        "The process ID to kill, from `ls`. When invoked via `npm run metro:kill`, pass it " +
        "after `--` (e.g. `npm run metro:kill -- 12345`) so npm forwards it through instead " +
        "of consuming it itself; running the built CLI directly needs no `--`."
    )
);

const KillCommand = Command.make(
    "kill",
    { Pid: PidArgument },
    Effect.fn(function* ({ Pid }: { Pid: number })
    {
        yield* ProcessManager.Kill(Pid);
        yield* Console.log(`Killed Metro/Expo dev server process ${Pid}.`);
    })
).pipe(
    Command.withDescription(
        "Kills a single Metro/Expo dev server process by PID, refusing if that PID isn't one " +
        "of this repo's."
    ),
    Command.withExamples([
        {
            command: "metro-dev-processes kill 12345",
            description: "Kill the Metro/Expo dev server process with PID 12345."
        },
        {
            command: "npm run metro:kill -- 12345",
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
                ? "No Metro/Expo dev server processes running."
                : `Killed ${Count} Metro/Expo dev server process${Count === 1 ? "" : "es"}.`
        );
    })
).pipe(
    Command.withDescription("Kills every running Metro/Expo dev server process for this repo's Mobile app."),
    Command.withExamples([
        {
            command: "metro-dev-processes kill-all",
            description: "Kill every running Metro/Expo dev server process."
        },
        {
            command: "npm run metro:kill-all",
            description: "The same thing, via the npm script."
        }
    ])
);

MetroDevProcessesCommand.pipe(
    Command.withSubcommands([LsCommand, KillCommand, KillAllCommand]),
    Command.run({ version: "1.0.0" }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
