/**
 * Index of the user's selected databases and their quick-entry form settings.
 *
 * @module notivex/app/database-settings
 *
 * @file      database-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Description } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useEffect, useState } from "react";
import { ListDataSources } from "@/Domain/Runtime/NotivexApi";
import { ResourceIcon, SettingsTable, SettingsTableRow } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

const DatabaseSettingsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const [ DataSources, SetDataSources ] =
        useState<ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(!Development.Active);

    useEffect(() =>
    {
        let Active = true;

        if (Development.Active)
        {
            return () =>
            {
                Active = false;
            };
        }

        type Source = Domain.DataSource.CachedDataSourceSchema;
        ListDataSources()
            .then((Sources: ReadonlyArray<Source>) =>
            {
                if (Active)
                {
                    SetDataSources(Sources);
                }
            })
            .catch((Error: unknown) =>
            {
            /* eslint-disable-next-line no-console */
                console.error("Failed to load database settings", Error);
            })
            .finally(() =>
            {
                if (Active)
                {
                    SetIsLoading(false);
                }
            });

        return () =>
        {
            Active = false;
        };
    }, [ Development.Active ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Description>
                    Choose a database to customize its alias and the properties
                    shown when you create a page.
                </Description>

                <ScrollView
                    contentContainerStyle={ Styles.List }
                    style={ Styles.Scroll }>
                    { IsLoading
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                        : DataSources.length === 0
                            ? (
                                <Description>
                                    Your selected databases will appear here.
                                </Description>
                            )
                            : (
                                <SettingsTable>
                                    { DataSources.map((
                                        Source: Domain.DataSource.CachedDataSourceSchema,
                                        Index: number
                                    ) => (
                                        <SettingsTableRow
                                            AccessibilityLabel={ `Customize ${ Source.Title }` }
                                            Divider={ Index < DataSources.length - 1 }
                                            Icon={ <ResourceIcon Resource={ Source } /> }
                                            Label={ Source.Title }
                                            OnPress={ Router.push({
                                                params:
                                                {
                                                    connectionId: Source.ConnectionId,
                                                    dataSourceId: Source.DataSourceId,
                                                    title: Source.Title
                                                },
                                                pathname: "/destination-config"
                                            }) }
                                            key={ Source.DataSourceId }
                                        />
                                    )) }
                                </SettingsTable>
                            ) }
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
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.Xl
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.L,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    })
});

export default DatabaseSettingsScreen;
