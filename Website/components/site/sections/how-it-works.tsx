/**
 * The landing page's "How it works" section: a four-step grid grounded in
 * the real product flow, sourced from `content/how-it-works`.
 *
 * @file      how-it-works.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type HowItWorksStep, howItWorksSteps } from "@/content/how-it-works";

/**
 * The four-step "how it works" grid.
 */
export function HowItWorks()
{
    return (
        <section
            className="mx-auto max-w-6xl px-6 py-24"
            id="how-it-works">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    How it works
                </h2>
                <p className="mt-4 text-base text-muted-foreground">
                    Four steps between opening the app and a new page landing in Notion.
                </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                { howItWorksSteps.map((step: HowItWorksStep, index: number) => (
                    <Card
                        className="shadow-none"
                        key={ step.title }>
                        <CardHeader>
                            <div
                                className={ "flex size-10 items-center justify-center "
                                    + "rounded-lg bg-primary/10 text-primary" }>
                                <step.icon className="size-5" />
                            </div>
                            <CardTitle className="mt-4 flex items-baseline gap-2 text-base">
                                <span className="text-xs font-normal text-muted-foreground">
                                    { String(index + 1).padStart(2, "0") }
                                </span>
                                { step.title }
                            </CardTitle>
                            <CardDescription>{ step.description }</CardDescription>
                        </CardHeader>
                    </Card>
                )) }
            </div>
        </section>
    );
}
