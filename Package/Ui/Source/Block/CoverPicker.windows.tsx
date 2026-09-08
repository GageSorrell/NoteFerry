/**
 * Windows variant of `CoverPicker.tsx`. Identical except the `Upload` tab
 * calls the injected `usePlatformAdapter().PickImage()` seam instead of
 * `expo-image-picker` directly — see `Source/Platform/index.windows.tsx` for
 * why an image picker needs a runtime injection seam instead of a plain
 * `.windows.tsx` file swap. Its `BottomSheet`/`BottomSheetView` import
 * (`../Primitive/BottomSheet.js`) resolves independently per platform via
 * Metro, so this file automatically inherits `BottomSheet.windows.tsx`'s
 * centered-dialog engine with no extra plumbing.
 *
 * @module @noteferry/ui/Primitive/CoverPicker
 *
 * @file      CoverPicker.windows.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import {
    BottomSheet,
    type BottomSheetProps,
    BottomSheetView
} from "../Primitive/BottomSheet.js";
import { MakeStyles, TextStyle, ViewStyle } from "../MakeStyles.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Primitive/Tabs.js";
import { Body } from "../Primitive/Text.js";
import { Button } from "../Primitive/Button.js";
import { Image } from "../Icon.js";
import { Input } from "../Primitive/Input.js";
import { View } from "react-native";
import { useToken } from "../ThemeProvider.js";
import { usePlatformAdapter } from "../Platform/index.js";

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
    const Styles = useStyles();
    const [ IsPicking, SetIsPicking ] = React.useState(false);
    const { [Semantic.Icon]: IconColor } = useToken(Semantic.Icon);
    const { PickImage } = usePlatformAdapter();

    const HandlePress = async (): Promise<void> =>
    {
        SetIsPicking(true);

        try
        {
            const Picked = await PickImage();

            if (Picked !== undefined)
            {
                OnSelect(Picked.Uri);
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
    const Styles = useStyles();
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
{
    const Styles = useStyles();

    return (
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
        </BottomSheet>
    );
};

const useStyles = MakeStyles({
    Hint: TextStyle({
        fontSize: 12,
        paddingTop: 16,
        textAlign: "center"
    }),
    LinkInput: ViewStyle({
        flex: 1
    }),
    LinkRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 8
    }),
    RemoveButton: ViewStyle({
        marginLeft: "auto",
        marginRight: 8
    }),
    Root: ViewStyle({
        flex: 1,
        flexDirection: "column",
        gap: 32,
        justifyContent: "space-between"
    }),
    TabBody: ViewStyle({
        padding: 16
    })
});
