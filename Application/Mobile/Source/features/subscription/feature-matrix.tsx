/**
 * Accessible Free versus Notivex Pro feature comparison table.
 *
 * @module notivex/features/subscription/feature-matrix
 *
 * @file      feature-matrix.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Description, LabelText } from "@notivex/ui/Primitive";
import { MakeStyles, TextStyle, Token, ViewStyle } from "@notivex/ui";
import { View } from "react-native";

const Rows =
    [
        [ "Page creation", "5 pages per rolling 30 minutes", "No product-level limit" ],
        [ "Active databases", "3", "Unlimited" ],
        [ "Notion workspaces (roadmap)", "1", "Unlimited" ],
        [ "Title, body, and supported Notion properties", "Included", "Included" ],
        [ "File/media properties", "Included", "Included" ],
        [ "Page icons and covers", "Locked", "Included" ],
        [ "Database aliases", "Default Notion name only", "Custom aliases" ],
        [
            "Form property visibility, required fields, " +
            "ordering, and defaults",
            "Automatic form only",
            "Fully customizable"
        ],
        [ "Notion templates", "No template", "Select defaults, hide, restore, and reorder templates" ],
        [ "Home-screen quick actions", "1 database", "Up to 6 databases" ],
        [ "Launch behavior", "Home screen", "Home or selected database" ],
        [ "Post-creation behavior", "Return home", "Home, selected database, or close app where supported" ],
        [ "Home-screen layout and database ordering", "Default layout/order", "Custom layout and order" ],
        [ "High-contrast/accessibility settings", "Included", "Included" ],
        [
            "Offline queue, retry, success notifications, and " +
            "operation history (roadmap)",
            "Included",
            "Included"
        ],
        [ "Account deletion, data export, feedback, and support", "Included", "Included" ],
        [ "Advertising", "Shown", "None" ],
        [ "Subscription-sale notifications", "Optional opt-in", "Disabled because already subscribed" ]
    ] as const;

export/**
       * The table of free-versus-paid features.
       *
       * @category Subscription
       * @since 1.0.0
       */
const FeatureMatrix = (): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View
            accessibilityLabel="Free and Notivex Pro feature comparison"
            accessibilityRole="summary"
            style={ Styles.Table }>
            <View style={ [ Styles.Row, Styles.Header ] }>
                <LabelText Style={ [ Styles.Cell, Styles.Feature ] }>Feature</LabelText>
                <LabelText Style={ Styles.Cell }>Free</LabelText>
                <LabelText Style={ Styles.Cell }>Notivex Pro</LabelText>
            </View>
            { Rows.map(([ Feature, Free, Pro ]: readonly [ string, string, string ], Index: number) => (
                <View
                    accessibilityLabel={ `${Feature}. Free: ${Free}. Notivex Pro: ${Pro}.` }
                    key={ Feature }
                    style={ [ Styles.Row, Index % 2 === 1 && Styles.Alternate ] }>
                    <Body Style={ [ Styles.Cell, Styles.Feature ] }>{ Feature }</Body>
                    <Description Style={ Styles.Cell }>{ Free }</Description>
                    <Description Style={ Styles.Cell }>{ Pro }</Description>
                </View>
            )) }
        </View>
    );
};

const useStyles = MakeStyles({
    Alternate: ViewStyle({ backgroundColor: Token.Semantic.BackgroundModal }),
    Cell: TextStyle({ flex: 1, fontSize: 12, lineHeight: 17, padding: 8 }),
    Feature: TextStyle({ flex: 1.25 }),
    Header: ViewStyle({ backgroundColor: Token.Semantic.BackgroundSidebar }),
    Row: ViewStyle({ alignItems: "stretch", flexDirection: "row" }),
    Table: ViewStyle({ borderRadius: 12, overflow: "hidden" })
});
