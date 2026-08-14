/**
 * Exhaustive, side-effect-free onboarding states.
 *
 * @module notivex/Storybook/Onboarding
 * @internal
 *
 * @file      Onboarding.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    DoneView,
    SignInModalStepOneView,
    SignInModalStepTwoView,
    SignInView,
    SyncView
} from "../../Source/features/onboarding/onboarding-views";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
    OnboardingMockRegistry,
    type OnboardingMockScenario,
    OnboardingMockScenarios
} from "../../Source/features/onboarding/onboarding-mock-scenarios";
import { action } from "storybook/actions";

interface OnboardingScenarioStoryProps
{
    readonly Scenario: OnboardingMockScenario;
}

const Authorize = action("Open Notion authorization");
const Continue = action("Continue");
const Customize = action("Open database settings");
const GoBack = action("Go back");
const Retry = action("Retry");
const SignIn = action("Sign in");
const Start = action("Start using Notivex");
const StartOver = action("Start over");

/** Renders a selected scenario using pure onboarding views only. */
const OnboardingScenarioStory = ({
    Scenario
}: OnboardingScenarioStoryProps): React.ReactNode =>
{
    const Definition = OnboardingMockRegistry[Scenario];
    const IsPending = "IsPending" in Definition && Definition.IsPending === true;

    switch (Scenario)
    {
        case "SignIn":
            return <SignInView OnContinue={ Continue } />;
        case "SignInModalStepOne":
            return <SignInModalStepOneView OnContinue={ Continue } />;
        case "SignInModalStepTwo":
        case "SignInPending":
            return (
                <SignInModalStepTwoView
                    IsPending={ IsPending }
                    OnBack={ GoBack }
                    OnSignIn={ SignIn }
                />
            );
        case "Syncing":
        case "NoIntegration":
        case "NoIntegrationPending":
        case "NoAccess":
        case "NoAccessPending":
        case "PagesOnly":
        case "PagesOnlyPending":
        case "Ready":
        case "ReadyPending":
        case "SyncError":
            return (
                <SyncView
                    Data={ "SyncData" in Definition ? Definition.SyncData ?? null : null }
                    IsPending={ IsPending }
                    OnAuthorize={ Authorize }
                    OnContinue={ Continue }
                    OnRetry={ Retry }
                    OnStartOver={ StartOver }
                    ShowLoading
                    Status={ "SyncStatus" in Definition
                        ? Definition.SyncStatus ?? "Syncing"
                        : "Syncing" }
                />
            );
        case "Done":
        case "DonePending":
            return (
                <DoneView
                    IsPending={ IsPending }
                    OnCustomize={ Customize }
                    OnStart={ Start }
                />
            );
    }

    return undefined;
};

const meta =
    {
        argTypes:
        {
            Scenario:
            {
                control: "select",
                options: OnboardingMockScenarios
            }
        },
        component: OnboardingScenarioStory,
        parameters: { layout: "fullscreen" },
        title: "Onboarding/States"
    } satisfies Meta<typeof OnboardingScenarioStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignInScreen: Story = { args: { Scenario: "SignIn" } };
export const SignInIntroStepOne: Story = { args: { Scenario: "SignInModalStepOne" } };
export const SignInIntroStepTwo: Story = { args: { Scenario: "SignInModalStepTwo" } };
export const SignInPending: Story = { args: { Scenario: "SignInPending" } };
export const CheckingNotionAccess: Story = { args: { Scenario: "Syncing" } };
export const IntegrationNotAdded: Story = { args: { Scenario: "NoIntegration" } };
export const IntegrationNotAddedPending: Story = { args: { Scenario: "NoIntegrationPending" } };
export const NothingShared: Story = { args: { Scenario: "NoAccess" } };
export const NothingSharedPending: Story = { args: { Scenario: "NoAccessPending" } };
export const PagesOnly: Story = { args: { Scenario: "PagesOnly" } };
export const PagesOnlyPending: Story = { args: { Scenario: "PagesOnlyPending" } };
export const DatabasesFound: Story = { args: { Scenario: "Ready" } };
export const DatabasesFoundPending: Story = { args: { Scenario: "ReadyPending" } };
export const DiscoveryError: Story = { args: { Scenario: "SyncError" } };
export const Done: Story = { args: { Scenario: "Done" } };
export const DonePending: Story = { args: { Scenario: "DonePending" } };
