/**
 * Quick-entry form for creating a page in one selected Notion database.
 *
 * @module notivex/app/page-create
 *
 * @file      page-create.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import {
    Button,
    Checkbox,
    Description,
    Input,
    ItemTitle,
    Textarea
} from "@notivex/ui/Primitive";
import {
    CreateDestination,
    CreatePage,
    GetDataSource,
    ListDestinations
} from "@/Domain/Runtime/NotivexApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectPropertyField } from
    "@/features/page-creation/select-property-field";
import { StatusPropertyField } from
    "@/features/page-creation/status-property-field";
import { MultiSelectPropertyField } from
    "@/features/page-creation/multi-select-property-field";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { DatabaseIcon } from "@/Component/DatabaseCard";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { randomUUID } from "expo-crypto";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";

type FieldValue =
    | boolean
    | string
    | ReadonlyArray<Domain.Id.NotionOptionId>;

interface PageFormFieldProps
{
    readonly Disabled: boolean;
    readonly OnChange: (Value: FieldValue) => void;
    readonly Property: Domain.Property.PropertyDefinition;
    readonly Value: FieldValue | undefined;
}

interface DatabaseHeaderTitleProps
{
    readonly Source: Domain.DataSource.CachedDataSourceSchema | null;
    readonly Title: string;
}

/** Displays the selected database identity in the native stack header. */
const DatabaseHeaderTitle = ({
    Source,
    Title
}: DatabaseHeaderTitleProps): React.JSX.Element =>
    <View style={ styles.navigationTitle }>
        { Source === null ? null : <DatabaseIcon Source={ Source } /> }
        <ItemTitle
            NumberOfLines={ 1 }
            Style={ styles.navigationTitleText }
            Weight="600">
            { Title }
        </ItemTitle>
    </View>;

const SupportsInput = (Property: Domain.Property.PropertyDefinition): boolean =>
    ![ "Files", "People", "Relation" ].includes(Property.Type);

/** Renders the input appropriate for one normalized Notion property. */
const PageFormField = ({
    Disabled,
    OnChange,
    Property,
    Value
}: PageFormFieldProps): React.JSX.Element =>
{
    const StringValue = typeof Value === "string" ? Value : "";
    const MultiSelectValue = Array.isArray(Value)
        ? Value as ReadonlyArray<Domain.Id.NotionOptionId>
        : [ ];

    if (Property.Type === "Checkbox")
    {
        return (
            <View style={ styles.checkboxRow }>
                <Checkbox
                    AccessibilityLabel={ Property.Name }
                    Checked={ Value === true }
                    Disabled={ Disabled }
                    OnCheckedChange={ OnChange }
                />
                <PropertyLabel Property={ Property } />
            </View>
        );
    }

    if (Property.Type === "Select")
    {
        return (
            <SelectPropertyField
                { ...{ Disabled, Property } }
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }

    if (Property.Type === "Status")
    {
        return (
            <StatusPropertyField
                { ...{ Disabled, Property } }
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }

    if (Property.Type === "MultiSelect")
    {
        return (
            <MultiSelectPropertyField
                { ...{ Disabled, Property } }
                OnValueChange={ OnChange }
                Value={ MultiSelectValue }
            />
        );
    }

    if (Property.Type === "RichText")
    {
        return (
            <View style={ styles.field }>
                <PropertyLabel Property={ Property } />
                <Textarea
                    Disabled={ Disabled }
                    OnChangeText={ OnChange }
                    Placeholder={ Property.Name }
                    Value={ StringValue }
                />
            </View>
        );
    }

    return (
        <View style={ styles.field }>
            <PropertyLabel Property={ Property } />
            <Input
                Disabled={ Disabled }
                OnChangeText={ OnChange }
                Placeholder={ Property.Type === "Date"
                    ? "YYYY-MM-DD"
                    : Property.Name }
                Value={ StringValue }
            />
        </View>
    );
};

const PageCreateScreen = (): React.JSX.Element =>
{
    const Params = useLocalSearchParams<{ dataSourceId: string; title?: string }>();
    const Navigation = useNavigation();
    const Router = UseLazyRouter();
    const DataSourceId = Params.dataSourceId as Domain.Id.NotionDataSourceId;
    const [ DataSource, SetDataSource ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const [ Destination, SetDestination ] =
        useState<Domain.Destination.Destination | null>(null);
    const [ ErrorMessage, SetErrorMessage ] = useState<string | null>(null);
    const [ IsLoading, SetIsLoading ] = useState(true);
    const [ IsSaving, SetIsSaving ] = useState(false);
    const [ Values, SetValues ] = useState<Readonly<Record<string, FieldValue>>>({});
    const AllowNavigation = useRef(false);
    const IsDirty = Object.values(Values).some((Value: FieldValue) =>
        Value === true
        || (typeof Value === "string" && Value.trim() !== "")
        || (Array.isArray(Value) && Value.length > 0));
    const DatabaseTitle = DataSource?.Title ?? Params.title ?? "Database";
    const RenderHeaderTitle = useCallback(() => (
        <DatabaseHeaderTitle
            Source={ DataSource }
            Title={ DatabaseTitle }
        />
    ), [ DataSource, DatabaseTitle ]);

    useEffect(() => Navigation.addListener("beforeRemove", (Event) =>
    {
        if (!IsDirty || AllowNavigation.current)
        {
            return;
        }

        Event.preventDefault();
        Alert.alert(
            "Discard this page?",
            "You have unsaved changes. If you go back, they will be lost.",
            [
                {
                    style: "cancel",
                    text: "Keep editing"
                },
                {
                    onPress: () =>
                    {
                        AllowNavigation.current = true;
                        Router.dismissTo("/")();
                    },
                    style: "destructive",
                    text: "Discard"
                }
            ]
        );
    }), [ IsDirty, Navigation, Router ]);

    useEffect(() =>
    {
        let Active = true;

        void (async (): Promise<void> =>
        {
            try
            {
                const [ Source, Destinations ] = await Promise.all([
                    GetDataSource(DataSourceId),
                    ListDestinations()
                ]);
                let Form = Destinations
                    .filter((Entry: Domain.Destination.Destination) =>
                        Entry.DataSourceId === DataSourceId)
                    .sort((
                        Left: Domain.Destination.Destination,
                        Right: Domain.Destination.Destination
                    ) => Left.Position - Right.Position)[0];

                if (Form === undefined)
                {
                    Form = await CreateDestination({
                        ConnectionId: Source.ConnectionId,
                        DataSourceId,
                        FieldConfiguration:
                        {
                            FieldOrder: Source.Properties.map((
                                Property: Domain.Property.PropertyDefinition
                            ) => Property.Id),
                            Fields: Source.Properties.map((
                                Property: Domain.Property.PropertyDefinition
                            ) => ({
                                PropertyId: Property.Id,
                                Required: Property.Type === "Title",
                                Visible: SupportsInput(Property)
                            })),
                            Version: 1
                        },
                        Name: Source.Title,
                        Position: 0,
                        Template: { Type: "None" }
                    });
                }

                if (Active)
                {
                    SetDataSource(Source);
                    SetDestination(Form);
                }
            }
            catch (Error: unknown)
            {
                if (Active)
                {
                    SetErrorMessage("We couldn't load this page form. Please try again.");
                    /* eslint-disable-next-line no-console */
                    console.error("Failed to load page creation form", Error);
                }
            }
            finally
            {
                if (Active)
                {
                    SetIsLoading(false);
                }
            }
        })();

        return () =>
        {
            Active = false;
        };
    }, [ DataSourceId ]);

    const VisibleProperties = useMemo(() =>
    {
        if (DataSource === null || Destination === null)
        {
            return [ ];
        }

        const PropertyById = new Map(DataSource.Properties.map((
            Property: Domain.Property.PropertyDefinition
        ) => [ Property.Id, Property ] as const));
        const VisibleIds = new Set(Destination.FieldConfiguration.Fields
            .filter((Field: Domain.Destination.FieldSetting) => Field.Visible)
            .map((Field: Domain.Destination.FieldSetting) => Field.PropertyId));

        return Destination.FieldConfiguration.FieldOrder
            .filter((PropertyId: Domain.Id.NotionPropertyId) =>
                VisibleIds.has(PropertyId))
            .map((PropertyId: Domain.Id.NotionPropertyId) =>
                PropertyById.get(PropertyId))
            .filter((
                Property: Domain.Property.PropertyDefinition | undefined
            ): Property is Domain.Property.PropertyDefinition =>
                Property !== undefined && SupportsInput(Property));
    }, [ DataSource, Destination ]);

    const SetFieldValue = useCallback((PropertyId: string, Value: FieldValue): void =>
    {
        SetValues((Current: Readonly<Record<string, FieldValue>>) => ({
            ...Current,
            [PropertyId]: Value
        }));
    }, [ ]);

    const Submit = useCallback(async (): Promise<void> =>
    {
        if (Destination === null || IsSaving)
        {
            return;
        }

        const Inputs: Array<Domain.PageDraft.PropertyInputValue> = [];
        let Title: string | undefined;

        for (const Property of VisibleProperties)
        {
            const Value = Values[Property.Id];

            if (Property.Type === "Title")
            {
                Title = typeof Value === "string" && Value.trim() !== ""
                    ? Value.trim()
                    : undefined;
            }
            else if (Property.Type === "Checkbox")
            {
                Inputs.push({
                    PropertyId: Property.Id,
                    Value: { Type: "Checkbox", Value: Value === true }
                });
            }
            else if ((Property.Type === "Select" || Property.Type === "Status")
                && typeof Value === "string"
                && Value !== "")
            {
                Inputs.push({
                    PropertyId: Property.Id,
                    Value: Property.Type === "Select"
                        ? {
                            OptionId: Value as Domain.Id.NotionOptionId,
                            Type: "Select"
                        }
                        : {
                            OptionId: Value as Domain.Id.NotionOptionId,
                            Type: "Status"
                        }
                });
            }
            else if (Property.Type === "MultiSelect"
                && Array.isArray(Value)
                && Value.length > 0)
            {
                Inputs.push({
                    PropertyId: Property.Id,
                    Value: {
                        OptionIds: [ ...Value ] as Array<Domain.Id.NotionOptionId>,
                        Type: "MultiSelect"
                    }
                });
            }
            else if (typeof Value === "string" && Value.trim() !== "")
            {
                const Trimmed = Value.trim();

                if (Property.Type === "Number")
                {
                    const NumberValue = Number(Trimmed);

                    if (!Number.isNaN(NumberValue))
                    {
                        Inputs.push({
                            PropertyId: Property.Id,
                            Value: { Type: "Number", Value: NumberValue }
                        });
                    }
                }
                else if (Property.Type === "Date")
                {
                    const Start = new Date(Trimmed);

                    if (!Number.isNaN(Start.getTime()))
                    {
                        Inputs.push({
                            PropertyId: Property.Id,
                            Value: { Start, Type: "Date" }
                        });
                    }
                }
                else if ([ "Email", "PhoneNumber", "RichText", "Url" ]
                    .includes(Property.Type))
                {
                    Inputs.push({
                        PropertyId: Property.Id,
                        Value: { Type: Property.Type, Value: Trimmed } as
                            Domain.Property.PropertyInput
                    });
                }
            }
        }

        if (Title === undefined)
        {
            SetErrorMessage("Enter a page title before creating the page.");

            return;
        }

        SetErrorMessage(null);
        SetIsSaving(true);

        try
        {
            await CreatePage({
                DestinationId: Destination.Id,
                OperationId: randomUUID() as Domain.Id.OperationId,
                Title,
                Values: Inputs
            });
            AllowNavigation.current = true;
            Router.replace("/")();
        }
        catch (Error: unknown)
        {
            SetErrorMessage("We couldn't create the page. Check the form and try again.");
            /* eslint-disable-next-line no-console */
            console.error("Failed to create page", Error);
        }
        finally
        {
            SetIsSaving(false);
        }
    }, [ Destination, IsSaving, Router, Values, VisibleProperties ]);

    return (
        <KeyboardAvoidingView
            behavior={ Platform.OS === "ios" ? "padding" : undefined }
            style={ styles.container }>
            <Stack.Screen options={ { headerTitle: RenderHeaderTitle } } />
            <SafeAreaView
                edges={ [ "bottom", "left", "right" ] }
                style={ styles.safeArea }>
                { IsLoading
                    ? <ActivityIndicator style={ styles.loading } />
                    : DataSource === null || Destination === null
                        ? <Description>{ ErrorMessage }</Description>
                        : (
                            <ScrollView
                                contentContainerStyle={ styles.form }
                                keyboardShouldPersistTaps="handled">
                                { VisibleProperties.map((
                                    Property: Domain.Property.PropertyDefinition
                                ) => (
                                    <PageFormField
                                        Disabled={ IsSaving }
                                        OnChange={ (Value: FieldValue) =>
                                            SetFieldValue(Property.Id, Value) }
                                        Property={ Property }
                                        Value={ Values[Property.Id] }
                                        key={ Property.Id }
                                    />
                                )) }

                                { ErrorMessage === null
                                    ? null
                                    : <Description>{ ErrorMessage }</Description> }

                                <Button
                                    Appearance="Blue"
                                    Loading={ IsSaving }
                                    OnPress={ () => void Submit() }
                                    Style={ styles.submit }>
                                    Create page
                                </Button>
                            </ScrollView>
                        ) }
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    checkboxRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 36
    },
    container:
    {
        flex: 1
    },
    field:
    {
        gap: 6
    },
    form:
    {
        gap: 18,
        paddingBottom: 40,
        paddingTop: 24
    },
    loading:
    {
        flex: 1
    },
    navigationTitle:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        maxWidth: 260
    },
    navigationTitleText:
    {
        flexShrink: 1
    },
    safeArea:
    {
        flex: 1,
        gap: 16,
        paddingHorizontal: 24,
        paddingVertical: 24
    },
    submit:
    {
        marginTop: 8,
        minHeight: 48
    }
});

export default PageCreateScreen;
