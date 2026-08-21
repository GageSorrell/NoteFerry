/**
 * Quick-action shortcut selection — up to six databases shown as
 * `expo-quick-actions` shortcuts on long-press. Reached from the "Quick
 * Actions" row on the settings screen.
 *
 * @module notivex/app/quick-action-settings
 *
 * @file      quick-action-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Checkbox, Description, Setting, SettingsContainer } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View } from "react-native";
import { useCallback } from "react";
import { useConnections } from "@/Domain/Connection";
import { useSettings } from "@/features/settings/use-settings";

const QuickActionSettingsScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { DataSources } = useConnections();
    const { Settings: AppSettings, Update } = useSettings();

    const ToggleQuickAction = useCallback((DataSourceId: Domain.Id.NotionDataSourceId) =>
    {
        const Current = AppSettings.QuickActionDataSourceIds;
        const Next = Current.includes(DataSourceId)
            ? Current.filter((Id: Domain.Id.NotionDataSourceId) => Id !== DataSourceId)
            : [ ...Current, DataSourceId ];

        void Update({ QuickActionDataSourceIds: Next });
    }, [ AppSettings.QuickActionDataSourceIds, Update ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Description>
                    Choose up to six databases to show as home-screen shortcuts
                    (long-press the app icon). Leave all unchecked to use the first
                    six databases automatically.
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
                            const AtLimit = AppSettings.QuickActionDataSourceIds.length >= 6;

                            return (
                                <Setting
                                    Title={ Source.Title }
                                    key={ Source.DataSourceId }>
                                    <Checkbox
                                        Checked={ Checked }
                                        Disabled={ !Checked && AtLimit }
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
