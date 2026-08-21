/**
 * Shared helpers for turning a cached database's Notion icon into whichever
 * icon representation a particular surface needs. Currently backs
 * `DatabaseCard`'s in-app icon rendering and `QuickActions`' home-screen
 * shortcut icons.
 *
 * @module notivex/Domain/Utility/DatabaseIcon
 *
 * @file      DatabaseIcon.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { LucideIconName } from "@notivex/ui/Block";
import type { SFSymbol } from "expo-symbols";

export/** Converts Notion's native icon name format to the local Lucide key format. */
const ToLucideIconName = (Value: string): LucideIconName =>
    Value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-") as LucideIconName;

/**
 * The closest SF Symbol for each Lucide icon Notivex's curated icon set
 * (`LucideIconMap` in `@notivex/ui/Block`) can render, used to give a
 * database's "Native" (Notion built-in) icon a real icon on iOS home-screen
 * quick actions. Deliberately partial: Lucide names with no faithful SF
 * Symbol equivalent (e.g. `cherry`, `pizza`) are left unmapped so callers
 * fall back to a generic icon instead of a misleading one.
 */
export const LucideToSfSymbol: Partial<Record<LucideIconName, SFSymbol>> =
    Object.freeze({
        archive: "archivebox",
        atom: "atom",
        award: "rosette",
        backpack: "backpack",
        bandage: "bandage",
        battery: "battery.100percent",
        beer: "mug",
        bell: "bell",
        bike: "bicycle",
        bird: "bird",
        book: "book",
        "book-open": "book.pages",
        bookmark: "bookmark",
        box: "shippingbox",
        brain: "brain",
        briefcase: "briefcase",
        bug: "ant",
        building: "building",
        "building-2": "building.2",
        bus: "bus",
        cake: "birthday.cake",
        calculator: "number",
        calendar: "calendar",
        "calendar-days": "calendar",
        camera: "camera",
        car: "car",
        carrot: "carrot",
        cat: "cat",
        "chart-column": "chart.bar",
        "chart-pie": "chart.pie",
        clapperboard: "movieclapper",
        clipboard: "clipboard",
        "clipboard-list": "list.clipboard",
        clock: "clock",
        cloud: "cloud",
        "cloud-rain": "cloud.rain",
        "cloud-upload": "icloud.and.arrow.up",
        code: "chevron.left.forwardslash.chevron.right",
        coffee: "cup.and.saucer",
        compass: "safari",
        "credit-card": "creditcard",
        crown: "crown",
        database: "cylinder.split.1x2",
        "dice-5": "die.face.5",
        dna: "swirl.circle.righthalf.filled",
        dog: "dog",
        "dollar-sign": "dollarsign",
        drama: "theatermasks",
        droplet: "drop",
        earth: "globe",
        eye: "eye",
        file: "doc",
        "file-text": "doc.text",
        film: "film",
        fish: "fish",
        flag: "flag",
        flame: "flame",
        "flask-conical": "testtube.2",
        "flower-2": "camera.macro",
        folder: "folder",
        "folder-open": "folder",
        "gamepad-2": "gamecontroller",
        gem: "diamond",
        gift: "gift",
        "git-branch": "arrow.triangle.branch",
        glasses: "eyeglasses",
        globe: "globe",
        "graduation-cap": "graduationcap",
        guitar: "guitars",
        hammer: "hammer",
        headphones: "headphones",
        heart: "heart",
        "heart-pulse": "waveform.path.ecg",
        hospital: "cross.case",
        hourglass: "hourglass",
        image: "photo",
        inbox: "tray",
        key: "key",
        keyboard: "keyboard",
        laptop: "laptopcomputer",
        leaf: "leaf",
        lightbulb: "lightbulb",
        link: "link",
        "list-todo": "checklist",
        lock: "lock",
        luggage: "bag",
        mail: "envelope",
        map: "map",
        "map-pin": "mappin",
        medal: "medal",
        "message-circle": "message",
        mic: "mic",
        microscope: "eyedropper",
        monitor: "display",
        moon: "moon",
        mountain: "mountain.2",
        mouse: "computermouse",
        music: "music.note",
        "music-2": "music.note",
        newspaper: "newspaper",
        "notebook-pen": "square.and.pencil",
        package: "shippingbox",
        paintbrush: "paintbrush",
        palette: "paintpalette",
        paperclip: "paperclip",
        "party-popper": "party.popper",
        "paw-print": "pawprint",
        "pen-line": "pencil.line",
        "pen-tool": "pencil.tip",
        pencil: "pencil",
        phone: "phone",
        piano: "pianokeys",
        "piggy-bank": "dollarsign.circle",
        pill: "pills",
        pin: "pin",
        plane: "airplane",
        plug: "powerplug",
        printer: "printer",
        puzzle: "puzzlepiece",
        receipt: "receipt",
        rocket: "arrow.up.forward.app",
        ruler: "ruler",
        satellite: "antenna.radiowaves.left.and.right",
        school: "building.columns",
        scissors: "scissors",
        search: "magnifyingglass",
        server: "server.rack",
        shield: "shield",
        "shield-check": "checkmark.shield",
        ship: "sailboat",
        shirt: "tshirt",
        "shopping-bag": "bag",
        "shopping-cart": "cart",
        smartphone: "iphone",
        smile: "face.smiling",
        snowflake: "snowflake",
        sparkles: "sparkles",
        sprout: "leaf",
        "square-check": "checkmark.square",
        star: "star",
        stethoscope: "stethoscope",
        "sticky-note": "note.text",
        store: "storefront",
        sun: "sun.max",
        swords: "figure.fencing",
        syringe: "syringe",
        tag: "tag",
        tags: "tag",
        target: "target",
        telescope: "antenna.radiowaves.left.and.right",
        tent: "tent",
        terminal: "terminal",
        "thumbs-up": "hand.thumbsup",
        ticket: "ticket",
        "train-front": "tram",
        trees: "tree",
        "trending-up": "chart.line.uptrend.xyaxis",
        trophy: "trophy",
        truck: "box.truck",
        umbrella: "umbrella",
        user: "person",
        users: "person.2",
        utensils: "fork.knife",
        video: "video",
        wallet: "wallet.pass",
        wheat: "leaf",
        wifi: "wifi",
        wine: "wineglass",
        wrench: "wrench",
        zap: "bolt"
    } as const);

export/**
       * Resolves the SF Symbol for a raw Notion "Native" icon name (before
       * `ToLucideIconName` conversion), if `LucideToSfSymbol` has one.
       *
       * @category Utility
       * @since 1.0.0
       */
const ResolveNativeIconSymbol = (RawIconName: string): SFSymbol | undefined =>
{
    const LucideName = ToLucideIconName(RawIconName);

    return Object.hasOwn(LucideToSfSymbol, LucideName) ? LucideToSfSymbol[ LucideName ] : undefined;
};
