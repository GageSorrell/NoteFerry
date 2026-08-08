/**
 *
 *
 * @module @notivex/icons/Icon.Types
 *
 * @file      Icon.Types.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { SvgProps } from "react-native-svg";

/**
 * The props to render the underlying vector graphic of a Notivex icon.
 *
 * @category Component
 * @since 1.0.0
 */
export interface NotivexIconProps extends Omit<SvgProps, "color">
{
    /** The fill applied to the whole (monochrome) icon. Defaults to `#231F20`. */
    color?: SvgProps["color"];
}
