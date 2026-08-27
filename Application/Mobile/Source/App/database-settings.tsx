/**
 * Index of the user's selected databases and their quick-entry form settings.
 *
 * @module noteferry/app/database-settings
 *
 * @file      database-settings.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Body, Description } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import { MakeStyles, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { useCallback, useEffect, useState } from "react";
import {
    ListDataSources,
    RemoveDataSourceFromNoteFerry,
    SwapFreeActiveDataSource
} from "@/Domain/Runtime/NoteFerryApi";
import { ResourceIcon } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";

const DatabaseSettingsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const { HasProAccess } = useSubscription();
    const { t } = useTranslation("settings");
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
            t("databaseSettings.customizeGate.title"),
            t("databaseSettings.customizeGate.message"),
            [
                { style: "cancel", text: t("databaseSettings.customizeGate.cancel") },
                { onPress: Router.push("/plans"), text: t("databaseSettings.customizeGate.comparePlans") },
                { onPress: Router.push("/subscribe"), text: t("databaseSettings.customizeGate.upgrade") }
            ]
        );
    }, [ Router, t ]);

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
            t("databaseSettings.removeConfirm.title"),
            t("databaseSettings.removeConfirm.message", { title: Source.Title }),
            [
                { style: "cancel", text: t("databaseSettings.removeConfirm.cancel") },
                {
                    onPress: () => void RemoveDataSourceFromNoteFerry(Source.DataSourceId).then(Load),
                    style: "destructive",
                    text: t("databaseSettings.removeConfirm.confirm")
                }
            ]
        );
    }, [ Load, t ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Description>
                    { t("databaseSettings.description") }
                </Description>

                { ReplaceTarget
                    ? (
                        <View style={ Styles.ReplacePanel }>
                            <Body Weight="600">{ t("databaseSettings.replacePanel.title") }</Body>
                            <Description>
                                { t("databaseSettings.replacePanel.description", { title: ReplaceTarget.Title }) }
                            </Description>
                            { DataSources.filter((Source) => Source.Access === "Available")
                                .map((Source) => (
                                    <Button
                                        key={ Source.DataSourceId }
                                        OnPress={ () => void Replace(Source) }>
                                        { t("databaseSettings.replacePanel.replaceButton", { title: Source.Title }) }
                                    </Button>
                                )) }
                            <Button Appearance="Link" OnPress={ () => SetReplaceTarget(null) }>
                                { t("databaseSettings.replacePanel.cancel") }
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
                                    { t("databaseSettings.empty") }
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
                                                        { Source.Access === "Locked"
                                                            ? t("databaseSettings.status.locked")
                                                            : t("databaseSettings.status.active") }
                                                    </Description>
                                                </View>
                                            </View>
                                            <View style={ Styles.Actions }>
                                                { Source.Access === "Locked"
                                                    ? (
                                                        <Button OnPress={ () => SetReplaceTarget(Source) }>
                                                            { t("databaseSettings.replaceActive") }
                                                        </Button>
                                                    )
                                                    : (
                                                        <Button OnPress={ () => Configure(Source) }>
                                                            { t("databaseSettings.customize") }
                                                        </Button>
                                                    ) }
                                                <Button Appearance="Link" OnPress={ () => Remove(Source) }>
                                                    { t("databaseSettings.remove") }
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
