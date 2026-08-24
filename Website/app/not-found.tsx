/**
 * The branded 404 page, reusing the standard navbar/footer chrome from
 * the root layout.
 *
 * @file      not-found.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * The 404 page rendered for unmatched routes.
 */
const NotFound = () =>
{
    return (
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-32 text-center">
            <p className="text-sm font-medium text-primary">404</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Page not found
            </h1>
            <p className="max-w-sm text-base text-muted-foreground">
                The page you're looking for doesn't exist or has moved.
            </p>
            <Button asChild
                className="mt-4">
                <Link href="/">Back home</Link>
            </Button>
        </div>
    );
};

export default NotFound;
