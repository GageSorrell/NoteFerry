/**
 *
 *
 * @module @noteferry/ui/Utility/Utility
 * @internal
 *
 * @file      Utility.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * Construct symbol keys for a given module.
       * @internal
       *
       * @category Utility
       * @since 1.0.0
       */
const MakeGetSymbolKey = <const TypeIdType extends string = string>(InTypeId: TypeIdType) =>
    (Label: string) => `~${ InTypeId }!${ Label }`;
