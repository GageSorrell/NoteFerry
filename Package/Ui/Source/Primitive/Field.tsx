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
import * as Semantic from "../Token/Semantic.js";
import { Description, Heading3 } from "./Text.js";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Label } from "./Label.js";
import { UseColor } from "../ThemeProvider.js";

/**
 * The orientation of a given `Field` component.
 *
 * @category Input
 * @since 1.0.0
 */
export type FieldOrientation =
    | "Vertical"
    | "Horizontal";

/** {@inheritDoc FieldSet} */
export interface FieldSetProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldSet = ({ Style, children }: FieldSetProps): React.JSX.Element =>
    <View style={ [ Styles.FieldSet, Style ] }>
        { children }
    </View>;

/** {@inheritDoc FieldLegend} */
export interface FieldLegendProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldLegend = ({ children }: FieldLegendProps): React.JSX.Element =>
    <Heading3>
        { children }
    </Heading3>;

/** {@inheritDoc FieldGroup} */
export interface FieldGroupProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldGroup = ({ Style, children }: FieldGroupProps): React.JSX.Element =>
    <View style={ [ Styles.FieldGroup, Style ] }>
        { children }
    </View>;

/** {@inheritDoc Field} */
export interface FieldProps extends React.PropsWithChildren
{
    readonly Orientation?: FieldOrientation;
    readonly Invalid?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const Field = ({ Orientation = "Vertical", Style, children }: FieldProps): React.JSX.Element =>
    <View style={ [ Orientation === "Horizontal" ? Styles.FieldHorizontal : Styles.FieldVertical, Style ] }>
        { children }
    </View>;

/** {@inheritDoc FieldContent} */
export interface FieldContentProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldContent = ({ Style, children }: FieldContentProps): React.JSX.Element => (
    <View style={ [ Styles.FieldContent, Style ] }>{ children }</View>
);

export/** {@inheritDoc Label} */
const FieldLabel = Label;

/** {@inheritDoc FieldDescription} */
export interface FieldDescriptionProps extends React.PropsWithChildren { }

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldDescription = ({ children }: FieldDescriptionProps): React.JSX.Element =>
{
    const MutedColor = UseColor(Semantic.Muted);
    return (
        <Description Color={ MutedColor }>
            { children }
        </Description>
    );
};

/** {@inheritDoc FieldError} */
export interface FieldErrorProps extends React.PropsWithChildren
{
    readonly Errors?: ReadonlyArray<{ readonly Message?: string } | undefined>;
}

export/**
       * TODO Write description.
       *
       * @category Component
       * @since 1.0.0
       */
const FieldError = ({ Errors, children }: FieldErrorProps): React.JSX.Element | null =>
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

        interface Error
        {
            readonly Message?: string;
        }

        const UniqueMessages = [ ...new Set(Errors.map((Error?: Error) => Error?.Message).filter(Boolean)) ];

        if (UniqueMessages.length <= 1)
        {
            return UniqueMessages[ 0 ] ?? null;
        }

        return (
            <View>
                { UniqueMessages.map((Message?: string) =>
                    <Description
                        Color={ RedColor }
                        key={ Message }>
                        { `• ${ Message }` }
                    </Description>
                ) }
            </View>
        );
    }, [ Errors, children, RedColor ]);

    if (!Content)
    {
        return null;
    }

    return typeof Content === "string"
        ? <Description
            Color={ RedColor }
            accessibilityRole="alert">
            { Content }
        </Description>
        : <>{ Content }</>;
};

const Styles = StyleSheet.create({
    FieldContent:
    {
        flex: 1,
        flexDirection: "column",
        gap: 2
    },
    FieldGroup:
    {
        flexDirection: "column",
        gap: 20,
        width: "100%"
    },
    FieldHorizontal:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        width: "100%"
    },
    FieldSet:
    {
        flexDirection: "column",
        gap: 16
    },
    FieldVertical:
    {
        flexDirection: "column",
        gap: 8,
        width: "100%"
    }
});
