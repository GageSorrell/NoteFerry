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
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Body, Button, Description } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useCallback, useEffect, useState } from "react";
import {
    ListDataSources,
    RemoveDataSourceFromNotivex,
    SwapFreeActiveDataSource
} from "@/Domain/Runtime/NotivexApi";
import { ResourceIcon } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";

const DatabaseSettingsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const { HasProAccess } = useSubscription();
    const [ DataSources, SetDataSources ] =
        useState<readonly Domain.DataSource.CachedDataSourceSchema[]>([ ]);
    const [ IsLoading, SetIsLoading ] = useState(!Development.Active);
    const [ ReplaceTarget, SetReplaceTarget ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);

    const Load = useCallback(async (): Promise<void> =>
    {
        SetIsLoading(true);
        try
        {
            SetDataSources(await ListDataSources());
        }
        finally
        {
            SetIsLoading(false);
        }
    }, [ ]);

    useEffect(() =>
    {
        if (Development.Active)
        {
            return;
        }

        void ListDataSources().then(SetDataSources).catch((Error: unknown) =>
            {
                console.error("Failed to load database settings", Error);
            }).finally(() => SetIsLoading(false));
    }, [ Development.Active, Load ]);

    const ShowCustomizationGate = useCallback((): void =>
    {
        Alert.alert(
            "Customize forms with Pro",
            "Pro lets you change aliases, visibility, required fields, order, and defaults.",
            [
                { style: "cancel", text: "Not now" },
                { onPress: Router.push("/plans"), text: "Compare plans" },
                { onPress: Router.push("/subscribe"), text: "Upgrade" }
            ]
        );
    }, [ Router ]);

    const Configure = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        if (!HasProAccess)
        {
            ShowCustomizationGate();
            return;
        }

        Router.push({
            params: {
                connectionId: Source.ConnectionId,
                dataSourceId: Source.DataSourceId,
                title: Source.Title
            },
            pathname: "/destination-config"
        })();
    }, [ HasProAccess, Router, ShowCustomizationGate ]);

    const Replace = useCallback(async (
        Active: Domain.DataSource.CachedDataSourceSchema
    ): Promise<void> =>
    {
        if (!ReplaceTarget) return;
        await SwapFreeActiveDataSource(ReplaceTarget.DataSourceId, Active.DataSourceId);
        SetReplaceTarget(null);
        await Load();
    }, [ Load, ReplaceTarget ]);

    const Remove = useCallback((Source: Domain.DataSource.CachedDataSourceSchema): void =>
    {
        Alert.alert(
            "Remove from Notivex?",
            `${Source.Title} stays unchanged in Notion.`,
            [
                { style: "cancel", text: "Cancel" },
                {
                    onPress: () => void RemoveDataSourceFromNotivex(Source.DataSourceId).then(Load),
                    style: "destructive",
                    text: "Remove"
                }
            ]
        );
    }, [ Load ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Description>
                    Free includes three active databases. Locked databases and saved
                    Pro configuration are retained; replacing or removing one never
                    changes anything in Notion.
                </Description>

                { ReplaceTarget
                    ? (
                        <View style={ Styles.ReplacePanel }>
                            <Body Weight="600">Replace an active database</Body>
                            <Description>
                                Choose the Free slot to replace with { ReplaceTarget.Title }.
                            </Description>
                            { DataSources.filter((Source) => Source.Access === "Available")
                                .map((Source) => (
                                    <Button
                                        key={ Source.DataSourceId }
                                        OnPress={ () => void Replace(Source) }>
                                        Replace { Source.Title }
                                    </Button>
                                )) }
                            <Button Appearance="Link" OnPress={ () => SetReplaceTarget(null) }>
                                Cancel
                            </Button>
                        </View>
                    )
                    : null }

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
                                <View style={ Styles.DatabaseList }>
                                    { DataSources.map((Source) => (
                                        <View key={ Source.DataSourceId } style={ Styles.DatabaseRow }>
                                            <View style={ Styles.DatabaseTitle }>
                                                <ResourceIcon Resource={ Source } />
                                                <View style={ Styles.DatabaseText }>
                                                    <Body NumberOfLines={ 1 }>{ Source.Title }</Body>
                                                    <Description>
                                                        { Source.Access === "Locked" ? "Locked" : "Active" }
                                                    </Description>
                                                </View>
                                            </View>
                                            <View style={ Styles.Actions }>
                                                { Source.Access === "Locked"
                                                    ? (
                                                        <Button OnPress={ () => SetReplaceTarget(Source) }>
                                                            Replace active
                                                        </Button>
                                                    )
                                                    : <Button OnPress={ () => Configure(Source) }>Customize</Button> }
                                                <Button Appearance="Link" OnPress={ () => Remove(Source) }>
                                                    Remove
                                                </Button>
                                            </View>
                                        </View>
                                    )) }
                                </View>
                            ) }
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Actions: ViewStyle({ alignItems: "flex-end", gap: Token.Spacing.Xs }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    DatabaseList: ViewStyle({ gap: Token.Spacing.M }),
    DatabaseRow: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        flexDirection: "row",
        gap: Token.Spacing.M,
        justifyContent: "space-between",
        padding: Token.Spacing.L
    }),
    DatabaseText: ViewStyle({ flex: 1 }),
    DatabaseTitle: ViewStyle({ alignItems: "center", flex: 1, flexDirection: "row", gap: Token.Spacing.M }),
    List: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.Xl
    }),
    ReplacePanel: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        gap: Token.Spacing.S,
        padding: Token.Spacing.L
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
