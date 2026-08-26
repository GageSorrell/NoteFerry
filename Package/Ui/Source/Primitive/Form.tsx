/**
 * Ported from `@notion-kit/ui`'s `primitives/form.tsx`. `react-hook-form`
 * is UI-framework-agnostic, so `Form` (= `FormProvider`), `FormField` (=
 * `Controller` + a name-context), and `useFormField` port essentially
 * unchanged. Source's `FormControl` — a polymorphic wrapper that injects
 * `aria-describedby`/`aria-invalid` into whatever DOM control it renders —
 * was not ported: RN controls (`Input`, `Checkbox`, ...) take their value
 * and change handler as direct props, wired straight from
 * `FormField`'s render-prop `field` (`Value={field.value}
 * OnChangeText={field.onChange}`), so there's no wrapper element for it to
 * inject attributes into.
 *
 * @module @noteferry/ui/Primitive/Form
 *
 * @file      Form.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    Controller,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
    FormProvider,
    useFormContext,
    useFormState
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "./Field.js";
import type { StyleProp, ViewStyle } from "react-native";
import { useToken } from "../ThemeProvider.js";

export/** {@inheritDoc FormProvider} */
const Form = FormProvider;

interface FormFieldContextValue
{
    readonly Name: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

export/**
       * Connects a `react-hook-form` controller to the context consumed by the compound form components.
       *
       * @category Component
       * @since 1.0.0
       */
const FormField = <
    A extends FieldValues = FieldValues,
    Name extends FieldPath<A> = FieldPath<A>
>(Props: ControllerProps<A, Name>): React.JSX.Element =>
{
    const ContextValue = React.useMemo<FormFieldContextValue>(() => ({ Name: Props.name }), [ Props.name ]);

    return (
        <FormFieldContext.Provider value={ ContextValue }>
            <Controller { ...Props } />
        </FormFieldContext.Provider>
    );
};

interface FormItemContextValue {
    readonly Id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | undefined>(undefined);

export/**
       * Returns the current form field's identity, validation state, and generated accessibility identifiers.
       *
       * @category Hook
       * @since 1.0.0
       */
const useFormField = () =>
{
    const FieldContext = React.useContext(FormFieldContext);
    const ItemContext = React.useContext(FormItemContext);
    const { getFieldState } = useFormContext();
    const FormState = useFormState(FieldContext === undefined ? {} : { name: FieldContext.Name });

    if (FieldContext === undefined)
    {
        throw new Error("[@noteferry/ui] `useFormField` was used outside of `<FormField>`.");
    }

    if (ItemContext === undefined)
    {
        throw new Error("[@noteferry/ui] `useFormField` was used outside of `<FormItem>`.");
    }

    const FieldState = getFieldState(FieldContext.Name, FormState);

    return {
        FormDescriptionId: `${ ItemContext.Id }-form-item-description`,
        FormItemId: `${ ItemContext.Id }-form-item`,
        FormMessageId: `${ ItemContext.Id }-form-item-message`,
        Id: ItemContext.Id,
        Name: FieldContext.Name,
        ...FieldState
    };
};

/** {@inheritDoc FormItem} */
export interface FormItemProps extends React.PropsWithChildren
{
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Provides a stable identifier and `Field` layout for one controlled form value.
       *
       * @category Component
       * @since 1.0.0
       */
const FormItem = ({ Style, children }: FormItemProps): React.JSX.Element =>
{
    const Id = React.useId();
    const ContextValue = React.useMemo<FormItemContextValue>(() => ({ Id }), [ Id ]);

    return (
        <FormItemContext.Provider value={ ContextValue }>
            <Field Style={ Style }>{ children }</Field>
        </FormItemContext.Provider>
    );
};

export/**
       * A field label that uses the error color when the current form field is invalid.
       *
       * @category Component
       * @since 1.0.0
       */
const FormLabel = (Props: React.ComponentProps<typeof FieldLabel>): React.JSX.Element =>
{
    const { error } = useFormField();
    const { [Semantic.Red]: RedColor } = useToken(Semantic.Red);

    return (
        <FieldLabel
            { ...Props }
            Style={ [ error ? { color: RedColor } : undefined, Props.Style ] }
        />
    );
};

export/**
       * Supporting text for the current form field.
       *
       * @category Component
       * @since 1.0.0
       */
const FormDescription = (Props: React.ComponentProps<typeof FieldDescription>): React.JSX.Element =>
    <FieldDescription { ...Props } />;

export/**
       * Displays the current form field's validation message, falling back to its children.
       *
       * @category Component
       * @since 1.0.0
       */
const FormMessage = (Props: React.ComponentProps<typeof FieldError>): React.JSX.Element | null =>
{
    const { error } = useFormField();
    const Body = error?.message ?? Props.children;

    if (!Body)
    {
        return null;
    }

    return <FieldError>{ Body }</FieldError>;
};
