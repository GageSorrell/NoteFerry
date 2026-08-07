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

import * as Color from "../Token/Color.js";
import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Shadow from "../Token/Shadow.js";
import { AlertTriangle, CheckCircle2, Info as InfoIcon, XCircle } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from "react-native-reanimated";
import { Body, Description } from "./Text.js";
import { Pressable, StyleSheet, View } from "react-native";
import { UseColor, useRadii, useShadow } from "../ThemeProvider.js";
import { Spinner } from "./Spinner.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The intent of a `Toast`.
 *
 * @category Notification
 * @since 1.0.0
 */
export type ToastVariant =
    | "Default"
    | "Success"
    | "Error"
    | "Warning"
    | "Info"
    | "Loading";

interface ToastRecord
{
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

let ToastState: ReadonlyArray<ToastRecord> = [ ];
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
    ToastState = Id === undefined ? [ ] : ToastState.filter((Existing: ToastRecord) => Existing.Id !== Id);
    Notify();
};

/**
 * The details of a toast message and its dispatch.
 *
 * @category Notification
 * @since 1.0.0
 */
export interface ToastOptions
{
    readonly Id?: string;
    readonly Description?: string;

    /**
     * Milliseconds before auto-dismissing. `Loading` toasts default to never auto-dismissing.
     */
    readonly Duration?: number;
}

const Push = (Message: string, Options: ToastOptions | undefined, Variant: ToastVariant): string =>
{
    const Id = Options?.Id ?? GenerateId();
    const Duration = Options?.Duration ?? (Variant === "Loading" ? Number.POSITIVE_INFINITY : 4000);

    ToastState =
        [
            ...ToastState.filter((Existing: ToastRecord) => Existing.Id !== Id),
            {
                Description: Options?.Description,
                Duration,
                Id,
                Message,
                Variant
            }
        ];
    Notify();

    if (Number.isFinite(Duration))
    {
        setTimeout(() => Dismiss(Id), Duration);
    }

    return Id;
};

/**
 * The state of an async toast message.
 *
 * @category Notification
 * @since 1.0.0
 */
export interface ToastPromiseMessages<A>
{
    readonly Loading?: string;
    readonly Success: string | ((Result: A) => string);
    readonly Error: string | ((Reason: unknown) => string);
}

interface ToastFunction
{
    (Message: string, Options?: ToastOptions): string;

    readonly Success: (Message: string, Options?: ToastOptions) => string;
    readonly Error: (Message: string, Options?: ToastOptions) => string;
    readonly Warning: (Message: string, Options?: ToastOptions) => string;
    readonly Info: (Message: string, Options?: ToastOptions) => string;
    readonly Loading: (Message: string, Options?: ToastOptions) => string;
    readonly Dismiss: (Id?: string) => void;
    readonly Promise: <Value>(Work: Promise<Value>, Messages: ToastPromiseMessages<Value>) => Promise<Value>;
}

const ToastCall =
    ((Message: string, Options?: ToastOptions): string => Push(Message, Options, "Default")) as ToastFunction;

(ToastCall as any).Success = (Message: string, Options?: ToastOptions) => Push(Message, Options, "Success");
(ToastCall as any).Error = (Message: string, Options?: ToastOptions) => Push(Message, Options, "Error");
(ToastCall as any).Warning = (Message: string, Options?: ToastOptions) => Push(Message, Options, "Warning");
(ToastCall as any).Info = (Message: string, Options?: ToastOptions) => Push(Message, Options, "Info");
(ToastCall as any).Loading = (Message: string, Options?: ToastOptions) => Push(Message, Options, "Loading");
(ToastCall as any).Dismiss = Dismiss;

(ToastCall as any).Promise = async <A,>(Work: Promise<A>, Messages: ToastPromiseMessages<A>) =>
{
    const Id = Push(Messages.Loading ?? "Loading…", undefined, "Loading");

    try
    {
        const Result = await Work;

        Push(
            typeof Messages.Success === "function"
                ? Messages.Success(Result)
                : Messages.Success, { Id }, "Success"
        );

        return Result;
    }
    catch (Reason)
    {
        Push(
            typeof Messages.Error === "function"
                ? Messages.Error(Reason)
                : Messages.Error, { Id }, "Error"
        );
        throw Reason;
    }
};

export/**
       * Imperative toast API: `Toast("Saved")`, `Toast.Success(...)`, `Toast.Promise(...)`, etc.
       * Requires a `<Toaster>` mounted once, near the app root.
       */
const Toast: ToastFunction = ToastCall;

const VariantIconColorToken =
    Object.freeze({
        Error: Semantic.Red,
        Info: Semantic.Blue,
        Success: Color.Green,
        Warning: Semantic.Orange
    } as const);

const ToastItemIcon = ({ Variant }: { readonly Variant: ToastVariant }): React.JSX.Element | null =>
{
    const GreenColor = UseColor(VariantIconColorToken.Success);
    const RedColor = UseColor(VariantIconColorToken.Error);
    const OrangeColor = UseColor(VariantIconColorToken.Warning);
    const BlueColor = UseColor(VariantIconColorToken.Info);
    const MutedColor = UseColor(Semantic.Muted);

    switch (Variant)
    {
        case "Success":
            return (
                <CheckCircle2
                    color={ GreenColor }
                    size={ 18 }
                />
            );
        case "Error":
            return (
                <XCircle
                    color={ RedColor }
                    size={ 18 }
                />
            );
        case "Warning":
            return (
                <AlertTriangle
                    color={ OrangeColor }
                    size={ 18 }
                />
            );
        case "Info":
            return (
                <InfoIcon
                    color={ BlueColor }
                    size={ 18 }
                />
            );
        case "Loading":
            return (
                <Spinner
                    Color={ MutedColor }
                    Size={ 16 }
                />
            );
        default:
            return null;
    }
};

const ToastItem = ({ Record }: { readonly Record: ToastRecord }): React.JSX.Element =>
{
    const ModalBackground = UseColor(Semantic.BackgroundModal);
    const BorderColor = UseColor(Semantic.Border);
    const LargeRadius = useRadii(Radii.Large);
    const CardShadow = useShadow(Shadow.Card);

    return (
        <Animated.View
            entering={ FadeInDown }
            exiting={ FadeOutDown }
            layout={ LinearTransition }>
            <Pressable
                accessibilityRole="alert"
                onPress={ () => Dismiss(Record.Id) }
                style={ [
                    Styles.Item,
                    {
                        backgroundColor: ModalBackground,
                        borderColor: BorderColor,
                        borderRadius: LargeRadius,
                        elevation: CardShadow.Elevation,
                        shadowColor: CardShadow.ShadowColor,
                        shadowOffset: CardShadow.ShadowOffset === undefined
                            ? undefined
                            : {
                                height: CardShadow.ShadowOffset.Height,
                                width: CardShadow.ShadowOffset.Width
                            },
                        shadowOpacity: CardShadow.ShadowOpacity,
                        shadowRadius: CardShadow.ShadowRadius
                    }
                ] }>
                <ToastItemIcon Variant={ Record.Variant } />
                <View style={ Styles.Body }>
                    <Body NumberOfLines={ 2 }>
                        { Record.Message }
                    </Body>
                    { Record.Description !== undefined && (
                        <Description Color={ Semantic.Muted }>
                            { Record.Description }
                        </Description>
                    ) }
                </View>
            </Pressable>
        </Animated.View>
    );
};

/** {@inheritDoc Toaster} */
export interface ToasterProps
{
    readonly Position?:
        | "Top"
        | "Bottom";
}

export/**
       * Mount once, near the app root, to render whatever `Toast(...)` pushes.
       *
       * @category Component
       * @since 1.0.0
       */
const Toaster = ({ Position = "Bottom" }: ToasterProps): React.JSX.Element =>
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
                Position === "Top" ? { top: Insets.top + 8 } : { bottom: Insets.bottom + 8 }
            ] }>
            { Toasts.map((Record: ToastRecord) =>
                <ToastItem
                    key={ Record.Id }
                    { ...{ Record } }
                />
            ) }
        </View>
    );
};

const Styles = StyleSheet.create({
    Body:
    {
        flex: 1,
        gap: 2
    },
    Container:
    {
        gap: 8,
        left: 12,
        position: "absolute",
        right: 12
    },
    Item:
    {
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12
    }
});
