/**
 * In-memory development scenarios for exercising onboarding without invoking
 * OAuth, Notion, or the Notivex API. State deliberately resets on app reload.
 *
 * @module notivex/features/onboarding/onboarding-development
 *
 * @file      onboarding-development.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    OnboardingMockRegistry,
    OnboardingMockScenarios,
    OnboardingMockTiming
} from "@/features/onboarding/onboarding-mock-scenarios";
import type { Href } from "expo-router";
import type { OnboardingMockScenario } from
    "@/features/onboarding/onboarding-mock-scenarios";
import type { Thunk } from "@sorrell/utility/Function";
import { router } from "expo-router";

export {
    OnboardingMockRegistry,
    OnboardingMockTiming,
    type OnboardingMockScenario,
    OnboardingMockScenarios
};

/** The active development mock session and its transition controls. */
export interface DevelopmentOnboardingState
{
    readonly Active: boolean;
    readonly Automatic: boolean;
    readonly Scenario: OnboardingMockScenario | null;
    readonly Pause: Thunk;
    readonly ReturnToLive: Thunk;
    readonly ReturnToPicker: Thunk;
    readonly Schedule: (Scenario: OnboardingMockScenario, DelayMs: number) => void;
    readonly ScheduleReturnToPicker: (DelayMs: number) => void;
    readonly SelectScenario: (Scenario: OnboardingMockScenario) => void;
    readonly StartHappyPath: Thunk;
    readonly Transition: (Scenario: OnboardingMockScenario) => void;
}

interface MockSession
{
    readonly Automatic: boolean;
    readonly Scenario: OnboardingMockScenario;
}

const DevelopmentOnboardingContext = React.createContext<DevelopmentOnboardingState>({
    Active: false,
    Automatic: false,
    Pause: () => { },
    ReturnToLive: () => { },
    ReturnToPicker: () => { },
    Scenario: null,
    Schedule: () => { },
    ScheduleReturnToPicker: () => { },
    SelectScenario: () => { },
    StartHappyPath: () => { },
    Transition: () => { }
});

/** Provides a development-only, non-persistent onboarding mock session. */
export function DevelopmentOnboardingProvider({ children }: React.PropsWithChildren)
{
    const [ Session, SetSession ] = React.useState<MockSession | null>(null);
    const Timers = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const ClearTimers = React.useCallback((): void =>
    {
        Timers.current.forEach(clearTimeout);
        Timers.current.clear();
    }, [ ]);

    React.useEffect(() => ClearTimers, [ ClearTimers ]);

    const NavigateAfterRender = React.useCallback((Href: Href): void =>
    {
        requestAnimationFrame(() => router.replace(Href));
    }, [ ]);

    const SelectScenario = React.useCallback((Scenario: OnboardingMockScenario): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        ClearTimers();
        SetSession({ Automatic: false, Scenario });
        NavigateAfterRender(OnboardingMockRegistry[Scenario].Route);
    }, [ ClearTimers, NavigateAfterRender ]);

    const StartHappyPath = React.useCallback((): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        ClearTimers();
        SetSession({ Automatic: true, Scenario: "SignIn" });
        NavigateAfterRender(OnboardingMockRegistry.SignIn.Route);
    }, [ ClearTimers, NavigateAfterRender ]);

    const Transition = React.useCallback((Scenario: OnboardingMockScenario): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        SetSession((Current: MockSession | null) => ({
            Automatic: Current?.Automatic ?? false,
            Scenario
        }));
        NavigateAfterRender(OnboardingMockRegistry[Scenario].Route);
    }, [ NavigateAfterRender ]);

    const Schedule = React.useCallback((
        Scenario: OnboardingMockScenario,
        DelayMs: number
    ): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        const Timer = setTimeout(() =>
        {
            Timers.current.delete(Timer);
            Transition(Scenario);
        }, DelayMs);

        Timers.current.add(Timer);
    }, [ Transition ]);

    const ReturnToPicker = React.useCallback((): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        ClearTimers();
        SetSession(null);
        NavigateAfterRender("/onboarding-scenarios" as Href);
    }, [ ClearTimers, NavigateAfterRender ]);

    const ScheduleReturnToPicker = React.useCallback((DelayMs: number): void =>
    {
        if (!__DEV__)
        {
            return;
        }

        const Timer = setTimeout(() =>
        {
            Timers.current.delete(Timer);
            ReturnToPicker();
        }, DelayMs);

        Timers.current.add(Timer);
    }, [ ReturnToPicker ]);

    const ReturnToLive = React.useCallback((): void =>
    {
        ClearTimers();
        SetSession(null);
        NavigateAfterRender("/" as Href);
    }, [ ClearTimers, NavigateAfterRender ]);

    const Pause = React.useCallback((): void =>
    {
        ClearTimers();
        SetSession((Current: MockSession | null) => Current === null
            ? null
            : { ...Current, Automatic: false });
    }, [ ClearTimers ]);

    const Value = React.useMemo<DevelopmentOnboardingState>(() => ({
        Active: __DEV__ && Session !== null,
        Automatic: __DEV__ && (Session?.Automatic ?? false),
        Pause,
        ReturnToLive,
        ReturnToPicker,
        Scenario: __DEV__ ? Session?.Scenario ?? null : null,
        Schedule,
        ScheduleReturnToPicker,
        SelectScenario,
        StartHappyPath,
        Transition
    }), [
        Pause,
        ReturnToLive,
        ReturnToPicker,
        Schedule,
        ScheduleReturnToPicker,
        SelectScenario,
        Session,
        StartHappyPath,
        Transition
    ]);

    return (
        <DevelopmentOnboardingContext.Provider value={ Value }>
            { children }
        </DevelopmentOnboardingContext.Provider>
    );
}

export/**
       * Reads the active development onboarding session.
       *
       * @category Development
       * @since 1.0.0
       */
const useDevelopmentOnboarding = (): DevelopmentOnboardingState =>
    React.useContext(DevelopmentOnboardingContext);
