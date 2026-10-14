/**
 * `avd-demo-mode` — toggles Android System UI demo mode on a running AVD: a
 * fixed 10:00 clock, a full non-charging battery, and full wifi, for clean
 * screenshots and recordings. Optionally hides the clock and notification
 * icons as well. Also scales UI animations and heads-up notifications to match.
 *
 * Runs the same commands as enabling demo mode by hand with
 * `Script/AvdDemoMode.ps1`, plus their inverse to disable it, plus the
 * animation-scale and heads-up-notification toggling that script didn't
 * cover.
 *
 * @module @noteferry/avd-demo-mode
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Adb from "./Adb.js";
import * as DemoMode from "./DemoMode.js";
import { CliError, Command, Flag } from "effect/cli";
import { Console, Effect, Option } from "effect";
import { NodeRuntime, NodeServices } from "@effect/platform-node";

const AvdFlag = Flag.String("avd").pipe(
    Flag.withAlias("a"),
    Flag.withMetavar("name-or-serial"),
    Flag.withDescription(
        "Target a specific AVD by name or adb serial (e.g. Pixel_6_API_34 or emulator-5554). " +
        "Only required when more than one AVD is running."
    ),
    Flag.optional
);

const EnableFlag = Flag.Boolean("enable").pipe(
    Flag.withDescription("Turn demo mode on. Cannot be combined with --disable.")
);

const DisableFlag = Flag.Boolean("disable").pipe(
    Flag.withDescription("Turn demo mode off. Cannot be combined with --enable.")
);

const HiddenFlag = Flag.Boolean("hidden").pipe(
    Flag.withDescription("Hide the clock and status bar notification icons while enabling demo mode. Requires --enable.")
);

/** Parsed flag values, exactly as `Command.make`'s handler receives them. */
interface ParsedFlags
{
    readonly Avd: Option.Option<string>;
    readonly Disable: boolean;
    readonly Enable: boolean;
    readonly Hidden: boolean;
}

/** Decides the demo-mode state a run should reach, honoring `--enable`/`--disable`, or toggling. */
const ResolveTargetState = Effect.fn("ResolveTargetState")(function* (
    Serial: string,
    Enable: boolean,
    Disable: boolean,
    Hidden: boolean
)
{
    if (Enable && Disable)
    {
        return yield* new CliError.UserError({
            cause: new Error("--enable and --disable were both given."),
            userMessage: "--enable and --disable cannot be used together."
        });
    }

    if (Hidden && !Enable)
    {
        return yield* new CliError.UserError({
            cause: new Error("--hidden was given without --enable."),
            userMessage: "--hidden requires --enable and cannot be used with --disable."
        });
    }

    if (Enable)
    {
        return "Enabled" as const;
    }

    if (Disable)
    {
        return "Disabled" as const;
    }

    const Current = yield* DemoMode.CurrentState(Serial);

    return Current === "Enabled" ? "Disabled" as const : "Enabled" as const;
});

const AvdDemoModeCommand = Command.make(
    "avd-demo-mode",
    {
        Avd: AvdFlag,
        Disable: DisableFlag,
        Enable: EnableFlag,
        Hidden: HiddenFlag
    },
    Effect.fn(function* ({ Avd, Disable, Enable, Hidden }: ParsedFlags)
    {
        const Target = yield* Adb.ResolveAvd(Avd);
        const Label = Option.match(Target.Name, {
            onNone: () => Target.Serial,
            onSome: (Name: string) => `${Name} (${Target.Serial})`
        });

        yield* Console.log(`Target AVD: ${Label}`);

        const State = yield* ResolveTargetState(Target.Serial, Enable, Disable, Hidden);

        yield* DemoMode.SetDemoMode(Target.Serial, State, Hidden);
    })
).pipe(
    Command.withDescription(
        "Toggles Android System UI demo mode on a running AVD: a fixed 10:00 clock, a full " +
        "non-charging battery, and full wifi, for clean screenshots and recordings. Use " +
        "--hidden with --enable to hide the clock and status bar notification icons. Also sets " +
        "animation scale to 0.5 and disables heads-up notifications while demo mode is on, " +
        "restoring both to normal when it's off."
    ),
    Command.withExamples([
        {
            command: "avd-demo-mode",
            description: "Toggle demo mode on the sole running AVD."
        },
        {
            command: "avd-demo-mode --enable",
            description: "Turn demo mode on, even if it's already on."
        },
        {
            command: "avd-demo-mode --enable --hidden",
            description: "Turn demo mode on with the clock and status bar notification icons hidden."
        },
        {
            command: "avd-demo-mode --disable --avd Pixel_6_API_34",
            description: "Turn demo mode off on a specific AVD."
        }
    ])
);

AvdDemoModeCommand.pipe(
    Command.run({ version: "1.0.0" }),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
