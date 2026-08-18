/**
 * Package-specific errors thrown by `@notivex/ui`.
 *
 * @module @notivex/ui/NotivexUiError
 *
 * @file      NotivexUiError.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/**
 * An error originating from `@notivex/ui`.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotivexUiError extends Error
{
    /**
     * Creates an `@notivex/ui` error with the required package-prefixed message.
     *
     * @param Message - The error message without the package prefix.
     */
    public constructor(Message: string)
    {
        super(`[@notivex/ui] ${ Message }`);
        this.name = "NotivexUiError";
    }
}
