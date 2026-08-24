"use client";

/**
 * Wraps `next-themes` for the whole app: class-based dark mode, defaulting
 * to the visitor's system preference.
 *
 * @file      theme-provider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export/**
       * Provides `next-themes` context to the app, using the `class` strategy
       * (matches the `.dark { ... }` selector in `app/globals.css`).
       */
const ThemeProvider = ({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) =>
{
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            { ...props }>
            { children }
        </NextThemesProvider>
    );
};
