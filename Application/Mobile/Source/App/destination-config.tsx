/**
 * Destination-config screen: turn a cached data source's schema into a
 * quick-entry destination; name it, pick a template, and choose which fields
 * are visible and required, then save.  Also lists and deletes the
 * destinations already configured for this data source. Reached from a
 * cached row on the data-sources screen.
 *
 * @module notivex/app/destination-config
 *
 * @file      destination-config.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { ActivityIndicator, ScrollView, View } from "react-native";
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
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { useCallback, useEffect, useState } from "react";
import { BehaviorPicker } from "@/Component/BehaviorPicker";
import { GetDataSource } from "@/Domain/Runtime/NotivexApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConnections } from "@/Domain/Connection";
import { useDestinations } from "@/features/destinations/use-destinations";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useLocalSearchParams } from "expo-router";

/** Per-field UI toggles held while the form is open. */
interface FieldSetting
{
    readonly Visible: boolean;
    readonly Required: boolean;
}

const DestinationConfigScreen = () =>
{
    const Router = useLazyRouter();
    const Theme = useTheme();
    const Styles = useStyles();
    const Params = useLocalSearchParams<{
        connectionId: string;
        dataSourceId: string;
        title?: string;
    }>();
    const ConnectionId = Params.connectionId as Domain.Id.NotionConnectionId;
    const DataSourceId = Params.dataSourceId as Domain.Id.NotionDataSourceId;

    const { Destinations, Create, Remove } = useDestinations(DataSourceId);
    const { DataSources } = useConnections();

    const [ DataSource, SetDataSource ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const [ Name, SetName ] = useState(Params.title ?? "");
    const [ UseDefaultTemplate, SetUseDefaultTemplate ] = useState(false);
    const [ Settings, SetSettings ] = useState<Record<string, FieldSetting>>({});
    const [ PostCreationBehavior, SetPostCreationBehavior ] =
        useState<Domain.Behavior.PostCreationBehavior>({ Type: "Home" });
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
                PostCreationBehavior,
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
        PostCreationBehavior,
        Settings,
        UseDefaultTemplate
    ]);

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <Button
                    Appearance="Link"
                    OnPress={ Router.back }
                    Style={ Styles.Back }>
                    ‹ Back
                </Button>

                <Heading1>
                    { Params.title ?? "Configure" }
                </Heading1>
                <Description Style={ Styles.Subtitle }>
                    Set up a quick-entry destination for this data source.
                </Description>

                { DataSource === null
                    ? <ActivityIndicator color={ Theme.Semantic.Cursor } />
                    : (
                        <ScrollView
                            contentContainerStyle={ Styles.Form }
                            style={ Styles.Scroll }>
                            <LabelText>Name</LabelText>
                            <Input
                                OnChangeText={ SetName }
                                Placeholder="Destination name"
                                Value={ Name }
                            />

                            <View style={ Styles.TemplateRow }>
                                <Checkbox
                                    Checked={ UseDefaultTemplate }
                                    OnCheckedChange={ SetUseDefaultTemplate }
                                />
                                <Body>Use the data source's default template</Body>
                            </View>

                            <Heading2 Style={ Styles.SectionHeading }>Fields</Heading2>
                            <View style={ Styles.FieldHeaderRow }>
                                <View style={ Styles.FieldNameCol } />
                                <LabelText
                                    NumberOfLines={ 1 }
                                    Style={ Styles.ToggleLabel }>
                                    Visible
                                </LabelText>
                                <LabelText
                                    NumberOfLines={ 1 }
                                    Style={ Styles.ToggleLabel }>
                                    Required
                                </LabelText>
                            </View>
                            { DataSource.Properties.map(
                                (Property: Domain.Property.PropertyDefinition) => (
                                    <View
                                        key={ Property.Id }
                                        style={ Styles.FieldRow }>
                                        <View style={ Styles.FieldNameCol }>
                                            <Body NumberOfLines={ 1 }>{ Property.Name }</Body>
                                            <LabelText Style={ Styles.FieldType }>
                                                { Property.Type }
                                            </LabelText>
                                        </View>
                                        <View style={ Styles.ToggleCol }>
                                            <Checkbox
                                                Checked={ Settings[Property.Id]?.Visible ?? true }
                                                OnCheckedChange={ () => Toggle(Property.Id, "Visible") }
                                            />
                                        </View>
                                        <View style={ Styles.ToggleCol }>
                                            <Checkbox
                                                Checked={ Settings[Property.Id]?.Required ?? false }
                                                OnCheckedChange={ () => Toggle(Property.Id, "Required") }
                                            />
                                        </View>
                                    </View>
                                )) }

                            <Heading2 Style={ Styles.SectionHeading }>
                                After creating a page
                            </Heading2>
                            <BehaviorPicker
                                AllowCloseApp
                                DataSources={ DataSources }
                                OnChange={ SetPostCreationBehavior }
                                Value={ PostCreationBehavior }
                            />

                            <Button
                                Appearance="Primary"
                                Disabled={ Saving || Name.trim().length === 0 }
                                OnPress={ HandleSave }
                                Style={ Styles.Save }>
                                { Saving ? "Saving…" : "Save destination" }
                            </Button>

                            { Destinations.length > 0
                                ? (
                                    <>
                                        <Heading2 Style={ Styles.SectionHeading }>Configured</Heading2>
                                        { Destinations.map((Destination: Domain.Destination.Destination) => (
                                            <View
                                                key={ Destination.Id }
                                                style={ Styles.DestinationRow }>
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

const useStyles = MakeStyles({
    Back: ViewStyle({
        alignSelf: "flex-start"
    }),
    Container: ViewStyle({
        flex: 1
    }),
    DestinationRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: Token.Spacing.S
    }),
    FieldHeaderRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.M
    }),
    FieldNameCol: ViewStyle({
        flex: 1
    }),
    FieldRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.S
    }),
    FieldType: TextStyle({
        marginTop: 2
    }),
    Form: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.L
    }),
    SafeArea: ViewStyle({
        flex: 1,
        gap: Token.Spacing.S,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.Xl
    }),
    Save: ViewStyle({
        marginTop: Token.Spacing.L
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    SectionHeading: TextStyle({
        marginTop: Token.Spacing.L
    }),
    Subtitle: TextStyle({
        marginTop: Token.Spacing.Xs
    }),
    TemplateRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.M,
        marginTop: Token.Spacing.S
    }),
    ToggleCol: ViewStyle({
        alignItems: "center",
        width: 64
    }),
    ToggleLabel: TextStyle({
        textAlign: "center",
        width: 64
    })
});

export default DestinationConfigScreen;
