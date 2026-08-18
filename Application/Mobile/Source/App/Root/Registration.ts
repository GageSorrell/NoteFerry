/**
 *
 *
 * @module notivex/App/Root/Registration
 *
 * @file      Registration.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Function } from "@sorrell/effect";
import { RegisterDevelopmentMenu } from "@/Domain/Runtime/DevelopmentMenu";
import { useEffect } from "react";

export/**
       * Run application-scope registration functions. Quick actions are *not*
       * registered here — they depend on the current data sources and
       * settings, which are only available once signed in, so that runs from
       * `RootNavigator` and the home/settings screens instead.
       *
       * @category Hook
       * @since 1.0.0
       */
const useRootRegistration = () =>
{
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(Function.AsVoid(RegisterDevelopmentMenu), [ ]);
    /* eslint-enable react-hooks/exhaustive-deps */
};
