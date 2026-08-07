/**
 * TODO Temporary.
 *
 * @module notivex/components/hint-row
 *
 * @file      hint-row.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

/* eslint-disable jsdoc/require-jsdoc */

interface HintRowProps
{
    readonly title?: string;
    readonly hint?: ReactNode;
}

export function HintRow({ title = "Try editing", hint = "app/index.tsx" }: HintRowProps)
{
    return (
        <View style={ styles.stepRow }>
            <ThemedText type="small">
                { title }
            </ThemedText>
            <ThemedView
                style={ styles.codeSnippet }
                type="backgroundSelected">
                <ThemedText themeColor="textSecondary">
                    { hint }
                </ThemedText>
            </ThemedView>
        </View>
    );
}

const styles = StyleSheet.create({
    codeSnippet:
    {
        borderRadius: Spacing.M,
        paddingHorizontal: Spacing.M,
        paddingVertical: Spacing.XS
    },
    stepRow:
    {
        flexDirection: "row",
        justifyContent: "space-between"
    }
});
