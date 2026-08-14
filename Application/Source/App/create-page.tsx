/**
 * Quick-entry form for creating a page in one selected Notion database.
 *
 * @module notivex/app/create-page
 *
 * @file      create-page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import * as ImagePicker from "expo-image-picker";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    type PressableStateCallbackType,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";
import {
    type BottomSheet,
    Button,
    Description,
    Input,
    ItemTitle,
    Pressable,
    Separator,
    Textarea
} from "@notivex/ui/Primitive";
import { ChevronLeft, ImagePlus, Settings, Smile } from "lucide-react-native";
import { Cover, IconBlock, type IconData, IconMenu } from "@notivex/ui/Block";
import {
    CreateDestination,
    CreatePage,
    GetDataSource,
    ListDestinations,
    RefreshDataSource,
    UpdateDestination
} from "@/Domain/Runtime/NotivexApi";
import type { EventArg, NavigationAction } from "expo-router/build/react-navigation";
import { FileMediaPropertyField, type FileMediaValue } from
    "@/features/page-creation/file-media-property-field";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { String, pipe } from "effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddMediaButton } from "@/features/page-creation/add-media-button";
import { CheckboxPropertyField } from
    "@/features/page-creation/checkbox-property-field";
import { DatabaseIcon } from "@/Component/DatabaseCard";
import { DatePropertyField } from
    "@/features/page-creation/date-property-field";
import { EmailPropertyField } from
    "@/features/page-creation/email-property-field";
import { MultiSelectPropertyField } from
    "@/features/page-creation/multi-select-property-field";
import { NumberPropertyField } from
    "@/features/page-creation/number-property-field";
import { PhoneNumberPropertyField } from
    "@/features/page-creation/phone-number-property-field";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { SelectPropertyField } from
    "@/features/page-creation/select-property-field";
import { StatusPropertyField } from
    "@/features/page-creation/status-property-field";
import { TextPropertyField } from
    "@/features/page-creation/text-property-field";
import type { Thunk } from "@sorrell/utility/Function";
import { UrlPropertyField } from
    "@/features/page-creation/url-property-field";
import { randomUUID } from "expo-crypto";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useTheme } from "@notivex/ui";

const MaxPageBodyLength = 200_000;

type FieldValue =
    | boolean
    | Domain.Property.DatePropertyInput
    | FileMediaValue
    | string
    | ReadonlyArray<Domain.Id.NotionOptionId>;

interface PageFormFieldProps
{
    readonly Disabled: boolean;
    readonly OnChange: (Value: FieldValue | undefined) => void;
    readonly Property: Domain.Property.PropertyDefinition;
    readonly Value: FieldValue | undefined;
}

interface DatabaseHeaderTitleProps
{
    readonly Source: Domain.DataSource.CachedDataSourceSchema | null;
    readonly Title: string;
}

interface HeaderSettingsButtonProps
{
    readonly Color: string;
    readonly Disabled: boolean;
    readonly Label: string;
    readonly OnPress: Thunk;
}

/** Shows the discard prompt shared by header navigation actions. */
const ShowDiscardConfirmation = (OnDiscard: () => void): void =>
{
    Alert.alert(
        "Discard this page?",
        "You have unsaved changes. If you go back, they will be lost.",
        [
            {
                style: "cancel",
                text: "Keep editing"
            },
            {
                onPress: OnDiscard,
                style: "destructive",
                text: "Discard"
            }
        ]
    );
};

/** Accessible native-stack header action for the current database's settings. */
const HeaderSettingsButton = ({
    Color,
    Disabled,
    Label,
    OnPress
}: HeaderSettingsButtonProps): React.JSX.Element =>
    <Pressable
        Accessibility={ {
            Label,
            Role: "button",
            State: { disabled: Disabled }
        } }
        Disabled={ Disabled }
        OnPress={ OnPress }
        hitSlop={ 8 }
        style={ ({ pressed }: PressableStateCallbackType) => [
            styles.headerSettingsButton,
            Disabled && styles.headerSettingsButtonDisabled,
            pressed && styles.headerSettingsButtonPressed
        ] }>
        <Settings
            color={ Color }
            size={ 20 }
            strokeWidth={ 2 }
        />
    </Pressable>;

/** Displays the selected database identity in the native stack header. */
const DatabaseHeaderTitle = ({
    Source,
    Title
}: DatabaseHeaderTitleProps): React.JSX.Element =>
    <View style={ styles.navigationTitle }>
        { Source === null
            ? (
                <View
                    accessible={ false }
                    style={ styles.navigationIconPlaceholder }
                />
            )
            : <DatabaseIcon Source={ Source } /> }
        <ItemTitle
            NumberOfLines={ 1 }
            Style={ styles.navigationTitleText }
            Weight="600">
            { Title }
        </ItemTitle>
    </View>;

const SupportsInput = (Property: Domain.Property.PropertyDefinition): boolean =>
    Domain.Destination.IsQuickEntryProperty(Property);

const IsDateValue = (
    Value: FieldValue | undefined
): Value is Domain.Property.DatePropertyInput =>
    typeof Value === "object"
    && Value !== null
    && "Type" in Value
    && Value.Type === "Date";

const IsFileMediaValue = (
    Value: FieldValue | undefined
): Value is FileMediaValue =>
    typeof Value === "object"
    && Value !== null
    && "Type" in Value
    && (Value.Type === "Local" || Value.Type === "Link");

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
    const DateValue = IsDateValue(Value) ? Value : undefined;
    const FileMediaFieldValue = IsFileMediaValue(Value) ? Value : undefined;
    let Control: React.JSX.Element;

    if (Property.Type === "Checkbox")
    {
        Control = (
            <CheckboxPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ Value === true }
            />
        );
    }
    else if (Property.Type === "Select")
    {
        Control = (
            <SelectPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "Status")
    {
        Control = (
            <StatusPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "MultiSelect")
    {
        Control = (
            <MultiSelectPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ MultiSelectValue }
            />
        );
    }
    else if (Property.Type === "Date")
    {
        Control = (
            <DatePropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ DateValue }
            />
        );
    }
    else if (Property.Type === "Number")
    {
        Control = (
            <NumberPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "Url")
    {
        Control = (
            <UrlPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "Email")
    {
        Control = (
            <EmailPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "PhoneNumber")
    {
        Control = (
            <PhoneNumberPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else if (Property.Type === "Files")
    {
        Control = (
            <FileMediaPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ FileMediaFieldValue }
            />
        );
    }
    else if (Property.Type === "RichText")
    {
        Control = (
            <TextPropertyField
                { ...{ Disabled, Property } }
                Inline
                OnValueChange={ OnChange }
                Value={ StringValue }
            />
        );
    }
    else
    {
        Control = (
            <Input
                Disabled={ Disabled }
                OnChangeText={ OnChange }
                Placeholder="Empty"
                Style={ styles.inlineInput }
                Value={ StringValue }
                Variant="Flat"
            />
        );
    }

    return (
        <View style={ styles.propertyRow }>
            <View style={ styles.propertyLabel }>
                <PropertyLabel
                    Muted
                    Property={ Property }
                />
            </View>
            <View style={ styles.propertyValue }>
                { Control }
            </View>
        </View>
    );
};

const PageCreateScreen = (): React.JSX.Element =>
{
    const Params = useLocalSearchParams<{ dataSourceId: string; title?: string }>();
    const Navigation = useNavigation();
    const Router = useLazyRouter();
    const Theme = useTheme();
    const DataSourceId = Params.dataSourceId as Domain.Id.NotionDataSourceId;
    const [ DataSource, SetDataSource ] =
        useState<Domain.DataSource.CachedDataSourceSchema | null>(null);
    const [ Destination, SetDestination ] =
        useState<Domain.Destination.Destination | null>(null);
    const [ ErrorMessage, SetErrorMessage ] = useState<string | null>(null);
    const [ IsLoading, SetIsLoading ] = useState(true);
    const [ IsSaving, SetIsSaving ] = useState(false);
    const [ PageBody, SetPageBody ] = useState("");
    const [ Values, SetValues ] = useState<Readonly<Record<string, FieldValue>>>({});
    const [ PageIcon, SetPageIcon ] = useState<IconData | undefined>(undefined);
    const [ CoverUrl, SetCoverUrl ] = useState<string | undefined>(undefined);
    const IconMenuRef = useRef<BottomSheet>(null);
    const Insets = useSafeAreaInsets();
    const AllowNavigation = useRef(false);
    const IsDirty = PageBody.trim() !== ""
        || Object.values(Values).some((Value: FieldValue) =>
            Value === true
            || (typeof Value === "string" && Value.trim() !== "")
            || IsDateValue(Value)
            || (Array.isArray(Value) && Value.length > 0));
    const DatabaseTitle = DataSource?.Title ?? Params.title ?? "Database";
    const RenderHeaderTitle = useCallback(() => (
        <DatabaseHeaderTitle
            Source={ DataSource }
            Title={ DatabaseTitle }
        />
    ), [ DataSource, DatabaseTitle ]);
    const NavigateToDatabaseSettings = useCallback((): void =>
    {
        if (DataSource === null)
        {
            return;
        }

        AllowNavigation.current = true;
        Router.replace({
            params:
            {
                connectionId: DataSource.ConnectionId,
                dataSourceId: DataSource.DataSourceId,
                title: DataSource.Title
            },
            pathname: "/destination-config"
        })();
    }, [ DataSource, Router ]);
    const OpenDatabaseSettings = useCallback((): void =>
    {
        if (DataSource === null)
        {
            return;
        }

        if (IsDirty)
        {
            ShowDiscardConfirmation(NavigateToDatabaseSettings);
        }
        else
        {
            NavigateToDatabaseSettings();
        }
    }, [ DataSource, IsDirty, NavigateToDatabaseSettings ]);
    const RenderHeaderRight = useCallback(() => (
        <HeaderSettingsButton
            Color={ Theme.Semantic.IconPrimary }
            Disabled={ DataSource === null }
            Label={ `Settings for ${ DatabaseTitle }` }
            OnPress={ OpenDatabaseSettings }
        />
    ), [
        DataSource,
        DatabaseTitle,
        OpenDatabaseSettings,
        Theme.Semantic.IconPrimary
    ]);

    type BeforeRemoveEvent = EventArg<"beforeRemove", true, { action: NavigationAction; }>;
    useEffect(() => Navigation.addListener("beforeRemove", (Event: BeforeRemoveEvent) =>
    {
        if (!IsDirty || AllowNavigation.current)
        {
            return;
        }

        Event.preventDefault();
        ShowDiscardConfirmation(() =>
        {
            AllowNavigation.current = true;
            Router.dismissTo("/")();
        });
    }), [ IsDirty, Navigation, Router ]);

    useEffect(() =>
    {
        let Active = true;

        void (async (): Promise<void> =>
        {
            try
            {
                const CachedSource = await GetDataSource(DataSourceId);
                let Source = CachedSource;

                try
                {
                    Source = await RefreshDataSource(
                        CachedSource.ConnectionId,
                        DataSourceId
                    );
                }
                catch (RefreshError: unknown)
                {
                    // A transient Notion failure should not make a cached form
                    // unusable. The next visit will attempt the refresh again.
                    /* eslint-disable-next-line no-console */
                    console.warn("Failed to refresh data source schema", RefreshError);
                }

                const Destinations = await ListDestinations();
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
                else
                {
                    const FieldConfiguration =
                        Domain.Destination.ReconcileFieldConfiguration(
                            Form.FieldConfiguration,
                            Source.Properties
                        );

                    if (JSON.stringify(FieldConfiguration)
                        !== JSON.stringify(Form.FieldConfiguration))
                    {
                        const ReconciledForm = { ...Form, FieldConfiguration };

                        try
                        {
                            Form = await UpdateDestination(Form.Id, {
                                FieldConfiguration
                            });
                        }
                        catch (UpdateError: unknown)
                        {
                            // Still show the live schema immediately. The server
                            // refresh path will persist it on a later successful
                            // request if this update was interrupted.
                            Form = ReconciledForm;
                            /* eslint-disable-next-line no-console */
                            console.warn(
                                "Failed to persist reconciled page form",
                                UpdateError
                            );
                        }
                    }
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
    const TitleProperty = DataSource?.Properties.find(
        (Property: Domain.Property.PropertyDefinition) => Property.Type === "Title"
    );
    const PropertyRows = VisibleProperties.filter(
        (Property: Domain.Property.PropertyDefinition) => Property.Type !== "Title"
    );
    const PageTitleValue = TitleProperty === undefined
        ? undefined
        : Values[TitleProperty.Id];
    const PageTitleText = typeof PageTitleValue === "string"
        ? PageTitleValue
        : "";

    const SetFieldValue = useCallback((
        PropertyId: string,
        Value: FieldValue | undefined
    ): void =>
    {
        SetValues((Current: Readonly<Record<string, FieldValue>>) =>
        {
            if (Value === undefined)
            {
                const NextValues = { ...Current };
                delete NextValues[PropertyId];

                return NextValues;
            }

            return {
                ...Current,
                [PropertyId]: Value
            };
        });
    }, [ ]);

    const OpenIconMenu = useCallback((): void =>
    {
        IconMenuRef.current?.present();
    }, [ ]);

    /**
     * Attaching an icon seeds a default document glyph so a value is set (the
     * "Add icon" button then hides), and opens the picker to change it.
     */
    const AddIcon = useCallback((): void =>
    {
        SetPageIcon({ Src: "file-text", Type: "Lucide" });
        IconMenuRef.current?.present();
    }, [ ]);

    const SelectIcon = useCallback((Icon: IconData): void =>
    {
        SetPageIcon(Icon);
        IconMenuRef.current?.dismiss();
    }, [ ]);

    const RemoveIcon = useCallback((): void =>
    {
        SetPageIcon(undefined);
        IconMenuRef.current?.dismiss();
    }, [ ]);

    const PickCover = useCallback(async (): Promise<void> =>
    {
        const Permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!Permission.granted)
        {
            return;
        }

        const Result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: [ "images" ],
            quality: 0.9
        });

        const Asset = Result.canceled ? undefined : Result.assets[ 0 ];

        if (Asset !== undefined)
        {
            SetCoverUrl(Asset.uri);
        }
    }, [ ]);

    const RemoveCover = useCallback((): void =>
    {
        SetCoverUrl(undefined);
    }, [ ]);

    const GoBack = useCallback((): void =>
    {
        Navigation.goBack();
    }, [ Navigation ]);

    const Submit = useCallback(async (): Promise<void> =>
    {
        if (Destination === null || IsSaving)
        {
            return;
        }

        const Inputs: Array<Domain.PageDraft.PropertyInputValue> = [];
        const Body = PageBody.trim() === "" ? undefined : PageBody;
        const Title = PageTitleText.trim() !== ""
            ? PageTitleText.trim()
            : undefined;

        for (const Property of VisibleProperties)
        {
            const Value = Values[Property.Id];

            if (Property.Type === "Title")
            {
                continue;
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
            else if (Property.Type === "Date" && IsDateValue(Value))
            {
                Inputs.push({
                    PropertyId: Property.Id,
                    Value
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
                ...(Body === undefined ? { } : { Body }),
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
    }, [ Destination, IsSaving, PageBody, PageTitleText, Router, Values, VisibleProperties ]);

    const HasIcon = PageIcon !== undefined;
    const HasCover = CoverUrl !== undefined;
    const BodyTopPadding = HasCover ? (HasIcon ? 0 : 12) : 24;

    const IconElement = PageIcon === undefined
        ? null
        : (
            <Pressable
                Accessibility={ { Label: "Change page icon", Role: "button" } }
                OnPress={ OpenIconMenu }
                style={ [ styles.iconWrap, HasCover && styles.iconOverlap ] }>
                <IconBlock
                    Icon={ PageIcon }
                    Size="ExtraLarge"
                />
            </Pressable>
        );
    const AddIconButton = (
        <AddMediaButton
            Disabled={ IsSaving }
            Icon={ Smile }
            Label="Add icon"
            OnPress={ AddIcon }
        />
    );
    const AddCoverButton = (
        <AddMediaButton
            Disabled={ IsSaving }
            Icon={ ImagePlus }
            Label="Add cover"
            OnPress={ () => void PickCover() }
        />
    );

    let MediaHeader: React.JSX.Element | null;

    if (!HasCover && !HasIcon)
    {
        MediaHeader = (
            <View style={ styles.addRow }>
                { AddIconButton }
                { AddCoverButton }
            </View>
        );
    }
    else if (!HasCover && HasIcon)
    {
        MediaHeader = (
            <>
                { AddCoverButton }
                { IconElement }
            </>
        );
    }
    else if (HasCover && !HasIcon)
    {
        MediaHeader = AddIconButton;
    }
    else
    {
        MediaHeader = IconElement;
    }

    return (
        <KeyboardAvoidingView
            behavior={ Platform.OS === "ios" ? "padding" : undefined }
            style={ styles.container }>
            <Stack.Screen options={ {
                headerRight: RenderHeaderRight,
                headerShown: !HasCover,
                headerTitle: RenderHeaderTitle
            } } />
            <SafeAreaView
                edges={ [ "bottom", "left", "right" ] }
                style={ styles.safeArea }>
                { IsLoading
                    ? <ActivityIndicator
                        color={ Theme.Semantic.Cursor }
                        style={ styles.loading }
                    />
                    : DataSource === null || Destination === null
                        ? (
                            <View style={ styles.messageContainer }>
                                <Description>{ ErrorMessage }</Description>
                            </View>
                        )
                        : (
                            <ScrollView
                                contentContainerStyle={ styles.scroll }
                                keyboardShouldPersistTaps="handled">
                                { HasCover && (
                                    <Cover
                                        OnChangeCoverPress={ () => void PickCover() }
                                        OnRemovePress={ RemoveCover }
                                        Url={ CoverUrl }
                                    />
                                ) }
                                <View style={ [ styles.body, { paddingTop: BodyTopPadding } ] }>
                                    { MediaHeader }

                                    { TitleProperty === undefined
                                        ? null
                                        : (
                                            <TextInput
                                                accessibilityLabel={ TitleProperty.Name }
                                                autoFocus
                                                cursorColor={ Theme.Semantic.Cursor }
                                                editable={ !IsSaving }
                                                multiline
                                                onChangeText={ (Value: string) =>
                                                    SetFieldValue(TitleProperty.Id, Value) }
                                                placeholder="Untitled"
                                                placeholderTextColor={ Theme.Semantic.Muted }
                                                scrollEnabled={ false }
                                                selectionColor={ Theme.Semantic.Cursor }
                                                style={ [
                                                    styles.pageTitleInput,
                                                    { color: Theme.Semantic.Primary }
                                                ] }
                                                value={ PageTitleText }
                                            />
                                        ) }

                                    <View style={ styles.properties }>
                                        { PropertyRows.map((
                                            Property: Domain.Property.PropertyDefinition
                                        ) => (
                                            <PageFormField
                                                Disabled={ IsSaving }
                                                OnChange={ (Value: FieldValue | undefined) =>
                                                    SetFieldValue(Property.Id, Value) }
                                                Property={ Property }
                                                Value={ Values[Property.Id] }
                                                key={ Property.Id }
                                            />
                                        )) }
                                    </View>

                                    <Separator Style={ styles.bodyDivider } />

                                    <Textarea
                                        AccessibilityLabel="Page body"
                                        Disabled={ IsSaving }
                                        MaxLength={ MaxPageBodyLength }
                                        NumberOfLines={ 8 }
                                        OnChangeText={ SetPageBody }
                                        Placeholder="Type something..."
                                        Style={ styles.pageBodyInput }
                                        Value={ PageBody }
                                    />

                                    { ErrorMessage === null
                                        ? null
                                        : <Description>{ ErrorMessage }</Description> }

                                    <Button
                                        Appearance="Blue"
                                        Disabled={ pipe(PageTitleText, String.trim, String.isEmpty) }
                                        Loading={ IsSaving }
                                        OnPress={ Submit }
                                        Style={ styles.submit }>
                                        Create page
                                    </Button>
                                </View>
                            </ScrollView>
                        ) }
                { HasCover && (
                    <View
                        pointerEvents="box-none"
                        style={ [ styles.coverHeader, { paddingTop: Insets.top + 6 } ] }>
                        <Pressable
                            Accessibility={ { Label: "Go back", Role: "button" } }
                            OnPress={ GoBack }
                            hitSlop={ 8 }
                            style={ styles.coverHeaderButton }>
                            <ChevronLeft
                                color="#FFFFFF"
                                size={ 22 }
                                strokeWidth={ 2.25 }
                            />
                        </Pressable>
                        <Pressable
                            Accessibility={ {
                                Label: `Settings for ${ DatabaseTitle }`,
                                Role: "button",
                                State: { disabled: DataSource === null }
                            } }
                            Disabled={ DataSource === null }
                            OnPress={ OpenDatabaseSettings }
                            hitSlop={ 8 }
                            style={ [
                                styles.coverHeaderButton,
                                DataSource === null && styles.coverHeaderButtonDisabled
                            ] }>
                            <Settings
                                color="#FFFFFF"
                                size={ 20 }
                                strokeWidth={ 2 }
                            />
                        </Pressable>
                    </View>
                ) }
                <IconMenu
                    OnRemove={ HasIcon ? RemoveIcon : undefined }
                    OnSelect={ SelectIcon }
                    Ref={ IconMenuRef }
                />
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    addRow:
    {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16
    },
    body:
    {
        gap: 16,
        paddingHorizontal: 24
    },
    bodyDivider:
    {
        marginVertical: 16
    },
    container:
    {
        flex: 1
    },
    coverHeader:
    {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        left: 0,
        paddingHorizontal: 12,
        position: "absolute",
        right: 0,
        top: 0
    },
    coverHeaderButton:
    {
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        width: 36
    },
    coverHeaderButtonDisabled:
    {
        opacity: 0.35
    },
    headerSettingsButton:
    {
        alignItems: "center",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        width: 36
    },
    headerSettingsButtonDisabled:
    {
        opacity: 0.35
    },
    headerSettingsButtonPressed:
    {
        opacity: 0.55
    },
    iconOverlap:
    {
        marginTop: -39
    },
    iconWrap:
    {
        alignSelf: "flex-start",
        marginBottom: 8
    },
    inlineInput:
    {
        height: 32,
        paddingHorizontal: 0
    },
    loading:
    {
        flex: 1
    },
    messageContainer:
    {
        flex: 1,
        padding: 24
    },
    navigationIconPlaceholder:
    {
        height: 24,
        width: 24
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
    pageBodyInput:
    {
        backgroundColor: "transparent",
        borderWidth: 0,
        fontSize: 16,
        lineHeight: 24,
        minHeight: 192,
        paddingHorizontal: 0,
        paddingVertical: 0
    },
    pageTitleInput:
    {
        fontSize: 34,
        fontWeight: "700",
        letterSpacing: -0.6,
        lineHeight: 42,
        marginBottom: 22,
        minHeight: 48,
        padding: 0,
        textAlignVertical: "top"
    },
    properties:
    {
        gap: 2
    },
    propertyLabel:
    {
        flexBasis: "38%",
        flexGrow: 0,
        flexShrink: 0,
        maxWidth: 128
    },
    propertyRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        minHeight: 40
    },
    propertyValue:
    {
        flex: 1,
        minWidth: 0
    },
    safeArea:
    {
        flex: 1
    },
    scroll:
    {
        flexGrow: 1,
        paddingBottom: 40
    },
    submit:
    {
        marginTop: 28,
        minHeight: 48
    }
});

export default PageCreateScreen;
