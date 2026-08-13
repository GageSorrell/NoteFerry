/**
 * Replaces every mutator of `ImperativeRouter` with a function that returns a `Thunk`.
 *
 * @module notivex/Domain/Utility/LazyRouter
 *
 * @file      LazyRouter.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    type Href,
    type ImperativeRouter,
    type RouteInputParams,
    type RoutePath,
    useRouter
} from "expo-router";
import { Struct } from "effect";
import type { Thunk } from "@sorrell/utility/Function";

/**
 * The type of the options argument given to many `ImperativeRouter` functions.
 * This type is not directly exported by `expo-router`.
 *
 * @category Router
 * @since 1.0.0
 */
export type NavigationOptions = NonNullable<Parameters<ImperativeRouter["dismissTo"]>[1]>;

/** {@inheritDoc UseLazyRouter} */
export interface LazyImperativeRouter
{
    readonly back: Thunk;
    readonly canGoBack: () => boolean;
    readonly push: (Href: Href, Options?: NavigationOptions) => Thunk;
    readonly navigate: (Href: Href, Options?: NavigationOptions) => Thunk;
    readonly replace: (Href: Href, Options?: NavigationOptions) => Thunk;
    readonly dismiss: (Count?: number) => Thunk;
    readonly dismissTo: (Href: Href, Options?: NavigationOptions) => Thunk;
    readonly dismissAll: Thunk;
    readonly canDismiss: () => boolean;
    readonly setParams: <A extends RoutePath>(Params: Partial<RouteInputParams<A>>) => Thunk;
    readonly reload: Thunk;
    readonly prefetch: (Name: Href) => Thunk;
}

export/**
       * Replaces every mutator of `ImperativeRouter` with a function that returns a `Thunk`.
       *
       * @category Router
       * @since 1.0.0
       */
const UseLazyRouter = (): LazyImperativeRouter =>
{
    const Router = useRouter();

    const dismiss: {
        (Count?: number): Thunk;
        (Count: number | undefined): Thunk;
    } = (Count?: number) => () => Router.dismiss(Count);

    const dismissTo = (Href: Href, Options?: NavigationOptions) => () => Router.dismissTo(Href, Options);
    const navigate = (Href: Href, Options?: NavigationOptions) => () => Router.navigate(Href, Options);
    const prefetch = (Name: Href) => () => Router.prefetch(Name);
    const push = (Href: Href, Options?: NavigationOptions) => () => Router.push(Href, Options);
    const replace = (Href: Href, Options?: NavigationOptions) => () => Router.replace(Href, Options);
    const setParams = <A extends RoutePath>(Params: Partial<RouteInputParams<A>>) =>
        () => Router.setParams(Params);

    const Thunks =
        {
            dismiss,
            dismissTo,
            navigate,
            prefetch,
            push,
            replace,
            setParams
        } as const;

    return Struct.assign(
        Struct.pick(Router, [ "canDismiss", "canGoBack", "back", "dismissAll", "reload" ]),
        Thunks
    );
};
