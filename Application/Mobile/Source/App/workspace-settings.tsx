/**
 * Workspaces settings: whether the home screen shows every connected
 * workspace's databases together, or just the current workspace's. Reached
 * from the "Workspaces" row on the settings screen.
 *
 * @module noteferry/app/workspace-settings
 *
 * @file      workspace-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { MakeStyles, Token, ViewStyle } from "@noteferry/ui/Core";
import { Setting, SettingsContainer } from "@noteferry/ui/Primitive/Setting";
import { Switch } from "@noteferry/ui/Primitive/Switch";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { useSettings } from "@/features/settings/use-settings";
import { useTranslation } from "react-i18next";

const WorkspaceSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();
    const { t } = useTranslation("settings");

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsContainer>
                    <Setting
                        Description={ t("workspaceSettings.showAll.description") }
                        Title={ t("workspaceSettings.showAll.title") }>
                        <Switch
                            OnValueChange={ (Value: boolean) =>
                                void Update({ ShowAllWorkspaceDatabases: Value }) }
                            Value={ AppSettings.ShowAllWorkspaceDatabases }
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

export default WorkspaceSettingsScreen;
