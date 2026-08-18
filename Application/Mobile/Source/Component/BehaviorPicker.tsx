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
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "@notivex/ui";

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
    const CanCloseApp = AllowCloseApp && Platform.OS === "android";

    return (
        <View style={ styles.container }>
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
                <View style={ styles.row }>
                    <RadioGroupItem Value={ HomeValue } />
                    <Body>Go to the home screen</Body>
                </View>
                <View style={ styles.row }>
                    <RadioGroupItem Value={ SelectedDatabaseValue } />
                    <Body>Open a database</Body>
                </View>
                { CanCloseApp
                    ? (
                        <View style={ styles.row }>
                            <RadioGroupItem Value={ CloseAppValue } />
                            <Body>Close the app</Body>
                        </View>
                    )
                    : null }
            </RadioGroup>

            { Value.Type === "SelectedDatabase"
                ? (
                    <ScrollView
                        contentContainerStyle={ styles.databaseList }
                        horizontal
                        showsHorizontalScrollIndicator={ false }>
                        { DataSources.map((Source: Domain.DataSource.CachedDataSourceSchema) =>
                        {
                            const Selected = Value.Type === "SelectedDatabase"
                                && Value.DataSourceId === Source.DataSourceId;

                            return (
                                <View
                                    key={ Source.DataSourceId }
                                    style={ [
                                        styles.databaseChip,
                                        {
                                            backgroundColor: Selected
                                                ? Theme.Semantic.BackgroundModal
                                                : "transparent",
                                            borderColor: Selected
                                                ? Theme.Semantic.Primary
                                                : Theme.Semantic.Border
                                        },
                                        Selected && styles.databaseChipSelected
                                    ] }
                                    onTouchEnd={ () => OnChange({
                                        DataSourceId: Source.DataSourceId,
                                        Type: "SelectedDatabase"
                                    }) }>
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

const styles = StyleSheet.create({
    container:
    {
        gap: 10
    },
    databaseChip:
    {
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 8
    },
    databaseChipSelected:
    {
        borderWidth: 2
    },
    databaseList:
    {
        gap: 8,
        paddingVertical: 2
    },
    row:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10
    }
});
