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
 * @module @noteferry/ui/Primitive/IconBlock
 *
 * @file      IconBlock.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import Anchor from "lucide-react-native/icons/anchor";
import Apple from "lucide-react-native/icons/apple";
import Archive from "lucide-react-native/icons/archive";
import Atom from "lucide-react-native/icons/atom";
import Award from "lucide-react-native/icons/award";
import Baby from "lucide-react-native/icons/baby";
import Backpack from "lucide-react-native/icons/backpack";
import Bandage from "lucide-react-native/icons/bandage";
import Battery from "lucide-react-native/icons/battery";
import Beer from "lucide-react-native/icons/beer";
import Bell from "lucide-react-native/icons/bell";
import Bike from "lucide-react-native/icons/bike";
import Bird from "lucide-react-native/icons/bird";
import Bluetooth from "lucide-react-native/icons/bluetooth";
import Bone from "lucide-react-native/icons/bone";
import Book from "lucide-react-native/icons/book";
import BookOpen from "lucide-react-native/icons/book-open";
import Bookmark from "lucide-react-native/icons/bookmark";
import Box from "lucide-react-native/icons/box";
import Brain from "lucide-react-native/icons/brain";
import Briefcase from "lucide-react-native/icons/briefcase";
import Bug from "lucide-react-native/icons/bug";
import Building from "lucide-react-native/icons/building";
import Building2 from "lucide-react-native/icons/building-2";
import Bus from "lucide-react-native/icons/bus";
import Cake from "lucide-react-native/icons/cake";
import Calculator from "lucide-react-native/icons/calculator";
import Calendar from "lucide-react-native/icons/calendar";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Camera from "lucide-react-native/icons/camera";
import Car from "lucide-react-native/icons/car";
import Carrot from "lucide-react-native/icons/carrot";
import Cat from "lucide-react-native/icons/cat";
import ChartColumn from "lucide-react-native/icons/chart-column";
import ChartPie from "lucide-react-native/icons/chart-pie";
import Cherry from "lucide-react-native/icons/cherry";
import Clapperboard from "lucide-react-native/icons/clapperboard";
import Clipboard from "lucide-react-native/icons/clipboard";
import ClipboardList from "lucide-react-native/icons/clipboard-list";
import Clock from "lucide-react-native/icons/clock";
import Cloud from "lucide-react-native/icons/cloud";
import CloudRain from "lucide-react-native/icons/cloud-rain";
import CloudUpload from "lucide-react-native/icons/cloud-upload";
import Code from "lucide-react-native/icons/code";
import Coffee from "lucide-react-native/icons/coffee";
import Compass from "lucide-react-native/icons/compass";
import CreditCard from "lucide-react-native/icons/credit-card";
import Crown from "lucide-react-native/icons/crown";
import Database from "lucide-react-native/icons/database";
import Dice5 from "lucide-react-native/icons/dice-5";
import Dna from "lucide-react-native/icons/dna";
import Dog from "lucide-react-native/icons/dog";
import DollarSign from "lucide-react-native/icons/dollar-sign";
import Drama from "lucide-react-native/icons/drama";
import Droplet from "lucide-react-native/icons/droplet";
import Drum from "lucide-react-native/icons/drum";
import Earth from "lucide-react-native/icons/earth";
import Egg from "lucide-react-native/icons/egg";
import Eye from "lucide-react-native/icons/eye";
import Feather from "lucide-react-native/icons/feather";
import File from "lucide-react-native/icons/file";
import FileText from "lucide-react-native/icons/file-text";
import Film from "lucide-react-native/icons/film";
import Fish from "lucide-react-native/icons/fish";
import Flag from "lucide-react-native/icons/flag";
import Flame from "lucide-react-native/icons/flame";
import FlaskConical from "lucide-react-native/icons/flask-conical";
import Flower2 from "lucide-react-native/icons/flower-2";
import Folder from "lucide-react-native/icons/folder";
import FolderOpen from "lucide-react-native/icons/folder-open";
import Gamepad2 from "lucide-react-native/icons/gamepad-2";
import Gem from "lucide-react-native/icons/gem";
import Gift from "lucide-react-native/icons/gift";
import GitBranch from "lucide-react-native/icons/git-branch";
import Glasses from "lucide-react-native/icons/glasses";
import Globe from "lucide-react-native/icons/globe";
import GraduationCap from "lucide-react-native/icons/graduation-cap";
import Guitar from "lucide-react-native/icons/guitar";
import Hammer from "lucide-react-native/icons/hammer";
import Headphones from "lucide-react-native/icons/headphones";
import Heart from "lucide-react-native/icons/heart";
import HeartPulse from "lucide-react-native/icons/heart-pulse";
import Hospital from "lucide-react-native/icons/hospital";
import Hourglass from "lucide-react-native/icons/hourglass";
import ImageIcon from "lucide-react-native/icons/image";
import Inbox from "lucide-react-native/icons/inbox";
import Key from "lucide-react-native/icons/key";
import Keyboard from "lucide-react-native/icons/keyboard";
import Laptop from "lucide-react-native/icons/laptop";
import Leaf from "lucide-react-native/icons/leaf";
import Lightbulb from "lucide-react-native/icons/lightbulb";
import Link from "lucide-react-native/icons/link";
import ListTodo from "lucide-react-native/icons/list-todo";
import Lock from "lucide-react-native/icons/lock";
import Luggage from "lucide-react-native/icons/luggage";
import Mail from "lucide-react-native/icons/mail";
import MapIcon from "lucide-react-native/icons/map";
import MapPin from "lucide-react-native/icons/map-pin";
import Medal from "lucide-react-native/icons/medal";
import MessageCircle from "lucide-react-native/icons/message-circle";
import Mic from "lucide-react-native/icons/mic";
import Microscope from "lucide-react-native/icons/microscope";
import Monitor from "lucide-react-native/icons/monitor";
import Moon from "lucide-react-native/icons/moon";
import Mountain from "lucide-react-native/icons/mountain";
import Mouse from "lucide-react-native/icons/mouse";
import Music from "lucide-react-native/icons/music";
import Music2 from "lucide-react-native/icons/music-2";
import Newspaper from "lucide-react-native/icons/newspaper";
import NotebookPen from "lucide-react-native/icons/notebook-pen";
import Package from "lucide-react-native/icons/package";
import Paintbrush from "lucide-react-native/icons/paintbrush";
import Palette from "lucide-react-native/icons/palette";
import Paperclip from "lucide-react-native/icons/paperclip";
import PartyPopper from "lucide-react-native/icons/party-popper";
import PawPrint from "lucide-react-native/icons/paw-print";
import PenLine from "lucide-react-native/icons/pen-line";
import PenTool from "lucide-react-native/icons/pen-tool";
import Pencil from "lucide-react-native/icons/pencil";
import Phone from "lucide-react-native/icons/phone";
import Piano from "lucide-react-native/icons/piano";
import PiggyBank from "lucide-react-native/icons/piggy-bank";
import Pill from "lucide-react-native/icons/pill";
import Pin from "lucide-react-native/icons/pin";
import Pizza from "lucide-react-native/icons/pizza";
import Plane from "lucide-react-native/icons/plane";
import Plug from "lucide-react-native/icons/plug";
import Printer from "lucide-react-native/icons/printer";
import Puzzle from "lucide-react-native/icons/puzzle";
import Receipt from "lucide-react-native/icons/receipt";
import Rocket from "lucide-react-native/icons/rocket";
import Ruler from "lucide-react-native/icons/ruler";
import Satellite from "lucide-react-native/icons/satellite";
import School from "lucide-react-native/icons/school";
import Scissors from "lucide-react-native/icons/scissors";
import Search from "lucide-react-native/icons/search";
import Server from "lucide-react-native/icons/server";
import Shield from "lucide-react-native/icons/shield";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import Ship from "lucide-react-native/icons/ship";
import Shirt from "lucide-react-native/icons/shirt";
import ShoppingBag from "lucide-react-native/icons/shopping-bag";
import ShoppingCart from "lucide-react-native/icons/shopping-cart";
import Smartphone from "lucide-react-native/icons/smartphone";
import Smile from "lucide-react-native/icons/smile";
import Snowflake from "lucide-react-native/icons/snowflake";
import Sparkles from "lucide-react-native/icons/sparkles";
import Sprout from "lucide-react-native/icons/sprout";
import SquareCheck from "lucide-react-native/icons/square-check";
import Star from "lucide-react-native/icons/star";
import Stethoscope from "lucide-react-native/icons/stethoscope";
import StickyNote from "lucide-react-native/icons/sticky-note";
import Store from "lucide-react-native/icons/store";
import Sun from "lucide-react-native/icons/sun";
import Swords from "lucide-react-native/icons/swords";
import Syringe from "lucide-react-native/icons/syringe";
import Tag from "lucide-react-native/icons/tag";
import Tags from "lucide-react-native/icons/tags";
import Target from "lucide-react-native/icons/target";
import Telescope from "lucide-react-native/icons/telescope";
import Tent from "lucide-react-native/icons/tent";
import Terminal from "lucide-react-native/icons/terminal";
import ThumbsUp from "lucide-react-native/icons/thumbs-up";
import Ticket from "lucide-react-native/icons/ticket";
import TrainFront from "lucide-react-native/icons/train-front";
import Trees from "lucide-react-native/icons/trees";
import TrendingUp from "lucide-react-native/icons/trending-up";
import Trophy from "lucide-react-native/icons/trophy";
import Truck from "lucide-react-native/icons/truck";
import Umbrella from "lucide-react-native/icons/umbrella";
import User from "lucide-react-native/icons/user";
import Users from "lucide-react-native/icons/users";
import Utensils from "lucide-react-native/icons/utensils";
import Video from "lucide-react-native/icons/video";
import Wallet from "lucide-react-native/icons/wallet";
import Wheat from "lucide-react-native/icons/wheat";
import Wifi from "lucide-react-native/icons/wifi";
import Wine from "lucide-react-native/icons/wine";
import Wrench from "lucide-react-native/icons/wrench";
import Zap from "lucide-react-native/icons/zap";
import { Avatar, AvatarFallback, AvatarImage } from "../Primitive/Avatar.js";
import { MakeStyles, ViewStyle as MakeViewStyle, TextStyle } from "../MakeStyles.js";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { Body } from "../Primitive/Text.js";
import * as ColorToken from "../Token/Color.js";
import type { ReadonlyRecord } from "effect/Record";
import { Spinner } from "../Primitive/Spinner.js";
import { Mix, Unmix, WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

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
    /**
     * Renders a desaturated, "hidden from the main list" treatment. The
     * blend strength is derived from how far the theme's own muted text
     * color already sits from its primary text color (toward gray), via
     * `Unmix`/`Mix`, rather than a hardcoded ratio — so a `Lucide` icon's
     * color is mixed toward gray by that ratio, and an `Emoji`/`Url` icon
     * (which can't be RGB-mixed without pixel-level filtering) gets an
     * opacity reduction of the same strength instead.
     */
    readonly Muted?: boolean;
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
const IconBlock = ({ Icon, Size = "Small", Fallback = " ", Muted = false, Style }: IconBlockProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const Config = SizeConfigs[ Size ];
    const {
        [Semantic.Secondary]: SecondaryColor,
        [Semantic.Default]: DefaultColor,
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Muted]: MutedColor,
        [Config.Radii]: MediumRadius
    } = useToken(
        Semantic.Secondary,
        Semantic.Default,
        Semantic.Primary,
        Semantic.Muted,
        Config.Radii
    );
    const GrayColor = ColorToken.Resolve(ColorToken.Gray) ?? MutedColor;
    const MutedRatio = Muted ? Unmix(PrimaryColor, GrayColor, MutedColor) : 0;
    const MutedOpacityStyle: ViewStyle = Muted ? { opacity: 1 - MutedRatio } : { };

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
                Style={ [ Styles.NoBorder, MutedOpacityStyle, Style ] }>
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
        const IconColor = Icon.Color ?? SecondaryColor;

        return (
            <View style={ [ Styles.Center, ContainerStyle, Style ] }>
                <LucideComponent
                    color={ Muted ? Mix(IconColor, GrayColor, MutedRatio) : IconColor }
                    size={ Config.IconSize }
                />
            </View>
        );
    }

    if (Icon.Type === "Emoji")
    {
        return (
            <View style={ [ Styles.Center, ContainerStyle, MutedOpacityStyle, Style ] }>
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
            MutedOpacityStyle,
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

const useStyles = MakeStyles({
    Center: MakeViewStyle({
        alignItems: "center",
        justifyContent: "center"
    }),
    Glyph: TextStyle({
        textAlign: "center"
    }),
    NoBorder: MakeViewStyle({
        borderWidth: 0
    })
});
