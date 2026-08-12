/**
 * Compact, full-width card for a cached Notion database.
 *
 * @module notivex/Component/DatabaseCard
 *
 * @file      DatabaseCard.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { IconBlock, type LucideIconName } from "@notivex/ui/Block";
import { Pressable, type PressableStateCallbackType, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ItemTitle } from "@notivex/ui/Primitive";
import { SvgUri } from "react-native-svg";
import type { Thunk } from "@sorrell/utility/Function";
import { UseTheme } from "@notivex/ui";

/** {@inheritDoc DatabaseCard} */
export interface DatabaseCardProps
{
    readonly OnPress: Thunk;
    readonly Source: Domain.DataSource.CachedDataSourceSchema;
}

/** Returns whether a cached icon string can be displayed as an image. */
const IsImageUrl = (Value: string): boolean =>
    Value.startsWith("https://") || Value.startsWith("http://");

/** Returns whether a remote image URL points to an SVG document. */
const IsSvgUrl = (Value: string): boolean => /\.svg(?:$|[?#])/iu.test(Value);

/** Converts Notion's native icon name format to the local Lucide key format. */
const ToLucideIconName = (Value: string): LucideIconName =>
    Value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-") as LucideIconName;

/**
 * Shows the database cover and icon only when Notion supplied them. The whole
 * surface is the navigation target, replacing the former Configure button.
 *
 * @category Component
 * @since 1.0.0
 */
export function DatabaseCard({ OnPress, Source }: DatabaseCardProps): React.JSX.Element
{
    const Theme = UseTheme();
    const CardShadow = Theme.Shadow.Card;
    const CoverIsSvg = Source.CoverUrl ? IsSvgUrl(Source.CoverUrl) : false;
    const IconIsImage = Source.Icon ? IsImageUrl(Source.Icon) : false;
    const IconIsNative = Source.IconType === "Native";

    return (
        <Pressable
            accessibilityLabel={ `Configure ${ Source.Title }` }
            accessibilityRole="button"
            onPress={ OnPress }
            style={ ({ pressed }: PressableStateCallbackType) => [
                styles.card,
                {
                    backgroundColor: Theme.Semantic.BackgroundModal,
                    borderColor: Theme.Semantic.Border,
                    borderRadius: Theme.Radii.ExtraLarge,
                    elevation: CardShadow.Elevation,
                    shadowColor: CardShadow.ShadowColor,
                    shadowOffset: CardShadow.ShadowOffset
                        ? {
                            height: CardShadow.ShadowOffset.Height,
                            width: CardShadow.ShadowOffset.Width
                        }
                        : undefined,
                    shadowOpacity: CardShadow.ShadowOpacity,
                    shadowRadius: CardShadow.ShadowRadius
                },
                pressed && styles.pressed
            ] }>
            <View
                style={ [
                    styles.clippedContent,
                    { borderRadius: Theme.Radii.ExtraLarge }
                ] }>
                {Source.CoverUrl
                    ? CoverIsSvg
                        ? (
                            <SvgUri
                                height={ styles.cover.height }
                                preserveAspectRatio="xMidYMid slice"
                                uri={ Source.CoverUrl }
                                width="100%"
                            />
                        )
                        : (
                            <Image
                                accessibilityIgnoresInvertColors
                                cachePolicy="memory-disk"
                                contentFit="cover"
                                source={ { uri: Source.CoverUrl } }
                                style={ styles.cover }
                                transition={ 150 }
                            />
                        )
                    : null}

                <View style={ styles.titleRow }>
                    {Source.Icon
                        ? IconIsNative
                            ? (
                                <IconBlock
                                    Icon={ {
                                        Src: ToLucideIconName(Source.Icon),
                                        Type: "Lucide"
                                    } }
                                    Size="Small"
                                />
                            )
                            : IconIsImage || Source.IconType === "Image"
                                ? (
                                    <Image
                                        accessibilityIgnoresInvertColors
                                        cachePolicy="memory-disk"
                                        contentFit="contain"
                                        source={ { uri: Source.Icon } }
                                        style={ styles.icon }
                                        transition={ 100 }
                                    />
                                )
                                : (
                                    <ItemTitle Style={ styles.emoji }>
                                        { Source.Icon }
                                    </ItemTitle>
                                )
                        : null}
                    <ItemTitle
                        NumberOfLines={ 2 }
                        Style={ styles.title }
                        Weight="600">
                        { Source.Title }
                    </ItemTitle>
                </View>
            </View>
        </Pressable>
    );
}

DatabaseCard.displayName = "DatabaseCard";

const styles = StyleSheet.create({
    card:
    {
        alignSelf: "stretch",
        borderWidth: 1
    },
    clippedContent:
    {
        overflow: "hidden"
    },
    cover:
    {
        height: 96,
        width: "100%"
    },
    emoji:
    {
        fontSize: 22,
        lineHeight: 26
    },
    icon:
    {
        borderRadius: 4,
        height: 24,
        width: 24
    },
    pressed:
    {
        opacity: 0.72,
        transform: [ { scale: 0.99 } ]
    },
    title:
    {
        flex: 1
    },
    titleRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 12
    }
});
