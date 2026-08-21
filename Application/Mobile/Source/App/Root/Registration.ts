/**
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
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

const HandledNotificationIds = new Set<string>();

function HandleNotificationResponse(Response: Notifications.NotificationResponse): void
{
    const Identifier = Response.notification.request.identifier;
    if (HandledNotificationIds.has(Identifier)) return;

    const CampaignId = Response.notification.request.content.data?.campaignId;
    if (typeof CampaignId !== "string") return;

    HandledNotificationIds.add(Identifier);
    router.push({ params: { campaignId: CampaignId }, pathname: "/subscribe" });
}

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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    useEffect(Function.AsVoid(RegisterDevelopmentMenu), [ ]);
    useEffect(() =>
    {
        void Notifications.getLastNotificationResponseAsync()
            .then((Response) => { if (Response) HandleNotificationResponse(Response); })
            .catch(() => undefined);
        const Subscription = Notifications.addNotificationResponseReceivedListener(
            HandleNotificationResponse
        );

        return Subscription.remove;
    }, [ ]);
};
