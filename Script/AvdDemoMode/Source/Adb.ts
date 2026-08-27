/**
 * Locates running Android Virtual Devices (AVDs) and runs `adb` against
 * them.
 *
 * All shell interaction for the `avd-demo-mode` script funnels through this
 * module, so callers never invoke `adb` directly.
 *
 * @module @noteferry/avd-demo-mode/Adb
 *
 * @file      Adb.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { Effect, Option, Stream } from "effect";
import { CliError } from "effect/unstable/cli";
import type { PlatformError } from "effect/PlatformError";

/**
 * One Android Virtual Device that `adb` currently reports as booted and
 * ready to accept shell commands.
 *
 * @category Adb
 * @since 1.0.0
 */
export interface AvdTarget
{
    /** The AVD's configured name (e.g. `"Pixel_6_API_34"`), when resolvable. */
    readonly Name: Option.Option<string>;

    /** The adb serial used to address this device (e.g. `"emulator-5554"`). */
    readonly Serial: string;
}

export/**
       * Runs `adb` with the given arguments to completion, capturing its
       * combined stdout/stderr as a single string.
       *
       * Fails with a {@link CliError.UserError} if `adb` cannot be started
       * or exits with a non-zero status, so callers never need to handle a
       * raw `PlatformError`.
       *
       * @category Adb
       * @since 1.0.0
       */
const RunAdb = Effect.fn("RunAdb")(function* (Args: ReadonlyArray<string>)
{
    const Spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const Handle = yield* Spawner.spawn(ChildProcess.make("adb", Args)).pipe(
        Effect.mapError((Cause: PlatformError) => new CliError.UserError({
            cause: Cause,
            userMessage:
                "Could not start adb. Install Android platform-tools and " +
                "make sure adb is on your PATH."
        }))
    );

    const Output = yield* Stream.mkString(Stream.decodeText(Handle.all)).pipe(
        Effect.mapError((Cause: PlatformError) => new CliError.UserError({ cause: Cause }))
    );
    const ExitCode = yield* Handle.exitCode.pipe(
        Effect.mapError((Cause: PlatformError) => new CliError.UserError({ cause: Cause }))
    );

    if (ExitCode !== ChildProcessSpawner.ExitCode(0))
    {
        const Trimmed = Output.trim();

        return yield* new CliError.UserError({
            cause: new Error(Trimmed.length > 0 ? Trimmed : `adb exited with code ${ExitCode}`),
            userMessage:
                `adb ${Args.join(" ")} failed (exit code ${ExitCode})` +
                (Trimmed.length > 0 ? `: ${Trimmed}` : ".")
        });
    }

    return Output;
}, Effect.scoped);

/** Resolves a running AVD's configured name, falling back to `None` if it can't be read. */
const ResolveAvdTarget = Effect.fn("ResolveAvdTarget")(function* (Serial: string)
{
    const Name = yield* RunAdb([ "-s", Serial, "emu", "avd", "name" ]).pipe(
        Effect.map((Output: string) => Output.split(/\r?\n/)[0]?.trim()),
        Effect.map((Value: string | undefined) => Value !== undefined && Value.length > 0
            ? Option.some(Value)
            : Option.none()),
        Effect.orElseSucceed(() => Option.none<string>())
    );

    return { Name, Serial } satisfies AvdTarget;
});

export/**
       * Lists every AVD `adb` currently reports as booted and attached
       * (i.e. every `emulator-*` serial in state `device`).
       *
       * @category Adb
       * @since 1.0.0
       */
const ListRunningAvds = Effect.fn("ListRunningAvds")(function* ()
{
    const Output = yield* RunAdb([ "devices" ]);

    const Serials = Output
        .split(/\r?\n/)
        .slice(1)
        .map((Line: string) => Line.trim())
        .filter((Line: string) => Line.length > 0)
        .map((Line: string) => Line.split(/\s+/))
        .filter((Parts: Array<string>) => Parts[1] === "device")
        .map((Parts: Array<string>) => Parts[0])
        .filter((Serial: string | undefined): Serial is string =>
            Serial !== undefined && Serial.startsWith("emulator-"));

    return yield* Effect.forEach(Serials, ResolveAvdTarget);
});

/** Renders a bulleted `Name (Serial)` list of `Targets`, for error messages. */
const DescribeTargets = (Targets: ReadonlyArray<AvdTarget>): string =>
    Targets
        .map((Target: AvdTarget) =>
            `  - ${Option.getOrElse(Target.Name, () => Target.Serial)} (${Target.Serial})`)
        .join("\n");

export/**
       * Picks the single AVD a run should target: the explicitly
       * `Requested` name or serial when given, or the sole running AVD
       * when there is only one.
       *
       * Fails with a {@link CliError.UserError} when `Requested` matches
       * nothing, when no AVD is running, or when more than one AVD is
       * running and none was requested.
       *
       * @category Adb
       * @since 1.0.0
       */
const ResolveAvd = Effect.fn("ResolveAvd")(function* (Requested: Option.Option<string>)
{
    const Targets = yield* ListRunningAvds();

    if (Option.isSome(Requested))
    {
        const Match = Targets.find((Target: AvdTarget) =>
            Target.Serial === Requested.value || Option.contains(Target.Name, Requested.value));

        if (Match === undefined)
        {
            const Available = Targets.length > 0
                ? `\n\nRunning AVDs:\n${DescribeTargets(Targets)}`
                : "\n\nNo AVDs are currently running.";

            return yield* new CliError.UserError({
                cause: new Error(`No running AVD matches "${Requested.value}".`),
                userMessage: `No running AVD matches "${Requested.value}".${Available}`
            });
        }

        return Match;
    }

    const [ OnlyTarget ] = Targets;

    if (Targets.length === 1 && OnlyTarget !== undefined)
    {
        return OnlyTarget;
    }

    if (Targets.length === 0)
    {
        return yield* new CliError.UserError({
            cause: new Error("No running AVD was found."),
            userMessage: "No running AVD was found. Start an emulator, then try again."
        });
    }

    return yield* new CliError.UserError({
        cause: new Error("Multiple running AVDs were found."),
        userMessage:
            "Multiple running AVDs were found; specify one with --avd.\n\n" +
            DescribeTargets(Targets)
    });
});
