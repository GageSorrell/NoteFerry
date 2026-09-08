"use client";

/**
 * The footer nav's "Credits" link and the modal it opens, listing
 * third-party asset credits — currently just Flaticon's required
 * attribution for the Finder artwork used in the platforms table's
 * macOS row (`components/ui/os-icons.tsx`'s `FinderIcon`,
 * `public/finder-logo.png`). A client component since the modal's
 * open/close state is Radix Dialog state, which needs to run in the
 * browser — everything around it (`footer.tsx` and the rest of the page)
 * stays a server component.
 *
 * @file      credits-modal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

export/**
       * The footer nav's trigger for the credits modal, styled to match
       * its sibling links (Terms/Privacy/Contact).
       */
const CreditsModal = () =>
{
    return (
        <Dialog>
            <DialogTrigger className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Credits
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Credits</DialogTitle>
                <DialogDescription>
                    <a
                        className="text-primary underline underline-offset-4 hover:no-underline"
                        href="https://www.flaticon.com/free-icons/search"
                        title="search icons">
                        Search icons created by Magnific - Flaticon
                    </a>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
};
