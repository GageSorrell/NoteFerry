/**
 * Modeled on Notion's own settings-modal row: a bold title, an optional
 * muted description beneath it, and a trailing control (a `Switch`, a
 * `Select`, a `Button`, ...) aligned to its right.
 * `SettingsContainer` groups a run of `Setting`s, inserting a hairline
 * `Separator` between each.
 *
 * @module @noteferry/ui/Primitive/Setting
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
}

export/**
       * One row of a settings list: a bold title, an optional muted
       * description, and a control aligned to its right. The text column
       * grows into the available space while the control remains compact.
       *
       * @category Component
       * @since 1.0.0
       */
const Setting = ({ Title, Description, children }: SettingProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    return (
        <View style={ Styles.Row }>
            <View style={ Styles.Text }>
                <Body Weight="600">{ Title }</Body>
                { Description
                    ? (
                        <DescriptionText Color={ MutedColor }>
                            { Description }
                        </DescriptionText>
                    )
                    : null }
            </View>
            <View style={ Styles.Control }>
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
        alignItems: "flex-end",
        flexShrink: 0,
        maxWidth: "35%"
    }),
    Row: MakeViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 16,
        justifyContent: "space-between",
        paddingVertical: 16
    }),
    Text: MakeViewStyle({
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        gap: 4,
        minWidth: 0
    })
});
