/**
 * @module noteferry/Domain/Miscellaneous/StatusBar
 *
 * @file      StatusBar.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "@noteferry/ui";

export/**
       * The status bar, whose style is derived from the NoteFerryTheme provider.
       *
       * @category Component
       * @since 1.0.0
       */
const StatusBar = (): React.JSX.Element =>
{
    const { Mode } = useTheme();

    return <ExpoStatusBar style={ Mode === "Dark" ? "light" : "dark" } />;
};
