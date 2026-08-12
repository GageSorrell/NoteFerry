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
    GrantView,
    SignInModalStepOneView,
    SignInModalStepTwoView,
    SignInView,
    SyncView
} from "@/features/onboarding/onboarding-views";
import type { Meta, StoryObj } from "@storybook/react-native";
import {
    OnboardingMockRegistry,
    OnboardingMockScenarios
} from "@/features/onboarding/onboarding-mock-scenarios";
import type { OnboardingMockScenario } from
    "@/features/onboarding/onboarding-mock-scenarios";
import { action } from "storybook/actions";

interface OnboardingScenarioStoryProps
{
    readonly Scenario: OnboardingMockScenario;
}

const Continue = action("Continue");
const GoBack = action("Go back");
const Grant = action("Grant access");
const Retry = action("Retry");
const SignIn = action("Sign in");
const Start = action("Start using Notivex");

/** Renders a selected scenario using pure onboarding views only. */
const OnboardingScenarioStory = ({
    Scenario
}: OnboardingScenarioStoryProps): React.JSX.Element =>
{
    switch (Scenario)
    {
        case "SignIn":
            return <SignInView OnContinue={ Continue } />;
        case "SignInModalStepOne":
            return <SignInModalStepOneView OnContinue={ Continue } />;
        case "SignInModalStepTwo":
            return (
                <SignInModalStepTwoView
                    OnBack={ GoBack }
                    OnSignIn={ SignIn }
                    Pending={ false }
                />
            );
        case "SignInPending":
            return (
                <SignInModalStepTwoView
                    OnBack={ GoBack }
                    OnSignIn={ SignIn }
                    Pending
                />
            );
        case "Grant":
            return (
                <GrantView
                    OnGrant={ Grant }
                    Pending={ false }
                />
            );
        case "GrantPending":
            return (
                <GrantView
                    OnGrant={ Grant }
                    Pending
                />
            );
        case "Syncing":
        case "SyncReady":
        case "SyncEmpty":
        case "SyncError":
            return (
                <SyncView
                    OnContinue={ Continue }
                    OnRetry={ Retry }
                    Status={ OnboardingMockRegistry[Scenario].SyncStatus ?? "Syncing" }
                />
            );
        case "Done":
            return (
                <DoneView
                    OnStart={ Start }
                    Pending={ false }
                />
            );
        case "DonePending":
            return (
                <DoneView
                    OnStart={ Start }
                    Pending
                />
            );
    }
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
export const GrantAccess: Story = { args: { Scenario: "Grant" } };
export const GrantAccessPending: Story = { args: { Scenario: "GrantPending" } };
export const Syncing: Story = { args: { Scenario: "Syncing" } };
export const SyncReady: Story = { args: { Scenario: "SyncReady" } };
export const SyncEmpty: Story = { args: { Scenario: "SyncEmpty" } };
export const SyncError: Story = { args: { Scenario: "SyncError" } };
export const Done: Story = { args: { Scenario: "Done" } };
export const DonePending: Story = { args: { Scenario: "DonePending" } };
