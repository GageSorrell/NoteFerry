/**
 * Windows variant of `Toast.tsx`. Identical store/imperative API
 * (`Toast(message)`, `Toast.Success(...)`, `Toast.Promise(...)`, ...); only
 * `ToastItem`'s enter/exit visuals differ — `react-native-reanimated`'s
 * `FadeInDown`/`FadeOutDown`/`LinearTransition` are replaced with a small,
 * JS-driven `Animated.Value` fade + `translateY`. Since a toast leaving the
 * `Toasts` array unmounts immediately with no chance to animate out, the
 * `Toaster` here keeps a short-lived local mirror of the store's records so a
 * removed toast can finish its exit animation before actually unmounting.
 *
 * @module @noteferry/ui/Primitive/Toast
 *
 * @file      Toast.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Color from "../Token/Color.js";
import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import * as Shadow from "../Token/Shadow.js";
import {
    CircleCheck as CheckCircle2,
    CircleX as XCircle,
    Info as InfoIcon,
    TriangleAlert as AlertTriangle
} from "../Icon.js";
import { Body, Description } from "./Text.js";
import { MakeStyles, ViewStyle } from "../MakeStyles.js";
import { Animated, StyleSheet, View } from "react-native";
import { Pressable } from "./Pressable.js";
import { Spinner } from "./Spinner.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToken } from "../ThemeProvider.js";

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
    readonly Promise: <A>(Work: Promise<A>, Messages: ToastPromiseMessages<A>) => Promise<A>;
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
    const {
        [VariantIconColorToken.Success]: GreenColor,
        [VariantIconColorToken.Error]: RedColor,
        [VariantIconColorToken.Warning]: OrangeColor,
        [VariantIconColorToken.Info]: BlueColor,
        [Semantic.Muted]: MutedColor
    } = useToken(
        VariantIconColorToken.Success,
        VariantIconColorToken.Error,
        VariantIconColorToken.Warning,
        VariantIconColorToken.Info,
        Semantic.Muted
    );

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

/* Matches the exit-hold `Toaster` gives a removed record below, so the fade/
 * slide-out actually finishes before the item unmounts. */
const ExitDurationMs = 150;
const EnterDurationMs = 200;

const ToastItem = ({ Record, Leaving }: { readonly Record: ToastRecord; readonly Leaving: boolean }): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        [Semantic.BackgroundModal]: ModalBackground,
        [Semantic.Border]: BorderColor,
        [Radii.Large]: LargeRadius,
        [Shadow.Card]: CardShadow
    } = useToken(
        Semantic.BackgroundModal,
        Semantic.Border,
        Radii.Large,
        Shadow.Card
    );

    /* Plain, JS-driven `Animated.Value`s (no worklets) standing in for
     * Reanimated's `FadeInDown`/`FadeOutDown`: 0 → 1 opacity and a 20px →
     * 0px slide up on mount, reversed on `Leaving`. */
    const Progress = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() =>
    {
        Animated.timing(Progress, {
            duration: Leaving ? ExitDurationMs : EnterDurationMs,
            toValue: Leaving ? 0 : 1,
            useNativeDriver: true
        }).start();
    }, [ Leaving, Progress ]);

    return (
        <Animated.View
            style={ {
                opacity: Progress,
                transform: [ {
                    translateY: Progress.interpolate({
                        inputRange: [ 0, 1 ],
                        outputRange: [ 20, 0 ]
                    })
                } ]
            } }>
            <Pressable
                Accessibility={ {
                    Label: undefined,
                    Role: "alert"
                } }
                OnPress={ () => Dismiss(Record.Id) }
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

interface DisplayedToast extends ToastRecord
{
    readonly Leaving: boolean;
}

export/**
       * Mount once, near the app root, to render whatever `Toast(...)` pushes.
       *
       * @category Component
       * @since 1.0.0
       */
const Toaster = ({ Position = "Bottom" }: ToasterProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const [ Toasts, SetToasts ] = React.useState(ToastState);
    const [ Displayed, SetDisplayed ] = React.useState<ReadonlyArray<DisplayedToast>>(
        ToastState.map((Record: ToastRecord) => ({ ...Record, Leaving: false }))
    );
    const Insets = useSafeAreaInsets();

    React.useEffect(() =>
    {
        Listeners.add(SetToasts);
        return () => { Listeners.delete(SetToasts); };
    }, []);

    /* `Toasts` (the store's live snapshot) drops a record the instant it's
     * dismissed, which would otherwise unmount `ToastItem` mid-exit-
     * animation. `Displayed` mirrors it but holds a just-removed record for
     * `ExitDurationMs` (flagged `Leaving`) before actually dropping it. */
    React.useEffect(() =>
    {
        SetDisplayed((Previous: ReadonlyArray<DisplayedToast>) =>
        {
            const LiveById = new Map(Toasts.map((Record: ToastRecord) => [ Record.Id, Record ] as const));

            const NewlyLeavingIds = new Set(
                Previous
                    .filter((Record: DisplayedToast) => !LiveById.has(Record.Id) && !Record.Leaving)
                    .map((Record: DisplayedToast) => Record.Id)
            );

            for (const Id of NewlyLeavingIds)
            {
                setTimeout(() =>
                {
                    SetDisplayed((Current: ReadonlyArray<DisplayedToast>) =>
                        Current.filter((Existing: DisplayedToast) => Existing.Id !== Id));
                }, ExitDurationMs);
            }

            const Kept: ReadonlyArray<DisplayedToast> = Previous
                .filter((Record: DisplayedToast) => LiveById.has(Record.Id) || Record.Leaving)
                .map((Record: DisplayedToast): DisplayedToast =>
                {
                    const Live = LiveById.get(Record.Id);
                    return Live === undefined ? Record : { ...Live, Leaving: false };
                })
                .map((Record: DisplayedToast): DisplayedToast =>
                    NewlyLeavingIds.has(Record.Id) ? { ...Record, Leaving: true } : Record);

            const Added: ReadonlyArray<DisplayedToast> = Toasts
                .filter((Record: ToastRecord) => !Previous.some((Existing: DisplayedToast) => Existing.Id === Record.Id))
                .map((Record: ToastRecord): DisplayedToast => ({ ...Record, Leaving: false }));

            return [ ...Kept, ...Added ];
        });
    }, [ Toasts ]);

    return (
        <View
            pointerEvents="box-none"
            style={ [
                Styles.Container,
                Position === "Top" ? { top: Insets.top + 8 } : { bottom: Insets.bottom + 8 }
            ] }>
            { Displayed.map((Record: DisplayedToast) =>
                <ToastItem
                    key={ Record.Id }
                    Leaving={ Record.Leaving }
                    { ...{ Record } }
                />
            ) }
        </View>
    );
};

const useStyles = MakeStyles({
    Body: ViewStyle({
        flex: 1,
        gap: 2
    }),
    Container: ViewStyle({
        gap: 8,
        left: 12,
        position: "absolute",
        right: 12
    }),
    Item: ViewStyle({
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12
    })
});
