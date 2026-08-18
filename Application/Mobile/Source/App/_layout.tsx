/**
 * @module notivex/app/_layout
 *
 * @file      _layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Providers, RootNavigator, useRootRegistration } from "./Root";

/* eslint-disable-next-line jsdoc/require-jsdoc */
export default function RootLayout()
{
    useRootRegistration();

    return (
        <Providers>
            <RootNavigator />
        </Providers>
    );

}
