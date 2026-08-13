/**
 * Ported from `@notion-kit/ui`'s `icon-menu/` — the emoji/Lucide/upload
 * "factory" system behind Notion's page-icon picker. Source's factories
 * (`useEmojiFactory`, `useLucideFactory`, `useUploadFactory`, plus a
 * Notion-proprietary-icon-set factory) are a pluggable
 * `IconFactoryResult` abstraction so `IconMenu` itself never special-cases
 * emoji vs. Lucide vs. upload. That plugin layer isn't ported — three fixed
 * tabs (`Emoji`, `Icons`, `Upload`) are wired directly instead, since this
 * package has no second consumer that would need a fourth or fifth
 * factory. `IconBlock.tsx`'s `LucideIconMap` is reused here rather than
 * re-derived, per that file's own header comment.
 *
 * Deliberate simplifications vs. upstream:
 *
 * - Rendered as a `BottomSheet` (owned by an externally-supplied `Ref`,
 *   matching `DateSheet`/`TreeSheet`), not source's anchored `Popover`.
 * - Source's `notion-icons` factory (Notion's own proprietary icon set)
 *   was never in scope — see `IconBlock.tsx`'s header comment.
 * - Source's emoji category nav is a scrollspy over one continuous scroll
 *   (tap a category icon, the list smooth-scrolls to it); here category
 *   chips are a mutually-exclusive filter instead — simpler to reason
 *   about inside a height-constrained sheet, at the cost of not being able
 *   to browse across categories in one continuous gesture. The Lucide tab's
 *   "Recent"/"All Icons" split reuses the same chip mechanism.
 *   `emoji-mart`'s skin-tone variants aren't in the installed `native`
 *   data set (each emoji has exactly one `Skins` entry) — there is nothing
 *   to build a skin-tone picker over, so source's `SkinPicker` wasn't
 *   ported either.
 * - The Lucide tab's color swatches are `Token.Color`'s ten Notion colors
 *   (already resolved via the public `UseTheme` hook — this file never
 *   reaches into `Token/Color`'s internal values directly), not source's arbitrary
 *   `COLOR` hex map.
 * - "Recent" tracking is a plain most-recently-used id list in
 *   `AsyncStorage` (`usehooks-ts`'s `useLocalStorage`, source's own
 *   mechanism, has no RN build) — the "frequency" strategy variant wasn't
 *   ported.
 * - The Upload tab is a single "Choose from Photos" action via
 *   `expo-image-picker`, not source's drag-and-drop/URL-paste/random-icon
 *   trio — pasting a URL is `CoverPicker`'s job on this port, not
 *   `IconMenu`'s (see that file's header comment for why `UrlForm` itself
 *   wasn't ported as a standalone block).
 *
 * @module @notivex/ui/Primitive/IconMenu
 *
 * @file      IconMenu.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "../Token/Color.js";
import * as ImagePicker from "expo-image-picker";
import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Body, Description } from "../Primitive/Text.js";
import {
    BottomSheet,
    type BottomSheetProps,
    BottomSheetScrollView,
    BottomSheetView
} from "../Primitive/BottomSheet.js";
import EmojiMartDataRaw, { type Emoji, type EmojiMartData } from "@emoji-mart/data";
import { IconBlock, type IconData, LucideIconMap, type LucideIconName } from "./IconBlock.js";
import { StyleSheet, View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Primitive/Tabs.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../Primitive/Button.js";
import { Input } from "../Primitive/Input.js";
import type { ReadonlyRecord } from "effect/Record";
import { String } from "effect";
import type { Thunk } from "@sorrell/utility/Function";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { Upload } from "lucide-react-native";
import { UseToken } from "../ThemeProvider.js";

const MaxEmojiSearchResults = 60 as const;
const MaxIconSearchResults = 100 as const;
const RecentLimit = 24 as const;

/**
 * A most-recently-used id list, persisted in `AsyncStorage`; this file's
 * (non-pluggable) stand-in for source's `useRecentIcons` "recency"
 * strategy.
 */
const useRecentIconIds = (
    StorageKey: string
): readonly [ ReadonlyArray<string>, (Id: string) => void ] =>
{
    const [ RecentIds, SetRecentIds ] = React.useState<ReadonlyArray<string>>([ ]);

    React.useEffect(() =>
    {
        let Cancelled = false;

        void AsyncStorage.getItem(StorageKey).then((Raw: string | null) =>
        {
            if (Cancelled || Raw === null)
            {
                return;
            }

            try
            {
                const Parsed: unknown = JSON.parse(Raw);

                if (Array.isArray(Parsed))
                {
                    SetRecentIds(Parsed as Array<string>);
                }
            }
            catch
            {
                /* Corrupt/unexpected storage value — ignore, start empty. */
            }
        });

        return () => { Cancelled = true; };
    }, [ StorageKey ]);

    const TrackRecent = React.useCallback((Id: string) =>
    {
        SetRecentIds((Previous: ReadonlyArray<string>) =>
        {
            const Next =
                [
                    Id,
                    ...Previous.filter((Existing: string) => Existing !== Id)
                ].slice(0, RecentLimit);

            void AsyncStorage.setItem(StorageKey, JSON.stringify(Next));
            return Next;
        });
    }, [ StorageKey ]);

    return [ RecentIds, TrackRecent ] as const;
};

interface CategoryChipProps
{
    readonly Label: string;
    readonly IsActive: boolean;
    readonly OnPress: Thunk;
}

const CategoryChip = ({ Label, IsActive, OnPress }: CategoryChipProps): React.JSX.Element =>
{
    const {
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Border]: BorderColor,
        [Radii.Small]: SmallRadius
    } = UseToken(
        Semantic.Primary,
        Semantic.Border,
        Radii.Small
    );

    return (
        <TouchableOpacity
            onPress={ OnPress }
            style={ [
                Styles.CategoryChip,
                { borderColor: IsActive ? PrimaryColor : BorderColor, borderRadius: SmallRadius }
            ] }>
            <Description Color={ IsActive ? Semantic.Primary : Semantic.Muted }>
                { Label }
            </Description>
        </TouchableOpacity>
    );
};

const CategoryLabels: ReadonlyRecord<string, string> =
    Object.freeze({
        activity: "Activity",
        flags: "Flags",
        foods: "Food & Drink",
        nature: "Animals & Nature",
        objects: "Objects",
        people: "Smileys & People",
        places: "Travel & Places",
        recent: "Recent",
        symbols: "Symbols"
    } as const);

/**
 * A named group of selectable ids (an emoji category, or the Lucide
 * tab's "Recent"/"All icons"), shown behind a `CategoryChip`.
 */
interface IconSection
{
    readonly Id: string;
    readonly Label: string;
    readonly Ids: ReadonlyArray<string>;
}

interface EmojiTabProps
{
    readonly OnSelect: (Icon: IconData) => void;
}

const EmojiTab = ({ OnSelect }: EmojiTabProps): React.JSX.Element =>
{
    const [ RecentIds, TrackRecent ] = useRecentIconIds("notivex:recent-emoji");
    const [ Query, SetQuery ] = React.useState("");

    const EmojiMap = React.useMemo(() =>
    {
        const Data = EmojiMartDataRaw as EmojiMartData;
        return new Map(Object.entries(Data.emojis));
    }, [ ]);

    const Categories = React.useMemo(() => (EmojiMartDataRaw as EmojiMartData).categories, [ ]);

    const Sections: ReadonlyArray<IconSection> = React.useMemo(() =>
    {
        const Result: Array<IconSection> = [ ];

        if (RecentIds.length > 0)
        {
            Result.push({ Id: "recent", Ids: RecentIds, Label: CategoryLabels[ "recent" ]! });
        }

        for (const CurrentCategory of Categories)
        {
            Result.push({
                Id: CurrentCategory.id,
                Ids: CurrentCategory.emojis,
                Label: CategoryLabels[ CurrentCategory.id ] ?? CurrentCategory.id
            });
        }

        return Result;
    }, [ Categories, RecentIds ]);

    const [ ActiveSectionId, SetActiveSectionId ] = React.useState<string>(() => Sections[ 0 ]?.Id ?? "");
    const IsSearching = Query.trim().length > 0;

    const VisibleEmojiIds: ReadonlyArray<string> = React.useMemo(() =>
    {
        if (IsSearching)
        {
            const NormalizedQuery = Query.trim().toLowerCase();
            const Results: Array<string> = [ ];

            for (const [ Id, CurrentEmoji ] of EmojiMap)
            {
                if (Results.length >= MaxEmojiSearchResults)
                {
                    break;
                }

                if (
                    CurrentEmoji.name.toLowerCase().includes(NormalizedQuery)
                    || CurrentEmoji.keywords.some(
                        (Keyword: string) => Keyword.toLowerCase().includes(NormalizedQuery)
                    )
                    || Id.toLowerCase().includes(NormalizedQuery)
                )
                {
                    Results.push(Id);
                }
            }

            return Results;
        }

        return Sections.find((Section: IconSection) => Section.Id === ActiveSectionId)?.Ids ?? [ ];
    }, [ IsSearching, Query, EmojiMap, Sections, ActiveSectionId ]);

    const HandleSelect = (Id: string, CurrentEmoji: Emoji): void =>
    {
        OnSelect({ Src: CurrentEmoji.skins[ 0 ]?.native ?? "", Type: "Emoji" });
        TrackRecent(Id);
    };

    return (
        <View style={ Styles.TabBody }>
            <Input
                Clear
                OnCancel={ () => SetQuery("") }
                OnChangeText={ SetQuery }
                Placeholder="Search emoji…"
                Search
                Style={ Styles.SearchInput }
                Value={ Query }
            />
            { !IsSearching && (
                <View style={ Styles.CategoryRow }>
                    { Sections.map((Section: IconSection) => (
                        <CategoryChip
                            IsActive={ Section.Id === ActiveSectionId }
                            Label={ Section.Label }
                            OnPress={ () => SetActiveSectionId(Section.Id) }
                            key={ Section.Id }
                        />
                    )) }
                </View>
            ) }
            <BottomSheetScrollView style={ Styles.Grid }>
                <View style={ Styles.GridWrap }>
                    { VisibleEmojiIds.map((Id: string) =>
                    {
                        const CurrentEmoji = EmojiMap.get(Id);

                        if (CurrentEmoji === undefined)
                        {
                            return null;
                        }

                        return (
                            <TouchableOpacity
                                accessibilityLabel={ CurrentEmoji.name }
                                key={ Id }
                                onPress={ () => HandleSelect(Id, CurrentEmoji) }
                                style={ Styles.EmojiCell }>
                                <Body Style={ Styles.EmojiGlyph }>
                                    { CurrentEmoji.skins[ 0 ]?.native ?? "" }
                                </Body>
                            </TouchableOpacity>
                        );
                    }) }
                </View>
            </BottomSheetScrollView>
        </View>
    );
};

const ColorPalette: ReadonlyArray<Color.Color> =
    Object.freeze([
        Color.Default,
        Color.Gray,
        Color.Brown,
        Color.Orange,
        Color.Yellow,
        Color.Green,
        Color.Blue,
        Color.Purple,
        Color.Pink,
        Color.Red
    ] as const);

interface IconsTabProps
{
    readonly OnSelect: (Icon: IconData) => void;
}

const IconsTab = ({ OnSelect }: IconsTabProps): React.JSX.Element =>
{
    const [ RecentIds, TrackRecent ] = useRecentIconIds("notivex:recent-icons");
    const [ Query, SetQuery ] = React.useState("");
    const [ SelectedColor, SetSelectedColor ] = React.useState<Color.Color>(Color.Default);

    /**
     * One fixed, unconditional token lookup per palette entry, matching `Button.tsx`.
     *
     * @since 1.0.0
     */
    const {
        [Color.Default]: DefaultHex,
        [Color.Gray]: GrayHex,
        [Color.Brown]: BrownHex,
        [Color.Orange]: OrangeHex,
        [Color.Yellow]: YellowHex,
        [Color.Green]: GreenHex,
        [Color.Blue]: BlueHex,
        [Color.Purple]: PurpleHex,
        [Color.Pink]: PinkHex,
        [Color.Red]: RedHex
    } = UseToken(
        Color.Default,
        Color.Gray,
        Color.Brown,
        Color.Orange,
        Color.Yellow,
        Color.Green,
        Color.Blue,
        Color.Purple,
        Color.Pink,
        Color.Red
    );

    const HexByColor = React.useMemo(() => new Map<Color.Color, string>([
        [ Color.Default, DefaultHex ],
        [ Color.Gray, GrayHex ],
        [ Color.Brown, BrownHex ],
        [ Color.Orange, OrangeHex ],
        [ Color.Yellow, YellowHex ],
        [ Color.Green, GreenHex ],
        [ Color.Blue, BlueHex ],
        [ Color.Purple, PurpleHex ],
        [ Color.Pink, PinkHex ],
        [ Color.Red, RedHex ]
    ]), [
        DefaultHex,
        GrayHex,
        BrownHex,
        OrangeHex,
        YellowHex,
        GreenHex,
        BlueHex,
        PurpleHex,
        PinkHex,
        RedHex
    ]);

    const SelectedHex = HexByColor.get(SelectedColor) ?? DefaultHex;

    const AllIds = React.useMemo(() => Object.keys(LucideIconMap) as ReadonlyArray<LucideIconName>, [ ]);

    const Sections: ReadonlyArray<IconSection> = React.useMemo(() =>
    {
        const Result: Array<IconSection> = [ ];

        if (RecentIds.length > 0)
        {
            Result.push({ Id: "recent", Ids: RecentIds, Label: "Recent" });
        }

        Result.push({ Id: "all", Ids: AllIds, Label: "All icons" });

        return Result;
    }, [ AllIds, RecentIds ]);

    const [ ActiveSectionId, SetActiveSectionId ] = React.useState<string>(() => Sections[ 0 ]?.Id ?? "all");
    const IsSearching = Query.trim().length > 0;

    const VisibleIds: ReadonlyArray<string> = React.useMemo(() =>
    {
        if (IsSearching)
        {
            const Keywords =
                Query.trim()
                    .toLowerCase()
                    .split(" ")
                    .filter(String.isNonEmpty);

            return AllIds
                .filter((Id: LucideIconName) => Keywords.some((Keyword: string) => Id.includes(Keyword)))
                .slice(0, MaxIconSearchResults);
        }

        return Sections.find((Section: IconSection) => Section.Id === ActiveSectionId)?.Ids ?? [ ];
    }, [ IsSearching, Query, AllIds, Sections, ActiveSectionId ]);

    const HandleSelect = (Id: string): void =>
    {
        OnSelect({ Color: SelectedHex, Src: Id as LucideIconName, Type: "Lucide" });
        TrackRecent(Id);
    };

    return (
        <View style={ Styles.TabBody }>
            <Input
                Clear
                OnCancel={ () => SetQuery("") }
                OnChangeText={ SetQuery }
                Placeholder="Search icons…"
                Search
                Style={ Styles.SearchInput }
                Value={ Query }
            />
            <View style={ Styles.ColorRow }>
                { ColorPalette.map((ColorToken: Color.Color) =>
                {
                    const Hex = HexByColor.get(ColorToken) ?? DefaultHex;

                    return (
                        <TouchableOpacity
                            accessibilityLabel="Icon color"
                            key={ String.String(ColorToken) }
                            onPress={ () => SetSelectedColor(ColorToken) }
                            style={ [
                                Styles.ColorSwatch,
                                { backgroundColor: Hex },
                                ColorToken === SelectedColor
                                    ? Styles.ColorSwatchSelected
                                    : undefined
                            ] }
                        />
                    );
                }) }
            </View>
            { !IsSearching && Sections.length > 1 && (
                <View style={ Styles.CategoryRow }>
                    { Sections.map((Section: IconSection) => (
                        <CategoryChip
                            IsActive={ Section.Id === ActiveSectionId }
                            Label={ Section.Label }
                            OnPress={ () => SetActiveSectionId(Section.Id) }
                            key={ Section.Id }
                        />
                    )) }
                </View>
            ) }
            <BottomSheetScrollView style={ Styles.Grid }>
                <View style={ Styles.GridWrap }>
                    { VisibleIds.map((Id: string) => (
                        <TouchableOpacity
                            accessibilityLabel={ Id }
                            key={ Id }
                            onPress={ () => HandleSelect(Id) }
                            style={ Styles.IconCell }>
                            <IconBlock
                                Icon={ {
                                    Color: SelectedHex,
                                    Src: Id as LucideIconName,
                                    Type: "Lucide"
                                } }
                                Size="Medium"
                            />
                        </TouchableOpacity>
                    )) }
                </View>
            </BottomSheetScrollView>
        </View>
    );
};

interface UploadTabProps
{
    readonly OnSelect: (Icon: IconData) => void;
}

const UploadTab = ({ OnSelect }: UploadTabProps): React.JSX.Element =>
{
    const [ IsPicking, SetIsPicking ] = React.useState(false);

    const HandlePress = async (): Promise<void> =>
    {
        SetIsPicking(true);

        try
        {
            const Permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!Permission.granted)
            {
                return;
            }

            const Result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                mediaTypes: [ "images" ],
                quality: 0.8
            });

            const Asset = Result.canceled ? undefined : Result.assets[ 0 ];

            if (Asset !== undefined)
            {
                OnSelect({ Src: Asset.uri, Type: "Url" });
            }
        }
        finally
        {
            SetIsPicking(false);
        }
    };

    return (
        <View style={ Styles.UploadBody }>
            <Button
                Appearance="Primary"
                Loading={ IsPicking }
                OnPress={ () => void HandlePress() }>
                <Upload size={ 16 } />
                <Body>
                    Choose from Photos
                </Body>
            </Button>
        </View>
    );
};

/** {@inheritDoc IconMenu} */
export interface IconMenuProps extends Pick<BottomSheetProps, "OnDismiss" | "Ref">
{
    readonly OnSelect: (Icon: IconData) => void;
    readonly OnRemove?: (() => void) | undefined;
    readonly TestID?: string;
}

export/**
       * A page/database icon picker bottom sheet — emoji, Lucide icon, or an
       * uploaded photo. See the file header comment for how this relates to
       * `@notion-kit/ui`'s `icon-menu/` block.
       *
       * @category Component
       * @since 1.0.0
       */
const IconMenu = ({ OnDismiss, Ref, OnSelect, OnRemove, TestID }: IconMenuProps): React.JSX.Element =>
    <BottomSheet
        { ...{ OnDismiss, Ref } }
        { ...(TestID === undefined ? { } : { TestId: TestID }) }>
        <Tabs
            DefaultValue="Emoji"
            Style={ Styles.Root }>
            <BottomSheetView>
                <TabsList>
                    <TabsTrigger Value="Emoji">Emoji</TabsTrigger>
                    <TabsTrigger Value="Icons">Icons</TabsTrigger>
                    <TabsTrigger Value="Upload">Upload</TabsTrigger>
                    { OnRemove !== undefined && (
                        <Button
                            Appearance="Hint"
                            OnPress={ OnRemove }
                            Size="Small"
                            Style={ Styles.RemoveButton }>
                            Remove
                        </Button>
                    ) }
                </TabsList>
            </BottomSheetView>
            <TabsContent Value="Emoji">
                <EmojiTab OnSelect={ OnSelect } />
            </TabsContent>
            <TabsContent Value="Icons">
                <IconsTab OnSelect={ OnSelect } />
            </TabsContent>
            <TabsContent Value="Upload">
                <UploadTab OnSelect={ OnSelect } />
            </TabsContent>
        </Tabs>
    </BottomSheet>;

const Styles = StyleSheet.create({
    CategoryChip:
    {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    CategoryRow:
    {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    ColorRow:
    {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    ColorSwatch:
    {
        borderRadius: 10,
        height: 20,
        width: 20
    },
    ColorSwatchSelected:
    {
        borderColor: "#FFFFFF",
        borderWidth: 2
    },
    EmojiCell:
    {
        alignItems: "center",
        borderRadius: 6,
        height: 40,
        justifyContent: "center",
        width: 40
    },
    EmojiGlyph:
    {
        fontSize: 22
    },
    Grid:
    {
        flex: 1
    },
    GridWrap:
    {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
        paddingHorizontal: 10,
        paddingVertical: 8
    },
    IconCell:
    {
        alignItems: "center",
        borderRadius: 6,
        height: 44,
        justifyContent: "center",
        width: 44
    },
    RemoveButton:
    {
        marginLeft: "auto",
        marginRight: 8
    },
    Root:
    {
        flex: 1
    },
    SearchInput:
    {
        marginHorizontal: 12,
        marginTop: 8
    },
    TabBody:
    {
        flex: 1
    },
    UploadBody:
    {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 24
    }
});
