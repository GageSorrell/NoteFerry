/**
 *
 *
 * @module @notivex/ui/Utility/Utility
 * @internal
 *
 * @file      Utility.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export const MakeGetSymbolKey = <const TypeIdType extends string = string>(InTypeId: TypeIdType) => (Label: string) => `~${ InTypeId }!${ Label }`;
