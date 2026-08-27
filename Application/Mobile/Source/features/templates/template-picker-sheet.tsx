/**
 * The bottom sheet opened from `create-page.tsx`'s header template switcher:
 * lets the user apply a different (non-hidden) template's values to the
 * current form for this one page, without changing the destination's
 * persisted default. Selecting a template dismisses the sheet and hands the
 * choice to the caller, which owns the keep/overwrite collision prompt.
 *
 * @module noteferry/features/templates/template-picker-sheet
 *
 * @file      template-picker-sheet.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import { Body, ModalTitle } from "@noteferry/ui/Primitive/Text";
import { BottomSheet, type BottomSheet as BottomSheetHandle, BottomSheetScrollView } from "@noteferry/ui/Primitive/BottomSheet";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import Ban from "lucide-react-native/icons/ban";
import Check from "lucide-react-native/icons/check";
import { type PressableStateCallbackType, StyleSheet, View } from "react-native";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import { IconBlock } from "@noteferry/ui/Block/IconBlock";
import { ResolveTemplateIconData } from "./template-icon";
import type { RefObject } from "react";

const TemplatePickerSheetSnapPoints = [ "50%", "83.333%" ];

/** {@inheritDoc TemplatePickerSheet} */
export interface TemplatePickerSheetProps
{
    /** The destination's persisted default — only used to check the current row. */
    readonly CurrentTemplate: Domain.Destination.DestinationTemplate;
    readonly OnSelect: (Template: Domain.Destination.DestinationTemplate) => void;
    readonly Ref: RefObject<BottomSheetHandle | null>;
    /** Non-hidden templates only, already ordered — the caller filters/orders. */
    readonly Templates: ReadonlyArray<Domain.DataSource.CachedDataSourceTemplate>;
}

export/**
       * A bottom sheet listing "No template" plus a data source's non-hidden
       * templates, for switching which one populates the current page's form.
       *
       * @category Component
       * @since 1.0.0
       */
const TemplatePickerSheet = ({
    CurrentTemplate,
    OnSelect,
    Ref,
    Templates
}: TemplatePickerSheetProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();

    const Choose = (Template: Domain.Destination.DestinationTemplate): void =>
    {
        Ref.current?.dismiss();
        OnSelect(Template);
    };

    return (
        <BottomSheet
            BackgroundColor={ Theme.Semantic.BackgroundSidebar }
            Ref={ Ref }
            SnapPoints={ TemplatePickerSheetSnapPoints }>
            <BottomSheetScrollView
                contentContainerStyle={ Styles.SheetContent }
                style={ Styles.SheetScroll }>
                <ModalTitle Style={ Styles.SheetTitle }>Use a template</ModalTitle>

                <View style={ Styles.OptionList }>
                    <Pressable
                        Accessibility={ {
                            Label: "No template",
                            Role: "radio",
                            State: { checked: CurrentTemplate.Type === "None" }
                        } }
                        OnPress={ () => Choose({ Type: "None" }) }
                        style={ ({ pressed }: PressableStateCallbackType) => [
                            Styles.OptionRow,
                            pressed && Styles.OptionRowPressed
                        ] }>
                        <Ban
                            color={ Theme.Semantic.IconSecondary }
                            size={ 18 }
                        />
                        <Body Style={ Styles.OptionLabel }>No template</Body>
                        { CurrentTemplate.Type === "None"
                            ? <Check color={ Theme.Semantic.IconSecondary } size={ 17 } />
                            : null }
                    </Pressable>

                    { Templates.map((Template: Domain.DataSource.CachedDataSourceTemplate) =>
                    {
                        const Selected = CurrentTemplate.Type === "Specific"
                            && CurrentTemplate.TemplateId === Template.TemplateId;

                        return (
                            <Pressable
                                Accessibility={ {
                                    Label: Template.Name,
                                    Role: "radio",
                                    State: { checked: Selected }
                                } }
                                OnPress={ () => Choose({ TemplateId: Template.TemplateId, Type: "Specific" }) }
                                key={ Template.TemplateId }
                                style={ ({ pressed }: PressableStateCallbackType) => [
                                    Styles.OptionRow,
                                    Styles.OptionRowDivider,
                                    pressed && Styles.OptionRowPressed
                                ] }>
                                <IconBlock
                                    Icon={ ResolveTemplateIconData(Template.Icon, Template.IconType) }
                                    Size="Small"
                                />
                                <Body
                                    NumberOfLines={ 1 }
                                    Style={ Styles.OptionLabel }>
                                    { Template.Name }
                                </Body>
                                { Selected
                                    ? <Check color={ Theme.Semantic.IconSecondary } size={ 17 } />
                                    : null }
                            </Pressable>
                        );
                    }) }
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const useStyles = MakeStyles({
    OptionLabel: TextStyle({
        flex: 1
    }),
    OptionList: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 18,
        overflow: "hidden"
    }),
    OptionRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.S,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 9
    }),
    OptionRowDivider: ViewStyle({
        borderTopColor: Token.Semantic.Border,
        borderTopWidth: StyleSheet.hairlineWidth
    }),
    OptionRowPressed: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundInput
    }),
    SheetContent: ViewStyle({
        paddingBottom: 40
    }),
    SheetScroll: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar
    }),
    SheetTitle: TextStyle({
        marginTop: 2,
        textAlign: "center"
    })
});

export default TemplatePickerSheet;
