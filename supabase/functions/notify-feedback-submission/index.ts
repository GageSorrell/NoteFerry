/**
 * The unauthenticated notify webhook for a new `app.feedback_submissions`
 * row. Called server-to-server by the `feedback_submissions_notify` Postgres
 * trigger (`supabase/schemas/11_notifications.sql`) via `pg_net`, not by the
 * app, so it carries no Supabase user JWT and is deployed with
 * `verify_jwt = false`. Authenticity is instead checked with a shared secret
 * header the trigger and this function both know (the same
 * `WEBHOOK_SECRET` the `notify-account-data-request` function uses).
 *
 * Emails NoteFerry via Resend so the feedback or bug report can be triaged by
 * hand. When the submitter opted to share their contact info, their account
 * email is resolved here (service role) and included so they can be replied
 * to directly; nothing else writes back to the database.
 *
 * @module noteferry/functions/notify-feedback-submission
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createClient } from "@supabase/supabase-js";

interface FeedbackSubmissionPayload
{
    readonly id: string;
    readonly user_id: string;
    readonly kind: "bug_report" | "feedback";
    readonly message: string;
    readonly share_contact: boolean;
    readonly created_at: string;
}

/* This webhook only ever notifies NoteFerry's own maintainer, so unlike
 * `ACCOUNT_DATA_REQUEST_NOTIFY_EMAIL` it is a fixed address rather than an
 * env var — one fewer secret to provision per environment. */
const NotifyEmail = "gage@sorrell.sh";

const EscapeHtml = (Value: string): string =>
{
    return Value
        .replace(/&/gu, "&amp;")
        .replace(/</gu, "&lt;")
        .replace(/>/gu, "&gt;")
        .replace(/"/gu, "&quot;");
};

Deno.serve(async (Request: Request) =>
{
    const ExpectedSecret = Deno.env.get("WEBHOOK_SECRET");
    const ProvidedSecret = Request.headers.get("x-noteferry-webhook-secret");

    if (!ExpectedSecret || ProvidedSecret !== ExpectedSecret)
    {
        return new Response("Unauthorized", { status: 401 });
    }

    const ResendApiKey = Deno.env.get("RESEND_API_KEY");
    const SupabaseUrl = Deno.env.get("SUPABASE_URL");
    const ServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ResendApiKey || !SupabaseUrl || !ServiceRoleKey)
    {
        return new Response("Server misconfigured", { status: 500 });
    }

    let Payload: FeedbackSubmissionPayload;

    try
    {
        Payload = await Request.json();
    }
    catch
    {
        return new Response("Invalid payload", { status: 400 });
    }

    let ContactLine = "The user opted not to share contact info.";

    if (Payload.share_contact)
    {
        const AdminClient = createClient(SupabaseUrl, ServiceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data } = await AdminClient.auth.admin.getUserById(Payload.user_id);

        ContactLine = data.user?.email
            ? `Reply to: <a href="mailto:${ EscapeHtml(data.user.email) }">${ EscapeHtml(data.user.email) }</a>`
            : "The user opted to share contact info, but no email was found.";
    }

    const KindLabel = Payload.kind === "bug_report" ? "Bug report" : "Feedback";
    const MessageHtml = EscapeHtml(Payload.message).replace(/\n/gu, "<br />");

    const EmailResponse = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
            from: "NoteFerry <noreply@notifications.sorrell.sh>",
            html: `<p><strong>${ KindLabel }</strong> from user `
                + `<code>${ Payload.user_id }</code> (${ Payload.created_at }).</p>`
                + `<p>${ ContactLine }</p>`
                + `<p>${ MessageHtml }</p>`,
            subject: `NoteFerry: ${ KindLabel.toLowerCase() }`,
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
        console.error("Failed to send feedback-submission email", Detail);

        return new Response("Failed to notify", { status: 502 });
    }

    return new Response(null, { status: 204 });
});
