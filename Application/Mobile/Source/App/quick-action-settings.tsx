/**
 * Quick-action shortcut selection — up to six databases shown as
 * `expo-quick-actions` shortcuts on long-press. Reached from the "Quick
 * Actions" row on the settings screen.
 *
 * @module noteferry/app/quick-action-settings
 *
 * @file      quick-action-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { Checkbox, Description, Setting, SettingsContainer } from "@noteferry/ui/Primitive";
import { MakeStyles, Token, ViewStyle } from "@noteferry/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, View } from "react-native";
import { useCallback } from "react";
import { useConnections } from "@/Domain/Connection";
import { useSettings } from "@/features/settings/use-settings";
import { useSubscription } from "@/Domain/Subscription";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

const QuickActionSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { DataSources } = useConnections();
    const { Settings: AppSettings, Update } = useSettings();
    const { HasProAccess } = useSubscription();
    const Router = useLazyRouter();

    const ToggleQuickAction = useCallback((DataSourceId: Domain.Id.NotionDataSourceId) =>
    {
        const Current = AppSettings.QuickActionDataSourceIds;
        const IsAdding = !Current.includes(DataSourceId);

        if (IsAdding && !HasProAccess && Current.length >= 1)
        {
            Alert.alert(
                "Add more Quick Actions with Pro",
                "Free includes one home-screen database shortcut. Pro includes up to six.",
                [
                    { style: "cancel", text: "Not now" },
                    { onPress: Router.push("/plans"), text: "Compare plans" },
                    { onPress: Router.push("/subscribe"), text: "Upgrade" }
                ]
            );
            return;
        }

        const Next = Current.includes(DataSourceId)
            ? Current.filter((Id: Domain.Id.NotionDataSourceId) => Id !== DataSourceId)
            : [ ...Current, DataSourceId ];

        void Update({ QuickActionDataSourceIds: Next });
    }, [ AppSettings.QuickActionDataSourceIds, HasProAccess, Router, Update ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Description>
                    Free includes one database shortcut; Pro includes up to six.
                    Long-press the app icon to use one. Your full saved selection
                    is restored after re-upgrading.
                </Description>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    <SettingsContainer>
                        { DataSources.map((
                            Source: Domain.DataSource.CachedDataSourceSchema
                        ) =>
                        {
                            const Checked = AppSettings.QuickActionDataSourceIds
                                .includes(Source.DataSourceId);
                            const EffectiveLimit = HasProAccess ? 6 : 1;
                            const AtLimit = AppSettings.QuickActionDataSourceIds.length >= EffectiveLimit;

                            return (
                                <Setting
                                    Title={ Source.Title }
                                    key={ Source.DataSourceId }>
                                    <Checkbox
                                        Checked={ Checked }
                                        Disabled={ !Checked && AtLimit && HasProAccess }
                                        OnCheckedChange={ () => ToggleQuickAction(Source.DataSourceId) }
                                    />
                                </Setting>
                            );
                        }) }
                    </SettingsContainer>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    List: ViewStyle({
        paddingVertical: Token.Spacing.M
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.M,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.L
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    })
});

export default QuickActionSettingsScreen;
