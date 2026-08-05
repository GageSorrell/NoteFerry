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

import { Image, type ImageSource } from "expo-image";
import * as React from "react";
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import { UseColor } from "../ThemeProvider.js";
import * as Semantic from "../Token/Semantic.js";
import { WithAlpha } from "../Utility/index.js";

type AvatarStatus = "Idle" | "Loaded" | "Error";

interface AvatarContextValue {
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

export interface AvatarProps {
    readonly Size?: number;
    readonly Style?: StyleProp<ViewStyle>;
    readonly children?: React.ReactNode;
}

export const Avatar = ({ Size = 40, Style, children }: AvatarProps): React.JSX.Element =>
{
    const [ Status, SetStatus ] = React.useState<AvatarStatus>("Idle");
    const BorderColor = UseColor(Semantic.Border);

    const ContextValue = React.useMemo<AvatarContextValue>(() => ({ Status, SetStatus }), [ Status ]);

    return (
        <AvatarContext.Provider value={ ContextValue }>
            <View
                style={ [
                    Styles.Root,
                    { width: Size, height: Size, borderRadius: Size / 2, borderColor: BorderColor },
                    Style,
                ] }
            >
                { children }
            </View>
        </AvatarContext.Provider>
    );
};

export interface AvatarImageProps {
    readonly Source: ImageSource | string;
    readonly Style?: StyleProp<ImageStyle>;
}

export const AvatarImage = ({ Source, Style }: AvatarImageProps): React.JSX.Element =>
{
    const { SetStatus } = useAvatarContext();

    return (
        <Image
            source={ typeof Source === "string" ? { uri: Source } : Source }
            style={ [ Styles.Fill, Style ] }
            onLoad={ () => SetStatus("Loaded") }
            onError={ () => SetStatus("Error") }
        />
    );
};

export interface AvatarFallbackProps {
    readonly children?: React.ReactNode;
}

export const AvatarFallback = ({ children }: AvatarFallbackProps): React.JSX.Element | null =>
{
    const { Status } = useAvatarContext();
    const DefaultColor = UseColor(Semantic.Default);

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
    Root: {
        overflow: "hidden",
        borderWidth: 1,
    },
    Fill: {
        width: "100%",
        height: "100%",
    },
    Fallback: {
        alignItems: "center",
        justifyContent: "center",
    },
});
