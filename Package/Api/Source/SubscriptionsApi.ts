/** Subscription state, allowance, sale, and push-device API contract. */

import * as Domain from "@notivex/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";

export const RegisterDevicePayload = Schema.Struct({
    DeviceId: Schema.String,
    Platform: Domain.Subscription.DevicePlatform,
    PushToken: Schema.String
});

export const RemoveDevicePayload = Schema.Struct({ DeviceId: Schema.String });

const CommonErrors = [
    Domain.Error.AuthenticationRequired,
    Domain.Error.DatabaseError,
    Domain.Error.NetworkError
] as const;

const Status = HttpApiEndpoint.get("Status", "/Status", {
    error: CommonErrors,
    success: Domain.Subscription.SubscriptionStatus
});

const Allowance = HttpApiEndpoint.get("Allowance", "/Allowance", {
    error: CommonErrors,
    success: Domain.Subscription.CreationAllowance
});

const Refresh = HttpApiEndpoint.post("Refresh", "/Refresh", {
    error: CommonErrors,
    success: Domain.Subscription.SubscriptionStatus
});

const Sale = HttpApiEndpoint.get("Sale", "/Sale", {
    error: CommonErrors,
    success: Domain.Subscription.ActiveSaleResponse
});

const RegisterDevice = HttpApiEndpoint.post("RegisterDevice", "/Devices", {
    error: CommonErrors,
    payload: RegisterDevicePayload,
    success: Schema.Void
});

const RemoveDevice = HttpApiEndpoint.post("RemoveDevice", "/Devices/Remove", {
    error: CommonErrors,
    payload: RemoveDevicePayload,
    success: Schema.Void
});

export const SubscriptionsApi = HttpApiGroup.make("Subscriptions").add(
    Status,
    Allowance,
    Refresh,
    Sale,
    RegisterDevice,
    RemoveDevice
);
