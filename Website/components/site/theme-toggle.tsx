"use client";

/**
 * A light/dark/system theme switch for the navbar, backed by `next-themes`.
 * Unlike a plain two-state toggle, this exposes all three states next-themes
 * supports — "system" is a real, selectable default, not just an initial
 * fallback.
 *
 * @file      theme-toggle.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { type LucideIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

/** The three theme options next-themes supports here. */
type ThemeOption = "light" | "dark" | "system";

/** One entry in the theme dropdown. */
interface ThemeOptionEntry
{
    readonly value: ThemeOption;
    readonly label: string;
    readonly icon: LucideIcon;
}

const themeOptions: ReadonlyArray<ThemeOptionEntry> = [
    { icon: SunIcon, label: "Light", value: "light" },
    { icon: MoonIcon, label: "Dark", value: "dark" },
    { icon: MonitorIcon, label: "System", value: "system" }
];

/**
 * A dropdown theme switch with Light / Dark / System options. Renders a
 * stable-sized trigger even before mount to avoid layout shift, but only
 * shows the active icon once mounted (the resolved theme is unknown during
 * server render).
 */
export function ThemeToggle()
{
    const [ mounted, setMounted ] = React.useState(false);
    const { theme, setTheme } = useTheme();

    React.useEffect(() =>
    {
        setMounted(true);
    }, []);

    const active = themeOptions.find(
        (option: ThemeOptionEntry) => option.value === theme
    ) ?? themeOptions[2];
    const ActiveIcon = active.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label="Change theme"
                    size="icon"
                    variant="ghost">
                    { mounted
                        ? <ActiveIcon className="size-4" />
                        : <MonitorIcon className="size-4" /> }
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                { themeOptions.map((option: ThemeOptionEntry) => (
                    <DropdownMenuItem
                        key={ option.value }
                        onSelect={ () => setTheme(option.value) }>
                        <option.icon className="size-4" />
                        { option.label }
                        { mounted && theme === option.value
                            ? <span className="ml-auto text-xs text-muted-foreground">Active</span>
                            : null }
                    </DropdownMenuItem>
                )) }
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
