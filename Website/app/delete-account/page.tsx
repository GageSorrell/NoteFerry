/**
 * `/delete-account` — the web-based account-deletion page Google Play
 * requires alongside the app's own in-app deletion (Settings → Account
 * settings → Delete my account). Static copy is rendered here on the
 * server; `DeleteAccountAction` is the one client component, handling
 * Notion sign-in and the delete call itself.
 *
 * @file      page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    dataDeleted,
    dataRetained,
    deletionSteps,
    inAppAlternative
} from "@/content/delete-account-content";
import { DeleteAccountAction } from "@/components/site/delete-account/delete-account-action";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";

export const metadata: Metadata = {
    description: `How to request deletion of your ${ siteConfig.name } account and data.`,
    title: "Delete Your Account"
};

const DeleteAccountPage = () =>
{
    return (
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Delete Your { siteConfig.name } Account
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                { siteConfig.name } is developed by Gage Sorrell. Use this page to request
                deletion of your { siteConfig.name } account and its data — no app install
                required.
            </p>

            <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    How to delete your account
                </h2>
                <ol className="mt-3 flex flex-col gap-3">
                    { deletionSteps.map((step: string, index: number) => (
                        <li
                            className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                            key={ index }>
                            <span
                                className={ "flex size-6 shrink-0 items-center justify-center "
                                    + "rounded-full bg-muted text-xs font-medium text-foreground" }>
                                { index + 1 }
                            </span>
                            <span className="pt-0.5">{ step }</span>
                        </li>
                    )) }
                </ol>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    { inAppAlternative }
                </p>
            </section>

            <DeleteAccountAction />

            <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    What gets deleted
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                    { dataDeleted.map((item: string, index: number) => (
                        <li
                            className="text-sm leading-relaxed text-muted-foreground"
                            key={ index }>
                            • { item }
                        </li>
                    )) }
                </ul>
            </section>

            <section className="mt-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    What's retained, and for how long
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                    { dataRetained.map((item: string, index: number) => (
                        <li
                            className="text-sm leading-relaxed text-muted-foreground"
                            key={ index }>
                            • { item }
                        </li>
                    )) }
                </ul>
            </section>

            <p className="mt-12 text-sm leading-relaxed text-muted-foreground">
                Questions about this page or your data can be sent to{ " " }
                <a
                    className="text-primary underline underline-offset-4 hover:no-underline"
                    href={ `mailto:${ siteConfig.contactEmail }` }>
                    { siteConfig.contactEmail }
                </a>
                . See also our{ " " }
                <a
                    className="text-primary underline underline-offset-4 hover:no-underline"
                    href="/privacy">
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    );
};

export default DeleteAccountPage;
