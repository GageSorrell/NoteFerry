/**
 * Ported from `@notion-kit/ui`'s `primitives/avatar.tsx` (built there on
 * `@base-ui/react/avatar`'s compound Root/Image/Fallback pattern — RN has no
 * equivalent primitive, so the load-state tracking that pattern gives for
 * free is reimplemented here via a small internal context). Uses
 * `expo-image` for the image itself.
 *
 * @module @notivex/ui/Primitive/Avatar
 *
 * @file      Avatar.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Image, type ImageSource } from "expo-image";
import { type ImageStyle, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { UseToken } from "../ThemeProvider.js";
import { WithAlpha } from "../Utility/index.js";

type AvatarStatus =
    | "Idle"
    | "Loaded"
    | "Error";

interface AvatarContextValue
{
    readonly Status: AvatarStatus;
    readonly SetStatus: (Status: AvatarStatus) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | undefined>(undefined);

const useAvatarContext = (): AvatarContextValue =>
{
    const Value = React.useContext(AvatarContext);

    if (Value === undefined)
    {
        throw new Error("[@notivex/ui] `AvatarImage`/`AvatarFallback` must be used inside `<Avatar>`.");
    }

    return Value;
};

/** {@inheritDoc Avatar} */
export interface AvatarProps extends React.PropsWithChildren
{
    readonly Size?: number;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * A circular container that coordinates an avatar image and its fallback content.
       *
       * @category Component
       * @since 1.0.0
       */
const Avatar = ({ Size = 40, Style, children }: AvatarProps): React.JSX.Element =>
{
    const [ Status, SetStatus ] = React.useState<AvatarStatus>("Idle");
    const { [Semantic.Border]: BorderColor } = UseToken(Semantic.Border);

    const ContextValue = React.useMemo<AvatarContextValue>(() => ({ SetStatus, Status }), [ Status ]);

    return (
        <AvatarContext.Provider value={ ContextValue }>
            <View
                style={ [
                    Styles.Root,
                    {
                        borderColor: BorderColor,
                        borderRadius: Size / 2,
                        height: Size,
                        width: Size
                    },
                    Style
                ] }>
                { children }
            </View>
        </AvatarContext.Provider>
    );
};

/** {@inheritDoc AvatarImage} */
export interface AvatarImageProps
{
    readonly Source: ImageSource | string;
    readonly Style?: StyleProp<ImageStyle>;
}

export/**
       * The image displayed inside an `Avatar` and used to track its loading state.
       *
       * @category Component
       * @since 1.0.0
       */
const AvatarImage = ({ Source, Style }: AvatarImageProps): React.JSX.Element =>
{
    const { SetStatus } = useAvatarContext();

    return (
        <Image
            onError={ () => SetStatus("Error") }
            onLoad={ () => SetStatus("Loaded") }
            source={ typeof Source === "string" ? { uri: Source } : Source }
            style={ [ Styles.Fill, Style ] }
        />
    );
};

/** {@inheritDoc AvatarFallback} */
export interface AvatarFallbackProps extends React.PropsWithChildren { }

export/**
       * Fallback content shown until the `Avatar` image loads or when loading fails.
       *
       * @category Component
       * @since 1.0.0
       */
const AvatarFallback = ({ children }: AvatarFallbackProps): React.JSX.Element | null =>
{
    const { Status } = useAvatarContext();
    const { [Semantic.Default]: DefaultColor } = UseToken(Semantic.Default);

    if (Status === "Loaded")
    {
        return null;
    }

    return (
        <View style={ [ Styles.Fill, Styles.Fallback, { backgroundColor: WithAlpha(DefaultColor, 0.05) } ] }>
            { children }
        </View>
    );
};

const Styles = StyleSheet.create({
    Fallback:
    {
        alignItems: "center",
        justifyContent: "center"
    },
    Fill:
    {
        height: "100%",
        width: "100%"
    },
    Root:
    {
        borderWidth: 1,
        overflow: "hidden"
    }
});
