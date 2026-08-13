/**
 * @module notivex/app
 *
 * @file      index.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    ActivityIndicator,
    type PressableStateCallbackType,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import { Body, Description, Pressable } from "@notivex/ui/Primitive";
import { Settings, UserRound } from "lucide-react-native";
import { DatabaseCard } from "@/Component/DatabaseCard";
import { Image } from "expo-image";
import { Predicate } from "@sorrell/utility";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConnections } from "@/Domain/Connection";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useState } from "react";
import { useTheme } from "@notivex/ui";

interface NotionAvatarProps
{
    readonly Name: string;
    readonly Uri?: string | undefined;
}

/** Displays the authorizing Notion user's image with an initials fallback. */
const NotionAvatar = ({ Name, Uri }: NotionAvatarProps): React.JSX.Element =>
{
    "use no memo";

    const Theme = useTheme();
    const [ HasImageError, SetHasImageError ] = useState(false);
    const CanDisplayImage = Uri !== undefined
        && (Uri.startsWith("https://") || Uri.startsWith("http://"))
        && !HasImageError;
    const Initial = Name.trim().charAt(0).toUpperCase() || "N";

    return (
        <View
            accessibilityLabel={ `Notion profile for ${ Name }` }
            accessible
            style={ [
                styles.avatar,
                {
                    backgroundColor: Theme.Semantic.BackgroundModal,
                    borderColor: Theme.Semantic.BackgroundModal
                }
            ] }>
            { CanDisplayImage
                ? (
                    <Image
                        accessibilityIgnoresInvertColors
                        cachePolicy="memory-disk"
                        contentFit="cover"
                        onError={ () => SetHasImageError(true) }
                        source={ { uri: Uri } }
                        style={ styles.avatarImage }
                        transition={ 100 }
                    />
                )
                : Name.trim() === ""
                    ? (
                        <UserRound
                            color={ Theme.Semantic.IconSecondary }
                            size={ 24 }
                            strokeWidth={ 1.8 }
                        />
                    )
                    : <Body Weight="600">{ Initial }</Body> }
        </View>
    );
};

NotionAvatar.displayName = "NotionAvatar";

const HomeScreen = () =>
{
    "use no memo";

    const { Connections, DataSources, IsLoading } = useConnections();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Connection = Connections.find(Predicate.HasPropertyValue("Status", "Active"))
        ?? Connections[0];
    const AvatarUri = Connection?.NotionOwnerAvatarUrl
        ?? Connection?.WorkspaceIconUrl;
    const AvatarName = Connection?.WorkspaceName ?? "Notion";
    const HomeBackground = Theme.Mode === "Dark"
        ? Theme.Semantic.BackgroundMain
        : "#F7F7F5";
    const ControlBackground = Theme.Mode === "Dark"
        ? "#2F2F2F"
        : "#EBEAE8";

    return (
        <View style={ [ styles.container, { backgroundColor: HomeBackground } ] }>
            <SafeAreaView style={ styles.safeArea }>
                <View style={ styles.topBar }>
                    <NotionAvatar
                        Name={ AvatarName }
                        Uri={ AvatarUri }
                        key={ AvatarUri ?? AvatarName }
                    />
                    <Pressable
                        Accessibility={ {
                            Label: "Database settings",
                            Role: "button"
                        } }
                        OnPress={ Router.push("/database-settings") }
                        style={ ({ pressed }: PressableStateCallbackType) => [
                            styles.settingsButton,
                            { backgroundColor: ControlBackground },
                            pressed && styles.controlPressed
                        ] }>
                        <Settings
                            color="#8C8786"
                            size={ 19 }
                            strokeWidth={ 1.8 }
                        />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={ styles.list }
                    style={ styles.listContainer }>
                    <Description
                        Style={ styles.sectionTitle }
                        Weight="500">
                        Databases
                    </Description>
                    { IsLoading
                        ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                        : DataSources.length === 0
                            ? <Body>No databases found yet.</Body>
                            : (
                                <View style={ styles.databaseCards }>
                                    { DataSources.map((
                                        Source: Domain.DataSource.CachedDataSourceSchema
                                    ) => (
                                        <DatabaseCard
                                            OnPress={ Router.push({
                                                params:
                                                {
                                                    dataSourceId: Source.DataSourceId,
                                                    title: Source.Title
                                                },
                                                pathname: "/create-page"
                                            }) }
                                            Source={ Source }
                                            key={
                                                `${ Source.ConnectionId }:${ Source.DataSourceId }`
                                            }
                                        />
                                    )) }
                                </View>
                            ) }
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    avatar:
    {
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 2,
        height: 36,
        justifyContent: "center",
        overflow: "hidden",
        width: 36
    },
    avatarImage:
    {
        height: "100%",
        width: "100%"
    },
    container:
    {
        flex: 1
    },
    controlPressed:
    {
        opacity: 0.68,
        transform: [ { scale: 0.97 } ]
    },
    databaseCards:
    {
        gap: 16,
        overflow: "visible",
        paddingHorizontal: 2
    },
    list:
    {
        gap: 14,
        paddingBottom: 28,
        paddingHorizontal: 16,
        paddingTop: 22
    },
    listContainer:
    {
        alignSelf: "stretch",
        flex: 1,
        marginHorizontal: -16
    },
    safeArea:
    {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10
    },
    sectionTitle:
    {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 2
    },
    settingsButton:
    {
        alignItems: "center",
        borderRadius: 22,
        height: 42,
        justifyContent: "center",
        width: 82
    },
    topBar:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 44
    }
});

export default HomeScreen;
