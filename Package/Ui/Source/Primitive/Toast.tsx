/**
 * Ported from `@notion-kit/ui`'s `primitives/toast.tsx`, which was a thin
 * wrapper around `sonner`'s web-only `Toaster`/`toast`. No RN equivalent of
 * `sonner` exists, so this is a from-scratch implementation — a small
 * module-level store (plain pub/sub, not `effect`; a toast queue is
 * inherently a mutable, externally-observed singleton, which is exactly
 * what `React.useSyncExternalStore`-style stores are for) driving a
 * `Toaster` that renders the active stack with `react-native-reanimated`
 * enter/exit transitions — but it keeps `sonner`'s imperative call shape
 * (`Toast(message)`, `Toast.Success(message)`, `Toast.Promise(...)`, ...)
 * so call sites read the same way.
 *
 * @module @notivex/ui/Primitive/Toast
 *
 * @file      Toast.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AlertTriangle, CheckCircle2, Info as InfoIcon, XCircle } from "lucide-react-native";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UseColor, useRadii, useShadow } from "../ThemeProvider.js";
import * as Color from "../Token/Color.js";
import * as Radii from "../Token/Radii.js";
import * as Semantic from "../Token/Semantic.js";
import * as Shadow from "../Token/Shadow.js";
import { Spinner } from "./Spinner.js";
import { Text } from "./Text.js";

export type ToastVariant = "Default" | "Success" | "Error" | "Warning" | "Info" | "Loading";

interface ToastRecord {
    readonly Id: string;
    readonly Message: string;
    readonly Description?: string | undefined;
    readonly Variant: ToastVariant;
    readonly Duration: number;
}

// -----------------------------------------------------------------------
// Store — a plain module-level singleton + subscriber set. This is public-
// API-only state (never `Effect`/`Layer`), so there's no reason to route
// it through `effect` internally either.
// -----------------------------------------------------------------------

let ToastState: ReadonlyArray<ToastRecord> = [];
const Listeners = new Set<(Toasts: ReadonlyArray<ToastRecord>) => void>();

const Notify = (): void =>
{
    for (const Listener of Listeners)
    {
        Listener(ToastState);
    }
};

const GenerateId = (): string => `${ Date.now() }-${ Math.random().toString(36).slice(2) }`;

const Dismiss = (Id?: string): void =>
{
    ToastState = Id === undefined ? [] : ToastState.filter((Existing) => Existing.Id !== Id);
    Notify();
};

export interface ToastOptions {
    readonly Id?: string;
    readonly Description?: string;
    /** Milliseconds before auto-dismissing. `Loading` toasts default to never auto-dismissing. */
    readonly Duration?: number;
}

const Push = (Message: string, Options: ToastOptions | undefined, Variant: ToastVariant): string =>
{
    const Id = Options?.Id ?? GenerateId();
    const Duration = Options?.Duration ?? (Variant === "Loading" ? Number.POSITIVE_INFINITY : 4000);

    ToastState = [ ...ToastState.filter((Existing) => Existing.Id !== Id), { Id, Message, Description: Options?.Description, Variant, Duration } ];
    Notify();

    if (Number.isFinite(Duration))
    {
        setTimeout(() => Dismiss(Id), Duration);
    }

    return Id;
};

export interface ToastPromiseMessages<Value> {
    readonly Loading?: string;
    readonly Success: string | ((Result: Value) => string);
    readonly Error: string | ((Reason: unknown) => string);
}

interface ToastFunction {
    (Message: string, Options?: ToastOptions): string;
    readonly Success: (Message: string, Options?: ToastOptions) => string;
    readonly Error: (Message: string, Options?: ToastOptions) => string;
    readonly Warning: (Message: string, Options?: ToastOptions) => string;
    readonly Info: (Message: string, Options?: ToastOptions) => string;
    readonly Loading: (Message: string, Options?: ToastOptions) => string;
    readonly Dismiss: (Id?: string) => void;
    readonly Promise: <Value>(Work: Promise<Value>, Messages: ToastPromiseMessages<Value>) => Promise<Value>;
}

const ToastCall = ((Message: string, Options?: ToastOptions): string => Push(Message, Options, "Default")) as ToastFunction;

(ToastCall as { Success: ToastFunction["Success"] }).Success = (Message, Options) => Push(Message, Options, "Success");
(ToastCall as { Error: ToastFunction["Error"] }).Error = (Message, Options) => Push(Message, Options, "Error");
(ToastCall as { Warning: ToastFunction["Warning"] }).Warning = (Message, Options) => Push(Message, Options, "Warning");
(ToastCall as { Info: ToastFunction["Info"] }).Info = (Message, Options) => Push(Message, Options, "Info");
(ToastCall as { Loading: ToastFunction["Loading"] }).Loading = (Message, Options) => Push(Message, Options, "Loading");
(ToastCall as { Dismiss: ToastFunction["Dismiss"] }).Dismiss = Dismiss;

(ToastCall as { Promise: ToastFunction["Promise"] }).Promise = async (Work, Messages) =>
{
    const Id = Push(Messages.Loading ?? "Loading…", undefined, "Loading");

    try
    {
        const Result = await Work;
        Push(typeof Messages.Success === "function" ? Messages.Success(Result) : Messages.Success, { Id }, "Success");
        return Result;
    }
    catch (Reason)
    {
        Push(typeof Messages.Error === "function" ? Messages.Error(Reason) : Messages.Error, { Id }, "Error");
        throw Reason;
    }
};

/** Imperative toast API — `Toast("Saved")`, `Toast.Success(...)`, `Toast.Promise(...)`, etc. Requires a `<Toaster>` mounted once, near the app root. */
export const Toast: ToastFunction = ToastCall;

// -----------------------------------------------------------------------
// Rendering.
// -----------------------------------------------------------------------

const VariantIconColorToken = {
    Success: Color.Green,
    Error: Semantic.Red,
    Warning: Semantic.Orange,
    Info: Semantic.Blue,
} as const;

const ToastItemIcon = ({ Variant }: { readonly Variant: ToastVariant }): React.JSX.Element | null =>
{
    const GreenColor = UseColor(VariantIconColorToken.Success);
    const RedColor = UseColor(VariantIconColorToken.Error);
    const OrangeColor = UseColor(VariantIconColorToken.Warning);
    const BlueColor = UseColor(VariantIconColorToken.Info);
    const MutedColor = UseColor(Semantic.Muted);

    switch (Variant)
    {
        case "Success": return <CheckCircle2 size={ 18 } color={ GreenColor } />;
        case "Error": return <XCircle size={ 18 } color={ RedColor } />;
        case "Warning": return <AlertTriangle size={ 18 } color={ OrangeColor } />;
        case "Info": return <InfoIcon size={ 18 } color={ BlueColor } />;
        case "Loading": return <Spinner Size={ 16 } Color={ MutedColor } />;
        default: return null;
    }
};

const ToastItem = ({ Record }: { readonly Record: ToastRecord }): React.JSX.Element =>
{
    const ModalBackground = UseColor(Semantic.BackgroundModal);
    const BorderColor = UseColor(Semantic.Border);
    const LargeRadius = useRadii(Radii.Large);
    const CardShadow = useShadow(Shadow.Card);

    return (
        <Animated.View entering={ FadeInDown } exiting={ FadeOutDown } layout={ LinearTransition }>
            <Pressable
                onPress={ () => Dismiss(Record.Id) }
                accessibilityRole="alert"
                style={ [
                    Styles.Item,
                    {
                        backgroundColor: ModalBackground,
                        borderRadius: LargeRadius,
                        borderColor: BorderColor,
                        shadowColor: CardShadow.ShadowColor,
                        shadowOffset: CardShadow.ShadowOffset === undefined
                            ? undefined
                            : { width: CardShadow.ShadowOffset.Width, height: CardShadow.ShadowOffset.Height },
                        shadowOpacity: CardShadow.ShadowOpacity,
                        shadowRadius: CardShadow.ShadowRadius,
                        elevation: CardShadow.Elevation,
                    },
                ] }
            >
                <ToastItemIcon Variant={ Record.Variant } />
                <View style={ Styles.Body }>
                    <Text Variant="Body" NumberOfLines={ 2 }>{ Record.Message }</Text>
                    { Record.Description !== undefined && <Text Variant="Description" Color={ Semantic.Muted }>{ Record.Description }</Text> }
                </View>
            </Pressable>
        </Animated.View>
    );
};

export interface ToasterProps {
    readonly Position?: "Top" | "Bottom";
}

/** Mount once, near the app root, to render whatever `Toast(...)` pushes. */
export const Toaster = ({ Position = "Bottom" }: ToasterProps): React.JSX.Element =>
{
    const [ Toasts, SetToasts ] = React.useState(ToastState);
    const Insets = useSafeAreaInsets();

    React.useEffect(() =>
    {
        Listeners.add(SetToasts);
        return () => { Listeners.delete(SetToasts); };
    }, []);

    return (
        <View
            pointerEvents="box-none"
            style={ [
                Styles.Container,
                Position === "Top" ? { top: Insets.top + 8 } : { bottom: Insets.bottom + 8 },
            ] }
        >
            { Toasts.map((Record) => <ToastItem key={ Record.Id } Record={ Record } />) }
        </View>
    );
};

const Styles = StyleSheet.create({
    Container: {
        position: "absolute",
        left: 12,
        right: 12,
        gap: 8,
    },
    Item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    Body: {
        flex: 1,
        gap: 2,
    },
});
