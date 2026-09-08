/**
 * CORS support for edge functions called directly from a browser. Today
 * that's only `api` (from the website's `/delete-account` page) — every
 * other caller of `api` is the mobile app's `fetch`, which isn't subject to
 * CORS, so this stayed unnecessary until now.
 *
 * @module noteferry/functions/_shared/Cors
 *
 * @file      Cors.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** Browser origins allowed to call CORS-protected edge functions. */
const AllowedOrigins: ReadonlyArray<string> = [
    "https://noteferry.sorrell.sh",
    "http://localhost:3000"
];

/**
 * The CORS response headers for a request from `Origin`. Falls back to the
 * production origin when `Origin` is missing or not allow-listed, so a
 * disallowed browser origin still gets a well-formed (if useless to it)
 * response rather than a header that echoes an untrusted value.
 *
 * @category Cors
 * @since 1.0.0
 */
export const HeadersFor = (Origin: string | null): HeadersInit =>
{
    const AllowOrigin = Origin && AllowedOrigins.includes(Origin) ? Origin : AllowedOrigins[0];

    return {
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Origin": AllowOrigin,
        Vary: "Origin"
    };
};

/**
 * Handles an `OPTIONS` preflight request, or `null` if `Request_` isn't one.
 *
 * @category Cors
 * @since 1.0.0
 */
export const HandlePreflight = (Request_: Request): Response | null =>
{
    if (Request_.method !== "OPTIONS")
    {
        return null;
    }

    return new Response(null, { headers: HeadersFor(Request_.headers.get("Origin")), status: 204 });
};

/**
 * Returns a copy of `Response_` with CORS headers for `Origin` added.
 *
 * @category Cors
 * @since 1.0.0
 */
export const WithCors = (Response_: Response, Origin: string | null): Response =>
{
    const Headers_ = new Headers(Response_.headers);

    for (const [ Key, Value ] of Object.entries(HeadersFor(Origin)))
    {
        Headers_.set(Key, Value);
    }

    return new Response(Response_.body, {
        headers: Headers_,
        status: Response_.status,
        statusText: Response_.statusText
    });
};
