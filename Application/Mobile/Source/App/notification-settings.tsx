/**
 * Notification preferences. Reached from the "Notifications" row on the
 * settings screen.
 *
 * @module notivex/app/notification-settings
 *
 * @file      notification-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { Setting, SettingsContainer, Switch } from "@notivex/ui/Primitive";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/features/settings/use-settings";
import { Platform, View } from "react-native";
import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {
    RegisterSubscriptionSaleDevice,
    RemoveSubscriptionSaleDevice
} from "@/Domain/Runtime/NotivexApi";
import { useCallback } from "react";
import { useSubscription } from "@/Domain/Subscription";

async function DeviceId(): Promise<string>
{
    if (Platform.OS === "ios")
    {
        return `ios:${await Application.getIosIdForVendorAsync() ?? "unknown"}`;
    }

    return `android:${Application.getAndroidId()}`;
}

const NotificationSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();
    const { Status } = useSubscription();

    const ToggleSales = useCallback(async (Value: boolean): Promise<void> =>
    {
        const Id = await DeviceId();

        if (!Value)
        {
            await Update({ NotifyOnSubscriptionSales: false });
            await RemoveSubscriptionSaleDevice(Id);
            return;
        }

        if (Status?.Active) return;

        let Permission = await Notifications.getPermissionsAsync();
        if (Permission.status !== "granted")
        {
            Permission = await Notifications.requestPermissionsAsync();
        }

        if (Permission.status !== "granted") return;

        const ProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        if (!ProjectId) return;
        const Token = await Notifications.getExpoPushTokenAsync({ projectId: ProjectId });

        await RegisterSubscriptionSaleDevice({
            DeviceId: Id,
            Platform: Platform.OS === "ios" ? "Ios" : "Android",
            PushToken: Token.data
        });
        await Update({ NotifyOnSubscriptionSales: true });
    }, [ Status?.Active, Update ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsContainer>
                    <Setting
                        Description="Notify you if a page was created while offline."
                        Title="Notify when back online">
                        <Switch
                            OnValueChange={ (Value: boolean) =>
                                void Update({ NotifyOnOfflineSubmit: Value }) }
                            Value={ AppSettings.NotifyOnOfflineSubmit }
                        />
                    </Setting>
                    <Setting
                        Description={ Status?.Active
                            ? "Disabled while Notivex Pro is active. Expiration will not turn it back on."
                            : "Optional marketing notifications for limited-time Notivex Pro offers." }
                        Title="Notify me about subscription sales">
                        <Switch
                            Disabled={ Status?.Active === true }
                            OnValueChange={ (Value: boolean) => void ToggleSales(Value) }
                            Value={ Status?.Active ? false : AppSettings.NotifyOnSubscriptionSales }
                        />
                    </Setting>
                </SettingsContainer>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.L
    })
});

export default NotificationSettingsScreen;
