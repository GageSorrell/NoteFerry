/** RevenueCat webhook receiver. Authenticates, stores idempotently, and refreshes. */

import * as Subscriptions from "../_shared/Subscriptions.ts";
import { Effect } from "effect";
import { PrivateSchema } from "../_shared/Database.ts";

const Equal = (Left: string, Right: string): boolean =>
{
    const Encoder = new TextEncoder();
    const A = Encoder.encode(Left);
    const B = Encoder.encode(Right);

    if (A.length !== B.length) return false;

    let Difference = 0;
    for (let Index = 0; Index < A.length; Index += 1) Difference |= A[Index]! ^ B[Index]!;

    return Difference === 0;
};

const Signature = async (Payload: string, Secret: string): Promise<string> =>
{
    const Encoder = new TextEncoder();
    const Key = await crypto.subtle.importKey(
        "raw",
        Encoder.encode(Secret),
        { hash: "SHA-256", name: "HMAC" },
        false,
        [ "sign" ]
    );
    const Bytes = new Uint8Array(await crypto.subtle.sign("HMAC", Key, Encoder.encode(Payload)));

    return Array.from(Bytes).map((Byte) => Byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (Request_: Request): Promise<Response> =>
{
    if (Request_.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const Authorization = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION");
    const HmacSecret = Deno.env.get("REVENUECAT_WEBHOOK_HMAC_SECRET");
    const PresentedAuthorization = Request_.headers.get("authorization") ?? "";
    const SignatureParts = Object.fromEntries(
        (Request_.headers.get("x-revenuecat-webhook-signature") ?? "")
            .split(",")
            .map((Part) => Part.trim().split("=", 2))
            .filter((Part) => Part.length === 2)
    );
    const Timestamp = SignatureParts.t ?? "";
    const PresentedSignature = (SignatureParts.v1 ?? "").toLowerCase();
    const BodyText = await Request_.text();
    const TimestampSeconds = Number(Timestamp);
    const TimestampIsFresh = Number.isFinite(TimestampSeconds)
        && Math.abs(Date.now() / 1000 - TimestampSeconds) <= 300;

    if (!Authorization || !HmacSecret
        || !Equal(PresentedAuthorization, Authorization)
        || !TimestampIsFresh
        || !Equal(
            PresentedSignature,
            await Signature(`${Timestamp}.${BodyText}`, HmacSecret)
        ))
    {
        return new Response("Unauthorized", { status: 401 });
    }

    let Body: Record<string, unknown>;
    try
    {
        Body = JSON.parse(BodyText) as Record<string, unknown>;
    }
    catch
    {
        return new Response("Invalid JSON", { status: 400 });
    }

    const Event = Body.event as Record<string, unknown> | undefined;
    const EventId = Event?.id as string | undefined;
    const AppUserId = Event?.app_user_id as string | undefined;
    const CandidateUserIds = [
        AppUserId,
        ...(Array.isArray(Event?.transferred_to) ? Event.transferred_to : [ ]),
        ...(Array.isArray(Event?.transferred_from) ? Event.transferred_from : [ ])
    ].filter((Value): Value is string => typeof Value === "string"
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(Value));

    if (!EventId)
    {
        return new Response("Missing event id", { status: 400 });
    }

    const Stored = await PrivateSchema.from("revenuecat_webhook_events").insert({
        app_user_id: AppUserId ?? null,
        body: Body,
        event_id: EventId,
        event_type: Event?.type ?? "UNKNOWN"
    });

    if (Stored.error?.code === "23505")
    {
        const Existing = await PrivateSchema.from("revenuecat_webhook_events")
            .select("processed_at")
            .eq("event_id", EventId)
            .single();
        if (Existing.data?.processed_at) return Response.json({ duplicate: true });
        /* A prior delivery was stored but its RevenueCat refresh failed. Let
         * the retry resume processing the same immutable event. */
    }
    if (Stored.error && Stored.error.code !== "23505")
    {
        return new Response("Storage failed", { status: 500 });
    }

    try
    {
        for (const UserId of new Set(CandidateUserIds))
        {
            await Effect.runPromise(Subscriptions.RefreshFromRevenueCat(UserId));
        }

        await PrivateSchema
            .from("revenuecat_webhook_events")
            .update({ processed_at: new Date().toISOString() })
            .eq("event_id", EventId);

        return Response.json({ processed: true });
    }
    catch (Error_)
    {
        await PrivateSchema
            .from("revenuecat_webhook_events")
            .update({ processing_error: String(Error_) })
            .eq("event_id", EventId);

        return new Response("Refresh failed", { status: 503 });
    }
});
