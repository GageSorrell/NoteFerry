/**
 * Displays a rasterized inline equation via a plain RN `Image` -- the one
 * documented exception to React Native's "only `Text`/`Image` inside
 * `Text`" rule, which is why inline equations rasterize to a PNG at all
 * rather than rendering live like block equations (`BlockEquationRenderer`)
 * do. Requests rasterization from `EquationRasterizerProvider` on mount and
 * shows `Fallback` until a result lands in its cache, or permanently on a
 * malformed expression.
 *
 * @module noteferry/Component/Equation/InlineEquationRenderer
 *
 * @file      InlineEquationRenderer.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Image, type TextStyle } from "react-native";
import { useEffect } from "react";
import { useEquationRasterizer } from "./EquationRasterizerProvider";

/** {@inheritDoc InlineEquationRenderer} */
export interface InlineEquationRendererProps
{
    readonly Expression: string;
    readonly Style?: TextStyle | undefined;
    readonly Fallback: React.ReactElement;
}

export/**
       * Renders a single inline equation as a rasterized image, once the
       * shared rasterizer has produced one.
       *
       * @category Components
       * @since 1.0.0
       */
const InlineEquationRenderer = ({ Expression, Fallback }: InlineEquationRendererProps): React.JSX.Element =>
{
    const { Cache, RequestRasterization } = useEquationRasterizer();

    useEffect(() =>
    {
        RequestRasterization(Expression);
    }, [ Expression, RequestRasterization ]);

    const Entry = Cache.get(Expression);

    if (!Entry || Entry.Status === "error")
    {
        return Fallback as React.JSX.Element;
    }

    return (
        <Image
            resizeMode="contain"
            source={ { uri: Entry.Uri } }
            style={ { width: Entry.Width, height: Entry.Height } } />
    );
};
