/**
 * The unauthenticated notify webhook for a new `app.account_data_requests`
 * row. Called server-to-server by the `account_data_requests_notify` Postgres
 * trigger (`supabase/schemas/11_notifications.sql`) via `pg_net`, not by the
 * app, so it carries no Supabase user JWT and is deployed with
 * `verify_jwt = false`. Authenticity is instead checked with a shared secret
 * header the trigger and this function both know.
 *
 * Emails NoteFerry via Resend so the request can be fulfilled by hand; nothing
 * here writes back to the database.
 *
 * @module noteferry/functions/notify-account-data-request
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

interface AccountDataRequestPayload
{
    readonly id: string;
    readonly user_id: string;
    readonly created_at: string;
}

Deno.serve(async (Request: Request) =>
{
    const ExpectedSecret = Deno.env.get("WEBHOOK_SECRET");
    const ProvidedSecret = Request.headers.get("x-noteferry-webhook-secret");

    if (!ExpectedSecret || ProvidedSecret !== ExpectedSecret)
    {
        return new Response("Unauthorized", { status: 401 });
    }

    const ResendApiKey = Deno.env.get("RESEND_API_KEY");
    const NotifyEmail = Deno.env.get("ACCOUNT_DATA_REQUEST_NOTIFY_EMAIL");

    if (!ResendApiKey || !NotifyEmail)
    {
        return new Response("Server misconfigured", { status: 500 });
    }

    let Payload: AccountDataRequestPayload;

    try
    {
        Payload = await Request.json();
    }
    catch
    {
        return new Response("Invalid payload", { status: 400 });
    }

    const EmailResponse = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
            from: "NoteFerry <noreply@notifications.sorrell.sh>",
            html: `<p>User <code>${ Payload.user_id }</code> requested a copy of `
                + `their account data (request <code>${ Payload.id }</code>, `
                + `${ Payload.created_at }).</p>`,
            subject: "NoteFerry: account data request",
            to: [ NotifyEmail ]
        }),
        headers:
        {
            Authorization: `Bearer ${ ResendApiKey }`,
            "Content-Type": "application/json"
        },
        method: "POST"
    });

    if (!EmailResponse.ok)
    {
        const Detail = await EmailResponse.text();

        /* eslint-disable-next-line no-console */
        console.error("Failed to send account-data-request email", Detail);

        return new Response("Failed to notify", { status: 502 });
    }

    return new Response(null, { status: 204 });
});
