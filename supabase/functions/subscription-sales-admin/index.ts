/** Secret-protected v1 sale campaign administration; intentionally no UI. */

import { AdminClient } from "../_shared/Database.ts";

Deno.serve(async (Request_: Request): Promise<Response> =>
{
    const Secret = Deno.env.get("SUBSCRIPTION_SALES_ADMIN_SECRET");
    if (!Secret || Request_.headers.get("x-notivex-admin-secret") !== Secret)
    {
        return new Response("Unauthorized", { status: 401 });
    }

    if (Request_.method === "GET")
    {
        const Result = await AdminClient.from("subscription_sales").select("*")
            .order("starts_at", { ascending: false });
        return Result.error
            ? new Response(Result.error.message, { status: 500 })
            : Response.json(Result.data);
    }

    if (Request_.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const Body = await Request_.json() as Record<string, unknown>;
    const Action = Body.Action;
    const Campaign = Body.Campaign as Record<string, unknown> | undefined;

    if (Action === "Upsert" && Campaign)
    {
        const Result = await AdminClient.from("subscription_sales").upsert({
            campaign_id: Campaign.CampaignId,
            copy: Campaign.Copy,
            deep_link: Campaign.DeepLink,
            ends_at: Campaign.EndsAt,
            offering_identifier: Campaign.OfferingIdentifier,
            starts_at: Campaign.StartsAt,
            status: Campaign.Status ?? "draft",
            targeted_packages: Campaign.TargetedPackages
        }).select("*").single();

        return Result.error
            ? new Response(Result.error.message, { status: 400 })
            : Response.json(Result.data);
    }

    if ((Action === "Activate" || Action === "End") && typeof Body.CampaignId === "string")
    {
        const Result = await AdminClient.from("subscription_sales")
            .update({ status: Action === "Activate" ? "active" : "ended" })
            .eq("campaign_id", Body.CampaignId)
            .select("*")
            .single();

        return Result.error
            ? new Response(Result.error.message, { status: 400 })
            : Response.json(Result.data);
    }

    return new Response("Invalid action", { status: 400 });
});
