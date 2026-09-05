/**
 * Windows variant of `Avatar.tsx`. Identical except it renders with React
 * Native core's `Image` instead of `expo-image`'s `Image`, which is not
 * resolvable outside an Expo host. The `Source` prop is narrowed to
 * `{ readonly uri: string } | string` — RN core's `Image` has no equivalent
 * to `expo-image`'s richer `ImageSource` (blurhash placeholders, local
 * asset `require`s with automatic scale selection, etc.), so that
 * flexibility is a documented public-API difference on this platform.
 *
 * @module @noteferry/ui/Primitive/Avatar
 *
 * @file      Avatar.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Image, type ImageStyle, type StyleProp, View, type ViewStyle } from "react-native";
import { ImageStyle as MakeImageStyle, MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";

import { WithAlpha } from "../Utility/index.js";
import { useToken } from "../ThemeProvider.js";

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
        throw new Error("[@noteferry/ui] `AvatarImage`/`AvatarFallback` must be used inside `<Avatar>`.");
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
    const Styles = useStyles();
    const [ Status, SetStatus ] = React.useState<AvatarStatus>("Idle");
    const { [Semantic.Border]: BorderColor } = useToken(Semantic.Border);

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
    readonly Source: { readonly uri: string } | string;
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
    const Styles = useStyles();
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
    const Styles = useStyles();
    const { Status } = useAvatarContext();
    const { [Semantic.Default]: DefaultColor } = useToken(Semantic.Default);

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

const useStyles = MakeStyles({
    Fallback: MakeViewStyle({
        alignItems: "center",
        justifyContent: "center"
    }),
    Fill: MakeImageStyle({
        height: "100%",
        width: "100%"
    }),
    Root: MakeViewStyle({
        borderWidth: 1,
        overflow: "hidden"
    })
});
