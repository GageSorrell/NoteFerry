/**
 * Quick-entry form for creating a page in one selected Notion database.
 *
 * @module noteferry/app/create-page
 *
 * @file      create-page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import * as ImagePicker from "expo-image-picker";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    type PressableStateCallbackType,
    ScrollView,
    TextInput,
    View
} from "react-native";
import { type BottomSheet } from "@noteferry/ui/Primitive/BottomSheet";
import { Button } from "@noteferry/ui/Primitive/Button";
import { Description, NavigationTitle } from "@noteferry/ui/Primitive/Text";
import { Input } from "@noteferry/ui/Primitive/Input";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { Separator } from "@noteferry/ui/Primitive/Separator";
import { Textarea } from "@noteferry/ui/Primitive/Textarea";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ImagePlus from "lucide-react-native/icons/image-plus";
import LayoutTemplate from "lucide-react-native/icons/layout-template";
import Settings from "lucide-react-native/icons/settings";
import Smile from "lucide-react-native/icons/smile";
import Wand2 from "lucide-react-native/icons/wand-sparkles";
import { Cover } from "@noteferry/ui/Block/Cover";
import { IconBlock, type IconData } from "@noteferry/ui/Block/IconBlock";
import { IconMenu } from "@noteferry/ui/Block/IconMenu";
import {
    CreateDestination,
    CreatePage,
    GetDataSource,
    ListDestinations,
    RefreshDataSource,
    UpdateDestination
} from "@/Domain/Runtime/NoteFerryApi";
import type { EventArg, NavigationAction } from "expo-router/build/react-navigation";
import { FileMediaPropertyField, type FileMediaValue } from
    "@/features/page-creation/file-media-property-field";
import {
    GenerateDummyValue,
    GenerateLoremIpsumParagraph,
    GetStockPhotoFileValue,
    IsFieldEmpty
} from "@/features/page-creation/dummy-page-data";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import {
    ResolveTemplateFieldValues,
    type TemplateFieldAssignment
} from "@/features/templates/template-values";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import * as String from "effect/String";
import { pipe } from "effect/Function";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddMediaButton } from "@/features/page-creation/add-media-button";
import { CheckboxPropertyField } from
    "@/features/page-creation/checkbox-property-field";
import { DatabaseIcon } from "@/Component/DatabaseCard";
import { DatePropertyField } from
    "@/features/page-creation/date-property-field";
import { EmailPropertyField } from "@/features/page-creation/email-property-field";
import { File } from "expo-file-system";
import type { LucideIcon } from "lucide-react-native";
import { MultiSelectPropertyField } from "@/features/page-creation/multi-select-property-field";
import { NumberPropertyField } from "@/features/page-creation/number-property-field";
import { PhoneNumberPropertyField } from "@/features/page-creation/phone-number-property-field";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { SelectPropertyField } from "@/features/page-creation/select-property-field";
import { StatusPropertyField } from "@/features/page-creation/status-property-field";
import { TemplatePickerSheet } from "@/features/templates/template-picker-sheet";
import { TextPropertyField } from "@/features/page-creation/text-property-field";
import type { Thunk } from "@sorrell/effect/Function";
import { UrlPropertyField } from "@/features/page-creation/url-property-field";
import { randomUUID } from "expo-crypto";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useSubscription } from "@/Domain/Subscription";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

const MaxPageBodyLength = 200_000;

const FileNameFromUri = (Uri: string, Fallback: string): string =>
    decodeURIComponent(Uri.split(/[?#]/u)[0]?.split("/").pop() ?? Fallback) || Fallback;

const FindTaggedError = (InError: unknown): Record<string, unknown> | null =>
{
    const Seen = new Set<unknown>();
    const Queue: Array<unknown> = [ InError ];

    while (Queue.length > 0)
    {
        const Current = Queue.shift();
        if (!Current || typeof Current !== "object" || Seen.has(Current))
        {
            continue;
        }

        Seen.add(Current);
        const CurrentRecord = Current as Record<string, unknown>;
        if (typeof CurrentRecord._tag === "string")
        {
            return CurrentRecord;
        }

        Queue.push(CurrentRecord.cause, CurrentRecord.error, CurrentRecord.failure);
    }

    return null;
};

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

interface HeaderIconButtonProps
{
    readonly Color: string;
    readonly Disabled: boolean;
    readonly Icon: LucideIcon;
    readonly Label: string;
    readonly OnPress: Thunk;
}

/** Shows the discard prompt shared by header navigation actions. */
const ShowDiscardConfirmation = (
    OnDiscard: () => void,
    T: TFunction<readonly [ "pageCreation", "errors" ], undefined>
): void =>
{
    Alert.alert(
        T("createPage.discard.title"),
        T("createPage.discard.message"),
        [
            {
                style: "cancel",
                text: T("createPage.discard.keepEditing")
            },
            {
                onPress: OnDiscard,
                style: "destructive",
                text: T("createPage.discard.discard")
            }
        ]
    );
};

/**
 * Accessible native-stack header action — the current database's settings, and
 * (dev-only) populating the form.
 */
const HeaderIconButton = ({
    Color,
    Disabled,
    Icon,
    Label,
    OnPress
}: HeaderIconButtonProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
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
                Styles.HeaderIconButton,
                Disabled && Styles.HeaderIconButtonDisabled,
                pressed && Styles.HeaderIconButtonPressed
            ] }>
            <Icon
                color={ Color }
                size={ 20 }
                strokeWidth={ 2 }
            />
        </Pressable>
    );
};

/**
 * Displays the selected database identity in the native stack header. The
 * native-stack header clips a custom `headerTitle` to its measured box, so
 * the icon can't be pulled out via absolute positioning without disappearing
 * — instead, a same-sized invisible spacer mirrors the icon on the far side
 * of the title text. That keeps the icon in normal flow (visible) while
 * making the text the exact midpoint of the row, so centering the whole row
 * centers the text rather than the icon+text pair.
 */
const DatabaseHeaderTitle = ({
    Source,
    Title
}: DatabaseHeaderTitleProps): React.JSX.Element =>
{
    const Styles = useStyles();
    const HasIcon = Source !== null && Boolean(Source.Icon);

    return (
        <View style={ Styles.NavigationTitle }>
            { HasIcon && (
                <View style={ Styles.NavigationIconSlot }>
                    <DatabaseIcon Source={ Source } />
                </View>
            ) }
            <NavigationTitle
                NumberOfLines={ 1 }
                Style={ Styles.NavigationTitleText }>
                { Title }
            </NavigationTitle>
            { HasIcon && (
                <View
                    accessible={ false }
                    pointerEvents="none"
                    style={ Styles.NavigationIconSlot }
                />
            ) }
        </View>
    );
};

const SupportsInput = (Property: Domain.Property.PropertyDefinition): boolean =>
    Domain.Destination.IsQuickEntryProperty(Property);

const IsDateValue = (Value: FieldValue | undefined): Value is Domain.Property.DatePropertyInput =>
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
    const Styles = useStyles();
    const { t } = useTranslation("pageCreation");
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
                Placeholder={ t("propertyFields.empty") }
                Style={ Styles.InlineInput }
                Value={ StringValue }
                Variant="Flat"
            />
        );
    }

    return (
        <View style={ Styles.PropertyRow }>
            <View style={ Styles.PropertyLabel }>
                <PropertyLabel
                    Muted
                    Property={ Property }
                />
            </View>
            <View style={ Styles.PropertyValue }>
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
    const Styles = useStyles();
    const { HasProAccess, Refresh: RefreshSubscription } = useSubscription();
    const { t } = useTranslation([ "pageCreation", "errors" ]);
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
    const TemplatePickerSheetRef = useRef<BottomSheet>(null);
    const Insets = useSafeAreaInsets();
    const AllowNavigation = useRef(false);
    const OperationId = useRef(randomUUID() as Domain.Id.OperationId);
    const IsDirty = PageBody.trim() !== ""
        || Object.values(Values).some((Value: FieldValue) =>
            Value === true
            || (typeof Value === "string" && Value.trim() !== "")
            || IsDateValue(Value)
            || (Array.isArray(Value) && Value.length > 0));
    const DatabaseTitle = DataSource?.Title ?? Params.title ?? t("createPage.databaseFallback");
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

        if (!HasProAccess)
        {
            Alert.alert(
                t("createPage.databaseSettingsGate.title"),
                t("createPage.databaseSettingsGate.message"),
                [
                    { style: "cancel", text: t("createPage.proPrompt.notNow") },
                    { onPress: Router.push("/plans"), text: t("createPage.proPrompt.comparePlans") },
                    { onPress: Router.push("/subscribe"), text: t("createPage.proPrompt.upgrade") }
                ]
            );
            return;
        }

        if (IsDirty)
        {
            ShowDiscardConfirmation(NavigateToDatabaseSettings, t);
        }
        else
        {
            NavigateToDatabaseSettings();
        }
    }, [ DataSource, HasProAccess, IsDirty, NavigateToDatabaseSettings, Router, t ]);
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
        }, t);
    }), [ IsDirty, Navigation, Router, t ]);

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

                    /* The form is guaranteed empty on first load, so the
                     * default template's own values can populate it outright
                     * — no collision to reconcile against (unlike the header
                     * switcher, which may run against an already-edited
                     * form). */
                    const SelectedTemplate = Form.Template;

                    if (SelectedTemplate.Type === "Specific")
                    {
                        const DefaultTemplate = Source.Templates.find(
                            (Entry: Domain.DataSource.CachedDataSourceTemplate) =>
                                Entry.TemplateId === SelectedTemplate.TemplateId);

                        if (DefaultTemplate)
                        {
                            const Assignments = ResolveTemplateFieldValues(DefaultTemplate);

                            if (Assignments.length > 0)
                            {
                                SetValues((Current: Readonly<Record<string, FieldValue>>) =>
                                {
                                    const Next = { ...Current };

                                    for (const Assignment of Assignments)
                                    {
                                        Next[Assignment.PropertyId] = Assignment.Value;
                                    }

                                    return Next;
                                });
                            }
                        }
                    }
                }
            }
            catch (Error: unknown)
            {
                if (Active)
                {
                    SetErrorMessage(t("createPage.errors.loadFailed"));
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
    }, [ DataSourceId, t ]);

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
    const VisibleTemplates = useMemo(() =>
    {
        if (DataSource === null || Destination === null)
        {
            return [ ];
        }

        const TemplateConfiguration = Domain.Destination.ResolveTemplateConfiguration(Destination);
        const TemplateById = new Map(DataSource.Templates.map(
            (Entry: Domain.DataSource.CachedDataSourceTemplate) => [ Entry.TemplateId, Entry ] as const));

        return TemplateConfiguration.TemplateOrder
            .filter((TemplateId: Domain.Id.NotionTemplateId) =>
                !TemplateConfiguration.Hidden.includes(TemplateId) && TemplateById.has(TemplateId))
            .map((TemplateId: Domain.Id.NotionTemplateId) => TemplateById.get(TemplateId)!);
    }, [ DataSource, Destination ]);
    const SelectedTemplate = Destination?.Template;
    const HasSwitchableTemplate = VisibleTemplates.some(
        (Entry: Domain.DataSource.CachedDataSourceTemplate) =>
            !(SelectedTemplate?.Type === "Specific" && SelectedTemplate.TemplateId === Entry.TemplateId));
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

    const OpenTemplateSwitcher = useCallback((): void =>
    {
        TemplatePickerSheetRef.current?.present();
    }, [ ]);

    /**
     * Applies a template's own property values to the current form for this
     * page only — never persisted as the destination's default (that's a
     * `destination-config.tsx` action). When the template has a value for a
     * property the user already filled in, asks whether to keep the current
     * entry or overwrite it with the template's.
     */
    const HandleTemplateSelect = useCallback((Selected: Domain.Destination.DestinationTemplate): void =>
    {
        if (Selected.Type !== "Specific")
        {
            return;
        }

        const SelectedTemplateId = Selected.TemplateId;
        const Template = VisibleTemplates.find(
            (Entry: Domain.DataSource.CachedDataSourceTemplate) => Entry.TemplateId === SelectedTemplateId);

        if (!Template)
        {
            return;
        }

        const Assignments = ResolveTemplateFieldValues(Template);
        const Apply = (SkipCollisions: boolean): void =>
        {
            for (const Assignment of Assignments)
            {
                if (SkipCollisions && !IsFieldEmpty(Values[Assignment.PropertyId]))
                {
                    continue;
                }

                SetFieldValue(Assignment.PropertyId, Assignment.Value);
            }
        };
        const Collisions = Assignments.filter((Assignment: TemplateFieldAssignment) =>
            !IsFieldEmpty(Values[Assignment.PropertyId]));

        if (Collisions.length === 0)
        {
            Apply(false);

            return;
        }

        Alert.alert(
            t("createPage.template.applyTitle", { name: Template.Name }),
            t("createPage.template.applyMessage"),
            [
                { style: "cancel", text: t("createPage.template.cancel") },
                { onPress: () => Apply(true), text: t("createPage.template.keepMine") },
                { onPress: () => Apply(false), style: "destructive", text: t("createPage.template.overwrite") }
            ]
        );
    }, [ SetFieldValue, t, Values, VisibleTemplates ]);

    /**
     * Dev-only: fills every empty property (including the title, via its own
     * `Type: "Title"` property definition) with type-appropriate dummy data,
     * and the page body if it's empty too. Never touches a property that
     * already has a value, or the icon/cover. Wired to the "Populate form"
     * header button below, which only renders when `__DEV__`.
     */
    const FillDummyData = useCallback(async (): Promise<void> =>
    {
        if (DataSource === null)
        {
            return;
        }

        const NeedsStockPhoto = DataSource.Properties.some((
            Property: Domain.Property.PropertyDefinition
        ) => Property.Type === "Files" && IsFieldEmpty(Values[Property.Id]));
        const StockPhoto = NeedsStockPhoto ? await GetStockPhotoFileValue() : undefined;

        for (const Property of DataSource.Properties)
        {
            if (!IsFieldEmpty(Values[Property.Id]))
            {
                continue;
            }

            const DummyValue = GenerateDummyValue(Property, StockPhoto);

            if (DummyValue !== undefined)
            {
                SetFieldValue(Property.Id, DummyValue);
            }
        }

        if (PageBody.trim() === "")
        {
            SetPageBody(GenerateLoremIpsumParagraph(3));
        }
    }, [ DataSource, PageBody, SetFieldValue, Values ]);

    const RenderHeaderRight = useCallback(() => (
        <View style={ Styles.HeaderRight }>
            { __DEV__
                ? (
                    <HeaderIconButton
                        Color={ Theme.Semantic.IconPrimary }
                        Disabled={ DataSource === null || IsSaving }
                        Icon={ Wand2 }
                        Label={ t("createPage.populateDummyData") }
                        OnPress={ () => void FillDummyData() }
                    />
                )
                : null }
            {
                HasProAccess && HasSwitchableTemplate
                    ? (
                        <HeaderIconButton
                            Color={ Theme.Semantic.IconPrimary }
                            Disabled={ DataSource === null }
                            Icon={ LayoutTemplate }
                            Label={ t("createPage.useTemplate") }
                            OnPress={ OpenTemplateSwitcher }
                        />
                    )
                    : null
            }
            <HeaderIconButton
                Color={ Theme.Semantic.IconPrimary }
                Disabled={ DataSource === null }
                Icon={ Settings }
                Label={ t("createPage.settingsFor", { database: DatabaseTitle }) }
                OnPress={ OpenDatabaseSettings }
            />
        </View>
    ), [
        DataSource,
        DatabaseTitle,
        FillDummyData,
        HasProAccess,
        HasSwitchableTemplate,
        IsSaving,
        OpenDatabaseSettings,
        OpenTemplateSwitcher,
        Styles.HeaderRight,
        t,
        Theme.Semantic.IconPrimary
    ]);

    const ShowProPrompt = useCallback((Benefit: string): void =>
    {
        Alert.alert(
            t("createPage.proPrompt.title"),
            Benefit,
            [
                { style: "cancel", text: t("createPage.proPrompt.notNow") },
                { onPress: Router.push("/plans"), text: t("createPage.proPrompt.comparePlans") },
                { onPress: Router.push("/subscribe"), text: t("createPage.proPrompt.upgrade") }
            ]
        );
    }, [ Router, t ]);

    const OpenIconMenu = useCallback((): void =>
    {
        if (!HasProAccess)
        {
            ShowProPrompt(t("createPage.proPrompt.iconBenefit"));
            return;
        }

        IconMenuRef.current?.present();
    }, [ HasProAccess, ShowProPrompt, t ]);

    /**
     * Attaching an icon seeds a default document glyph so a value is set (the
     * "Add icon" button then hides), and opens the picker to change it.
     */
    const AddIcon = useCallback((): void =>
    {
        if (!HasProAccess)
        {
            ShowProPrompt(t("createPage.proPrompt.iconBenefit"));
            return;
        }

        SetPageIcon({ Src: "📄", Type: "Emoji" });
        IconMenuRef.current?.present();
    }, [ HasProAccess, ShowProPrompt, t ]);

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
        if (!HasProAccess)
        {
            ShowProPrompt(t("createPage.proPrompt.coverBenefit"));
            return;
        }

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
    }, [ HasProAccess, ShowProPrompt, t ]);

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
            else if (Property.Type === "Files" && IsFileMediaValue(Value))
            {
                if (Value.Type === "Link")
                {
                    Inputs.push({
                        PropertyId: Property.Id,
                        Value: {
                            Type: "Files",
                            Value: {
                                Name: Value.Name ?? FileNameFromUri(Value.Uri, "attachment"),
                                Type: "External",
                                Url: Value.Uri
                            }
                        }
                    });
                }
                else
                {
                    Inputs.push({
                        PropertyId: Property.Id,
                        Value: {
                            Type: "Files",
                            Value: {
                                Base64: await new File(Value.Uri).base64(),
                                ...(Value.MimeType === undefined ? { } : { MimeType: Value.MimeType }),
                                Name: Value.Name ?? FileNameFromUri(Value.Uri, "attachment"),
                                Type: "Upload"
                            }
                        }
                    });
                }
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
            SetErrorMessage(t("createPage.errors.titleRequired"));

            return;
        }

        SetErrorMessage(null);
        SetIsSaving(true);

        try
        {
            const Cover: Domain.Command.PageCoverInput | undefined = CoverUrl === undefined
                ? undefined
                : {
                    Base64: await new File(CoverUrl).base64(),
                    MimeType: "image/jpeg",
                    Name: FileNameFromUri(CoverUrl, "cover.jpg"),
                    Type: "Upload"
                };
            const Icon: Domain.Command.PageIconInput | undefined = PageIcon?.Type === "Emoji"
                ? { Emoji: PageIcon.Src, Type: "Emoji" }
                : PageIcon?.Type === "Url"
                    ? {
                        Base64: await new File(PageIcon.Src).base64(),
                        MimeType: "image/png",
                        Name: FileNameFromUri(PageIcon.Src, "icon.png"),
                        Type: "Upload"
                    }
                    : undefined;

            await CreatePage({
                ...(Body === undefined ? { } : { Body }),
                ...(Cover === undefined ? { } : { Cover }),
                DestinationId: Destination.Id,
                ...(Icon === undefined ? { } : { Icon }),
                OperationId: OperationId.current,
                Title,
                Values: Inputs
            });
            void RefreshSubscription();
            AllowNavigation.current = true;

            const AfterCreate = Domain.Destination.ResolvePostCreationBehavior(Destination);

            if (AfterCreate.Type === "SelectedDatabase")
            {
                Router.replace({
                    params: { dataSourceId: AfterCreate.DataSourceId },
                    pathname: "/create-page"
                })();
            }
            else if (AfterCreate.Type === "CloseApp" && Platform.OS === "android")
            {
                BackHandler.exitApp();
            }
            else
            {
                Router.replace("/")();
            }
        }
        catch (Error: unknown)
        {
            const Tagged = FindTaggedError(Error);

            if (Tagged?._tag === "FreeCreationWindowExceeded")
            {
                const Next = Tagged.NextAvailableAt instanceof Date
                    ? Tagged.NextAvailableAt
                    : new Date(`${ Tagged.NextAvailableAt }`);

                Alert.alert(
                    t("createPage.freeLimit.title"),
                    t("createPage.freeLimit.message", {
                        time: Next.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                        })
                    }),
                    [
                        { style: "cancel", text: t("createPage.freeLimit.keepEditing") },
                        { onPress: Router.push("/subscribe"), text: t("createPage.freeLimit.upgrade") }
                    ]
                );
                void RefreshSubscription();
                return;
            }

            if (Tagged?._tag === "DestinationNotFound")
            {
                SetErrorMessage(t("errors:destinationNotFound"));
            }
            else if (Tagged?._tag === "PageCreationInProgress")
            {
                SetErrorMessage(t("errors:pageCreationInProgress"));
            }
            else if (Tagged?._tag === "RateLimitExceeded")
            {
                SetErrorMessage(t("errors:rateLimitExceeded"));
            }
            else if (Tagged?._tag === "FreeDatabaseLimitReached")
            {
                SetErrorMessage(t("errors:freeDatabaseLimitReached", { limit: Tagged.Limit }));
            }
            else if (Tagged?._tag === "FeatureGateError")
            {
                SetErrorMessage(t("errors:featureGateError"));
            }
            else
            {
                SetErrorMessage(t("errors:generic"));
            }

            /* eslint-disable-next-line no-console */
            console.error("Failed to create page", Error);
        }
        finally
        {
            SetIsSaving(false);
        }
    }, [
        Destination,
        CoverUrl,
        IsSaving,
        PageBody,
        PageIcon,
        PageTitleText,
        RefreshSubscription,
        Router,
        t,
        Values,
        VisibleProperties
    ]);

    const HasIcon = PageIcon !== undefined;
    const HasCover = CoverUrl !== undefined;
    const BodyTopPadding = HasCover ? (HasIcon ? 0 : 12) : 24;

    const IconElement = PageIcon === undefined
        ? null
        : (
            <Pressable
                Accessibility={ { Label: t("createPage.changeIcon"), Role: "button" } }
                OnPress={ OpenIconMenu }
                style={ [ Styles.IconWrap, HasCover && Styles.IconOverlap ] }>
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
            Label={ t("createPage.addIcon") }
            OnPress={ AddIcon }
        />
    );
    const AddCoverButton = (
        <AddMediaButton
            Disabled={ IsSaving }
            Icon={ ImagePlus }
            Label={ t("createPage.addCover") }
            OnPress={ () => void PickCover() }
        />
    );

    let MediaHeader: React.JSX.Element | null;

    if (!HasCover && !HasIcon)
    {
        MediaHeader = (
            <View style={ Styles.AddRow }>
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
            style={ Styles.Container }>
            <Stack.Screen options={ {
                headerRight: RenderHeaderRight,
                headerShown: !HasCover,
                headerTitle: RenderHeaderTitle
            } } />
            <SafeAreaView
                edges={ [ "bottom", "left", "right" ] }
                style={ Styles.SafeArea }>
                { IsLoading
                    ? <ActivityIndicator
                        color={ Theme.Semantic.Cursor }
                        style={ Styles.Loading }
                    />
                    : DataSource === null || Destination === null
                        ? (
                            <View style={ Styles.MessageContainer }>
                                <Description>{ ErrorMessage }</Description>
                            </View>
                        )
                        : (
                            <ScrollView
                                contentContainerStyle={ Styles.Scroll }
                                keyboardShouldPersistTaps="handled">
                                { HasCover && (
                                    <Cover
                                        OnChangeCoverPress={ () => void PickCover() }
                                        OnRemovePress={ RemoveCover }
                                        Url={ CoverUrl }
                                    />
                                ) }
                                <View style={ [ Styles.Body, { paddingTop: BodyTopPadding } ] }>
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
                                                placeholder={ t("createPage.titlePlaceholder") }
                                                placeholderTextColor={ Theme.Semantic.Muted }
                                                scrollEnabled={ false }
                                                selectionColor={ Theme.Semantic.Cursor }
                                                style={ Styles.PageTitleInput }
                                                value={ PageTitleText }
                                            />
                                        ) }

                                    <View style={ Styles.Properties }>
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

                                    <Separator Style={ Styles.BodyDivider } />

                                    <Textarea
                                        AccessibilityLabel={ t("createPage.pageBody.accessibilityLabel") }
                                        Disabled={ IsSaving }
                                        MaxLength={ MaxPageBodyLength }
                                        NumberOfLines={ 8 }
                                        OnChangeText={ SetPageBody }
                                        Placeholder={ t("createPage.pageBody.placeholder") }
                                        Style={ Styles.PageBodyInput }
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
                                        Style={ Styles.Submit }>
                                        { t("createPage.submit") }
                                    </Button>
                                </View>
                            </ScrollView>
                        ) }
                { HasCover && (
                    <View
                        pointerEvents="box-none"
                        style={ [ Styles.CoverHeader, { paddingTop: Insets.top + 6 } ] }>
                        <Pressable
                            Accessibility={ { Label: t("createPage.goBack"), Role: "button" } }
                            OnPress={ GoBack }
                            hitSlop={ 8 }
                            style={ Styles.CoverHeaderButton }>
                            <ChevronLeft
                                color="#FFFFFF"
                                size={ 22 }
                                strokeWidth={ 2.25 }
                            />
                        </Pressable>
                        <Pressable
                            Accessibility={ {
                                Label: t("createPage.settingsFor", { database: DatabaseTitle }),
                                Role: "button",
                                State: { disabled: DataSource === null }
                            } }
                            Disabled={ DataSource === null }
                            OnPress={ OpenDatabaseSettings }
                            hitSlop={ 8 }
                            style={ [
                                Styles.CoverHeaderButton,
                                DataSource === null && Styles.CoverHeaderButtonDisabled
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
                { Destination === null
                    ? null
                    : (
                        <TemplatePickerSheet
                            CurrentTemplate={ Destination.Template }
                            OnSelect={ HandleTemplateSelect }
                            Ref={ TemplatePickerSheetRef }
                            Templates={ VisibleTemplates }
                        />
                    ) }
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const useStyles = MakeStyles({
    AddRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Token.Spacing.L
    }),
    Body: ViewStyle({
        gap: Token.Spacing.L,
        paddingHorizontal: Token.Spacing.Xl
    }),
    BodyDivider: ViewStyle({
        marginVertical: Token.Spacing.L
    }),
    Container: ViewStyle({
        flex: 1
    }),
    CoverHeader: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        left: 0,
        paddingHorizontal: Token.Spacing.M,
        position: "absolute",
        right: 0,
        top: 0
    }),
    CoverHeaderButton: ViewStyle({
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        width: 36
    }),
    CoverHeaderButtonDisabled: ViewStyle({
        opacity: 0.35
    }),
    HeaderIconButton: ViewStyle({
        alignItems: "center",
        borderRadius: 18,
        height: 36,
        justifyContent: "center",
        width: 36
    }),
    HeaderIconButtonDisabled: ViewStyle({
        opacity: 0.35
    }),
    HeaderIconButtonPressed: ViewStyle({
        opacity: 0.55
    }),
    HeaderRight: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 4
    }),
    IconOverlap: ViewStyle({
        marginTop: -39
    }),
    IconWrap: ViewStyle({
        alignSelf: "flex-start",
        marginBottom: Token.Spacing.S
    }),
    InlineInput: ViewStyle({
        height: 32,
        paddingHorizontal: 0
    }),
    Loading: ViewStyle({
        flex: 1
    }),
    MessageContainer: ViewStyle({
        flex: 1,
        padding: Token.Spacing.Xl
    }),
    NavigationIconSlot: ViewStyle({
        alignItems: "center",
        height: 24,
        justifyContent: "center",
        width: 24
    }),
    NavigationTitle: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.S,
        maxWidth: 260
    }),
    NavigationTitleText: TextStyle({
        flexShrink: 1
    }),
    PageBodyInput: TextStyle({
        backgroundColor: "transparent",
        borderWidth: 0,
        fontSize: 16,
        lineHeight: 24,
        minHeight: 192,
        paddingHorizontal: 0,
        paddingVertical: 0
    }),
    PageTitleInput: TextStyle({
        color: Token.Semantic.Primary,
        fontSize: 34,
        fontWeight: "700",
        letterSpacing: -0.6,
        lineHeight: 42,
        marginBottom: 22,
        minHeight: 48,
        padding: 0,
        textAlignVertical: "top"
    }),
    Properties: ViewStyle({
        gap: 2
    }),
    PropertyLabel: ViewStyle({
        flexBasis: "38%",
        flexGrow: 0,
        flexShrink: 0,
        maxWidth: 128
    }),
    PropertyRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.M,
        minHeight: 40
    }),
    PropertyValue: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    SafeArea: ViewStyle({
        flex: 1
    }),
    Scroll: ViewStyle({
        flexGrow: 1,
        paddingBottom: 40
    }),
    Submit: ViewStyle({
        marginTop: 28
    })
});

export default PageCreateScreen;
