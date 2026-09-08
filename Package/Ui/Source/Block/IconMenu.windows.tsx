/**
 * Windows variant of `IconMenu.tsx`. Identical except:
 *
 * - Grid cells/swatches use RN core `Pressable` instead of
 *   `@gorhom/bottom-sheet`'s `TouchableOpacity`.
 * - The `Upload` tab calls the injected `usePlatformAdapter().PickImage()`
 *   seam instead of `expo-image-picker` directly — see
 *   `Source/Platform/index.windows.tsx` for why an image picker needs a
 *   runtime injection seam instead of a plain `.windows.tsx` file swap.
 * - `useRecentIconIds` persists through `usePlatformAdapter().KeyValueStore`
 *   instead of importing `@react-native-async-storage/async-storage`
 *   directly — that package's own Windows native module turned out to be a
 *   real build-fragility point in this app's MSBuild pipeline, and this is a
 *   non-critical nicety, so Windows's default `KeyValueStore` is a plain
 *   in-memory store instead (see `Source/Platform/index.windows.tsx`). The
 *   Expo/mobile build's `IconMenu.tsx` goes through the same seam now too,
 *   defaulting to real `AsyncStorage` there — nothing changes for it.
 *
 * `@emoji-mart/data` usage is unchanged (verified Windows-safe). Its
 * `BottomSheet`/`BottomSheetScrollView`/`BottomSheetView` import
 * (`../Primitive/BottomSheet.js`) resolves independently per platform via
 * Metro, so this file automatically inherits `BottomSheet.windows.tsx`'s
 * centered-dialog engine with no extra plumbing.
 *
 * @module @noteferry/ui/Primitive/IconMenu
 *
 * @file      IconMenu.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "../Token/Color.js";
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
import { MakeStyles, TextStyle, ViewStyle } from "../MakeStyles.js";
import { Pressable, View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Primitive/Tabs.js";
import { Button } from "../Primitive/Button.js";
import { Input } from "../Primitive/Input.js";
import type { ReadonlyRecord } from "effect/Record";
import * as String from "effect/String";
import type { Thunk } from "@sorrell/effect/Function";
import { Upload } from "../Icon.js";
import { useToken } from "../ThemeProvider.js";
import { usePlatformAdapter } from "../Platform/index.js";

const MaxEmojiSearchResults = 60 as const;
const MaxIconSearchResults = 100 as const;
const RecentLimit = 24 as const;

/**
 * A most-recently-used id list, persisted via `usePlatformAdapter().KeyValueStore`
 * (Windows's default is a plain in-memory store — see the file header
 * comment); this file's (non-pluggable) stand-in for source's
 * `useRecentIcons` "recency" strategy.
 */
const useRecentIconIds = (
    StorageKey: string
): readonly [ ReadonlyArray<string>, (Id: string) => void ] =>
{
    const { KeyValueStore: Store } = usePlatformAdapter();
    const [ RecentIds, SetRecentIds ] = React.useState<ReadonlyArray<string>>([ ]);

    React.useEffect(() =>
    {
        let Cancelled = false;

        void Store.GetItem(StorageKey).then((Raw: string | undefined) =>
        {
            if (Cancelled || Raw === undefined)
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
    }, [ Store, StorageKey ]);

    const TrackRecent = React.useCallback((Id: string) =>
    {
        SetRecentIds((Previous: ReadonlyArray<string>) =>
        {
            const Next =
                [
                    Id,
                    ...Previous.filter((Existing: string) => Existing !== Id)
                ].slice(0, RecentLimit);

            void Store.SetItem(StorageKey, JSON.stringify(Next));
            return Next;
        });
    }, [ Store, StorageKey ]);

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
    const Styles = useStyles();
    const {
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Border]: BorderColor,
        [Radii.Small]: SmallRadius
    } = useToken(
        Semantic.Primary,
        Semantic.Border,
        Radii.Small
    );

    return (
        <Pressable
            onPress={ OnPress }
            style={ [
                Styles.CategoryChip,
                { borderColor: IsActive ? PrimaryColor : BorderColor, borderRadius: SmallRadius }
            ] }>
            <Description Color={ IsActive ? Semantic.Primary : Semantic.Muted }>
                { Label }
            </Description>
        </Pressable>
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
    const Styles = useStyles();
    const [ RecentIds, TrackRecent ] = useRecentIconIds("noteferry:recent-emoji");
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
                            <Pressable
                                accessibilityLabel={ CurrentEmoji.name }
                                key={ Id }
                                onPress={ () => HandleSelect(Id, CurrentEmoji) }
                                style={ Styles.EmojiCell }>
                                <Body Style={ Styles.EmojiGlyph }>
                                    { CurrentEmoji.skins[ 0 ]?.native ?? "" }
                                </Body>
                            </Pressable>
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
    const Styles = useStyles();
    const [ RecentIds, TrackRecent ] = useRecentIconIds("noteferry:recent-icons");
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
    } = useToken(
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
                        <Pressable
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
                        <Pressable
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
                        </Pressable>
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
    const Styles = useStyles();
    const [ IsPicking, SetIsPicking ] = React.useState(false);
    const { PickImage } = usePlatformAdapter();

    const HandlePress = async (): Promise<void> =>
    {
        SetIsPicking(true);

        try
        {
            const Picked = await PickImage();

            if (Picked !== undefined)
            {
                OnSelect({ Src: Picked.Uri, Type: "Url" });
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
{
    const Styles = useStyles();

    return (
        <BottomSheet
            { ...{ OnDismiss, Ref } }
            { ...(TestID === undefined ? { } : { TestId: TestID }) }>
            <BottomSheetView style={ Styles.Sheet }>
                <Tabs
                    DefaultValue="Emoji"
                    Style={ Styles.Root }>
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
            </BottomSheetView>
        </BottomSheet>
    );
};

const useStyles = MakeStyles({
    CategoryChip: ViewStyle({
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4
    }),
    CategoryRow: ViewStyle({
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8
    }),
    ColorRow: ViewStyle({
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8
    }),
    ColorSwatch: ViewStyle({
        borderRadius: 10,
        height: 20,
        width: 20
    }),
    ColorSwatchSelected: ViewStyle({
        borderColor: "#FFFFFF",
        borderWidth: 2
    }),
    EmojiCell: ViewStyle({
        alignItems: "center",
        borderRadius: 6,
        height: 40,
        justifyContent: "center",
        width: 40
    }),
    EmojiGlyph: TextStyle({
        fontSize: 22
    }),
    Grid: ViewStyle({
        flex: 1
    }),
    GridWrap: ViewStyle({
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 2,
        paddingHorizontal: 10,
        paddingVertical: 8
    }),
    IconCell: ViewStyle({
        alignItems: "center",
        borderRadius: 6,
        height: 44,
        justifyContent: "center",
        width: 44
    }),
    RemoveButton: ViewStyle({
        marginLeft: "auto",
        marginRight: 8
    }),
    Root: ViewStyle({
        flex: 1
    }),
    SearchInput: ViewStyle({
        marginHorizontal: 12,
        marginTop: 8,
        width: "auto"
    }),
    Sheet: ViewStyle({
        flex: 1
    }),
    TabBody: ViewStyle({
        flex: 1
    }),
    UploadBody: ViewStyle({
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 24
    })
});
