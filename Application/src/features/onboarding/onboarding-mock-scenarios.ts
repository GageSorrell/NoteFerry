/**
 * Pure definitions for every user-visible onboarding development scenario.
 * This module intentionally contains no runtime router, auth, or API imports so
 * Storybook can consume it without initializing application side effects.
 *
 * @module notivex/features/onboarding/onboarding-mock-scenarios
 *
 * @file      onboarding-mock-scenarios.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Href } from "expo-router";
import type { NotionSyncStatus } from "@/features/onboarding/use-notion-sync";

/** A root-navigation stage that can host an onboarding mock. */
export type OnboardingMockStage = "SignedOut" | "Onboarding";

/** Every user-visible onboarding state that can be selected in development. */
export type OnboardingMockScenario =
    | "SignIn"
    | "SignInModalStepOne"
    | "SignInModalStepTwo"
    | "SignInPending"
    | "Grant"
    | "GrantPending"
    | "Syncing"
    | "SyncReady"
    | "SyncEmpty"
    | "SyncError"
    | "Done"
    | "DonePending";

/** Metadata used by navigation, the picker, and Storybook. */
export interface OnboardingMockDefinition
{
    readonly Label: string;
    readonly Route: Href;
    readonly Stage: OnboardingMockStage;
    readonly SyncStatus?: NotionSyncStatus | undefined;
}

export/**
       * Exhaustive definitions for the development-only onboarding scenarios.
       *
       * @category Development
       * @since 1.0.0
       */
const OnboardingMockRegistry = Object.freeze({
    Done:
    {
        Label: "Done",
        Route: "/done",
        Stage: "Onboarding"
    },
    DonePending:
    {
        Label: "Done · pending",
        Route: "/done",
        Stage: "Onboarding"
    },
    Grant:
    {
        Label: "Grant access",
        Route: "/grant",
        Stage: "Onboarding"
    },
    GrantPending:
    {
        Label: "Grant access · pending",
        Route: "/grant",
        Stage: "Onboarding"
    },
    SignIn:
    {
        Label: "Sign in",
        Route: "/sign-in",
        Stage: "SignedOut"
    },
    SignInModalStepOne:
    {
        Label: "Sign-in intro · step one",
        Route: "/sign-in-modal-step-one",
        Stage: "SignedOut"
    },
    SignInModalStepTwo:
    {
        Label: "Sign-in intro · step two",
        Route: "/sign-in-modal-step-two",
        Stage: "SignedOut"
    },
    SignInPending:
    {
        Label: "Sign in · pending",
        Route: "/sign-in-modal-step-two",
        Stage: "SignedOut"
    },
    SyncEmpty:
    {
        Label: "Sync · empty",
        Route: "/sync",
        Stage: "Onboarding",
        SyncStatus: "Empty"
    },
    SyncError:
    {
        Label: "Sync · error",
        Route: "/sync",
        Stage: "Onboarding",
        SyncStatus: "Error"
    },
    SyncReady:
    {
        Label: "Sync · ready",
        Route: "/sync",
        Stage: "Onboarding",
        SyncStatus: "Ready"
    },
    Syncing:
    {
        Label: "Sync · waiting",
        Route: "/sync",
        Stage: "Onboarding",
        SyncStatus: "Syncing"
    }
} satisfies Readonly<Record<OnboardingMockScenario, OnboardingMockDefinition>>);

export/**
       * Stable display order for scenario pickers and Storybook.
       *
       * @category Development
       * @since 1.0.0
       */
const OnboardingMockScenarios = Object.freeze([
    "SignIn",
    "SignInModalStepOne",
    "SignInModalStepTwo",
    "SignInPending",
    "Grant",
    "GrantPending",
    "Syncing",
    "SyncReady",
    "SyncEmpty",
    "SyncError",
    "Done",
    "DonePending"
] as const);

export/**
       * Timing constants for deterministic routed mock transitions.
       *
       * @category Development
       * @since 1.0.0
       */
const OnboardingMockTiming = Object.freeze({
    PendingMs: 600,
    SyncMs: 1800
} as const);
