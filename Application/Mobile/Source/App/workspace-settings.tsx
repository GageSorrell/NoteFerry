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

import { MakeStyles, Token, ViewStyle } from "@noteferry/ui";
import { Setting, SettingsContainer, Switch } from "@noteferry/ui/Primitive";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/features/settings/use-settings";
import { View } from "react-native";

const WorkspaceSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Settings: AppSettings, Update } = useSettings();

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <SettingsContainer>
                    <Setting
                        Description="Show every connected workspace's databases together on the home screen, instead of just the current workspace's."
                        Title="Show all databases from all workspaces">
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
