/**
 * A single, curated catalog of every Lucide icon this package actually
 * renders, re-exported under one canonical PascalCase name per icon
 * (matching Lucide's own naming convention, e.g. `circle-check` ->
 * `CircleCheck`) — the whole point of routing every consumer's import
 * through this module instead of `lucide-react-native/icons/*` directly
 * is so a single `.windows.tsx` sibling can swap every icon's rendering
 * strategy at once. See `Icon.windows.tsx`'s header comment for why
 * Windows needs a different one.
 *
 * On the Expo/mobile build (this file), every export is a plain,
 * zero-overhead re-export of the real `lucide-react-native` component —
 * nothing about icon rendering changes for mobile.
 *
 * Generated from the exact `iconNode` data baked into the installed
 * `lucide-react-native`; regenerate by re-running the same extraction
 * against `node_modules/lucide-react-native/dist/esm/icons/*.mjs` if the
 * set of icons this package uses ever changes.
 *
 * @module @noteferry/ui/Icon
 *
 * @file      Icon.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export { default as Anchor } from "lucide-react-native/icons/anchor";
export { default as Apple } from "lucide-react-native/icons/apple";
export { default as Archive } from "lucide-react-native/icons/archive";
export { default as Atom } from "lucide-react-native/icons/atom";
export { default as Award } from "lucide-react-native/icons/award";
export { default as Baby } from "lucide-react-native/icons/baby";
export { default as Backpack } from "lucide-react-native/icons/backpack";
export { default as Bandage } from "lucide-react-native/icons/bandage";
export { default as Battery } from "lucide-react-native/icons/battery";
export { default as Beer } from "lucide-react-native/icons/beer";
export { default as Bell } from "lucide-react-native/icons/bell";
export { default as Bike } from "lucide-react-native/icons/bike";
export { default as Bird } from "lucide-react-native/icons/bird";
export { default as Bluetooth } from "lucide-react-native/icons/bluetooth";
export { default as Bone } from "lucide-react-native/icons/bone";
export { default as Book } from "lucide-react-native/icons/book";
export { default as BookOpen } from "lucide-react-native/icons/book-open";
export { default as Bookmark } from "lucide-react-native/icons/bookmark";
export { default as Box } from "lucide-react-native/icons/box";
export { default as Brain } from "lucide-react-native/icons/brain";
export { default as Briefcase } from "lucide-react-native/icons/briefcase";
export { default as Bug } from "lucide-react-native/icons/bug";
export { default as Building } from "lucide-react-native/icons/building";
export { default as Building2 } from "lucide-react-native/icons/building-2";
export { default as Bus } from "lucide-react-native/icons/bus";
export { default as Cake } from "lucide-react-native/icons/cake";
export { default as Calculator } from "lucide-react-native/icons/calculator";
export { default as Calendar } from "lucide-react-native/icons/calendar";
export { default as CalendarDays } from "lucide-react-native/icons/calendar-days";
export { default as Camera } from "lucide-react-native/icons/camera";
export { default as Car } from "lucide-react-native/icons/car";
export { default as Carrot } from "lucide-react-native/icons/carrot";
export { default as Cat } from "lucide-react-native/icons/cat";
export { default as ChartColumn } from "lucide-react-native/icons/chart-column";
export { default as ChartPie } from "lucide-react-native/icons/chart-pie";
export { default as Check } from "lucide-react-native/icons/check";
export { default as Cherry } from "lucide-react-native/icons/cherry";
export { default as ChevronDown } from "lucide-react-native/icons/chevron-down";
export { default as ChevronLeft } from "lucide-react-native/icons/chevron-left";
export { default as ChevronRight } from "lucide-react-native/icons/chevron-right";
export { default as CircleCheck } from "lucide-react-native/icons/circle-check";
export { default as CircleQuestionMark } from "lucide-react-native/icons/circle-question-mark";
export { default as CircleX } from "lucide-react-native/icons/circle-x";
export { default as Clapperboard } from "lucide-react-native/icons/clapperboard";
export { default as Clipboard } from "lucide-react-native/icons/clipboard";
export { default as ClipboardList } from "lucide-react-native/icons/clipboard-list";
export { default as Clock } from "lucide-react-native/icons/clock";
export { default as Cloud } from "lucide-react-native/icons/cloud";
export { default as CloudRain } from "lucide-react-native/icons/cloud-rain";
export { default as CloudUpload } from "lucide-react-native/icons/cloud-upload";
export { default as Code } from "lucide-react-native/icons/code";
export { default as Coffee } from "lucide-react-native/icons/coffee";
export { default as Compass } from "lucide-react-native/icons/compass";
export { default as CreditCard } from "lucide-react-native/icons/credit-card";
export { default as Crown } from "lucide-react-native/icons/crown";
export { default as Database } from "lucide-react-native/icons/database";
export { default as Dice5 } from "lucide-react-native/icons/dice-5";
export { default as Dna } from "lucide-react-native/icons/dna";
export { default as Dog } from "lucide-react-native/icons/dog";
export { default as DollarSign } from "lucide-react-native/icons/dollar-sign";
export { default as Drama } from "lucide-react-native/icons/drama";
export { default as Droplet } from "lucide-react-native/icons/droplet";
export { default as Drum } from "lucide-react-native/icons/drum";
export { default as Earth } from "lucide-react-native/icons/earth";
export { default as Egg } from "lucide-react-native/icons/egg";
export { default as Eye } from "lucide-react-native/icons/eye";
export { default as Feather } from "lucide-react-native/icons/feather";
export { default as File } from "lucide-react-native/icons/file";
export { default as FileText } from "lucide-react-native/icons/file-text";
export { default as Film } from "lucide-react-native/icons/film";
export { default as Fish } from "lucide-react-native/icons/fish";
export { default as Flag } from "lucide-react-native/icons/flag";
export { default as Flame } from "lucide-react-native/icons/flame";
export { default as FlaskConical } from "lucide-react-native/icons/flask-conical";
export { default as Flower2 } from "lucide-react-native/icons/flower-2";
export { default as Folder } from "lucide-react-native/icons/folder";
export { default as FolderOpen } from "lucide-react-native/icons/folder-open";
export { default as Gamepad2 } from "lucide-react-native/icons/gamepad-2";
export { default as Gem } from "lucide-react-native/icons/gem";
export { default as Gift } from "lucide-react-native/icons/gift";
export { default as GitBranch } from "lucide-react-native/icons/git-branch";
export { default as Glasses } from "lucide-react-native/icons/glasses";
export { default as Globe } from "lucide-react-native/icons/globe";
export { default as GraduationCap } from "lucide-react-native/icons/graduation-cap";
export { default as GripVertical } from "lucide-react-native/icons/grip-vertical";
export { default as Guitar } from "lucide-react-native/icons/guitar";
export { default as Hammer } from "lucide-react-native/icons/hammer";
export { default as Headphones } from "lucide-react-native/icons/headphones";
export { default as Heart } from "lucide-react-native/icons/heart";
export { default as HeartPulse } from "lucide-react-native/icons/heart-pulse";
export { default as Hospital } from "lucide-react-native/icons/hospital";
export { default as Hourglass } from "lucide-react-native/icons/hourglass";
export { default as Image } from "lucide-react-native/icons/image";
export { default as Inbox } from "lucide-react-native/icons/inbox";
export { default as Info } from "lucide-react-native/icons/info";
export { default as Key } from "lucide-react-native/icons/key";
export { default as Keyboard } from "lucide-react-native/icons/keyboard";
export { default as Laptop } from "lucide-react-native/icons/laptop";
export { default as Leaf } from "lucide-react-native/icons/leaf";
export { default as Lightbulb } from "lucide-react-native/icons/lightbulb";
export { default as Link } from "lucide-react-native/icons/link";
export { default as ListTodo } from "lucide-react-native/icons/list-todo";
export { default as Lock } from "lucide-react-native/icons/lock";
export { default as Luggage } from "lucide-react-native/icons/luggage";
export { default as Mail } from "lucide-react-native/icons/mail";
export { default as Map } from "lucide-react-native/icons/map";
export { default as MapPin } from "lucide-react-native/icons/map-pin";
export { default as Medal } from "lucide-react-native/icons/medal";
export { default as MessageCircle } from "lucide-react-native/icons/message-circle";
export { default as Mic } from "lucide-react-native/icons/mic";
export { default as Microscope } from "lucide-react-native/icons/microscope";
export { default as Minus } from "lucide-react-native/icons/minus";
export { default as Monitor } from "lucide-react-native/icons/monitor";
export { default as Moon } from "lucide-react-native/icons/moon";
export { default as Mountain } from "lucide-react-native/icons/mountain";
export { default as Mouse } from "lucide-react-native/icons/mouse";
export { default as Music } from "lucide-react-native/icons/music";
export { default as Music2 } from "lucide-react-native/icons/music-2";
export { default as Newspaper } from "lucide-react-native/icons/newspaper";
export { default as NotebookPen } from "lucide-react-native/icons/notebook-pen";
export { default as Package } from "lucide-react-native/icons/package";
export { default as Paintbrush } from "lucide-react-native/icons/paintbrush";
export { default as Palette } from "lucide-react-native/icons/palette";
export { default as Paperclip } from "lucide-react-native/icons/paperclip";
export { default as PartyPopper } from "lucide-react-native/icons/party-popper";
export { default as PawPrint } from "lucide-react-native/icons/paw-print";
export { default as PenLine } from "lucide-react-native/icons/pen-line";
export { default as PenTool } from "lucide-react-native/icons/pen-tool";
export { default as Pencil } from "lucide-react-native/icons/pencil";
export { default as Phone } from "lucide-react-native/icons/phone";
export { default as Piano } from "lucide-react-native/icons/piano";
export { default as PiggyBank } from "lucide-react-native/icons/piggy-bank";
export { default as Pill } from "lucide-react-native/icons/pill";
export { default as Pin } from "lucide-react-native/icons/pin";
export { default as Pizza } from "lucide-react-native/icons/pizza";
export { default as Plane } from "lucide-react-native/icons/plane";
export { default as Plug } from "lucide-react-native/icons/plug";
export { default as Printer } from "lucide-react-native/icons/printer";
export { default as Puzzle } from "lucide-react-native/icons/puzzle";
export { default as Receipt } from "lucide-react-native/icons/receipt";
export { default as Rocket } from "lucide-react-native/icons/rocket";
export { default as Ruler } from "lucide-react-native/icons/ruler";
export { default as Satellite } from "lucide-react-native/icons/satellite";
export { default as School } from "lucide-react-native/icons/school";
export { default as Scissors } from "lucide-react-native/icons/scissors";
export { default as Search } from "lucide-react-native/icons/search";
export { default as Server } from "lucide-react-native/icons/server";
export { default as Shield } from "lucide-react-native/icons/shield";
export { default as ShieldCheck } from "lucide-react-native/icons/shield-check";
export { default as Ship } from "lucide-react-native/icons/ship";
export { default as Shirt } from "lucide-react-native/icons/shirt";
export { default as ShoppingBag } from "lucide-react-native/icons/shopping-bag";
export { default as ShoppingCart } from "lucide-react-native/icons/shopping-cart";
export { default as Smartphone } from "lucide-react-native/icons/smartphone";
export { default as Smile } from "lucide-react-native/icons/smile";
export { default as Snowflake } from "lucide-react-native/icons/snowflake";
export { default as Sparkles } from "lucide-react-native/icons/sparkles";
export { default as Sprout } from "lucide-react-native/icons/sprout";
export { default as SquareCheck } from "lucide-react-native/icons/square-check";
export { default as Star } from "lucide-react-native/icons/star";
export { default as Stethoscope } from "lucide-react-native/icons/stethoscope";
export { default as StickyNote } from "lucide-react-native/icons/sticky-note";
export { default as Store } from "lucide-react-native/icons/store";
export { default as Sun } from "lucide-react-native/icons/sun";
export { default as Swords } from "lucide-react-native/icons/swords";
export { default as Syringe } from "lucide-react-native/icons/syringe";
export { default as Tag } from "lucide-react-native/icons/tag";
export { default as Tags } from "lucide-react-native/icons/tags";
export { default as Target } from "lucide-react-native/icons/target";
export { default as Telescope } from "lucide-react-native/icons/telescope";
export { default as Tent } from "lucide-react-native/icons/tent";
export { default as Terminal } from "lucide-react-native/icons/terminal";
export { default as ThumbsUp } from "lucide-react-native/icons/thumbs-up";
export { default as Ticket } from "lucide-react-native/icons/ticket";
export { default as TrainFront } from "lucide-react-native/icons/train-front";
export { default as Trees } from "lucide-react-native/icons/trees";
export { default as TrendingUp } from "lucide-react-native/icons/trending-up";
export { default as TriangleAlert } from "lucide-react-native/icons/triangle-alert";
export { default as Trophy } from "lucide-react-native/icons/trophy";
export { default as Truck } from "lucide-react-native/icons/truck";
export { default as Umbrella } from "lucide-react-native/icons/umbrella";
export { default as Upload } from "lucide-react-native/icons/upload";
export { default as User } from "lucide-react-native/icons/user";
export { default as Users } from "lucide-react-native/icons/users";
export { default as Utensils } from "lucide-react-native/icons/utensils";
export { default as Video } from "lucide-react-native/icons/video";
export { default as Wallet } from "lucide-react-native/icons/wallet";
export { default as Wheat } from "lucide-react-native/icons/wheat";
export { default as Wifi } from "lucide-react-native/icons/wifi";
export { default as Wine } from "lucide-react-native/icons/wine";
export { default as Wrench } from "lucide-react-native/icons/wrench";
export { default as X } from "lucide-react-native/icons/x";
export { default as Zap } from "lucide-react-native/icons/zap";
