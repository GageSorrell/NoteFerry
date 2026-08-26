/**
 * A root View for screens.
 *
 * @module noteferry/Component/Screen
 *
 * @file      Screen.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import { type StyleProp, View, type ViewProps, type ViewStyle } from "react-native";
import type React from "react";

/** {@inheritDoc Screen} */
export interface ScreenProps extends Omit<ViewProps, "children">
{
    readonly OuterProps?: Omit<ViewProps, "children">;
    readonly InnerProps?: Omit<SafeAreaViewProps, "children">;
    readonly children: React.JSX.Element;
}

const AppendStyle = (Appended: StyleProp<ViewStyle>) =>
    (In: object): (typeof In & { readonly style: any; }) =>
    {
        if ("style" in In && typeof In.style === "object" && In.style !== null)
        {
            if (Array.isArray(In.style))
            {
                return {
                    ...In,
                    style: [ ...In.style, Appended ]
                } as const;
            }
            else
            {
                return {
                    ...In,
                    style:
                    {
                        ...In.style,
                        ...Appended
                    }
                } as const;
            }
        }
        else
        {
            return {
                ...In,
                style: Appended
            } as const;
        }
    };

export/**
       * A root View for screens.
       *
       * @category Component
       * @since 1.0.0
       */
const Screen = (Props: ScreenProps): React.JSX.Element =>
{
    const {
        InnerProps: InInnerProps = { },
        OuterProps: InOuterProps = { },
        children
    } = Props;

    const OuterBaseStyle = { flex: 1 } as const;

    const InnerBaseStyle =
        {
            flex: 1,
            paddingHorizontal: 32,
            paddingVertical: 24
        } as const;

    const OuterProps = AppendStyle(OuterBaseStyle)(InOuterProps);
    const InnerProps = AppendStyle(InnerBaseStyle)(InInnerProps);

    return (
        <View { ...OuterProps }>
            <SafeAreaView { ...InnerProps }>
                { children }
            </SafeAreaView>
        </View>
    );
};

Screen.displayName = "Screen";
