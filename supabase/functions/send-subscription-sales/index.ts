/** Idempotent Expo Push sender and receipt reconciler for active campaigns. */

import { AdminClient, PrivateSchema } from "../_shared/Database.ts";

const ExpoPushUrl = "https://exp.host/--/api/v2/push/send";
const ExpoReceiptsUrl = "https://exp.host/--/api/v2/push/getReceipts";

Deno.serve(async (Request_: Request): Promise<Response> =>
{
    const Secret = Deno.env.get("SUBSCRIPTION_SALES_WORKER_SECRET");
    if (!Secret || Request_.headers.get("authorization") !== `Bearer ${Secret}`)
    {
        return new Response("Unauthorized", { status: 401 });
    }

    const Ticketed = await PrivateSchema.from("subscription_sale_deliveries")
        .select("campaign_id,user_id,device_id,expo_ticket_id,attempt_count")
        .eq("state", "ticketed")
        .not("expo_ticket_id", "is", null)
        .limit(300);
    const TicketIds = (Ticketed.data ?? []).map((Row) => Row.expo_ticket_id as string);

    if (TicketIds.length > 0)
    {
        const ReceiptResponse = await fetch(ExpoReceiptsUrl, {
            body: JSON.stringify({ ids: TicketIds }),
            headers: { "Content-Type": "application/json" },
            method: "POST"
        });
        const ReceiptBody = await ReceiptResponse.json() as {
            readonly data?: Record<string, { readonly details?: { readonly error?: string }; readonly message?: string; readonly status: string }>;
        };

        for (const Delivery of Ticketed.data ?? [])
        {
            const Receipt = ReceiptBody.data?.[Delivery.expo_ticket_id as string];
            if (!Receipt) continue;
            const Invalid = Receipt.details?.error === "DeviceNotRegistered";
            const RetriesExhausted = Receipt.status !== "ok"
                && !Invalid
                && Delivery.attempt_count >= 5;

            await PrivateSchema.from("subscription_sale_deliveries").update({
                expo_ticket_id: Receipt.status === "ok" || Invalid || RetriesExhausted
                    ? Delivery.expo_ticket_id
                    : null,
                last_error: Receipt.message ?? null,
                next_attempt_at: Receipt.status === "ok" || Invalid || RetriesExhausted
                    ? new Date().toISOString()
                    : new Date(Date.now() + 15 * 60_000).toISOString(),
                state: Receipt.status === "ok"
                    ? "delivered"
                    : Invalid || RetriesExhausted ? "failed" : "retry"
            }).eq("campaign_id", Delivery.campaign_id)
                .eq("user_id", Delivery.user_id)
                .eq("device_id", Delivery.device_id);

            if (Invalid)
            {
                await AdminClient.from("push_devices").update({
                    disabled_at: new Date().toISOString()
                }).eq("user_id", Delivery.user_id).eq("device_id", Delivery.device_id);
            }
        }
    }

    const Now = new Date().toISOString();
    await AdminClient.from("subscription_sales")
        .update({ status: "ended" })
        .eq("status", "active")
        .lte("ends_at", Now);
    await AdminClient.from("subscription_sales")
        .update({ status: "active" })
        .eq("status", "scheduled")
        .lte("starts_at", Now)
        .gt("ends_at", Now);
    const Sale = await AdminClient.from("subscription_sales").select("*")
        .eq("status", "active").lte("starts_at", Now).gt("ends_at", Now)
        .order("starts_at", { ascending: false }).limit(1).maybeSingle();

    if (!Sale.data) return Response.json({ sent: 0 });

    const Profiles = await AdminClient.from("profiles").select("user_id")
        .contains("settings", { NotifyOnSubscriptionSales: true }).limit(1000);
    const UserIds = (Profiles.data ?? []).map((Profile) => Profile.user_id);
    if (UserIds.length === 0) return Response.json({ sent: 0 });

    const [ Devices, Paid ] = await Promise.all([
        AdminClient.from("push_devices").select("*")
            .in("user_id", UserIds).is("disabled_at", null).limit(1000),
        AdminClient.from("subscription_entitlements").select("user_id")
            .in("user_id", UserIds).eq("active", true)
    ]);
    const PaidIds = new Set((Paid.data ?? []).map((Row) => Row.user_id));
    const Eligible = (Devices.data ?? []).filter((Device) => !PaidIds.has(Device.user_id));
    let Sent = 0;

    for (let Offset = 0; Offset < Eligible.length; Offset += 100)
    {
        const Batch = Eligible.slice(Offset, Offset + 100);
        const ToSend: Array<{
            readonly AttemptCount: number;
            readonly Device: typeof Batch[number];
        }> = [];

        for (const Device of Batch)
        {
            const Existing = await PrivateSchema.from("subscription_sale_deliveries")
                .select("attempt_count,next_attempt_at,state")
                .eq("campaign_id", Sale.data.campaign_id)
                .eq("user_id", Device.user_id)
                .eq("device_id", Device.device_id)
                .maybeSingle();

            if (!Existing.data)
            {
                const Insert = await PrivateSchema.from("subscription_sale_deliveries").insert({
                    campaign_id: Sale.data.campaign_id,
                    device_id: Device.device_id,
                    user_id: Device.user_id
                });
                if (!Insert.error) ToSend.push({ AttemptCount: 0, Device });
                continue;
            }

            const RetryIsDue = Existing.data.state === "retry"
                && new Date(Existing.data.next_attempt_at).getTime() <= Date.now();
            if (RetryIsDue && Existing.data.attempt_count < 5)
            {
                ToSend.push({ AttemptCount: Existing.data.attempt_count, Device });
            }
        }

        if (ToSend.length === 0) continue;
        const Response_ = await fetch(ExpoPushUrl, {
            body: JSON.stringify(ToSend.map(({ Device }) => ({
                body: Sale.data.copy,
                data: { campaignId: Sale.data.campaign_id, url: Sale.data.deep_link },
                sound: "default",
                title: "NoteFerry Pro sale",
                to: Device.push_token
            }))),
            headers: { "Content-Type": "application/json" },
            method: "POST"
        });
        const Result = await Response_.json() as {
            readonly data?: ReadonlyArray<{ readonly id?: string; readonly message?: string; readonly status: string }>;
        };

        for (let Index = 0; Index < ToSend.length; Index += 1)
        {
            const { AttemptCount, Device } = ToSend[Index]!;
            const Ticket = Result.data?.[Index];
            const NextAttemptCount = AttemptCount + 1;
            const WasAccepted = Ticket?.status === "ok";
            const RetryAt = new Date(Date.now()
                + Math.min(60, 2 ** NextAttemptCount) * 60_000).toISOString();
            await PrivateSchema.from("subscription_sale_deliveries").update({
                attempt_count: NextAttemptCount,
                expo_ticket_id: Ticket?.id ?? null,
                last_error: Ticket?.message ?? (Response_.ok ? null : `Expo HTTP ${Response_.status}`),
                next_attempt_at: WasAccepted ? new Date().toISOString() : RetryAt,
                state: WasAccepted ? "ticketed" : NextAttemptCount >= 5 ? "failed" : "retry"
            }).eq("campaign_id", Sale.data.campaign_id)
                .eq("user_id", Device.user_id)
                .eq("device_id", Device.device_id);
            Sent += 1;
        }
    }

    return Response.json({ sent: Sent });
});
