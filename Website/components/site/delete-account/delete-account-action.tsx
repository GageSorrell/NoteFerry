"use client";

/**
 * The interactive half of `/delete-account`: sign in with Notion (the same
 * Supabase Auth provider the mobile app's sign-in already uses), then
 * delete the account. The only client component on the page — the
 * surrounding copy in `app/delete-account/page.tsx` stays a server
 * component, the same split `credits-modal.tsx` uses for the footer's
 * Credits dialog.
 *
 * @file      delete-account-action.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteAccount } from "@/lib/delete-account";
import { Loader2Icon } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Supabase } from "@/lib/supabase-client";

/** The action's state machine. */
type Status = "loading" | "signedOut" | "signedIn" | "deleting" | "deleted";

export/**
       * Renders the "Continue with Notion" / "Delete my account" control,
       * whichever the current session state calls for.
       */
const DeleteAccountAction = () =>
{
    const [ status, setStatus ] = useState<Status>("loading");
    const [ session, setSession ] = useState<Session | null>(null);
    const [ isConfirmOpen, setIsConfirmOpen ] = useState(false);
    const [ errorMessage, setErrorMessage ] = useState<string | null>(null);

    useEffect(() =>
    {
        let isMounted = true;

        void Supabase.auth.getSession().then(({ data }) =>
        {
            if (!isMounted)
            {
                return;
            }

            setSession(data.session);
            setStatus(data.session ? "signedIn" : "signedOut");
        });

        const { data: listener } = Supabase.auth.onAuthStateChange((_event, newSession) =>
        {
            setSession(newSession);
            setStatus((current) =>
            {
                /* Don't let a background token refresh interrupt an in-flight
                 * deletion or clobber the just-shown "deleted" confirmation. */
                if (current === "deleting" || current === "deleted")
                {
                    return current;
                }

                return newSession ? "signedIn" : "signedOut";
            });
        });

        return () =>
        {
            isMounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = useCallback(async () =>
    {
        await Supabase.auth.signInWithOAuth({
            options: { redirectTo: `${ window.location.origin }/delete-account` },
            provider: "notion"
        });
    }, []);

    const handleSignOut = useCallback(async () =>
    {
        await Supabase.auth.signOut();
        setSession(null);
        setStatus("signedOut");
    }, []);

    const handleConfirmDelete = useCallback(async () =>
    {
        if (!session)
        {
            return;
        }

        setErrorMessage(null);
        setStatus("deleting");

        try
        {
            await DeleteAccount(session.access_token);
            await Supabase.auth.signOut();
            setIsConfirmOpen(false);
            setStatus("deleted");
        }
        catch (Error_)
        {
            setErrorMessage(Error_ instanceof Error ? Error_.message : "Something went wrong.");
            setStatus("signedIn");
        }
    }, [ session ]);

    if (status === "loading")
    {
        return (
            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Checking sign-in status…
            </div>
        );
    }

    if (status === "deleted")
    {
        return (
            <div className="mt-10 rounded-xl border border-border bg-muted/50 p-6">
                <p className="text-sm font-medium text-foreground">
                    Your account and its data have been deleted.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    This page can safely be closed.
                </p>
            </div>
        );
    }

    if (status === "signedOut")
    {
        return (
            <div className="mt-10 flex flex-col items-center gap-3 sm:items-start">
                <Button
                    className="w-full sm:w-auto"
                    onClick={ () => void handleSignIn() }
                    size="lg">
                    Continue with Notion
                </Button>
                <p className="text-xs text-muted-foreground">
                    Signs you in the same way the app does, so we can confirm which
                    account to delete.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-10 flex flex-col items-center gap-3 sm:items-start">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    className="w-full sm:w-auto"
                    disabled={ status === "deleting" }
                    onClick={ () => setIsConfirmOpen(true) }
                    size="lg"
                    variant="destructive">
                    { status === "deleting"
                        ? <Loader2Icon className="size-4 animate-spin" />
                        : null }
                    Delete my account
                </Button>
                <Button
                    disabled={ status === "deleting" }
                    onClick={ () => void handleSignOut() }
                    variant="ghost">
                    Not you? Sign out
                </Button>
            </div>
            { errorMessage
                ? <p className="text-sm text-destructive">{ errorMessage }</p>
                : null }

            <Dialog
                onOpenChange={ setIsConfirmOpen }
                open={ isConfirmOpen }>
                <DialogContent>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>
                        This permanently deletes your NoteFerry account and the data
                        listed on this page. It can't be undone.
                    </DialogDescription>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            disabled={ status === "deleting" }
                            onClick={ () => setIsConfirmOpen(false) }
                            variant="outline">
                            Cancel
                        </Button>
                        <Button
                            disabled={ status === "deleting" }
                            onClick={ () => void handleConfirmDelete() }
                            variant="destructive">
                            { status === "deleting"
                                ? <Loader2Icon className="size-4 animate-spin" />
                                : null }
                            Yes, delete my account
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
