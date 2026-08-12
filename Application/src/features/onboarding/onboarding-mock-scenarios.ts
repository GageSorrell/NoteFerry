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

import type * as Domain from "@notivex/domain";
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
    | "NoIntegration"
    | "NoIntegrationPending"
    | "NoAccess"
    | "NoAccessPending"
    | "PagesOnly"
    | "PagesOnlyPending"
    | "Ready"
    | "ReadyPending"
    | "SyncError"
    | "Done"
    | "DonePending";

/** Metadata used by navigation, the picker, and Storybook. */
export interface OnboardingMockDefinition
{
    readonly IsPending?: boolean | undefined;
    readonly Label: string;
    readonly Route: Href;
    readonly Stage: OnboardingMockStage;
    readonly SyncData?: Domain.DataSource.OnboardingDiscovery | undefined;
    readonly SyncStatus?: NotionSyncStatus | undefined;
}

const MockPages = Array.from({ length: 25 }, (_: unknown, Index: number) => ({
    Id: `mock-page-${ Index + 1 }`,
    Title: [
        "Product planning",
        "Weekly notes",
        "Team handbook",
        "Research",
        "Meeting notes"
    ][Index] ?? `Shared page ${ Index + 1 }`
})) as unknown as ReadonlyArray<Domain.DataSource.OnboardingPage>;

const MockDatabases = ([
    [ "Tasks", 101, "✅" ],
    [ "Clients", 83, "👥" ],
    [ "Ideas", 46, "💡" ],
    [ "Meetings", 31, "🗓️" ],
    [ "Projects", 24, "🚀" ],
    [ "Projects", 9, "📁" ],
    [ "Reading list", 18, "📚" ],
    [ "Recipes", 12, "🍲" ],
    [ "Goals", 8, "🎯" ],
    [ "Travel", 5, "✈️" ],
    [ "Archive", 2, "🗄️" ],
    [ "Inbox", 0, "📥" ]
] as const).map((
    [ Title, Count, Icon ]: readonly [string, number, string],
    Index: number
) => ({
    ConnectionId: "mock-connection",
    DataSourceId: `mock-data-source-${ Index + 1 }`,
    DatabaseId: `mock-database-${ Index + 1 }`,
    HasMoreThan100Pages: Count === 101,
    Icon,
    IconType: "Emoji",
    PageCount: Count === 101 ? 100 : Count,
    Title
})) as unknown as ReadonlyArray<Domain.DataSource.OnboardingDatabase>;

const EmptyData = {
    DatabaseCount: 0,
    Databases: [],
    PageCount: 0,
    Pages: []
} as unknown as Domain.DataSource.OnboardingDiscovery;

const PagesOnlyData = {
    DatabaseCount: 0,
    Databases: [],
    PageCount: 30,
    Pages: MockPages
} as unknown as Domain.DataSource.OnboardingDiscovery;

const ReadyData = {
    DatabaseCount: MockDatabases.length,
    Databases: MockDatabases,
    PageCount: 28,
    Pages: MockPages
} as unknown as Domain.DataSource.OnboardingDiscovery;

export/**
       * Exhaustive definitions for development and Storybook.
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
        IsPending: true,
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
        IsPending: true,
        Label: "Grant access · pending",
        Route: "/grant",
        Stage: "Onboarding"
    },
    NoAccess:
    {
        Label: "Installed · nothing shared",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: EmptyData,
        SyncStatus: "NoAccess"
    },
    NoAccessPending:
    {
        IsPending: true,
        Label: "Installed · reopening Notion",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: EmptyData,
        SyncStatus: "NoAccess"
    },
    NoIntegration:
    {
        Label: "Integration not added",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: EmptyData,
        SyncStatus: "NoIntegration"
    },
    NoIntegrationPending:
    {
        IsPending: true,
        Label: "Integration not added · restarting",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: EmptyData,
        SyncStatus: "NoIntegration"
    },
    PagesOnly:
    {
        Label: "Pages only",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: PagesOnlyData,
        SyncStatus: "PagesOnly"
    },
    PagesOnlyPending:
    {
        IsPending: true,
        Label: "Pages only · reopening Notion",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: PagesOnlyData,
        SyncStatus: "PagesOnly"
    },
    Ready:
    {
        Label: "Databases found",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: ReadyData,
        SyncStatus: "Ready"
    },
    ReadyPending:
    {
        IsPending: true,
        Label: "Databases found · continuing",
        Route: "/sync",
        Stage: "Onboarding",
        SyncData: ReadyData,
        SyncStatus: "Ready"
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
        IsPending: true,
        Label: "Sign in · pending",
        Route: "/sign-in-modal-step-two",
        Stage: "SignedOut"
    },
    SyncError:
    {
        Label: "Discovery error",
        Route: "/sync",
        Stage: "Onboarding",
        SyncStatus: "Error"
    },
    Syncing:
    {
        Label: "Checking Notion access",
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
    "NoIntegration",
    "NoIntegrationPending",
    "NoAccess",
    "NoAccessPending",
    "PagesOnly",
    "PagesOnlyPending",
    "Ready",
    "ReadyPending",
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
    LoadingDelayMs: 1_000,
    PendingMs: 600,
    SyncMs: 1_800
} as const);
