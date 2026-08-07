/**
 * Minimal ambient declarations so the edge-function sources (which run in Deno)
 * can be type-checked in the Node/workspace toolchain, where `effect` and the
 * built `@notivex/*` contracts resolve. This file is NOT shipped to Deno — the
 * real globals come from the Deno runtime. See `_typecheck/tsconfig.json`.
 */

/* eslint-disable */

declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): unknown;
};
