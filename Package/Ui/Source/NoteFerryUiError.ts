/**
 * Package-specific errors thrown by `@noteferry/ui`.
 *
 * @module @noteferry/ui/NoteFerryUiError
 *
 * @file      NoteFerryUiError.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/**
 * An error originating from `@noteferry/ui`.
 *
 * @category Error
 * @since 1.0.0
 */
export class NoteFerryUiError extends Error
{
    /**
     * Creates an `@noteferry/ui` error with the required package-prefixed message.
     *
     * @param Message - The error message without the package prefix.
     */
    public constructor(Message: string)
    {
        super(`[@noteferry/ui] ${ Message }`);
        this.name = "NoteFerryUiError";
    }
}
