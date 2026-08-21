/**
 * Modeled on Notion's own settings-modal row: a bold title, an optional
 * muted description beneath it, and a trailing control (a `Switch`, a
 * `Select`, a `Button`, ...) vertically centered against them.
 * `SettingsContainer` groups a run of `Setting`s, inserting a hairline
 * `Separator` between each.
 *
 * @module @notivex/ui/Primitive/Setting
 *
 * @file      Setting.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import * as Semantic from "../Token/Semantic.js";
import { Body, Description as DescriptionText } from "./Text.js";
import { MakeStyles, ViewStyle as MakeViewStyle } from "../MakeStyles.js";
import { Separator } from "./Separator.js";
import { View } from "react-native";
import { useToken } from "../ThemeProvider.js";

/** {@inheritDoc Setting} */
export interface SettingProps extends React.PropsWithChildren
{
    readonly Title: string;

    /** Supporting copy shown under the title, muted. Accepts rich content (e.g. an inline `Link`). */
    readonly Description?: React.ReactNode;

    /**
     * Stacks the control full-width below the title/description instead of
     * trailing beside them — for a control too wide to share that row (a
     * multi-option preview picker, a several-item segmented control, ...).
     */
    readonly Wide?: boolean;
}

export/**
       * One row of a settings list: a bold title, an optional muted
       * description, and a control — trailing beside them by default, or
       * (`Wide`) stacked full-width below.
       *
       * @category Component
       * @since 1.0.0
       */
const Setting = ({ Title, Description, Wide = false, children }: SettingProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    return (
        <View style={ [ Styles.Row, Wide && Styles.WideRow ] }>
            <View style={ [ Styles.Text, Wide && Styles.WideText ] }>
                <Body Weight="600">{ Title }</Body>
                { Description
                    ? (
                        <DescriptionText Color={ MutedColor }>
                            { Description }
                        </DescriptionText>
                    )
                    : null }
            </View>
            <View style={ [ Styles.Control, Wide && Styles.WideControl ] }>
                { children }
            </View>
        </View>
    );
};

Setting.displayName = "Setting";

/** {@inheritDoc SettingsContainer} */
export interface SettingsContainerProps
{
    readonly children:
        | React.ReactElement<SettingProps>
        | ReadonlyArray<React.ReactElement<SettingProps> | boolean | null | undefined>;
}

export/**
       * Groups a run of `Setting` rows, inserting a hairline `Separator`
       * between each — never after the last.
       *
       * @category Component
       * @since 1.0.0
       */
const SettingsContainer = ({ children }: SettingsContainerProps): React.JSX.Element =>
{
    const Items = React.Children.toArray(children);

    return (
        <View>
            { Items.map((Child: React.ReactNode, Index: number) => (
                <React.Fragment key={ Index }>
                    { Child }
                    { Index < Items.length - 1 ? <Separator /> : null }
                </React.Fragment>
            )) }
        </View>
    );
};

SettingsContainer.displayName = "SettingsContainer";

const useStyles = MakeStyles({
    Control: MakeViewStyle({
        flexShrink: 0
    }),
    Row: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 16,
        justifyContent: "space-between",
        paddingVertical: 16
    }),
    Text: MakeViewStyle({
        flex: 1,
        gap: 4
    }),
    WideControl: MakeViewStyle({
        alignSelf: "stretch",
        marginTop: 12
    }),
    WideText: MakeViewStyle({
        alignSelf: "stretch",
        flex: 0
    }),
    WideRow: MakeViewStyle({
        alignItems: "flex-start",
        flexDirection: "column",
        justifyContent: "flex-start"
    })
});
