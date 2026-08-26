/**
 * Compact, full-width card for a cached Notion database.
 *
 * @module noteferry/Component/DatabaseCard
 *
 * @file      DatabaseCard.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import * as React from "react";
import { ChevronRight } from "lucide-react-native";
import { Defs, LinearGradient, Rect, Stop, Svg, SvgXml } from "react-native-svg";
import { IconBlock } from "@noteferry/ui/Block";
import { ToLucideIconName } from "@/Domain/Utility/DatabaseIcon";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui";
import { ItemTitle, Pressable } from "@noteferry/ui/Primitive";
import { Platform, type PressableStateCallbackType, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { Thunk } from "@sorrell/effect/Function";

/** {@inheritDoc DatabaseCard} */
export interface DatabaseCardProps
{
    readonly OnPress: Thunk;
    readonly Source: Domain.DataSource.CachedDataSourceSchema;

    /** Renders as a 1:1 square (home-screen grid layout) instead of the default full-width row. */
    readonly Square?: boolean;
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

/* The reference box `Styles.IconOverlay` centers a database's icon within
 * before scaling it up — chosen to match `Styles.Icon`'s own footprint, so
 * every icon kind (Lucide, image, emoji) centers on the same point
 * regardless of its own natural size. Kept in sync with `Styles.IconOverlay`
 * below by hand, the same way `CoverHeight` is. */
const IconOverlaySize = 24;

const SvgCache = new Map<string, Promise<string>>();

/** Loads an SVG once for the lifetime of its current Notion file URL. */
const LoadSvg = (Uri: string): Promise<string> =>
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
};

/**
 * Detects soft, blurred-color SVGs whose Gaussian filter is not faithfully
 * supported by Android image decoders and returns their two endpoint colors.
 */
const GetBlurredSvgGradient = (Xml: string): SvgGradient | null =>
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
};

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
const DatabaseCard = ({ OnPress, Source, Square = false }: DatabaseCardProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const CoverIsSvg = Source.CoverUrl ? IsSvgUrl(Source.CoverUrl) : false;
    const RippleColor = Theme.Mode === "Dark"
        ? "rgba(255, 255, 255, 0.16)"
        : "rgba(0, 0, 0, 0.16)";
    /* Only a square (home-layout "2") card with a cover has room to float the
     * icon over the cover's bottom edge instead of leading the title row. */
    const ShowOverlayIcon = Square && Boolean(Source.CoverUrl);

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
                Square && Styles.SquareCard,
                Platform.OS !== "android" && pressed && Styles.Pressed
            ] }>
            <View style={ [ Styles.ClippedContent, Square && Styles.SquareClippedContent ] }>
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

                { ShowOverlayIcon
                    ? (
                        <View style={ [ Styles.IconOverlay, { left: 2 * Theme.Spacing.L } ] }>
                            <DatabaseIcon Source={ Source } />
                        </View>
                    )
                    : null }

                <View style={ [ Styles.TitleRow, Square && Styles.SquareTitleRow ] }>
                    { ShowOverlayIcon ? null : <DatabaseIcon Source={ Source } /> }
                    <ItemTitle
                        NumberOfLines={ 2 }
                        Style={ Styles.Title }
                        Weight="600">
                        { Source.Title }
                    </ItemTitle>
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

DatabaseCard.displayName = "DatabaseCard";

const useStyles = MakeStyles({
    Card: ViewStyle({
        alignSelf: "stretch",
        backgroundColor: Token.Semantic.BackgroundModal,
        /* `BorderCell` — Notion's own table/database-cell border role — reads
         * as the same light, solid gray line their card/template UI (see the
         * reference screenshot) uses, unlike the near-invisible translucent
         * `Border`/`BorderButton` tokens this card sat on before. */
        borderColor: Token.Semantic.BorderCell,
        borderRadius: Token.Radii.ExtraLarge,
        borderWidth: StyleSheet.hairlineWidth,
        /* The Android ripple (`android_ripple={ foreground: true }`) paints on
         * this `Pressable` itself, not on `ClippedContent` below — without
         * clipping here too, the ripple ignores the border radius and bleeds
         * square into the rounded corners. */
        overflow: "hidden"
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
    /* Straddles the seam between the cover and the title row below it:
     * vertically centered on `CoverHeight`, then scaled up x1.5 around that
     * same center point so every icon kind ends up 1.5x its own normal
     * size without needing per-kind size math. `left` is set inline (needs
     * `Theme.Spacing.L` resolved to a number, not the raw token symbol). */
    IconOverlay: ViewStyle({
        alignItems: "center",
        height: IconOverlaySize,
        justifyContent: "center",
        position: "absolute",
        top: CoverHeight - (IconOverlaySize / 2),
        transform: [ { scale: 1.5 } ],
        width: IconOverlaySize
    }),
    Pressed: ViewStyle({
        opacity: 0.72,
        transform: [ { scale: 0.99 } ]
    }),
    /* `aspectRatio: 1` derives the height from whatever width the grid
     * wrapper (`Styles.GridCell` in `index.tsx`) gives the card — the card
     * itself stays width-driven via the inherited `alignSelf: "stretch"`. */
    SquareCard: ViewStyle({
        aspectRatio: 1
    }),
    /* Stretches to fill the now-square `Card` exactly, rather than sitting
     * at its organic (cover + `minHeight` title row) height. */
    SquareClippedContent: ViewStyle({
        flex: 1
    }),
    /* Absorbs whatever space `SquareClippedContent` has left below a cover
     * (or the whole square, sans cover) instead of just `minHeight: 60`. */
    SquareTitleRow: ViewStyle({
        flex: 1,
        justifyContent: "center"
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
