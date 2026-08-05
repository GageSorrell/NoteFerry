/**
 * Ported from `@notion-kit/ui`'s `primitives/field.tsx` — a layout kit for
 * composing a label, control, description, and error into one form row.
 * `FieldSet`/`FieldLegend` (HTML `<fieldset>`/`<legend>`) collapse into
 * plain `View`/`Text` since RN has no native equivalent.
 *
 * @module @notivex/ui/Primitive/Field
 *
 * @file      Field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";
import { Label } from "./Label.js";
import { Text } from "./Text.js";

export type FieldOrientation = "Vertical" | "Horizontal";

export interface FieldSetProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const FieldSet = ({ Style, children }: FieldSetProps): React.JSX.Element => (
    <View style={ [ Styles.FieldSet, Style ] }>{ children }</View>
);

export interface FieldLegendProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const FieldLegend = ({ children }: FieldLegendProps): React.JSX.Element => (
    <Text Variant="Heading3">{ children }</Text>
);

export interface FieldGroupProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const FieldGroup = ({ Style, children }: FieldGroupProps): React.JSX.Element => (
    <View style={ [ Styles.FieldGroup, Style ] }>{ children }</View>
);

export interface FieldProps {
    readonly Orientation?: FieldOrientation;
    readonly Invalid?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const Field = ({ Orientation = "Vertical", Style, children }: FieldProps): React.JSX.Element => (
    <View style={ [ Orientation === "Horizontal" ? Styles.FieldHorizontal : Styles.FieldVertical, Style ] }>
        { children }
    </View>
);

export interface FieldContentProps {
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const FieldContent = ({ Style, children }: FieldContentProps): React.JSX.Element => (
    <View style={ [ Styles.FieldContent, Style ] }>{ children }</View>
);

export const FieldLabel = Label;

export interface FieldDescriptionProps {
    readonly children?: React.ReactNode;
}

export const FieldDescription = ({ children }: FieldDescriptionProps): React.JSX.Element =>
{
    const MutedColor = UseColor(Semantic.Muted);
    return <Text Variant="Description" Color={ MutedColor }>{ children }</Text>;
};

export interface FieldErrorProps {
    readonly Errors?: ReadonlyArray<{ readonly Message?: string } | undefined>;
    readonly children?: React.ReactNode;
}

export const FieldError = ({ Errors, children }: FieldErrorProps): React.JSX.Element | null =>
{
    const RedColor = UseColor(Semantic.Red);

    const Content = React.useMemo(() =>
    {
        if (children)
        {
            return children;
        }

        if (!Errors?.length)
        {
            return null;
        }

        const UniqueMessages = [ ...new Set(Errors.map((Error) => Error?.Message).filter(Boolean)) ];

        if (UniqueMessages.length <= 1)
        {
            return UniqueMessages[ 0 ] ?? null;
        }

        return (
            <View>
                { UniqueMessages.map((Message) => (
                    <Text key={ Message } Variant="Description" Color={ RedColor }>{ `• ${ Message }` }</Text>
                )) }
            </View>
        );
    }, [ Errors, children, RedColor ]);

    if (!Content)
    {
        return null;
    }

    return typeof Content === "string"
        ? <Text Variant="Description" Color={ RedColor } accessibilityRole="alert">{ Content }</Text>
        : <>{ Content }</>;
};

const Styles = StyleSheet.create({
    FieldSet: {
        flexDirection: "column",
        gap: 16,
    },
    FieldGroup: {
        width: "100%",
        flexDirection: "column",
        gap: 20,
    },
    FieldVertical: {
        width: "100%",
        flexDirection: "column",
        gap: 8,
    },
    FieldHorizontal: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    FieldContent: {
        flex: 1,
        flexDirection: "column",
        gap: 2,
    },
});
