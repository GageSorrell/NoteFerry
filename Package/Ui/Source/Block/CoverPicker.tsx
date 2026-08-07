/**
 * Ported from `@notion-kit/ui`'s `cover/cover-picker.tsx`. Source's three
 * tabs (`Upload` via `SingleImageDropzone`, `Link` via `UrlForm`,
 * `Unsplash` via its own API-backed search) become two here:
 *
 * - `Upload` uses `expo-image-picker`'s photo library picker directly,
 *   rather than a drag-and-drop zone (no drag-and-drop on a touch device).
 * - `Link` is a minimal inline URL field + submit button, not a reusable
 *   `UrlForm` — this port's `Blocks` list deliberately excluded `UrlForm`
 *   as a standalone primitive (it's a thin `react-hook-form` + `zod`
 *   wrapper around `Input`/`Button` this package already has), so
 *   `CoverPicker` just does the one-line equivalent inline instead of
 *   pulling in `react-hook-form`/`zod` for a single field.
 * - `Unsplash` (an API-key-gated image search) isn't ported — see the
 *   `unsplash`/`single-image-dropzone` blocks' own scoping notes; nothing
 *   here precludes adding it as a third tab later.
 *
 * @module @notivex/ui/Primitive/CoverPicker
 *
 * @file      CoverPicker.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as ImagePicker from "expo-image-picker";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    BottomSheet,
    type BottomSheetProps,
    BottomSheetView
} from "../Primitive/BottomSheet.js";
import { StyleSheet, View } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Primitive/Tabs.js";
import { Body } from "../Primitive/Text.js";
import { Button } from "../Primitive/Button.js";
import { Image } from "lucide-react-native";
import { Input } from "../Primitive/Input.js";
import { UseColor } from "../ThemeProvider.js";

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

interface UploadTabProps
{
    readonly OnSelect: (Url: string) => void;
}

const UploadTab = ({ OnSelect }: UploadTabProps): React.JSX.Element =>
{
    const [ IsPicking, SetIsPicking ] = React.useState(false);
    const IconColor = UseColor(Semantic.Icon);

    const HandlePress = async (): Promise<void> =>
    {
        SetIsPicking(true);

        try
        {
            const Permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!Permission.granted)
            {
                return;
            }

            const Result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: [ "images" ],
                quality: 0.9
            });

            const Asset = Result.canceled ? undefined : Result.assets[ 0 ];

            if (Asset !== undefined)
            {
                OnSelect(Asset.uri);
            }
        }
        finally
        {
            SetIsPicking(false);
        }
    };

    return (
        <View style={ Styles.TabBody }>
            <Button
                Appearance="Primary"
                Loading={ IsPicking }
                OnPress={ () => void HandlePress() }>
                <Image
                    color={ IconColor }
                    size={ 16 }
                />
                <Body>
                    Choose from Photos
                </Body>
            </Button>
            <Body
                Color={ Semantic.Muted }
                Style={ Styles.Hint }>
                Images wider than 1500 pixels work best.
            </Body>
        </View>
    );
};

interface LinkTabProps
{
    readonly OnSelect: (Url: string) => void;
}

const LinkTab = ({ OnSelect }: LinkTabProps): React.JSX.Element =>
{
    const [ Value, SetValue ] = React.useState("");
    const IsValid = IsLikelyUrl(Value);

    const HandleSubmit = (): void =>
    {
        if (!IsValid)
        {
            return;
        }

        OnSelect(Value.trim());
        SetValue("");
    };

    return (
        <View style={ Styles.TabBody }>
            <View style={ Styles.LinkRow }>
                <Input
                    Clear
                    OnCancel={ () => SetValue("") }
                    OnChangeText={ SetValue }
                    OnSubmitEditing={ HandleSubmit }
                    Placeholder="Paste an image link…"
                    Style={ Styles.LinkInput }
                    Value={ Value }
                />
                <Button
                    Appearance="Blue"
                    Disabled={ !IsValid }
                    OnPress={ HandleSubmit }
                    Size="Small">
                    Submit
                </Button>
            </View>
            <Body
                Color={ Semantic.Muted }
                Style={ Styles.Hint }>
                Works with any image from the web.
            </Body>
        </View>
    );
};

/** {@inheritDoc CoverPicker} */
export interface CoverPickerProps extends Pick<BottomSheetProps, "OnDismiss" | "Ref">
{
    readonly OnSelect: (Url: string) => void;
    readonly OnRemove?: (() => void) | undefined;
    readonly TestID?: string;
}

export/**
       * A page cover-image picker bottom sheet — upload a photo, or paste an
       * image URL. See the file header comment for how this relates to
       * `@notion-kit/ui`'s `cover/cover-picker.tsx`.
       *
       * @category Component
       * @since 1.0.0
       */
const CoverPicker = ({ OnDismiss, Ref, OnSelect, OnRemove, TestID }: CoverPickerProps): React.JSX.Element =>
    <BottomSheet
        { ...{ OnDismiss, Ref } }
        { ...(TestID === undefined ? { } : { TestId: TestID }) }>
        <BottomSheetView>
            <Tabs
                DefaultValue="Upload"
                Style={ Styles.Root }>
                <BottomSheetView>
                    <TabsList>
                        <TabsTrigger Value="Upload" />
                        <TabsTrigger Value="Link" />
                        { OnRemove !== undefined && (
                            <Button
                                Appearance="Hint"
                                OnPress={ OnRemove }
                                Size="Small"
                                Style={ Styles.RemoveButton }>
                                Remove
                            </Button>
                        ) }
                    </TabsList>
                </BottomSheetView>
                <TabsContent Value="Upload">
                    <UploadTab { ...{ OnSelect } } />
                </TabsContent>
                <TabsContent Value="Link">
                    <LinkTab { ...{ OnSelect } } />
                </TabsContent>
            </Tabs>
        </BottomSheetView>
    </BottomSheet>;

const Styles = StyleSheet.create({
    Hint:
    {
        fontSize: 12,
        paddingTop: 16,
        textAlign: "center"
    },
    LinkInput:
    {
        flex: 1
    },
    LinkRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 8
    },
    RemoveButton:
    {
        marginLeft: "auto",
        marginRight: 8
    },
    Root:
    {
        flex: 1,
        flexDirection: "column",
        gap: 32,
        justifyContent: "space-between"
    },
    TabBody:
    {
        padding: 16
    }
});
