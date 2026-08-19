/**
 * Shared "what happens next" picker: home, a chosen database, or (optionally)
 * closing the app. Used for both a destination's `PostCreationBehavior` and
 * the app-wide `LaunchBehavior` setting, which share the same shape minus
 * `CloseApp`.
 *
 * @module notivex/Component/BehaviorPicker
 *
 * @file      BehaviorPicker.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Body, LabelText, RadioGroup, RadioGroupItem } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle, useTheme } from "@notivex/ui";
import { Platform, ScrollView, View } from "react-native";

/** {@inheritDoc BehaviorPicker} */
export interface BehaviorPickerProps
{
    readonly Value: Domain.Behavior.PostCreationBehavior;
    readonly OnChange: (Value: Domain.Behavior.PostCreationBehavior) => void;
    readonly DataSources: ReadonlyArray<Domain.DataSource.CachedDataSourceSchema>;
    /** Whether "Close the app" is offered — Android only; iOS forbids self-termination. */
    readonly AllowCloseApp?: boolean;
}

const HomeValue = "Home";
const SelectedDatabaseValue = "SelectedDatabase";
const CloseAppValue = "CloseApp";

export/**
       * A radio choice between landing on the home screen, jumping straight
       * into a chosen database's quick-entry form, or (Android only, when
       * `AllowCloseApp`) closing the app.
       *
       * @category Component
       * @since 1.0.0
       */
const BehaviorPicker = ({
    Value,
    OnChange,
    DataSources,
    AllowCloseApp = false
}: BehaviorPickerProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useStyles();
    const CanCloseApp = AllowCloseApp && Platform.OS === "android";

    return (
        <View style={ Styles.Container }>
            <RadioGroup
                OnValueChange={ (Next: string) =>
                {
                    if (Next === HomeValue)
                    {
                        OnChange({ Type: "Home" });
                    }
                    else if (Next === CloseAppValue)
                    {
                        OnChange({ Type: "CloseApp" });
                    }
                    else if (Next === SelectedDatabaseValue)
                    {
                        const First = DataSources[0];

                        if (First)
                        {
                            OnChange({
                                DataSourceId: First.DataSourceId,
                                Type: "SelectedDatabase"
                            });
                        }
                    }
                } }
                Value={ Value.Type }>
                <View style={ Styles.Row }>
                    <RadioGroupItem Value={ HomeValue } />
                    <Body>Go to the home screen</Body>
                </View>
                <View style={ Styles.Row }>
                    <RadioGroupItem Value={ SelectedDatabaseValue } />
                    <Body>Open a database</Body>
                </View>
                { CanCloseApp
                    ? (
                        <View style={ Styles.Row }>
                            <RadioGroupItem Value={ CloseAppValue } />
                            <Body>Close the app</Body>
                        </View>
                    )
                    : null }
            </RadioGroup>

            { Value.Type === "SelectedDatabase"
                ? (
                    <ScrollView
                        contentContainerStyle={ Styles.DatabaseList }
                        horizontal
                        showsHorizontalScrollIndicator={ false }>
                        { DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema) =>
                        {
                            const Selected = Value.Type === "SelectedDatabase"
                                && Value.DataSourceId === Source.DataSourceId;

                            return (
                                <View
                                    key={ Source.DataSourceId }
                                    onTouchEnd={ () => OnChange({
                                        DataSourceId: Source.DataSourceId,
                                        Type: "SelectedDatabase"
                                    }) }
                                    style={ [
                                        Styles.DatabaseChip,
                                        {
                                            backgroundColor: Selected
                                                ? Theme.Semantic.BackgroundModal
                                                : "transparent",
                                            borderColor: Selected
                                                ? Theme.Semantic.Primary
                                                : Theme.Semantic.Border
                                        },
                                        Selected && Styles.DatabaseChipSelected
                                    ] }>
                                    <LabelText>{ Source.Title }</LabelText>
                                </View>
                            );
                        }) }
                    </ScrollView>
                )
                : null }
        </View>
    );
};

BehaviorPicker.displayName = "BehaviorPicker";

const useStyles = MakeStyles({
    Container: ViewStyle({
        gap: 10
    }),
    DatabaseChip: ViewStyle({
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: Token.Spacing.S
    }),
    DatabaseChipSelected: ViewStyle({
        borderWidth: 2
    }),
    DatabaseList: ViewStyle({
        gap: Token.Spacing.S,
        paddingVertical: 2
    }),
    Row: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10
    })
});
