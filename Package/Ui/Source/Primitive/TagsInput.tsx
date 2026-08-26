/**
 * Ported from `@notion-kit/ui`'s `tags-input/tags-input.tsx`. Source is a
 * single, tightly-coupled `<input>` + Zod-validated tag chips; trimmed
 * here to plain `string[]` tags (source's optional per-tag `Color` and
 * `inputSchema` Zod validation were dropped — no in-scope consumer needs
 * either yet, and `zod` is only an optional peer dependency of this
 * library). Comma-splitting and Enter-to-commit both port directly;
 * Backspace-to-remove-the-last-tag is wired through `TextInput`'s
 * `onKeyPress` (RN's analogue of source's `onKeyDown` check).
 *
 * @module @noteferry/ui/Primitive/TagsInput
 *
 * @file      TagsInput.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Radii from "../Token/Radii.js";
import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { MakeStyles, TextStyle as MakeTextStyle, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import {
    type NativeSyntheticEvent,
    type StyleProp,
    TextInput,
    type TextInputKeyPressEventData,
    View,
    type ViewStyle
} from "react-native";
import { Description } from "./Text.js";
import { Pressable } from "./Pressable.js";
import { String } from "effect";
import { WithAlpha } from "../Utility/index.js";
import { X } from "lucide-react-native";
import { useToken } from "../ThemeProvider.js";

/** {@inheritDoc TagsInput} */
export interface TagsInputProps
{
    readonly Value: ReadonlyArray<string>;
    readonly OnValueChange?: (Value: ReadonlyArray<string>) => void;
    readonly Placeholder?: string;
    readonly Disabled?: boolean;
    readonly Style?: StyleProp<ViewStyle>;
}

export/**
       * Specify a set of tags by typing in their values.
       *
       * @category Component
       * @since 1.0.0
       */
const TagsInput = ({
    Value,
    OnValueChange,
    Placeholder,
    Disabled = false,
    Style
}: TagsInputProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const [ InputText, SetInputText ] = React.useState("");
    const {
        [Semantic.Ring]: RingColor,
        [Semantic.BackgroundInput]: InputBackground,
        [Semantic.Primary]: PrimaryColor,
        [Semantic.Muted]: MutedColor,
        [Semantic.Default]: DefaultColor,
        [Semantic.Cursor]: CursorColor,
        [Radii.Medium]: MediumRadius,
        [Radii.Small]: SmallRadius
    } = useToken(
        Semantic.Ring,
        Semantic.BackgroundInput,
        Semantic.Primary,
        Semantic.Muted,
        Semantic.Default,
        Semantic.Cursor,
        Radii.Medium,
        Radii.Small
    );

    const AddTags = React.useCallback((Chunks: ReadonlyArray<string>) =>
    {
        const NextTags = [ ...new Set([ ...Value, ...Chunks.map(String.trim).filter(Boolean) ]) ];

        if (NextTags.length !== Value.length)
        {
            OnValueChange?.(NextTags);
        }

        SetInputText("");
    }, [ Value, OnValueChange ]);

    const RemoveTag = React.useCallback((Tag: string) =>
    {
        OnValueChange?.(Value.filter((Existing: string) => Existing !== Tag));
    }, [ Value, OnValueChange ]);

    const HandleChangeText = (NextText: string) =>
    {
        if (NextText.includes(","))
        {
            AddTags(NextText.split(","));
        }
        else
        {
            SetInputText(NextText);
        }
    };

    const HandleKeyPress = (Event: NativeSyntheticEvent<TextInputKeyPressEventData>) =>
    {
        if (Event.nativeEvent.key === "Backspace" && InputText.length === 0 && Value.length > 0)
        {
            RemoveTag(Value[ Value.length - 1 ] as string);
        }
    };

    return (
        <View
            style={ [
                Styles.Container,
                {
                    backgroundColor: InputBackground,
                    borderColor: RingColor,
                    borderRadius: MediumRadius
                },
                Disabled ? { opacity: 0.5 } : undefined,
                Style
            ] }>
            { Value.map((Tag: string) => (
                <View
                    key={ Tag }
                    style={ [
                        Styles.Tag,
                        {
                            backgroundColor: WithAlpha(DefaultColor, 0.08),
                            borderRadius: SmallRadius
                        }
                    ] }>
                    <Description
                        Color={ PrimaryColor }
                        NumberOfLines={ 1 }>
                        { Tag }
                    </Description>
                    { !Disabled && (
                        <Pressable
                            Accessibility={ {
                                Label: `Remove ${ Tag }`,
                                Role: "button"
                            } }
                            OnPress={ () => RemoveTag(Tag) }
                            hitSlop={ 8 }
                            style={ Styles.TagRemove }>
                            <X
                                color={ MutedColor }
                                size={ 10 }
                            />
                        </Pressable>
                    ) }
                </View>
            )) }
            <TextInput
                cursorColor={ CursorColor }
                editable={ !Disabled }
                onChangeText={ HandleChangeText }
                onKeyPress={ HandleKeyPress }
                onSubmitEditing={ () => AddTags([ InputText ]) }
                placeholder={ Placeholder }
                placeholderTextColor={ WithAlpha(PrimaryColor, 0.45) }
                selectionColor={ CursorColor }
                style={ [ Styles.Input, { color: PrimaryColor } ] }
                value={ InputText }
            />
        </View>
    );
};

const useStyles = MakeStyles({
    Container: MakeViewStyle({
        alignItems: "center",
        borderWidth: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        minHeight: 40,
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: "100%"
    }),
    Input: MakeTextStyle({
        flexGrow: 1,
        fontSize: 14,
        height: 22,
        margin: 0,
        minWidth: 60,
        padding: 0
    }),
    Tag: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 4,
        height: 22,
        paddingLeft: 8,
        paddingRight: 4
    }),
    TagRemove: MakeViewStyle({
        alignItems: "center",
        justifyContent: "center"
    })
});
