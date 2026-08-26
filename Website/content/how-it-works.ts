/**
 * The four-step product flow shown in the landing page's "How it works"
 * section, grounded in the real app flow (Connect → Data Source →
 * Destination → Quick Entry).
 *
 * @file      how-it-works.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Database, LogIn, type LucideIcon, Settings2, Zap } from "lucide-react";

/** A single step in the "How it works" section. */
export interface HowItWorksStep
{
    /** The lucide icon representing the step. */
    readonly icon: LucideIcon;

    /** The step's short title. */
    readonly title: string;

    /** One sentence describing what happens at this step. */
    readonly description: string;
}

export/** The four steps, in order. */
const howItWorksSteps: ReadonlyArray<HowItWorksStep> = [
    {
        description: "Sign in with Notion OAuth. NoteFerry never sees your credentials.",
        icon: LogIn,
        title: "Connect Notion"
    },
    {
        description: "Browse and cache the Notion databases you want quick access to.",
        icon: Database,
        title: "Pick a data source"
    },
    {
        description: "Choose which fields show up, which are required, and set a template.",
        icon: Settings2,
        title: "Configure a destination"
    },
    {
        description: "Add a new Notion page in seconds — even from a home-screen quick action.",
        icon: Zap,
        title: "Quick-entry from your home screen"
    }
];
