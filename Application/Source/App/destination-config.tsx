/**
 * Destination-config screen: turn a cached data source's schema into a
 * quick-entry destination — name it, pick a template, and choose which fields
 * are visible and required — then save. Also lists and deletes the
 * destinations already configured for this data source
 * (ArchitectureInitialDraft.md §24-25). Reached from a cached row on the
 * data-sources screen.
 *
 * @module notivex/app/destination-config
 *
 * @file      destination-config.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
    Body,
    Button,
    Checkbox,
    Description,
    Heading1,
    Heading2,
    Input,
    LabelText
} from "@notivex/ui/Primitive";
import { useCallback, useEffect, useState } from "react";
import { GetDataSource } from "@/Domain/Runtime/NotivexApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useDestinations } from "@/features/destinations/use-destinations";
import { useLocalSearchParams } from "expo-router";

/** Per-field UI toggles held while the form is open. */
interface FieldSetting
{
    readonly Visible: boolean;
    readonly Required: boolean;
}

const DestinationConfigScreen = () =>
{
    const Router = UseLazyRouter();
    const Params = useLocalSearchParams<{
        connectionId: string;
        dataSourceId: string;
        title?: string;
    }>();
    const ConnectionId = Params.connectionId as Domain.Id.NotionConnectionId;
    const DataSourceId = Params.dataSourceId as Domain.Id.NotionDataSourceId;

    const { Destinations, Create, Remove } = useDestinations(DataSourceId);

    const [ DataSource, SetDataSource ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const [ Name, SetName ] = useState(Params.title ?? "");
    const [ UseDefaultTemplate, SetUseDefaultTemplate ] = useState(false);
    const [ Settings, SetSettings ] = useState<Record<string, FieldSetting>>({});
    const [ Saving, SetSaving ] = useState(false);

    useEffect(() =>
    {
        let Active = true;

        void (async () =>
        {
            try
            {
                const Loaded = await GetDataSource(DataSourceId);

                if (!Active)
                {
                    return;
                }

                SetDataSource(Loaded);
                SetSettings(Object.fromEntries(Loaded.Properties.map(
                    (Property: Domain.Property.PropertyDefinition) =>
                        [ Property.Id, { Required: Property.Type === "Title", Visible: true } ])));
            }
            catch (Error)
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to load data source", Error);
            }
        })();

        return () =>
        {
            Active = false;
        };
    }, [ DataSourceId ]);

    const Toggle = useCallback((PropertyId: string, Key: keyof FieldSetting) =>
    {
        SetSettings((Previous: Record<string, FieldSetting>) =>
        {
            const Current = Previous[PropertyId] ?? { Required: false, Visible: true };

            return { ...Previous, [PropertyId]: { ...Current, [Key]: !Current[Key] } };
        });
    }, []);

    const HandleSave = useCallback(async () =>
    {
        if (!DataSource || Name.trim().length === 0)
        {
            return;
        }

        SetSaving(true);

        try
        {
            const Fields = DataSource.Properties.map(
                (Property: Domain.Property.PropertyDefinition) => ({
                    PropertyId: Property.Id,
                    Required: Settings[Property.Id]?.Required ?? false,
                    Visible: Settings[Property.Id]?.Visible ?? true
                }));

            await Create({
                ConnectionId,
                DataSourceId,
                FieldConfiguration:
                {
                    FieldOrder: DataSource.Properties.map(
                        (Property: Domain.Property.PropertyDefinition) => Property.Id),
                    Fields,
                    Version: 1
                },
                Name: Name.trim(),
                Position: Destinations.length,
                Template: UseDefaultTemplate ? { Type: "Default" } : { Type: "None" }
            });
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to save destination", Error);
        }
        finally
        {
            SetSaving(false);
        }
    }, [
        ConnectionId,
        Create,
        DataSource,
        DataSourceId,
        Destinations.length,
        Name,
        Settings,
        UseDefaultTemplate
    ]);

    return (
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Button
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ styles.back }>
                    ‹ Back
                </Button>

                <Heading1>
                    { Params.title ?? "Configure" }
                </Heading1>
                <Description Style={ styles.subtitle }>
                    Set up a quick-entry destination for this data source.
                </Description>

                { DataSource === null
                    ? <ActivityIndicator />
                    : (
                        <ScrollView
                            contentContainerStyle={ styles.form }
                            style={ styles.scroll }>
                            <LabelText>Name</LabelText>
                            <Input
                                OnChangeText={ SetName }
                                Placeholder="Destination name"
                                Value={ Name }
                            />

                            <View style={ styles.templateRow }>
                                <Checkbox
                                    Checked={ UseDefaultTemplate }
                                    OnCheckedChange={ SetUseDefaultTemplate }
                                />
                                <Body>Use the data source's default template</Body>
                            </View>

                            <Heading2 Style={ styles.sectionHeading }>Fields</Heading2>
                            <View style={ styles.fieldHeaderRow }>
                                <View style={ styles.fieldNameCol } />
                                <LabelText Style={ styles.toggleLabel }>Visible</LabelText>
                                <LabelText Style={ styles.toggleLabel }>Required</LabelText>
                            </View>
                            { DataSource.Properties.map(
                                (Property: Domain.Property.PropertyDefinition) => (
                                    <View
                                        key={ Property.Id }
                                        style={ styles.fieldRow }>
                                        <View style={ styles.fieldNameCol }>
                                            <Body NumberOfLines={ 1 }>{ Property.Name }</Body>
                                            <LabelText Style={ styles.fieldType }>
                                                { Property.Type }
                                            </LabelText>
                                        </View>
                                        <View style={ styles.toggleCol }>
                                            <Checkbox
                                                Checked={ Settings[Property.Id]?.Visible ?? true }
                                                OnCheckedChange={ () => Toggle(Property.Id, "Visible") }
                                            />
                                        </View>
                                        <View style={ styles.toggleCol }>
                                            <Checkbox
                                                Checked={ Settings[Property.Id]?.Required ?? false }
                                                OnCheckedChange={ () => Toggle(Property.Id, "Required") }
                                            />
                                        </View>
                                    </View>
                                )) }

                            <Button
                                Appearance="Primary"
                                Disabled={ Saving || Name.trim().length === 0 }
                                OnPress={ () => void HandleSave() }
                                Style={ styles.save }>
                                { Saving ? "Saving…" : "Save destination" }
                            </Button>

                            { Destinations.length > 0
                                ? (
                                    <>
                                        <Heading2 Style={ styles.sectionHeading }>Configured</Heading2>
                                        { Destinations.map((Destination: Domain.Destination.Destination) => (
                                            <View
                                                key={ Destination.Id }
                                                style={ styles.destinationRow }>
                                                <Body NumberOfLines={ 1 }>{ Destination.Name }</Body>
                                                <Button
                                                    Appearance="Link"
                                                    OnPress={ () => void Remove(Destination.Id) }>
                                                    Delete
                                                </Button>
                                            </View>
                                        )) }
                                    </>
                                )
                                : null }
                        </ScrollView>
                    ) }
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    back:
    {
        alignSelf: "flex-start"
    },
    container:
    {
        flex: 1
    },
    destinationRow:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8
    },
    fieldHeaderRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12
    },
    fieldNameCol:
    {
        flex: 1
    },
    fieldRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        paddingVertical: 8
    },
    fieldType:
    {
        marginTop: 2
    },
    form:
    {
        gap: 12,
        paddingVertical: 16
    },
    safeArea:
    {
        flex: 1,
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 24
    },
    save:
    {
        marginTop: 16
    },
    scroll:
    {
        alignSelf: "stretch",
        flex: 1
    },
    sectionHeading:
    {
        marginTop: 16
    },
    subtitle:
    {
        marginTop: 4
    },
    templateRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        marginTop: 8
    },
    toggleCol:
    {
        alignItems: "center",
        width: 64
    },
    toggleLabel:
    {
        textAlign: "center",
        width: 64
    }
});

export default DestinationConfigScreen;
