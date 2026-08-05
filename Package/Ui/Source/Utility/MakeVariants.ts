/**
 * A `class-variance-authority`-shaped variant helper for React Native
 * `StyleSheet` objects.  Since the token system resolves to plain JS values
 * (not CSS custom properties), variant authoring is a matter of picking
 * which precomputed style object(s) apply for a given `{Variant, Size, ...}`
 * prop combination — this is the mechanical equivalent of `cva()` used
 * throughout `@notion-kit/ui`'s `primitives/variants.ts`.
 *
 * @module @notivex/ui/Utility/MakeVariants
 * @internal
 *
 * @file      MakeVariants.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

/**
 *
 */
export type VariantStyle =
    | ViewStyle
    | TextStyle
    | ImageStyle;

/**
 *
 */
export type VariantAxis<StyleType extends VariantStyle> = Record<string, StyleType>;

/**
 *
 */
export interface MakeVariantsConfig<
    StyleType extends VariantStyle,
    Axes extends Record<string, VariantAxis<StyleType>>>
{
    readonly Base?: StyleType;
    readonly Variants: Axes;
    readonly DefaultVariants?:
    {
        readonly [ AxisName in keyof Axes ]?: keyof Axes[AxisName];
    };
}

/**
 *
 */
export type VariantProps<Axes extends Record<string, VariantAxis<VariantStyle>>> =
    {
        readonly [AxisName in keyof Axes]?: keyof Axes[AxisName];
    };

export/**
       * `MakeVariants({Base, Variants: {Variant: {...}, Size: {...}}})` returns a
       * function `(Props) => ReadonlyArray<StyleType>` suitable for spreading directly into an
       * RN `style` prop array: `style={ButtonVariants({ Variant: "Primary" })}`.
       */
const MakeVariants = <
    StyleType extends VariantStyle,
    Axes extends Record<string, VariantAxis<StyleType>>
>(Config: MakeVariantsConfig<StyleType, Axes>) =>
    (Props?: VariantProps<Axes>): ReadonlyArray<StyleType> =>
    {
        const Styles: Array<StyleType> = [ ];

        if (Config.Base !== undefined)
        {
            Styles.push(Config.Base);
        }

        for (const AxisName of Object.keys(Config.Variants) as Array<keyof Axes>)
        {
            const SelectedOption = (Props?.[AxisName] ?? Config.DefaultVariants?.[AxisName]) as string | undefined;

            if (SelectedOption === undefined)
            {
                continue;
            }

            const AxisStyles = Config.Variants[AxisName] as Record<string, StyleType>;
            const StyleForOption = AxisStyles[SelectedOption];

            if (StyleForOption !== undefined)
            {
                Styles.push(StyleForOption);
            }
        }

        return Styles;
    };
