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
import * as React from "react";
import { Defs, LinearGradient, Rect, Stop, Svg, SvgXml } from "react-native-svg";
import { IconBlock, type LucideIconName } from "@notivex/ui/Block";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { ItemTitle, Pressable } from "@notivex/ui/Primitive";
import { Platform, type PressableStateCallbackType, View } from "react-native";
import { Image } from "expo-image";
import type { Thunk } from "@sorrell/effect/Function";

/** {@inheritDoc DatabaseCard} */
export interface DatabaseCardProps
{
    readonly OnPress: Thunk;
    readonly Source: Domain.DataSource.CachedDataSourceSchema;
}

/** Props shared by compact database icon presentations. */
export interface DatabaseIconProps
{
    readonly Source: Domain.DataSource.CachedDataSourceSchema;
}

/** Returns whether a cached icon string can be displayed as an image. */
const IsImageUrl = (Value: string): boolean =>
    Value.startsWith("https://") || Value.startsWith("http://");

/** Returns whether a remote image URL points to an SVG document. */
const IsSvgUrl = (Value: string): boolean => /\.svg(?:$|[?#])/iu.test(Value);

interface SvgGradient
{
    readonly EndColor: string;
    readonly StartColor: string;
}

/* Read by the raw `<Svg>`/`<SvgXml>` `height` number props below, which take
 * a plain `NumberProp`, not a resolved `DimensionValue` — kept in sync with
 * `Cover`'s `height` in `useStyles` below by hand. */
const CoverHeight = 96;

const SvgCache = new Map<string, Promise<string>>();

/** Loads an SVG once for the lifetime of its current Notion file URL. */
function LoadSvg(Uri: string): Promise<string>
{
    const Cached = SvgCache.get(Uri);

    if (Cached)
    {
        return Cached;
    }

    const Request = fetch(Uri)
        .then((Response: Response) =>
        {
            if (!Response.ok)
            {
                throw new Error(`Unable to load SVG cover (${ Response.status }).`);
            }

            return Response.text();
        })
        .catch((ErrorValue: unknown) =>
        {
            SvgCache.delete(Uri);
            throw ErrorValue;
        });

    SvgCache.set(Uri, Request);

    return Request;
}

/**
 * Detects soft, blurred-color SVGs whose Gaussian filter is not faithfully
 * supported by Android image decoders and returns their two endpoint colors.
 */
function GetBlurredSvgGradient(Xml: string): SvgGradient | null
{
    const BlurredCircleCount = Array.from(Xml.matchAll(/<circle\b/giu)).length;

    if (!/<feGaussianBlur\b/iu.test(Xml) || BlurredCircleCount < 2)
    {
        return null;
    }

    const Colors: Array<string> = [ ];
    const FillPattern = /\bfill=["'](#[\da-f]{3,8}|rgba?\([^"']+\)|[a-z]+)["']/giu;

    for (const Match of Xml.matchAll(FillPattern))
    {
        const Color = Match[1]?.toLowerCase();

        if (Color && Color !== "none" && Color !== "transparent" && !Colors.includes(Color))
        {
            Colors.push(Color);
        }
    }

    return Colors.length >= 2
        ? { EndColor: Colors[1] as string, StartColor: Colors[0] as string }
        : null;
}

/** Renders remote SVG covers without losing their large blurred gradients. */
const DatabaseSvgCover = ({ Uri }: { readonly Uri: string; }): React.JSX.Element =>
{
    const Styles = useStyles();
    const [ Xml, SetXml ] = React.useState<string | null | undefined>();

    React.useEffect(() =>
    {
        let IsMounted = true;

        void LoadSvg(Uri)
            .then((Value: string) =>
            {
                if (IsMounted)
                {
                    SetXml(Value);
                }
            })
            .catch(() =>
            {
                if (IsMounted)
                {
                    SetXml(null);
                }
            });

        return () =>
        {
            IsMounted = false;
        };
    }, [ Uri ]);

    const Gradient = Xml ? GetBlurredSvgGradient(Xml) : null;

    if (Gradient)
    {
        return (
            <Svg
                accessible={ false }
                height={ CoverHeight }
                preserveAspectRatio="none"
                viewBox="0 0 1 1"
                width="100%">
                <Defs>
                    <LinearGradient
                        id="database-cover-gradient"
                        x1="0%"
                        x2="100%"
                        y1="0%"
                        y2="100%">
                        <Stop
                            offset="0%"
                            stopColor={ Gradient.StartColor }
                        />
                        <Stop
                            offset="100%"
                            stopColor={ Gradient.EndColor }
                        />
                    </LinearGradient>
                </Defs>
                <Rect
                    fill="url(#database-cover-gradient)"
                    height="1"
                    width="1"
                />
            </Svg>
        );
    }

    if (Xml)
    {
        return (
            <SvgXml
                accessible={ false }
                height={ CoverHeight }
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                xml={ Xml }
            />
        );
    }

    return Xml === null
        ? (
            <Image
                accessibilityIgnoresInvertColors
                cachePolicy="memory-disk"
                contentFit="cover"
                source={ { uri: Uri } }
                style={ Styles.Cover }
            />
        )
        : <View style={ Styles.Cover } />;
};

DatabaseSvgCover.displayName = "DatabaseSvgCover";

/** Converts Notion's native icon name format to the local Lucide key format. */
const ToLucideIconName = (Value: string): LucideIconName =>
    Value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-") as LucideIconName;

export/** Renders the emoji, image, or native icon supplied by Notion. */
const DatabaseIcon = React.memo(({ Source }: DatabaseIconProps): React.JSX.Element | null =>
{
    const Styles = useStyles();

    if (!Source.Icon)
    {
        return null;
    }

    if (Source.IconType === "Native")
    {
        return (
            <IconBlock
                Icon={ {
                    Src: ToLucideIconName(Source.Icon),
                    Type: "Lucide"
                } }
                Size="Small"
            />
        );
    }

    if (IsImageUrl(Source.Icon) || Source.IconType === "Image")
    {
        return (
            <Image
                accessibilityIgnoresInvertColors
                cachePolicy="memory-disk"
                contentFit="contain"
                source={ { uri: Source.Icon } }
                style={ Styles.Icon }
                transition={ 100 }
            />
        );
    }

    return <ItemTitle Style={ Styles.Emoji }>{ Source.Icon }</ItemTitle>;
});

DatabaseIcon.displayName = "DatabaseIcon";

export/**
       * Shows the database cover and icon only when Notion supplied them. The whole
       * surface is the navigation target, replacing the former Configure button.
       *
       * @category Component
       * @since 1.0.0
       */
const DatabaseCard = ({ OnPress, Source }: DatabaseCardProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const CardShadow = Theme.Shadow.Card;
    const CoverIsSvg = Source.CoverUrl ? IsSvgUrl(Source.CoverUrl) : false;
    const RippleColor = Theme.Mode === "Dark"
        ? "rgba(255, 255, 255, 0.16)"
        : "rgba(0, 0, 0, 0.16)";

    return (
        <Pressable
            Accessibility={ {
                Label: `Create a page in ${ Source.Title }`,
                Role: "button"
            } }
            OnPress={ OnPress }
            android_ripple={ {
                color: RippleColor,
                foreground: true
            } }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.Card,
                {
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
                Platform.OS !== "android" && pressed && Styles.Pressed
            ] }>
            <View style={ Styles.ClippedContent }>
                {Source.CoverUrl
                    ? CoverIsSvg
                        ? (
                            <DatabaseSvgCover Uri={ Source.CoverUrl } />
                        )
                        : (
                            <Image
                                accessibilityIgnoresInvertColors
                                cachePolicy="memory-disk"
                                contentFit="cover"
                                source={ { uri: Source.CoverUrl } }
                                style={ Styles.Cover }
                                transition={ 150 }
                            />
                        )
                    : null}

                <View style={ Styles.TitleRow }>
                    <DatabaseIcon Source={ Source } />
                    <ItemTitle
                        NumberOfLines={ 2 }
                        Style={ Styles.Title }
                        Weight="600">
                        { Source.Title }
                    </ItemTitle>
                </View>
            </View>
        </Pressable>
    );
};

DatabaseCard.displayName = "DatabaseCard";

const useStyles = MakeStyles({
    Card: ViewStyle({
        alignSelf: "stretch",
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: Token.Radii.ExtraLarge
    }),
    ClippedContent: ViewStyle({
        borderRadius: Token.Radii.ExtraLarge,
        overflow: "hidden"
    }),
    Cover: ImageStyle({
        height: CoverHeight,
        width: "100%"
    }),
    Emoji: TextStyle({
        fontSize: 22,
        lineHeight: 26
    }),
    Icon: ImageStyle({
        borderRadius: 4,
        height: 24,
        width: 24
    }),
    Pressed: ViewStyle({
        opacity: 0.72,
        transform: [ { scale: 0.99 } ]
    }),
    Title: TextStyle({
        flex: 1
    }),
    TitleRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 60,
        paddingHorizontal: Token.Spacing.L,
        paddingVertical: Token.Spacing.M
    })
});
