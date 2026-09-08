/**
 * Pure, side-effect-free views for every user-visible onboarding state. Route
 * modules supply navigation and live service callbacks; Storybook and the
 * development scenario runner can supply deterministic callbacks instead.
 *
 * @module noteferry/features/onboarding/onboarding-views
 *
 * @file      onboarding-views.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import type * as Domain from "@noteferry/domain";
import * as MailComposer from "expo-mail-composer";
import * as React from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    View
} from "react-native";
import { AuthButton, Button } from "@noteferry/ui/Primitive/Button";
import { Body, Caption, Description, Heading1, HeroTitle, ItemTitle, ScreenTitle } from "@noteferry/ui/Primitive/Text";
import { BottomSheet, BottomSheetView } from "@noteferry/ui/Primitive/BottomSheet";
import { Checkbox } from "@noteferry/ui/Primitive/Checkbox";
import { Input } from "@noteferry/ui/Primitive/Input";
import { Link } from "@noteferry/ui/Primitive/Link";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronUp from "lucide-react-native/icons/chevron-up";
import { HeroImage, ResourceIcon } from "@/Component";
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@noteferry/ui/Core";
import * as Boolean from "effect/Boolean";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility";
import type { NotionSyncStatus } from "@/features/onboarding/use-notion-sync";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Thunk } from "@sorrell/effect/Function";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

/** Props shared by views with a single primary action. */
export interface OnboardingActionProps
{
    readonly OnContinue: Thunk;
}

/** Props for views whose primary action can be pending. */
export interface PendingOnboardingActionProps
{
    readonly IsPending: boolean;
}

/** Props for retryable sync states. */
export interface RetryableOnboardingActionProps
{
    readonly OnRetry: Thunk;
}

/** Props for the welcome/sign-in screen. */
export interface SignInViewProps
{
    readonly OnContinue: Thunk;
}

export/**
       * Renders the welcome screen without owning navigation or authentication.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SignInView = ({ OnContinue }: SignInViewProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useSignInStyles();
    const { t } = useTranslation("onboarding");

    const HandleNeedHelp = React.useCallback(async () =>
    {
        const IsAvailable = await MailComposer.isAvailableAsync();

        if (!IsAvailable)
        {
            Alert.alert(
                t("signIn.mail.unavailableTitle"),
                t("signIn.mail.unavailableMessage")
            );

            return;
        }

        const body = Application.nativeApplicationVersion !== null && Application.nativeBuildVersion !== null
            ? t("signIn.mail.body", {
                build: Application.nativeBuildVersion,
                version: Application.nativeApplicationVersion
            })
            : undefined;

        await MailComposer.composeAsync({
            body,
            recipients: [ "gage@sorrell.sh" ],
            subject: t("signIn.mail.subject")
        });
    }, [ t ]);

    return (
        <OnboardingScreen
            Header={
                <View style={ [ Styles.Header, { paddingTop: 64 } ] }>
                    <Image
                        source={ Theme.Mode === "Dark"
                            ? require("../../../Resource/Logo/NoteFerryLogoDark.png")
                            : require("../../../Resource/Logo/NoteFerryLogoLight.png") }
                        style={ { height: 44, marginBottom: 16, width: 44 } }
                    />
                    <HeroTitle Style={ Styles.HeaderText }>
                        { t("signIn.heroTitle") }
                    </HeroTitle>
                    <HeroTitle
                        Color="#9D9A99"
                        Style={ [ Styles.HeaderText, { fontFamily: "Roboto Flex", fontWeight: "bold" } ] }
                        Weight="600">
                        { t("signIn.heroSubtitle") }
                    </HeroTitle>
                </View>
            }
            Hero={ undefined }
            Subtitle={ t("signIn.heroSubtitle") }
            Title={ t("signIn.heroTitle") }>
            <View style={ Styles.BottomContent }>
                <Button
                    Appearance="Blue"
                    OnPress={ OnContinue }
                    Style={ Styles.Cta }>
                    <Body Style={ { color: "#FFFFFF", fontSize: 14 } }>
                        { t("signIn.getStarted") }
                    </Body>
                </Button>
                <Description Style={ Styles.AffiliationDisclaimer }>
                    { t("signIn.notionAffiliationDisclaimer") }{" "}
                    { t("signIn.noAccount") }{"  "}
                    <Link
                        Appearance="Subtle"
                        Href="https://app.notion.com/signup"
                        Style={ { fontSize: 14, textDecorationLine: "underline" } }>
                        { t("signIn.signUp") }
                    </Link>
                </Description>
                <View style={ Styles.Footer }>
                    <Caption Style={ Styles.LegalCopy }>
                        { t("signIn.legal.line1") }{"\n"}
                        { t("signIn.legal.line2") }{" "}
                        <Link
                            Href="https://noteferry.sorrell.sh/terms"
                            Style={ Styles.CaptionLink }>
                            { t("signIn.legal.terms") }
                        </Link>
                        {" "}{ t("signIn.legal.and") }{" "}
                        <Link
                            Href="https://noteferry.sorrell.sh/privacy"
                            Style={ Styles.CaptionLink }>
                            { t("signIn.legal.privacy") }
                        </Link>
                    </Caption>
                    <View style={ Styles.FooterLinks }>
                        <Link
                            Href="https://noteferry.sorrell.sh"
                            Style={ Styles.FooterLink }>{ t("signIn.learnMore") }</Link>
                        <Link
                            OnPress={ HandleNeedHelp }
                            Style={ Styles.FooterLink }>{ t("signIn.needHelp") }</Link>
                    </View>
                    <Description Style={ Styles.Copyright }>
                        { t("signIn.copyright") }
                    </Description>
                </View>
            </View>
        </OnboardingScreen>
    );
};

/** Props for the sign-in explanation modal. */
export interface SignInModalViewProps extends PendingOnboardingActionProps
{
    readonly OnSignIn: Thunk;
}

export/**
       * Renders the sign-in explanation modal before the user authenticates.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SignInModalView = ({
    OnSignIn,
    IsPending: Pending
}: SignInModalViewProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useModalStyles();
    const TipColor = Theme.Semantic.Secondary;
    const { t } = useTranslation("onboarding");

    return (
        <View style={ Styles.Container }>
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <BottomSheetView style={ Styles.Content }>
                    <Heading1>
                        { t("titles.signInModal") }
                    </Heading1>
                    <Body>
                        { t("signInModal.message") }
                    </Body>
                    <Body Style={ { color: TipColor, textAlign: "center" } }>
                        { t("signInModal.tip") }
                    </Body>
                    <AuthButton
                        Icon={
                            <Image
                                source={ require("../../../Resource/Onboarding/NotionLogoLight.svg") }
                                style={ Styles.AuthIcon }
                            />
                        }
                        Loading={ Pending }
                        OnPress={ OnSignIn }
                        Style={ Styles.FullWidthCta }>
                        { t("signIn.continueWithNotion") }
                    </AuthButton>
                    <Link
                        Appearance="Subtle"
                        Href={ NotionConnectionsHelpUrl }
                        Style={ Styles.LearnMoreLink }>
                        { t("signInModal.learnMore") }
                    </Link>
                </BottomSheetView>
            </SafeAreaView>
        </View>
    );
};

export/**
       * Official Notion guidance linked from every access-recovery outcome.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const NotionConnectionsHelpUrl =
    "https://www.notion.com/help/add-and-manage-connections-with-the-api";

/** Props for the exhaustive post-authorization outcomes. */
export interface SyncViewProps
{
    readonly Data: Domain.DataSource.OnboardingDiscovery | null;
    readonly IsPending: boolean;
    readonly OnAuthorize: Thunk;
    readonly OnContinue: (
        Databases: ReadonlyArray<Domain.DataSource.OnboardingDatabase>
    ) => void;
    readonly OnRetry: Thunk;
    readonly OnStartOver: Thunk;
    readonly ShowLoading: boolean;
    readonly Status: NotionSyncStatus;
}

/** Expandable summary of the regular pages visible to NoteFerry. */
const PageAccessDisclosure = ({
    PageCount,
    Pages
}: {
    readonly PageCount: number;
    readonly Pages: ReadonlyArray<Domain.DataSource.OnboardingPage>;
}): React.JSX.Element =>
{
    const [ IsExpanded, SetIsExpanded ] = React.useState(false);
    const HelpSheet = React.useRef<BottomSheetModal | null>(null);
    const Theme = useTheme();
    const Styles = useOnboardingResultStyles();
    const OnboardingStyles = useOnboardingStyles();
    const NumRemaining = Math.max(0, PageCount - Pages.length);
    const { t } = useTranslation("onboarding");

    return (
        <View style={ Styles.DisclosureSection }>
            <View style={ Styles.DisclosureHeader }>
                <Pressable
                    Accessibility={ {
                        Label: undefined,
                        Role: "button",
                        State: { expanded: IsExpanded }
                    } }
                    OnPress={ () => SetIsExpanded(Boolean.not) }
                    style={ Styles.DisclosureTrigger }>
                    <View style={ { alignItems: "center", flexDirection: "row", gap: 8 } }>
                        <Body Weight="600">
                            { t("sync.pageAccessDisclosure.pagesFound", { count: PageCount }) }
                        </Body>
                        <Pressable
                            Accessibility={ {
                                Label: t("sync.pageAccessDisclosure.whyShown"),
                                Role: "button"
                            } }
                            OnPress={ () => HelpSheet.current?.present() }
                            hitSlop={ 8 }
                            style={ Styles.HelpButton }>
                            <Description Weight="600">{ t("sync.pageAccessDisclosure.helpGlyph") }</Description>
                        </Pressable>
                    </View>
                    <View
                        accessible={ false }
                        style={ Styles.DisclosureChevron }>
                        { IsExpanded
                            ? <ChevronUp
                                color={ Theme.Semantic.Muted }
                                size={ 20 }
                            />
                            : <ChevronDown
                                color={ Theme.Semantic.Muted }
                                size={ 20 }
                            /> }
                    </View>
                </Pressable>
            </View>

            { IsExpanded
                ? (
                    <View style={ Styles.PageList }>
                        { Pages.length === 0
                            ? (
                                <Description Color={ Token.Semantic.Muted }>
                                    { t("sync.pageAccessDisclosure.noPages") }
                                </Description>
                            )
                            : Pages.slice(0, 25).map((
                                Page: Domain.DataSource.OnboardingPage
                            ) => (
                                <View
                                    key={ Page.Id }
                                    style={ Styles.PageRow }>
                                    <ResourceIcon Resource={ Page } />
                                    <Description
                                        NumberOfLines={ 2 }
                                        Style={ Styles.PageTitle }>
                                        { Page.Title }
                                    </Description>
                                </View>
                            )) }
                        { NumRemaining > 0
                            ? (
                                <Description Color={ Token.Semantic.Muted }>
                                    { t("sync.pageAccessDisclosure.andMore", { count: NumRemaining }) }
                                </Description>
                            )
                            : null }
                    </View>
                )
                : null }

            <BottomSheet Ref={ HelpSheet }>
                <BottomSheetView style={ Styles.HelpSheet }>
                    <View style={ Styles.HelpSheetHeader }>
                        <ScreenTitle>{ t("sync.pageAccessDisclosure.sheetTitle") }</ScreenTitle>
                        <Description Color={ Token.Semantic.Muted }>
                            { t("sync.pageAccessDisclosure.sheetBody") }
                        </Description>
                    </View>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => HelpSheet.current?.dismiss() }
                        Style={ OnboardingStyles.Cta }>
                        { t("sync.pageAccessDisclosure.gotIt") }
                    </Button>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
};

interface AccessOutcomeLayoutProps extends React.PropsWithChildren
{
    readonly Subtitle: string;
    readonly Title: string;
    readonly HeroImageAsset?: ImageAsset | undefined;
}

/** Shared scrollable hero layout for post-authorization recovery outcomes. */
const AccessOutcomeLayout = ({
    HeroImageAsset,
    Title,
    Subtitle,
    children
}: AccessOutcomeLayoutProps): React.JSX.Element =>
{
    const Styles = useOnboardingResultStyles();

    return (
        <SafeAreaView style={ Styles.SafeArea }>
            <ScrollView
                contentContainerStyle={ Styles.OutcomeContent }
                showsVerticalScrollIndicator={ false }>
                <View style={ Styles.OutcomeHeader }>
                    <Heading1>{ Title }</Heading1>
                    <Description>{ Subtitle }</Description>
                </View>
                {
                    HeroImageAsset !== undefined &&
                    <HeroImage Source={ HeroImageAsset } />
                }
                <View style={ Styles.OutcomeActions }>
                    { children }
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

/** Successful database-selection surface. */
const DatabaseSelectionView = ({
    Data,
    IsPending,
    OnContinue
}: {
    readonly Data: Domain.DataSource.OnboardingDiscovery;
    readonly IsPending: boolean;
    readonly OnContinue: (
        Databases: ReadonlyArray<Domain.DataSource.OnboardingDatabase>
    ) => void;
}): React.JSX.Element =>
{
    const [ Search, SetSearch ] = React.useState("");
    const Styles = useOnboardingResultStyles();
    const { t } = useTranslation("onboarding");
    const SortedDatabases: ReadonlyArray<Domain.DataSource.OnboardingDatabase> =
        React.useMemo(
            () => [ ...Data.Databases ]
                .sort((
                    Left: Domain.DataSource.OnboardingDatabase,
                    Right: Domain.DataSource.OnboardingDatabase
                ) =>
                {
                    const ByTitle = Left.Title.localeCompare(Right.Title, undefined, {
                        sensitivity: "base"
                    });

                    if (ByTitle !== 0)
                    {
                        return ByTitle;
                    }

                    const LeftCount = Left.HasMoreThan100Pages ? 101 : Left.PageCount;
                    const RightCount = Right.HasMoreThan100Pages ? 101 : Right.PageCount;

                    return RightCount - LeftCount;
                }),
            [ Data.Databases ]
        );
    const [ SelectedIds, SetSelectedIds ] = React.useState<ReadonlySet<string>>(
        () => new Set(SortedDatabases
            .slice(0, 3)
            .map((Database: Domain.DataSource.OnboardingDatabase) =>
                Database.DataSourceId))
    );
    const Databases: ReadonlyArray<Domain.DataSource.OnboardingDatabase> = React.useMemo(
        () => SortedDatabases.filter((Database: Domain.DataSource.OnboardingDatabase) =>
            Database.Title.toLocaleLowerCase().includes(
                Search.trim().toLocaleLowerCase()
            )),
        [ Search, SortedDatabases ]
    );
    const ToggleDatabase = React.useCallback((DataSourceId: string): void =>
    {
        SetSelectedIds((Current: ReadonlySet<string>) =>
        {
            const Next = new Set(Current);

            if (Next.has(DataSourceId))
            {
                Next.delete(DataSourceId);
            }
            else
            {
                if (Current.size >= 3)
                {
                    Alert.alert(
                        t("sync.databaseSelection.proGate.title"),
                        t("sync.databaseSelection.proGate.message"),
                        [
                            { style: "cancel", text: t("sync.databaseSelection.proGate.cancel") },
                            { onPress: () => router.push("/plans"), text: t("sync.databaseSelection.proGate.comparePlans") },
                            { onPress: () => router.push("/subscribe"), text: t("sync.databaseSelection.proGate.upgrade") }
                        ]
                    );
                    return Current;
                }

                Next.add(DataSourceId);
            }

            return Next;
        });
    }, [ t ]);
    const Continue = React.useCallback((): void =>
    {
        OnContinue(Data.Databases.filter((
            Database: Domain.DataSource.OnboardingDatabase
        ) =>
            SelectedIds.has(Database.DataSourceId)));
    }, [ Data.Databases, OnContinue, SelectedIds ]);

    return (
        <SafeAreaView style={ Styles.SafeArea }>
            <ScrollView
                contentContainerStyle={ Styles.SelectionContent }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={ false }>
                <View style={ Styles.OutcomeHeader }>
                    <Heading1>
                        { t("sync.databaseSelection.title") }
                    </Heading1>
                    <Description>
                        { t("sync.databaseSelection.subtitle") }
                    </Description>
                </View>

                { Data.DatabaseCount > 10
                    ? (
                        <Input
                            Clear
                            OnCancel={ () => SetSearch("") }
                            OnChangeText={ SetSearch }
                            Placeholder={ t("sync.databaseSelection.searchPlaceholder") }
                            Search
                            Size="Large"
                            Value={ Search }
                        />
                    )
                    : null }

                <View style={ Styles.DatabaseTableSection }>
                    <Description
                        Style={ [
                            Styles.SelectedDatabaseCount,
                            SelectedIds.size === 0 ? { opacity: 0 } : null
                        ] }
                        accessibilityElementsHidden={ SelectedIds.size === 0 }
                        importantForAccessibility={ SelectedIds.size === 0
                            ? "no-hide-descendants"
                            : "auto" }>
                        { t("sync.databaseSelection.selectedCount", { count: SelectedIds.size }) }
                    </Description>

                    <View
                        accessibilityRole="list"
                        style={ Styles.DatabaseTable }>
                        { Databases.map((
                            Database: Domain.DataSource.OnboardingDatabase,
                            Index: number
                        ) => (
                            <View
                                accessibilityRole="none"
                                key={ Database.DataSourceId }
                                style={ [
                                    Styles.DatabaseRow,
                                    Index < Databases.length - 1 && Styles.DatabaseRowDivider
                                ] }>
                                <Checkbox
                                    AccessibilityLabel={ t("sync.databaseSelection.selectDatabase", { title: Database.Title }) }
                                    Checked={ SelectedIds.has(Database.DataSourceId) }
                                    Disabled={ IsPending }
                                    OnCheckedChange={ () =>
                                        ToggleDatabase(Database.DataSourceId) }
                                />
                                <ResourceIcon Resource={ Database } />
                                <ItemTitle
                                    NumberOfLines={ 2 }
                                    Style={ Styles.DatabaseTitle }>
                                    { Database.Title }
                                </ItemTitle>
                                <Description
                                    Color={ Token.Semantic.Muted }
                                    Style={ Styles.DatabaseCount }>
                                    { Database.HasMoreThan100Pages
                                        ? t("sync.databaseSelection.moreThan100Pages")
                                        : t("sync.databaseSelection.pageCount", { count: Database.PageCount }) }
                                </Description>
                            </View>
                        )) }
                    </View>
                </View>

                { Databases.length === 0
                    ? (
                        <Description
                            Color={ Token.Semantic.Muted }
                            Style={ Styles.NoSearchResults }>
                            { t("sync.databaseSelection.noResults", { query: Search }) }
                        </Description>
                    )
                    : null }

                <PageAccessDisclosure
                    PageCount={ Data.PageCount }
                    Pages={ Data.Pages }
                />

                <Button
                    Appearance={ SelectedIds.size === 0 ? "Primary" : "Blue" }
                    Disabled={ IsPending || SelectedIds.size === 0 }
                    Loading={ IsPending }
                    OnPress={ Continue }>
                    { SelectedIds.size === 0
                        ? t("sync.databaseSelection.selectAtLeastOne")
                        : t("sync.databaseSelection.continueWith", { count: SelectedIds.size }) }
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

/** Loading state that avoids flashing for sub-second discovery responses. */
const DelayedSyncLoading = ({ Immediate }: { readonly Immediate: boolean }): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useOnboardingResultStyles();
    const [ IsVisible, SetIsVisible ] = React.useState(Immediate);
    const { t } = useTranslation("onboarding");

    React.useEffect(() =>
    {
        if (Immediate)
        {
            return undefined;
        }

        const Timer = setTimeout(
            () => SetIsVisible(true),
            1_000
        );

        return () => clearTimeout(Timer);
    }, [ Immediate ]);

    return IsVisible
        ? (
            <SafeAreaView style={ Styles.Loading }>
                <ActivityIndicator
                    accessibilityLabel={ t("sync.loading.accessibilityLabel") }
                    color={ Theme.Semantic.Cursor }
                />
                <Description Color={ Token.Semantic.Muted }>
                    { t("sync.loading.message") }
                </Description>
            </SafeAreaView>
        )
        : <View style={ Styles.Loading } />;
};

export/**
       * Renders one exhaustive post-authorization state without owning OAuth,
       * API, navigation, or authentication behavior.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SyncView = ({
    Data,
    IsPending,
    OnAuthorize,
    OnContinue,
    OnRetry,
    OnStartOver,
    ShowLoading,
    Status
}: SyncViewProps): React.JSX.Element =>
{
    const OnboardingStyles = useOnboardingStyles();
    const Styles = useOnboardingResultStyles();
    const { t } = useTranslation("onboarding");

    if (Status === "Syncing")
    {
        return <DelayedSyncLoading Immediate={ ShowLoading } />;
    }

    if (Status === "NoIntegration")
    {
        return (
            <AccessOutcomeLayout
                Subtitle={ t("sync.noIntegration.subtitle") }
                Title={ t("sync.noIntegration.title") }>
                <View style={ { flex: 1, gap: 24, justifyContent: "flex-end" } }>
                    <Button
                        Appearance="Primary"
                        Loading={ IsPending }
                        OnPress={ OnStartOver }
                        Style={ { alignSelf: "stretch" } }>
                        { t("sync.noIntegration.action") }
                    </Button>
                    <Link
                        Href={ NotionConnectionsHelpUrl }
                        Style={ Styles.HelpLink }>
                        { t("sync.helpLink") }
                    </Link>
                </View>
            </AccessOutcomeLayout>
        );
    }

    if (Status === "NoAccess")
    {
        return (
            <AccessOutcomeLayout
                Subtitle={ t("sync.noAccess.subtitle") }
                Title={ t("sync.noAccess.title") }>
                <Button
                    Appearance="Primary"
                    Loading={ IsPending }
                    OnPress={ OnAuthorize }
                    Style={ OnboardingStyles.Cta }>
                    { t("sync.noAccess.action") }
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ Styles.HelpLink }>
                    { t("sync.helpLink") }
                </Link>
            </AccessOutcomeLayout>
        );
    }

    if (Status === "PagesOnly" && Data)
    {
        return (
            <AccessOutcomeLayout
                HeroImageAsset={ require("../../../Resource/Onboarding/Empty.png") }
                Subtitle={ t("sync.pagesOnly.subtitle") }
                Title={ t("sync.pagesOnly.title") }>
                <PageAccessDisclosure
                    PageCount={ Data.PageCount }
                    Pages={ Data.Pages }
                />
                <Button
                    Appearance="Primary"
                    Loading={ IsPending }
                    OnPress={ OnAuthorize }
                    Style={ OnboardingStyles.Cta }>
                    { t("sync.pagesOnly.action") }
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ Styles.HelpLink }>
                    { t("sync.helpLink") }
                </Link>
            </AccessOutcomeLayout>
        );
    }

    if (Status === "Ready" && Data)
    {
        return (
            <DatabaseSelectionView
                { ...{ Data, IsPending, OnContinue } }
            />
        );
    }

    return (
        <AccessOutcomeLayout
            Subtitle={ t("sync.error.subtitle") }
            Title={ t("sync.error.title") }>
            <Button
                Appearance="Primary"
                Loading={ IsPending }
                OnPress={ OnRetry }
                Style={ OnboardingStyles.Cta }>
                { t("sync.error.action") }
            </Button>
        </AccessOutcomeLayout>
    );
};

/** Props for the notification preference onboarding screen. */
export interface EnableNotificationsViewProps extends PendingOnboardingActionProps
{
    readonly OnEnable: Thunk;
    readonly OnSkip: Thunk;
}

export/**
       * Offers the existing offline-submit notification preference before the
       * final onboarding screen. The hero is intentionally left empty until
       * its artwork is available.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const EnableNotificationsView = ({
    IsPending: Pending,
    OnEnable,
    OnSkip
}: EnableNotificationsViewProps): React.JSX.Element =>
{
    const Styles = useOnboardingStyles();
    const { t } = useTranslation("onboarding");

    return (
        <OnboardingScreen
            Hero={ require("../../../Resource/Onboarding/Notifications.png") }
            Subtitle={ t("enableNotifications.subtitle") }
            Title={ t("enableNotifications.title") }>
            <View style={ Styles.Spacer } />
            <Button
                Appearance="Blue"
                Loading={ Pending }
                OnPress={ OnEnable }
                Style={ { alignSelf: "stretch" } }>
                { t("enableNotifications.enable") }
            </Button>
            <Button
                Disabled={ Pending }
                OnPress={ OnSkip }
                Style={ { alignSelf: "stretch" } }>
                { t("enableNotifications.notNow") }
            </Button>
        </OnboardingScreen>
    );
};

/** Props for the final onboarding screen. */
export interface DoneViewProps extends PendingOnboardingActionProps
{
    readonly IsAddingWorkspace: boolean;
    readonly OnAddWorkspace: Thunk;
    readonly OnCustomize: Thunk;
    readonly OnStart: Thunk;
}

export/**
       * Renders the final onboarding screen and its pending state.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const DoneView = ({
    IsAddingWorkspace,
    IsPending: Pending,
    OnAddWorkspace,
    OnCustomize,
    OnStart
}: DoneViewProps): React.JSX.Element =>
{
    const Styles = useCustomizeFormsStyles();
    const AnyPending = Pending || IsAddingWorkspace;
    const { t } = useTranslation("onboarding");

    return (
        <SafeAreaView style={ Styles.SafeArea }>
            <View style={ Styles.Header }>
                <Heading1>
                    { t("done.title") }
                </Heading1>
                <HeroImage Source={ require("../../../Resource/Onboarding/Grant.png") } />
                <Description>
                    { t("done.description") }
                </Description>
            </View>
            <View style={ { flex: 1 } } />
            <View style={ Styles.CenterAction }>
                <Button
                    Disabled={ AnyPending }
                    OnPress={ OnCustomize }>
                    { t("done.viewDatabaseSettings") }
                </Button>
                <Button
                    Disabled={ AnyPending }
                    Loading={ IsAddingWorkspace }
                    OnPress={ OnAddWorkspace }>
                    { t("done.addWorkspace") }
                </Button>
                <Button
                    Appearance="Blue"
                    Disabled={ AnyPending }
                    Loading={ Pending }
                    OnPress={ OnStart }>
                    { t("done.start") }
                </Button>
            </View>
        </SafeAreaView>
    );
};

const useCustomizeFormsStyles = MakeStyles({
    CenterAction: ViewStyle({
        alignItems: "stretch",
        flex: 1,
        gap: 8,
        justifyContent: "center"
    }),
    Header: ViewStyle({
        gap: 24
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingBottom: 40,
        paddingHorizontal: 32,
        paddingTop: 24
    })
});

const useOnboardingResultStyles = MakeStyles({
    DatabaseCount: TextStyle({
        flexShrink: 0,
        fontSize: 12,
        textAlign: "right"
    }),
    DatabaseRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 56,
        paddingHorizontal: 12,
        paddingVertical: 9
    }),
    DatabaseRowDivider: ViewStyle({
        borderBottomColor: Token.Semantic.Border,
        borderBottomWidth: 1
    }),
    DatabaseTable: ViewStyle({
        borderColor: Token.Semantic.Border,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden"
    }),
    DatabaseTableSection: ViewStyle({
        gap: 8
    }),
    DatabaseTitle: TextStyle({
        flex: 1
    }),
    DisclosureChevron: ViewStyle({
        alignItems: "center",
        height: 24,
        justifyContent: "center",
        width: 24
    }),
    DisclosureHeader: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10
    }),
    DisclosureSection: ViewStyle({
        gap: 10
    }),
    DisclosureTrigger: ViewStyle({
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 44,
        paddingVertical: 8
    }),
    HelpButton: ViewStyle({
        alignItems: "center",
        borderColor: Token.Semantic.Border,
        borderRadius: 15,
        borderWidth: 1,
        height: 30,
        justifyContent: "center",
        width: 30
    }),
    HelpLink: TextStyle({
        alignSelf: "center",
        fontSize: 12,
        textAlign: "center"
    }),
    HelpSheet: ViewStyle({
        flex: 1,
        gap: 24,
        paddingBottom: 32,
        paddingHorizontal: 24,
        paddingTop: 16
    }),
    HelpSheetHeader: ViewStyle({
        gap: 12
    }),
    Loading: ViewStyle({
        alignItems: "center",
        flex: 1,
        gap: 16,
        justifyContent: "center",
        padding: 32
    }),
    NoSearchResults: TextStyle({
        paddingVertical: 12,
        textAlign: "center"
    }),
    OutcomeActions: ViewStyle({
        flex: 1,
        gap: 20
    }),
    OutcomeContent: ViewStyle({
        flexGrow: 1,
        gap: 24,
        paddingBottom: 40,
        paddingHorizontal: 32,
        paddingTop: 24
    }),
    OutcomeHeader: ViewStyle({
        gap: 8
    }),
    PageList: ViewStyle({
        borderLeftColor: Token.Semantic.Border,
        borderLeftWidth: 2,
        gap: 10,
        paddingLeft: 14,
        paddingVertical: 4
    }),
    PageRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 24
    }),
    PageTitle: TextStyle({
        flex: 1
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: 20
    }),
    SelectedDatabaseCount: TextStyle({
        minHeight: 20
    }),
    SelectionContent: ViewStyle({
        flexGrow: 1,
        gap: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
        paddingTop: 24
    })
});

const useOnboardingStyles = MakeStyles({
    Center: ViewStyle({
        alignItems: "center",
        marginTop: 24
    }),
    Cta: ViewStyle({
        alignSelf: "stretch",
        minHeight: Token.Size.Control.Large
    }),
    Note: TextStyle({
        textAlign: "center"
    }),
    Spacer: ViewStyle({
        flex: 1
    })
});

const useModalStyles = MakeStyles({
    AuthIcon: ImageStyle({
        height: 24,
        width: 24
    }),
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        flex: 1
    }),
    Content: ViewStyle({
        gap: 20,
        paddingBottom: 24,
        paddingHorizontal: 32,
        paddingTop: 8
    }),
    Cta: ViewStyle({
        flex: 1
    }),
    FullWidthCta: ViewStyle({
        width: "100%"
    }),
    Header: ViewStyle({
        gap: 8
    }),
    LearnMoreLink: TextStyle({
        alignSelf: "center",
        fontSize: 14,
        textDecorationLine: "underline"
    }),
    SafeArea: ViewStyle({
        flex: 1
    })
});

const useSignInStyles = MakeStyles({
    AffiliationDisclaimer: TextStyle({
        marginHorizontal: 24,
        marginTop: 12,
        textAlign: "center"
    }),
    AuthIcon: ImageStyle({
        height: 24,
        width: 24
    }),
    BottomContent: ViewStyle({
        alignSelf: "stretch",
        flex: 1,
        justifyContent: "flex-end"
    }),
    CaptionLink: TextStyle({
        fontSize: 12,
        lineHeight: 16
    }),
    Copyright: TextStyle({
        textAlign: "center"
    }),
    Cta: ViewStyle({
        marginBottom: 16,
        marginHorizontal: 18
    }),
    Footer: ViewStyle({
        alignItems: "center",
        gap: 16,
        marginTop: 16
    }),
    FooterLink: TextStyle({
        fontSize: 12,
        lineHeight: 16,
        textDecorationLine: "none"
    }),
    FooterLinks: ViewStyle({
        flexDirection: "row",
        gap: 20,
        justifyContent: "center"
    }),
    Header: ViewStyle({
        alignItems: "center",
        gap: 0
    }),
    HeaderText: TextStyle({
        textAlign: "center"
    }),
    LegalCopy: TextStyle({
        textAlign: "center"
    })
});
