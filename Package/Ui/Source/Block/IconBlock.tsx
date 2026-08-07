/**
 * Ported from `@notion-kit/ui`'s `icon-block/` (`icon-block.tsx` +
 * `lucide-icon.tsx` + `lib/types.ts` + `lib/utils.ts`). Source resolves a
 * Lucide icon dynamically at runtime via `lucide-react`'s `iconNodes` data
 * table (`createLucideNode` + the low-level `<Icon iconNode={...}>`) so any
 * of its ~1500 icons can be requested by name without importing all of
 * them. `lucide-react-native` has no equivalent data table — every icon is
 * its own named export — so this file instead imports a curated ~180-icon
 * subset directly and exposes it as `LucideIconMap`/`LucideIconName`.
 * `IconMenu.tsx` (Phase 4's other half) renders/searches this same map
 * rather than re-deriving its own.
 *
 * Deliberate simplifications vs. upstream:
 *
 * - `LucideIconName` is that curated ~180-name union, not "any Lucide icon
 *   name". Per `PlanInitialDraft.md`'s explicit guidance to use "your own
 *   icon set... rather than copying Notion's proprietary icon assets",
 *   Notion's own custom icon set (source's `icon-menu/factories/
 *   notion-icons`) was never in scope here regardless — this curated set is
 *   the *entire* icon vocabulary, not a Lucide fallback alongside it.
 * - `isEmoji` doesn't run source's `zod` emoji-grapheme validation — a
 *   `Type: "Emoji"` icon's `Src` is trusted as-is. Nothing in this package
 *   depends on `zod`.
 *
 * @module @notivex/ui/Primitive/IconBlock
 *
 * @file      IconBlock.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    Anchor,
    Apple,
    Archive,
    Atom,
    Award,
    Baby,
    Backpack,
    Bandage,
    Battery,
    Beer,
    Bell,
    Bike,
    Bird,
    Bluetooth,
    Bone,
    Book,
    BookOpen,
    Bookmark,
    Box,
    Brain,
    Briefcase,
    Bug,
    Building,
    Building2,
    Bus,
    Cake,
    Calculator,
    Calendar,
    CalendarDays,
    Camera,
    Car,
    Carrot,
    Cat,
    ChartColumn,
    ChartPie,
    Cherry,
    Clapperboard,
    Clipboard,
    ClipboardList,
    Clock,
    Cloud,
    CloudRain,
    CloudUpload,
    Code,
    Coffee,
    Compass,
    CreditCard,
    Crown,
    Database,
    Dice5,
    Dna,
    Dog,
    DollarSign,
    Drama,
    Droplet,
    Drum,
    Earth,
    Egg,
    Eye,
    Feather,
    File,
    FileText,
    Film,
    Fish,
    Flag,
    Flame,
    FlaskConical,
    Flower2,
    Folder,
    FolderOpen,
    Gamepad2,
    Gem,
    Gift,
    GitBranch,
    Glasses,
    Globe,
    GraduationCap,
    Guitar,
    Hammer,
    Headphones,
    Heart,
    HeartPulse,
    Hospital,
    Hourglass,
    Image as ImageIcon,
    Inbox,
    Key,
    Keyboard,
    Laptop,
    Leaf,
    Lightbulb,
    Link,
    ListTodo,
    Lock,
    Luggage,
    Mail,
    Map as MapIcon,
    MapPin,
    Medal,
    MessageCircle,
    Mic,
    Microscope,
    Monitor,
    Moon,
    Mountain,
    Mouse,
    Music,
    Music2,
    Newspaper,
    NotebookPen,
    Package,
    Paintbrush,
    Palette,
    Paperclip,
    PartyPopper,
    PawPrint,
    PenLine,
    PenTool,
    Pencil,
    Phone,
    Piano,
    PiggyBank,
    Pill,
    Pin,
    Pizza,
    Plane,
    Plug,
    Printer,
    Puzzle,
    Receipt,
    Rocket,
    Ruler,
    Satellite,
    School,
    Scissors,
    Search,
    Server,
    Shield,
    ShieldCheck,
    Ship,
    Shirt,
    ShoppingBag,
    ShoppingCart,
    Smartphone,
    Smile,
    Snowflake,
    Sparkles,
    Sprout,
    SquareCheck,
    Star,
    Stethoscope,
    StickyNote,
    Store,
    Sun,
    Swords,
    Syringe,
    Tag,
    Tags,
    Target,
    Telescope,
    Tent,
    Terminal,
    ThumbsUp,
    Ticket,
    TrainFront,
    Trees,
    TrendingUp,
    Trophy,
    Truck,
    Umbrella,
    User,
    Users,
    Utensils,
    Video,
    Wallet,
    Wheat,
    Wifi,
    Wine,
    Wrench,
    Zap
} from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "../Primitive/Avatar.js";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { UseColor, useRadii } from "../ThemeProvider.js";
import { Body } from "../Primitive/Text.js";
import type { ReadonlyRecord } from "effect/Record";
import { Spinner } from "../Primitive/Spinner.js";
import { WithAlpha } from "../Utility/index.js";

/**
 * Every Lucide icon `IconBlock`/`IconMenu` can render, keyed by Lucide's own
 * kebab-case icon id (e.g. `"book-open"`) — see the file header comment for
 * why this is a curated subset rather than the full Lucide catalog. Deliberately
 * not widened to `ReadonlyRecord<string, LucideIcon>` — the literal object type
 * (via `as const`) is what makes `LucideIconName` below a real union of the ~180
 * ids, not just `string`.
 */
const LucideIconMap =
    Object.freeze({
        anchor: Anchor,
        apple: Apple,
        archive: Archive,
        atom: Atom,
        award: Award,
        baby: Baby,
        backpack: Backpack,
        bandage: Bandage,
        battery: Battery,
        beer: Beer,
        bell: Bell,
        bike: Bike,
        bird: Bird,
        bluetooth: Bluetooth,
        bone: Bone,
        book: Book,
        "book-open": BookOpen,
        bookmark: Bookmark,
        box: Box,
        brain: Brain,
        briefcase: Briefcase,
        bug: Bug,
        building: Building,
        "building-2": Building2,
        bus: Bus,
        cake: Cake,
        calculator: Calculator,
        calendar: Calendar,
        "calendar-days": CalendarDays,
        camera: Camera,
        car: Car,
        carrot: Carrot,
        cat: Cat,
        "chart-column": ChartColumn,
        "chart-pie": ChartPie,
        cherry: Cherry,
        clapperboard: Clapperboard,
        clipboard: Clipboard,
        "clipboard-list": ClipboardList,
        clock: Clock,
        cloud: Cloud,
        "cloud-rain": CloudRain,
        "cloud-upload": CloudUpload,
        code: Code,
        coffee: Coffee,
        compass: Compass,
        "credit-card": CreditCard,
        crown: Crown,
        database: Database,
        "dice-5": Dice5,
        dna: Dna,
        dog: Dog,
        "dollar-sign": DollarSign,
        drama: Drama,
        droplet: Droplet,
        drum: Drum,
        earth: Earth,
        egg: Egg,
        eye: Eye,
        feather: Feather,
        file: File,
        "file-text": FileText,
        film: Film,
        fish: Fish,
        flag: Flag,
        flame: Flame,
        "flask-conical": FlaskConical,
        "flower-2": Flower2,
        folder: Folder,
        "folder-open": FolderOpen,
        "gamepad-2": Gamepad2,
        gem: Gem,
        gift: Gift,
        "git-branch": GitBranch,
        glasses: Glasses,
        globe: Globe,
        "graduation-cap": GraduationCap,
        guitar: Guitar,
        hammer: Hammer,
        headphones: Headphones,
        heart: Heart,
        "heart-pulse": HeartPulse,
        hospital: Hospital,
        hourglass: Hourglass,
        image: ImageIcon,
        inbox: Inbox,
        key: Key,
        keyboard: Keyboard,
        laptop: Laptop,
        leaf: Leaf,
        lightbulb: Lightbulb,
        link: Link,
        "list-todo": ListTodo,
        lock: Lock,
        luggage: Luggage,
        mail: Mail,
        map: MapIcon,
        "map-pin": MapPin,
        medal: Medal,
        "message-circle": MessageCircle,
        mic: Mic,
        microscope: Microscope,
        monitor: Monitor,
        moon: Moon,
        mountain: Mountain,
        mouse: Mouse,
        music: Music,
        "music-2": Music2,
        newspaper: Newspaper,
        "notebook-pen": NotebookPen,
        package: Package,
        paintbrush: Paintbrush,
        palette: Palette,
        paperclip: Paperclip,
        "party-popper": PartyPopper,
        "paw-print": PawPrint,
        "pen-line": PenLine,
        "pen-tool": PenTool,
        pencil: Pencil,
        phone: Phone,
        piano: Piano,
        "piggy-bank": PiggyBank,
        pill: Pill,
        pin: Pin,
        pizza: Pizza,
        plane: Plane,
        plug: Plug,
        printer: Printer,
        puzzle: Puzzle,
        receipt: Receipt,
        rocket: Rocket,
        ruler: Ruler,
        satellite: Satellite,
        school: School,
        scissors: Scissors,
        search: Search,
        server: Server,
        shield: Shield,
        "shield-check": ShieldCheck,
        ship: Ship,
        shirt: Shirt,
        "shopping-bag": ShoppingBag,
        "shopping-cart": ShoppingCart,
        smartphone: Smartphone,
        smile: Smile,
        snowflake: Snowflake,
        sparkles: Sparkles,
        sprout: Sprout,
        "square-check": SquareCheck,
        star: Star,
        stethoscope: Stethoscope,
        "sticky-note": StickyNote,
        store: Store,
        sun: Sun,
        swords: Swords,
        syringe: Syringe,
        tag: Tag,
        tags: Tags,
        target: Target,
        telescope: Telescope,
        tent: Tent,
        terminal: Terminal,
        "thumbs-up": ThumbsUp,
        ticket: Ticket,
        "train-front": TrainFront,
        trees: Trees,
        "trending-up": TrendingUp,
        trophy: Trophy,
        truck: Truck,
        umbrella: Umbrella,
        user: User,
        users: Users,
        utensils: Utensils,
        video: Video,
        wallet: Wallet,
        wheat: Wheat,
        wifi: Wifi,
        wine: Wine,
        wrench: Wrench,
        zap: Zap
    } as const);

/**
 * A Lucide icon id `IconBlock`/`IconMenu` knows how to render — one of
 * `LucideIconMap`'s own keys.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type LucideIconName = keyof typeof LucideIconMap;

export { LucideIconMap };

/**
 * The size of a given `IconBlock` component.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type IconBlockSize =
    | "Small"
    | "Medium"
    | "Large"
    | "ExtraLarge";

interface SizeConfig
{
    readonly Container: number;
    readonly Padding: number;
    readonly FontSize: number;
    readonly IconSize: number;
    readonly Radii: Radii.Radii;
}

const SizeConfigs: ReadonlyRecord<IconBlockSize, SizeConfig> =
    Object.freeze({
        ExtraLarge: { Container: 78, FontSize: 60, IconSize: 48, Padding: 4, Radii: Radii.Large },
        Large: { Container: 64, FontSize: 48, IconSize: 40, Padding: 4, Radii: Radii.Medium },
        Medium: { Container: 36, FontSize: 30, IconSize: 24, Padding: 4, Radii: Radii.Medium },
        Small: { Container: 20, FontSize: 14, IconSize: 14, Padding: 2, Radii: Radii.Small }
    } as const);

/**
 * What a page/database icon actually is — an emoji, a `LucideIconMap` icon,
 * a remote image (uploaded or pasted), or a plain-text initial fallback.
 *
 * @category Miscellaneous
 * @since 1.0.0
 */
export type IconData =
    | { readonly Type: "Emoji"; readonly Src: string }
    | { readonly Type: "Lucide"; readonly Src: LucideIconName; readonly Color?: string | undefined }
    | { readonly Type: "Url"; readonly Src: string }
    | { readonly Type: "Text"; readonly Src: string };

const IsLucideIcon = (Icon: IconData): Icon is Extract<IconData, { readonly Type: "Lucide" }> =>
    Icon.Type === "Lucide" && Object.hasOwn(LucideIconMap, Icon.Src);

const GetLetter = (Src: string, Fallback: string): string =>
    (Src.length > 0 ? Src[ 0 ]! : Fallback).toUpperCase();

/** {@inheritDoc IconBlock} */
export interface IconBlockProps
{
    readonly Icon: IconData;
    readonly Size?: IconBlockSize;
    readonly Fallback?: string;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Renders a page/database icon — an emoji, a Lucide icon, a remote
       * image, or a letter fallback — sized and rounded consistently
       * wherever an icon appears (property rows, pickers, page headers).
       *
       * @category Component
       * @since 1.0.0
       */
const IconBlock = ({ Icon, Size = "Small", Fallback = " ", Style }: IconBlockProps): React.JSX.Element =>
{
    const Config = SizeConfigs[ Size ];
    const SecondaryColor = UseColor(Semantic.Secondary);
    const DefaultColor = UseColor(Semantic.Default);
    const MediumRadius = useRadii(Config.Radii);

    const ContainerStyle: ViewStyle =
        {
            borderRadius: MediumRadius,
            height: Config.Container,
            padding: Config.Padding,
            width: Config.Container
        };

    if (Icon.Type === "Url")
    {
        return (
            <Avatar
                Size={ Config.Container }
                Style={ [ Styles.NoBorder, Style ] }>
                <AvatarFallback>
                    <Spinner Size={ Config.IconSize } />
                </AvatarFallback>
                <AvatarImage Source={ Icon.Src } />
            </Avatar>
        );
    }

    if (IsLucideIcon(Icon))
    {
        const LucideComponent = LucideIconMap[ Icon.Src ];

        return (
            <View style={ [ Styles.Center, ContainerStyle, Style ] }>
                <LucideComponent
                    color={ Icon.Color ?? SecondaryColor }
                    size={ Config.IconSize }
                />
            </View>
        );
    }

    if (Icon.Type === "Emoji")
    {
        return (
            <View style={ [ Styles.Center, ContainerStyle, Style ] }>
                <Body Style={ [ Styles.Glyph, { fontSize: Config.FontSize, lineHeight: Config.FontSize } ] }>
                    { Icon.Src }
                </Body>
            </View>
        );
    }

    return (
        <View style={ [
            Styles.Center,
            {
                backgroundColor: WithAlpha(DefaultColor, 0.05)
            },
            ContainerStyle,
            Style
        ] }>
            <Body
                Color={ Semantic.Secondary }
                Style={ [
                    Styles.Glyph,
                    {
                        fontSize: Config.FontSize,
                        lineHeight: Config.FontSize
                    }
                ] }>
                { GetLetter(Icon.Src, Fallback) }
            </Body>
        </View>
    );
};

const Styles = StyleSheet.create({
    Center:
    {
        alignItems: "center",
        justifyContent: "center"
    },
    Glyph:
    {
        textAlign: "center"
    },
    NoBorder:
    {
        borderWidth: 0
    }
});
