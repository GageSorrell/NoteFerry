/**
 * A subtle, flush-left affordance for adding a page icon or cover on the
 * create-page screen. Each button pairs a Lucide glyph with a muted label
 * and disappears once its corresponding value is set (the screen simply
 * stops rendering it), mirroring Notion's "Add icon"/"Add cover" controls.
 *
 * @module notivex/features/page-creation/add-media-button
 *
 * @file      add-media-button.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Pressable } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import type { LucideIcon } from "lucide-react-native";
import { type PressableStateCallbackType } from "react-native";
import type { Thunk } from "@sorrell/effect/Function";

/** Props for a single "Add icon"/"Add cover" affordance. */
export interface AddMediaButtonProps
{
    readonly Disabled?: boolean | undefined;
    readonly Icon: LucideIcon;
    readonly Label: string;
    readonly OnPress: Thunk;
}

/** A subtle labeled icon button used to attach a page icon or cover. */
export const AddMediaButton = ({
    Disabled = false,
    Icon,
    Label,
    OnPress
}: AddMediaButtonProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();

    return (
        <Pressable
            Accessibility={ {
                Label,
                Role: "button",
                State: { disabled: Disabled }
            } }
            Disabled={ Disabled }
            OnPress={ OnPress }
            hitSlop={ 6 }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.Button,
                pressed && Styles.Pressed
            ] }>
            <Icon
                color={ Theme.Semantic.Muted }
                size={ 16 }
                strokeWidth={ 2 }
            />
            <Body
                Color={ Token.Semantic.Muted }
                Style={ Styles.Label }>
                { Label }
            </Body>
        </Pressable>
    );
};

const useStyles = MakeStyles({
    Button: ViewStyle({
        alignItems: "center",
        alignSelf: "flex-start",
        flexDirection: "row",
        gap: 6,
        paddingVertical: 6
    }),
    Label: TextStyle({
        fontSize: 14
    }),
    Pressed: ViewStyle({
        opacity: 0.5
    })
});
