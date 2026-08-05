/**
 * Ported from `@notion-kit/ui`'s `primitives/label.tsx` — a thin
 * `Text` wrapper styled as the `Token.Typography.Label` variant in
 * `Semantic.Secondary`.
 *
 * @module @notivex/ui/Primitive/Label
 *
 * @file      Label.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { StyleProp, TextStyle } from "react-native";

import * as Semantic from "../Token/Semantic.js";
import { Text } from "./Text.js";

export interface LabelProps {
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<TextStyle>;
    readonly children?: React.ReactNode;
}

export const Label = ({ Disabled = false, Style, children }: LabelProps): React.JSX.Element => (
    <Text
        Variant="Label"
        Color={ Semantic.Secondary }
        Style={ [ Disabled ? { opacity: 0.7 } : undefined, Style ] }
    >
        { children }
    </Text>
);
