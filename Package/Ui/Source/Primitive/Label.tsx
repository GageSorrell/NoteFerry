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
import * as Semantic from "../Token/Semantic.js";
import type { StyleProp, TextStyle } from "react-native";

import { Text } from "./Text.js";

/** {@inheritDoc Label} */
export interface LabelProps extends React.PropsWithChildren
{
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<TextStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const Label = ({ Disabled = false, Style, children }: LabelProps): React.JSX.Element => (
    <Text
        Color={ Semantic.Secondary }
        Style={ [ Disabled ? { opacity: 0.7 } : undefined, Style ] }
        Variant="Label">
        { children }
    </Text>
);
