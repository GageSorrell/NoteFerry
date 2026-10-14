/**
 * Compact card for a page recently created through NoteFerry.
 */

import type * as Domain from "@noteferry/domain";
import type { Thunk } from "@sorrell/effect/Function";
import * as React from "react";
import { Image } from "expo-image";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { Platform, type PressableStateCallbackType, StyleSheet, View } from "react-native";
import { MakeStyles, ImageStyle, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { Caption, ItemTitle } from "@noteferry/ui/Primitive/Text";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { ResourceIcon } from "./ResourceIcon";
import { GetRelativeTimeParts } from "@/Domain/Utility/RelativeTime";
import { useTranslation } from "react-i18next";

export interface PageCardProps
{
    readonly CurrentTime: number;
    readonly OnPress: Thunk;
    readonly Page: Domain.Page.RecentPage;
    readonly ShowCover: boolean;
    readonly ShowDatabaseName: boolean;
}

export const PageCard = ({
    CurrentTime,
    OnPress,
    Page,
    ShowCover,
    ShowDatabaseName
}: PageCardProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const { t } = useTranslation("home");
    const [ CoverFailureUrl, SetCoverFailureUrl ] = React.useState<string | null>(null);
    const Relative = GetRelativeTimeParts(Page.CreatedAt, new Date(CurrentTime));
    const RelativeLabel = Relative.Unit === "Now"
        ? t("recent.time.now")
        : Relative.Unit === "Minute"
            ? t("recent.time.minute", { count: Relative.Count })
            : Relative.Unit === "Hour"
                ? t("recent.time.hour", { count: Relative.Count })
                : Relative.Unit === "Day"
                    ? t("recent.time.day", { count: Relative.Count })
                    : Relative.Unit === "Month"
                        ? t("recent.time.month", { count: Relative.Count })
                        : t("recent.time.year", { count: Relative.Count });
    const HasCover = ShowCover
        && Boolean(Page.CoverUrl)
        && CoverFailureUrl !== Page.CoverUrl;
    const Title = Page.Title.trim() || t("recent.untitled");
    const RippleColor = Theme.Mode === "Dark"
        ? "rgba(255, 255, 255, 0.16)"
        : "rgba(0, 0, 0, 0.16)";

    return (
        <Pressable
            Accessibility={ {
                Label: t("recent.cardAccessibilityLabel", { title: Title }),
                Role: "button"
            } }
            OnPress={ OnPress }
            android_ripple={ { color: RippleColor, foreground: true } }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.Card,
                Platform.OS !== "android" && pressed && Styles.Pressed
            ] }>
            <View style={ Styles.ClippedContent }>
                { HasCover
                    ? (
                        <Image
                            accessibilityIgnoresInvertColors
                            cachePolicy="memory-disk"
                            contentFit="cover"
                            onError={ () => SetCoverFailureUrl(Page.CoverUrl ?? null) }
                            source={ { uri: Page.CoverUrl } }
                            style={ Styles.Cover }
                            transition={ 150 }
                        />
                    )
                    : null }
                <View style={ Styles.Content }>
                    <ResourceIcon
                        key={ `${ Page.IconType ?? "none" }:${ Page.Icon ?? "" }` }
                        Resource={ Page }
                    />
                    <View style={ Styles.TextContent }>
                        <ItemTitle
                            NumberOfLines={ 2 }
                            Style={ Styles.Title }
                            Weight="600">
                            { Title }
                        </ItemTitle>
                        <View style={ Styles.Metadata }>
                            { ShowDatabaseName && Page.DatabaseName
                                ? (
                                    <Caption
                                        NumberOfLines={ 1 }
                                        Style={ Styles.DatabaseName }>
                                        { Page.DatabaseName }
                                    </Caption>
                                )
                                : null }
                            <Caption NumberOfLines={ 1 }>{ RelativeLabel }</Caption>
                        </View>
                    </View>
                    <ChevronRight
                        color={ Theme.Semantic.IconSecondary }
                        size={ 18 }
                        strokeWidth={ 1.8 }
                    />
                </View>
            </View>
        </Pressable>
    );
};

PageCard.displayName = "PageCard";

const useStyles = MakeStyles({
    Card: ViewStyle({
        alignSelf: "stretch",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderColor: Token.Semantic.BorderCell,
        borderRadius: Token.Radii.ExtraLarge,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden"
    }),
    ClippedContent: ViewStyle({
        borderRadius: Token.Radii.ExtraLarge,
        overflow: "hidden"
    }),
    Content: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 72,
        paddingHorizontal: Token.Spacing.L,
        paddingVertical: Token.Spacing.M
    }),
    Cover: ImageStyle({
        height: 96,
        width: "100%"
    }),
    DatabaseName: TextStyle({
        letterSpacing: 0.5,
        textTransform: "uppercase"
    }),
    Metadata: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 2
    }),
    Pressed: ViewStyle({
        opacity: 0.72,
        transform: [ { scale: 0.99 } ]
    }),
    TextContent: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    Title: TextStyle({
        flex: 1
    })
});
