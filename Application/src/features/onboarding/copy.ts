/**
 * Centralized copy for the onboarding flow — one place to keep the wording
 * calm, plain, and consistent across every screen. Error copy is deliberately
 * short and actionable: say what happened, then what to do next.
 *
 * @module notivex/features/onboarding/copy
 *
 * @file      copy.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * The strings shown across onboarding, grouped by screen.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const OnboardingCopy =
    {
        Done:
        {
            Body: "Capture a thought and it lands in Notion in seconds.",
            Cta: "Start using Notivex",
            Title: "You're all set"
        },
        Grant:
        {
            Body: "Pick the databases and pages Notivex can write to — nothing else is ever touched.",
            Cta: "Choose pages in Notion",
            Note: "You can change what's shared anytime, right from Notion.",
            Title: "Give Notivex a place to write"
        },
        SignIn:
        {
            Body: "The quickest way to add to Notion. Sign in with your Notion account to begin.",
            Cta: "Continue with Notion",
            Pending: "Opening Notion…",
            Title: "Welcome to Notivex"
        },
        SignInModal:
        {
            Cta: "Got it",
            Note: "Choose a page and every database nested inside it comes along too.",
            Steps:
            [
                "Sign in to your Notion account on the next screen.",
                "Then pick which databases Notivex can use."
            ],
            Title: "Two quick steps"
        },
        Sync:
        {
            Empty:
            {
                Body: "Nothing's shared with Notivex yet. Share a database in Notion, then try again.",
                Cta: "Try again",
                Secondary: "I'll do this later",
                Title: "Nothing shared yet"
            },
            Error:
            {
                Body: "We couldn't reach Notion. Check your connection and try again.",
                Cta: "Try again",
                Title: "We hit a snag"
            },
            Ready:
            {
                Body: "Your workspace is ready to go.",
                Cta: "Continue",
                Title: "All connected"
            },
            Syncing:
            {
                Body: "Notion takes a few seconds to share your pages. Hang tight — almost there.",
                Title: "Getting things ready"
            }
        }
    } as const;
