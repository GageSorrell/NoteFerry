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
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Body, Button, Description, Heading1 } from "@notivex/ui/Primitive";
import { useEffect, useState } from "react";
import { ListDataSources } from "@/Domain/Runtime/NotivexApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useTheme } from "@notivex/ui";

const DatabaseSettingsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();
    const Theme = useTheme();
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
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Button
                    AccessibilityLabel="Back"
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ styles.back }>
                    Back
                </Button>

                <View style={ styles.header }>
                    <Heading1>Database settings</Heading1>
                    <Description>
                        Choose a database to customize its alias and the properties
                        shown when you create a page.
                    </Description>
                </View>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.scroll }>
                    { IsLoading
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                        : DataSources.length === 0
                            ? (
                                <Description>
                                    Your selected databases will appear here.
                                </Description>
                            )
                            : DataSources.map((
                                Source: Domain.DataSource.CachedDataSourceSchema
                            ) => (
                                <View
                                    key={ Source.DataSourceId }
                                    style={ styles.row }>
                                    <Body
                                        NumberOfLines={ 2 }
                                        Style={ styles.databaseTitle }>
                                        { Source.Title }
                                    </Body>
                                    <Button
                                        AccessibilityLabel={
                                            `Customize ${ Source.Title }`
                                        }
                                        Appearance="SoftBlue"
                                        OnPress={ Router.push({
                                            params:
                                            {
                                                connectionId: Source.ConnectionId,
                                                dataSourceId: Source.DataSourceId,
                                                title: Source.Title
                                            },
                                            pathname: "/destination-config"
                                        }) }>
                                        Customize
                                    </Button>
                                </View>
                            )) }
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    back:
    {
        alignSelf: "flex-start"
    },
    container:
    {
        flex: 1
    },
    databaseTitle:
    {
        flex: 1
    },
    header:
    {
        gap: 8
    },
    list:
    {
        gap: 12,
        paddingVertical: 24
    },
    row:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 16,
        justifyContent: "space-between",
        minHeight: 48
    },
    safeArea:
    {
        flex: 1,
        gap: 16,
        paddingHorizontal: 24,
        paddingVertical: 24
    },
    scroll:
    {
        alignSelf: "stretch",
        flex: 1
    }
});

export default DatabaseSettingsScreen;
