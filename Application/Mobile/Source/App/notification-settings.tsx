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
import { View } from "react-native";

const NotificationSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();

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
