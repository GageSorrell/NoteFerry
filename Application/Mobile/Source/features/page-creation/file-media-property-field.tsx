/**
 * Attachment input for Notion Files & media properties. Tapping the empty
 * property value presents a bottom sheet offering "Upload" (the native file
 * picker) or "Link" (a pasted URL); once set, the value renders as a small
 * thumbnail and tapping it reopens the same sheet (now with a Remove
 * action) to change or clear it.
 *
 * @module notivex/features/page-creation/file-media-property-field
 *
 * @file      file-media-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as DocumentPicker from "expo-document-picker";
import type * as Domain from "@notivex/domain";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
    Body,
    BottomSheet,
    type BottomSheet as BottomSheetHandle,
    BottomSheetView,
    Button,
    Input
} from "@notivex/ui/Primitive";
import { File as FileIcon, Link as LinkIcon, Play, Upload } from "lucide-react-native";
import { ImageStyle, MakeStyles, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { PropertyOptionSheetTrigger } from "@/features/page-creation/property-option-sheet";
import { View } from "react-native";

const VideoExtensions: ReadonlySet<string> = new Set([
    "3gp",
    "avi",
    "m4v",
    "mkv",
    "mov",
    "mp4",
    "webm"
]);

/** Returns the lowercased file extension from a URI or filename, if any. */
const GetExtension = (Value: string): string =>
{
    const WithoutQuery = Value.split(/[?#]/u)[0] ?? Value;
    const Segment = WithoutQuery.split("/").pop() ?? WithoutQuery;
    const Dot = Segment.lastIndexOf(".");

    return Dot === -1 ? "" : Segment.slice(Dot + 1).toLowerCase();
};

/** A file or media attachment picked from the device, or pasted as a link. */
export interface FileMediaValue
{
    readonly MimeType?: string | undefined;
    readonly Name?: string | undefined;
    readonly Type: "Local" | "Link";
    readonly Uri: string;
}

const IsVideoValue = (Value: FileMediaValue): boolean =>
    Boolean(Value.MimeType?.startsWith("video/"))
    || VideoExtensions.has(GetExtension(Value.Name ?? Value.Uri));

const IsLikelyUrl = (Value: string): boolean =>
{
    try
    {
        const Parsed = new URL(Value.trim());

        return Parsed.protocol === "http:" || Parsed.protocol === "https:";
    }
    catch
    {
        return false;
    }
};

interface MediaPlaceholderProps
{
    readonly Video?: boolean;
}

/** The generic gray thumbnail shown for a video link, or any attachment that fails to preview. */
const MediaPlaceholder = ({ Video = false }: MediaPlaceholderProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();

    return (
        <View style={ [ Styles.Thumbnail, Styles.Placeholder ] }>
            { Video
                ? (
                    <View style={ Styles.PlayCircle }>
                        <Play
                            color="#FFFFFF"
                            fill="#FFFFFF"
                            size={ 12 }
                        />
                    </View>
                )
                : (
                    <FileIcon
                        color={ Theme.Semantic.Muted }
                        size={ 16 }
                    />
                ) }
        </View>
    );
};

/** {@inheritDoc FileMediaThumbnail} */
interface FileMediaThumbnailProps
{
    readonly Value: FileMediaValue;
}

/**
 * Renders the attached file's thumbnail: a real preview frame for a local
 * image or video, a downloaded preview for an image link, and the generic
 * placeholder for a video link or anything that fails to preview.
 */
const FileMediaThumbnail = ({ Value }: FileMediaThumbnailProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const [ LocalVideoThumbnail, SetLocalVideoThumbnail ] = useState<string | null>(null);
    const [ ImageFailed, SetImageFailed ] = useState(false);
    const IsLocalVideo = Value.Type === "Local" && IsVideoValue(Value);

    useEffect(() =>
    {
        SetImageFailed(false);
    }, [ Value.Uri ]);

    useEffect(() =>
    {
        if (!IsLocalVideo)
        {
            SetLocalVideoThumbnail(null);

            return;
        }

        let Cancelled = false;

        VideoThumbnails.getThumbnailAsync(Value.Uri, { time: 0 })
            .then((Result: VideoThumbnails.VideoThumbnailsResult) =>
            {
                if (!Cancelled)
                {
                    SetLocalVideoThumbnail(Result.uri);
                }
            })
            .catch(() =>
            {
                if (!Cancelled)
                {
                    SetLocalVideoThumbnail(null);
                }
            });

        return () =>
        {
            Cancelled = true;
        };
    }, [ IsLocalVideo, Value.Uri ]);

    if (Value.Type === "Link" && IsVideoValue(Value))
    {
        return <MediaPlaceholder Video />;
    }

    if (IsLocalVideo)
    {
        return LocalVideoThumbnail === null
            ? <MediaPlaceholder Video />
            : (
                <Image
                    accessibilityIgnoresInvertColors
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={ { uri: LocalVideoThumbnail } }
                    style={ Styles.Thumbnail }
                />
            );
    }

    if (ImageFailed)
    {
        return <MediaPlaceholder />;
    }

    return (
        <Image
            accessibilityIgnoresInvertColors
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={ () => SetImageFailed(true) }
            source={ { uri: Value.Uri } }
            style={ Styles.Thumbnail }
        />
    );
};

interface FileMediaSheetProps
{
    readonly OnRemove?: (() => void) | undefined;
    readonly OnSelect: (Value: FileMediaValue) => void;
    readonly Ref: React.RefObject<BottomSheetHandle | null>;
}

/** The "Upload"/"Link" picker sheet — Link replaces the two options with a URL field + Submit. */
const FileMediaSheet = ({ OnRemove, OnSelect, Ref }: FileMediaSheetProps): React.JSX.Element =>
{
    const [ Mode, SetMode ] = useState<"Choose" | "Link">("Choose");
    const [ LinkValue, SetLinkValue ] = useState("");
    const [ IsPicking, SetIsPicking ] = useState(false);
    const Theme = useTheme();
    const Styles = useStyles();

    const Reset = (): void =>
    {
        SetMode("Choose");
        SetLinkValue("");
    };

    const HandleUpload = async (): Promise<void> =>
    {
        SetIsPicking(true);

        try
        {
            const Result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
            const Asset = Result.canceled ? undefined : Result.assets[ 0 ];

            if (Asset !== undefined)
            {
                OnSelect({
                    ...(Asset.mimeType === undefined ? { } : { MimeType: Asset.mimeType }),
                    Name: Asset.name,
                    Type: "Local",
                    Uri: Asset.uri
                });
                Reset();
                Ref.current?.dismiss();
            }
        }
        finally
        {
            SetIsPicking(false);
        }
    };

    const HandleLinkSubmit = (): void =>
    {
        if (!IsLikelyUrl(LinkValue))
        {
            return;
        }

        OnSelect({ Type: "Link", Uri: LinkValue.trim() });
        Reset();
        Ref.current?.dismiss();
    };

    return (
        <BottomSheet
            OnDismiss={ Reset }
            Ref={ Ref }>
            <BottomSheetView style={ Styles.Sheet }>
                { OnRemove !== undefined && (
                    <Button
                        Appearance="Hint"
                        OnPress={ () =>
                        {
                            OnRemove();
                            Reset();
                            Ref.current?.dismiss();
                        } }
                        Size="Small"
                        Style={ Styles.RemoveButton }>
                        Remove
                    </Button>
                ) }
                { Mode === "Choose"
                    ? (
                        <View style={ Styles.ChooseRows }>
                            <Button
                                Appearance="Primary"
                                Loading={ IsPicking }
                                OnPress={ () => void HandleUpload() }>
                                <Upload
                                    color={ Theme.Semantic.Icon }
                                    size={ 16 }
                                />
                                <Body>Upload</Body>
                            </Button>
                            <Button
                                Appearance="Primary"
                                OnPress={ () => SetMode("Link") }>
                                <LinkIcon
                                    color={ Theme.Semantic.Icon }
                                    size={ 16 }
                                />
                                <Body>Link</Body>
                            </Button>
                        </View>
                    )
                    : (
                        <View style={ Styles.LinkRow }>
                            <Input
                                Clear
                                KeyboardType="url"
                                OnCancel={ () => SetLinkValue("") }
                                OnChangeText={ SetLinkValue }
                                OnSubmitEditing={ HandleLinkSubmit }
                                Placeholder="Paste an image or video link…"
                                Style={ Styles.LinkInput }
                                Value={ LinkValue }
                            />
                            <Button
                                Appearance="Blue"
                                Disabled={ !IsLikelyUrl(LinkValue) }
                                OnPress={ HandleLinkSubmit }
                                Size="Small">
                                Submit
                            </Button>
                        </View>
                    ) }
            </BottomSheetView>
        </BottomSheet>
    );
};

/** Props for a Notion Files & media property field. */
export interface FileMediaPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: FileMediaValue | undefined) => void;
    readonly Property: Domain.Property.FilesPropertyDefinition;
    readonly Value?: FileMediaValue | undefined;
}

/** Renders a labeled attachment field for a Notion Files & media property. */
export function FileMediaPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: FileMediaPropertyFieldProps): React.JSX.Element
{
    const Styles = useStyles();
    const SheetRef = useRef<BottomSheetHandle | null>(null);

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <PropertyOptionSheetTrigger
                AccessibilityLabel={ Property.Name }
                Disabled={ Disabled }
                Inline={ Inline }
                OnPress={ () => SheetRef.current?.present() }>
                { Value === undefined
                    ? <Body Color={ Token.Semantic.Muted }>Empty</Body>
                    : <FileMediaThumbnail Value={ Value } /> }
            </PropertyOptionSheetTrigger>
            <FileMediaSheet
                OnRemove={ Value === undefined ? undefined : () => OnValueChange(undefined) }
                OnSelect={ OnValueChange }
                Ref={ SheetRef }
            />
        </View>
    );
}

const useStyles = MakeStyles({
    ChooseRows: ViewStyle({
        gap: 8,
        padding: 16
    }),
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    LinkInput: ViewStyle({
        flex: 1
    }),
    LinkRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        padding: 16
    }),
    Placeholder: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.BackgroundInput,
        borderColor: Token.Semantic.Ring,
        borderWidth: 1,
        justifyContent: "center"
    }),
    PlayCircle: ViewStyle({
        alignItems: "center",
        backgroundColor: Token.Semantic.Icon,
        borderRadius: 10,
        height: 20,
        justifyContent: "center",
        width: 20
    }),
    RemoveButton: ViewStyle({
        alignSelf: "flex-end",
        marginRight: 8,
        marginTop: 8
    }),
    Sheet: ViewStyle({
        paddingBottom: Token.Spacing.Xl
    }),
    Thumbnail: ImageStyle({
        borderRadius: 6,
        height: 32,
        width: 32
    })
});
