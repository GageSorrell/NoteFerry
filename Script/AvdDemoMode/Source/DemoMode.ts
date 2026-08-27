/**
 * Defines the exact `adb shell` commands that put a device into (or out of)
 * System UI demo mode, and runs them against one {@link Adb.AvdTarget}'s
 * serial.
 *
 * @module @noteferry/avd-demo-mode/DemoMode
 *
 * @file      DemoMode.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Adb from "./Adb.js";
import { Effect, Result } from "effect";
import ora from "ora";

/**
 * The two states this script can put an AVD's demo mode into.
 *
 * @category DemoMode
 * @since 1.0.0
 */
export type DemoModeState = "Disabled" | "Enabled";

/** A named group of `adb shell` steps that together change one visible feature. */
interface DemoModeFeature
{
    readonly Feature: string;
    readonly Steps: ReadonlyArray<ReadonlyArray<string>>;
}

const AnimationScaleSettings: ReadonlyArray<string> = [
    "animator_duration_scale",
    "transition_animation_scale",
    "window_animation_scale"
];

/** Builds an `am broadcast` step for `com.android.systemui.demo`. */
const DemoBroadcast = (...Extra: ReadonlyArray<string>): ReadonlyArray<string> =>
    [ "am", "broadcast", "-a", "com.android.systemui.demo", ...Extra ];

const EnableFeatures: ReadonlyArray<DemoModeFeature> = [
    {
        Feature: "Demo mode",
        Steps: [ [ "settings", "put", "global", "sysui_demo_allowed", "1" ] ]
    },
    {
        Feature: "Clock",
        Steps: [
            DemoBroadcast(
                "-e", "command", "clock",
                "-e", "hhmm", "1000"
            )
        ]
    },
    {
        Feature: "Battery",
        Steps: [
            DemoBroadcast(
                "-e", "command", "battery",
                "-e", "level", "100",
                "-e", "plugged", "false"
            )
        ]
    },
    {
        Feature: "Network",
        Steps: [
            DemoBroadcast(
                "-e", "command", "network",
                "-e", "wifi", "show",
                "-e", "level", "4",
                "-e", "fully", "true"
            )
        ]
    },
    {
        Feature: "Notification icons",
        Steps: [
            DemoBroadcast(
                "-e", "command", "notifications",
                "-e", "visible", "false"
            )
        ]
    },
    {
        Feature: "Animation scale",
        Steps: AnimationScaleSettings.map(
            (Setting: string) => [ "settings", "put", "global", Setting, "0.5" ]
        )
    },
    {
        Feature: "Heads-up notifications",
        Steps: [ [ "settings", "put", "global", "heads_up_notifications_enabled", "0" ] ]
    }
];

const DisableFeatures: ReadonlyArray<DemoModeFeature> = [
    {
        Feature: "Demo mode",
        Steps: [
            DemoBroadcast("-e", "command", "exit"),
            [ "settings", "put", "global", "sysui_demo_allowed", "0" ]
        ]
    },
    {
        Feature: "Animation scale",
        Steps: AnimationScaleSettings.map((Setting: string) => [ "settings", "put", "global", Setting, "1" ])
    },
    {
        Feature: "Heads-up notifications",
        Steps: [ [ "settings", "put", "global", "heads_up_notifications_enabled", "1" ] ]
    }
];

export/**
       * Reads whether demo mode is currently enabled on `Serial`, by
       * reading back the `sysui_demo_allowed` global setting this script
       * itself sets.
       *
       * @category DemoMode
       * @since 1.0.0
       */
const CurrentState = Effect.fn("CurrentState")(function* (Serial: string)
{
    const Value = yield* Adb.RunAdb(
        [ "-s", Serial, "shell", "settings", "get", "global", "sysui_demo_allowed" ]
    );

    return Value.trim() === "1" ? "Enabled" as const : "Disabled" as const;
});

export/**
       * Puts `Serial` into `Target` demo-mode state, running every step for
       * each feature behind its own spinner: a green checkmark once it
       * succeeds while enabling, a red cross once it succeeds (or if any
       * step fails) while disabling.
       *
       * @category DemoMode
       * @since 1.0.0
       */
const SetDemoMode = Effect.fn("SetDemoMode")(function* (Serial: string, Target: DemoModeState)
{
    const Features = Target === "Enabled" ? EnableFeatures : DisableFeatures;

    for (const { Feature, Steps } of Features)
    {
        const Spinner = ora(Feature).start();

        const Outcome = yield* Effect.forEach(
            Steps,
            (Step: ReadonlyArray<string>) => Adb.RunAdb([ "-s", Serial, "shell", ...Step ])
        ).pipe(Effect.result);

        if (Result.isFailure(Outcome))
        {
            Spinner.fail();

            return yield* Outcome.failure;
        }

        if (Target === "Enabled")
        {
            Spinner.succeed();
        }
        else
        {
            Spinner.fail();
        }
    }
});
