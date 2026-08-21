/**
 * Destination-config screen: turn a cached data source's schema into a
 * quick-entry destination; name it, pick a template, and choose which fields
 * are visible and required, then save. Also lists and deletes the
 * destinations already configured for this data source. Reached from a
 * cached row on the data-sources screen.
 *
 * If a destination already exists for this data source (the lowest-`Position`
 * one, same rule `create-page.tsx` uses to pick which destination it opens),
 * the form loads and edits that one instead of always creating a new one —
 * needed so template hide/reorder/default-select persist against a real row.
 *
 * @module notivex/app/destination-config
 *
 * @file      destination-config.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
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
import { GetDataSource, RefreshDataSource } from "@/Domain/Runtime/NotivexApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { TemplateSection } from "@/features/templates/template-section";
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

const EmptyTemplateConfiguration: Domain.Destination.TemplateConfiguration =
    { Hidden: [ ], TemplateOrder: [ ], Version: 1 };

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

    const { Destinations, IsLoading: DestinationsLoading, Create, Update, Remove } = useDestinations(DataSourceId);
    const { DataSources } = useConnections();

    const [ DataSource, SetDataSource ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const [ Name, SetName ] = useState(Params.title ?? "");
    const [ Template, SetTemplate ] =
        useState<Domain.Destination.DestinationTemplate>({ Type: "None" });
    const [ TemplateConfig, SetTemplateConfig ] =
        useState<Domain.Destination.TemplateConfiguration>(EmptyTemplateConfiguration);
    const [ Settings, SetSettings ] = useState<Record<string, FieldSetting>>({});
    const [ PostCreationBehavior, SetPostCreationBehavior ] =
        useState<Domain.Behavior.PostCreationBehavior>({ Type: "Home" });
    const [ Saving, SetSaving ] = useState(false);
    const [ HasSeeded, SetHasSeeded ] = useState(false);

    const ExistingDestination = Destinations
        .filter((Entry: Domain.Destination.Destination) => Entry.DataSourceId === DataSourceId)
        .sort((Left: Domain.Destination.Destination, Right: Domain.Destination.Destination) =>
            Left.Position - Right.Position)[0];

    /* Seeds the form from an already-existing destination exactly once, the
     * moment both loads settle — done here (during render, not inside a
     * `useEffect`) per React's guidance for adjusting state from data that's
     * already available synchronously: a `useEffect` calling several setters
     * back-to-back for already-rendered data is the anti-pattern that
     * guidance warns against, since nothing here is subscribing to an
     * external system or awaiting a new fetch. */
    if (!HasSeeded && DataSource !== null && !DestinationsLoading)
    {
        SetHasSeeded(true);

        if (ExistingDestination !== undefined)
        {
            SetName(ExistingDestination.Name);
            SetSettings(Object.fromEntries(DataSource.Properties.map(
                (Property: Domain.Property.PropertyDefinition) =>
                {
                    const Field = ExistingDestination.FieldConfiguration.Fields.find(
                        (Entry: Domain.Destination.FieldSetting) => Entry.PropertyId === Property.Id);

                    return [ Property.Id, {
                        Required: Field?.Required ?? Property.Type === "Title",
                        Visible: Field?.Visible ?? true
                    } ];
                })));
            SetPostCreationBehavior(Domain.Destination.ResolvePostCreationBehavior(ExistingDestination));
            SetTemplate(ExistingDestination.Template);
            SetTemplateConfig(Domain.Destination.ResolveTemplateConfiguration(ExistingDestination));
        }
    }

    useEffect(() =>
    {
        let Active = true;

        void (async () =>
        {
            try
            {
                const Cached = await GetDataSource(DataSourceId);

                let Loaded = Cached;

                try
                {
                    Loaded = await RefreshDataSource(Cached.ConnectionId, DataSourceId);
                }
                catch (RefreshError)
                {
                    // A transient Notion failure should not make an otherwise
                    // usable cached schema/template list unavailable here.
                    /* eslint-disable-next-line no-console */
                    console.warn("Failed to refresh data source schema", RefreshError);
                }

                if (!Active)
                {
                    return;
                }

                SetDataSource(Loaded);
                SetSettings((Current: Record<string, FieldSetting>) =>
                    Object.keys(Current).length > 0
                        ? Current
                        : Object.fromEntries(Loaded.Properties.map(
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
            const FieldConfiguration: Domain.Destination.FieldConfiguration = {
                FieldOrder: DataSource.Properties.map(
                    (Property: Domain.Property.PropertyDefinition) => Property.Id),
                Fields,
                Version: 1
            };

            if (ExistingDestination)
            {
                await Update(ExistingDestination.Id, {
                    FieldConfiguration,
                    Name: Name.trim(),
                    PostCreationBehavior,
                    Template,
                    TemplateConfiguration: TemplateConfig
                });
            }
            else
            {
                await Create({
                    ConnectionId,
                    DataSourceId,
                    FieldConfiguration,
                    Name: Name.trim(),
                    Position: Destinations.length,
                    PostCreationBehavior,
                    Template,
                    TemplateConfiguration: TemplateConfig
                });
            }
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
        ExistingDestination,
        Name,
        PostCreationBehavior,
        Settings,
        Template,
        TemplateConfig,
        Update
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

                            <TemplateSection
                                OnTemplateChange={ SetTemplate }
                                OnTemplateConfigurationChange={ SetTemplateConfig }
                                Template={ Template }
                                TemplateConfiguration={ TemplateConfig }
                                Templates={ DataSource.Templates }
                            />

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
                                { Saving
                                    ? "Saving…"
                                    : ExistingDestination
                                        ? "Save changes"
                                        : "Save destination" }
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
