/**
 * Pure, side-effect-free views for every user-visible onboarding state. Route
 * modules supply navigation and live service callbacks; Storybook and the
 * development scenario runner can supply deterministic callbacks instead.
 *
 * @module notivex/features/onboarding/onboarding-views
 *
 * @file      onboarding-views.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import * as React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import {
    AuthButton,
    Body,
    BottomSheet,
    BottomSheetView,
    Button,
    Caption,
    Checkbox,
    Description,
    Heading1,
    HeroTitle,
    Input,
    ItemTitle,
    Link,
    Pressable,
    ScreenTitle
} from "@notivex/ui/Primitive";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { IconBlock, type LucideIconName } from "@notivex/ui/Block";
import { Token, useTheme } from "@notivex/ui";
import { Boolean } from "effect";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HeroImage } from "@/Component";
import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility";
import type { NotionSyncStatus } from "@/features/onboarding/use-notion-sync";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { Semantic } from "@notivex/ui/Token";
import { SvgUri } from "react-native-svg";
import type { Thunk } from "@sorrell/effect/Function";

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
const SignInView = ({ OnContinue }: SignInViewProps): React.JSX.Element => (
    <OnboardingScreen
        Header={
            <View style={ signInStyles.header }>
                <Image
                    source={ require("../../../Resource/NotivexLogoLight.png") }
                    style={ { height: 52, marginBottom: 16, width: 52 } }
                />
                <HeroTitle Style={ signInStyles.headerText }>
                    Your notes, faster.
                </HeroTitle>
                <HeroTitle
                    Color={ Semantic.Muted }
                    Style={ [ signInStyles.headerText, { fontFamily: "Roboto", fontWeight: "bold" } ] }
                    Weight="600">
                    Log in with your Notion account
                </HeroTitle>
            </View>
        }
        // Hero={ require("../../../Resource/Onboarding/Welcome.png") }
        Subtitle="Log in with your Notion account"
        Title="Your notes, faster.">
        <View style={ signInStyles.spacer } />
        <AuthButton
            Icon={
                <Image
                    source={ require("../../../Resource/Onboarding/NotionLogoLight.svg") }
                    style={ signInStyles.authIcon }
                />
            }
            OnPress={ OnContinue }
            Style={ signInStyles.cta }>
            Continue with Notion
        </AuthButton>
        <View style={ signInStyles.footerSpacer } />
        <View style={ signInStyles.footer }>
            <View style={ { gap: 32 } }>
                <View style={ { flexDirection: "row", justifyContent: "center" } }>
                    <Description Style={ { fontSize: 14 } }>
                        Don’t have a Notion account?{"  "}
                    </Description>
                    <Link Style={ { fontSize: 14 } }>
                        Sign up
                    </Link>
                </View>
                <Caption Style={ signInStyles.legalCopy }>
                    By continuing, you acknowledge that you understand{"\n"}
                    and agree to the{" "}
                    <Link Style={ signInStyles.captionLink }>
                        Terms &amp; Conditions
                    </Link>
                    {" "}and{" "}
                    <Link Style={ signInStyles.captionLink }>
                        Privacy Policy
                    </Link>
                </Caption>
            </View>
            <View style={ signInStyles.footerDetails }>
                <View style={ signInStyles.footerLinks }>
                    <Link Style={ signInStyles.footerLink }>Privacy &amp; terms</Link>
                    <Link Style={ signInStyles.footerLink }>Need help?</Link>
                </View>
                <Description Style={ signInStyles.copyright }>
                    © 2026 Notivex.
                </Description>
            </View>
        </View>
    </OnboardingScreen>
);

/** Props for the first sign-in explanation modal. */
export interface SignInModalStepOneViewProps
{
    readonly OnContinue: Thunk;
}

export/**
       * Renders the first sign-in explanation modal.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SignInModalStepOneView = ({
    OnContinue
}: SignInModalStepOneViewProps): React.JSX.Element =>
{
    const ModalBackground = useTheme().Semantic.BackgroundModal;

    return (
        <View style={ [ modalStyles.container, { backgroundColor: ModalBackground } ] }>
            <SafeAreaView style={ modalStyles.safeArea }>
                <ScrollView
                    contentContainerStyle={ modalStyles.scroll }
                    showsVerticalScrollIndicator={ false }
                    style={ modalStyles.safeArea }>
                    <View style={ modalStyles.header }>
                        <ScreenTitle>What’s Ahead: Two Steps</ScreenTitle>
                    </View>
                    <HeroImage Source={ require("../../../Resource/Onboarding/SignInModalStepOne.png") } />
                    <Body>
                        First, you’ll sign into Notion and add the{" "}
                        Notivex integration to your workspace.
                    </Body>
                    <View style={ modalStyles.spacer } />
                    <Button
                        Appearance="Primary"
                        OnPress={ OnContinue }
                        Style={ modalStyles.cta }>
                        Got it
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

/** Props for the second sign-in explanation modal. */
export interface SignInModalStepTwoViewProps extends PendingOnboardingActionProps
{
    readonly OnBack: Thunk;
    readonly OnSignIn: Thunk;
}

export/**
       * Renders the second sign-in explanation modal and its pending state.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SignInModalStepTwoView = ({
    OnBack,
    OnSignIn,
    IsPending: Pending
}: SignInModalStepTwoViewProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const ModalBackground = Theme.Semantic.BackgroundModal;
    const TipColor = Theme.Semantic.Secondary;

    return (
        <View style={ [ modalStyles.container, { backgroundColor: ModalBackground } ] }>
            <SafeAreaView style={ modalStyles.safeArea }>
                <ScrollView
                    contentContainerStyle={ modalStyles.scroll }
                    showsVerticalScrollIndicator={ false }
                    style={ modalStyles.safeArea }>
                    <View style={ modalStyles.header }>
                        <ScreenTitle>What’s Ahead: Two Steps</ScreenTitle>
                    </View>
                    <HeroImage Source={ require("../../../Resource/Onboarding/SignInModalStepTwo.png") } />
                    <Body>
                        Then, you’ll choose which databases Notivex can see.
                    </Body>
                    <Body Style={ { color: TipColor, textAlign: "center" } }>
                        Tip: Giving Notivex access to a page also gives access to all{" "}
                        databases under that page.
                    </Body>
                    <View style={ modalStyles.spacer } />
                    <AuthButton
                        Icon={
                            <Image
                                source={ require("../../../Resource/Onboarding/NotionLogoLight.svg") }
                                style={ { height: 24, width: 24 } }
                            />
                        }
                        Loading={ Pending }
                        OnPress={ OnSignIn }
                        Style={ modalStyles.fullWidthCta }>
                        Log in
                    </AuthButton>
                    <View style={ { flexDirection: "row", justifyContent: "center" } }>
                        <Description Style={ { fontSize: 14 } }>
                            Not ready yet?{"  "}
                        </Description>
                        <Link
                            OnPress={ OnBack }
                            Style={ { fontSize: 14 } }>
                            Go back
                        </Link>
                    </View>
                </ScrollView>
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

/** Whether a Notion icon string can be rendered by `expo-image`. */
const IsImageUrl = (Value: string): boolean =>
    Value.startsWith("https://") || Value.startsWith("http://");

/** Whether a Notion image URL points to SVG artwork. */
const IsSvgUrl = (Value: string): boolean => /\.svg(?:$|[?#])/iu.test(Value);

/** Converts Notion's native icon names to the local Lucide key format. */
const ToLucideIconName = (Value: string): LucideIconName =>
    Value.trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-") as LucideIconName;

/** Renders one optional database icon using the same normalization as Home. */
const OnboardingDatabaseIcon = ({
    Database
}: {
    readonly Database: Domain.DataSource.OnboardingDatabase;
}): React.JSX.Element | null =>
{
    if (!Database.Icon)
    {
        return null;
    }

    if (Database.IconType === "Native")
    {
        return (
            <IconBlock
                Icon={ { Src: ToLucideIconName(Database.Icon), Type: "Lucide" } }
                Size="Small"
            />
        );
    }

    if (Database.IconType === "Image" || IsImageUrl(Database.Icon))
    {
        if (IsSvgUrl(Database.Icon))
        {
            return (
                <SvgUri
                    height={ 22 }
                    uri={ Database.Icon }
                    width={ 22 }
                />
            );
        }

        return (
            <Image
                accessibilityIgnoresInvertColors
                cachePolicy="memory-disk"
                contentFit="contain"
                source={ { uri: Database.Icon } }
                style={ onboardingResultStyles.databaseIcon }
            />
        );
    }

    return (
        <ItemTitle Style={ onboardingResultStyles.databaseEmoji }>
            { Database.Icon }
        </ItemTitle>
    );
};

/** Expandable summary of the regular pages visible to Notivex. */
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
    const NumRemaining = Math.max(0, PageCount - Pages.length);

    return (
        <View style={ onboardingResultStyles.disclosureSection }>
            <View style={ onboardingResultStyles.disclosureHeader }>
                <Pressable
                    Accessibility={ {
                        Label: undefined,
                        Role: "button",
                        State: { expanded: IsExpanded }
                    } }
                    OnPress={ () => SetIsExpanded(Boolean.not) }
                    style={ onboardingResultStyles.disclosureTrigger }>
                    <View style={ { alignItems: "center", flexDirection: "row", gap: 8 } }>
                        <Body Weight="600">
                            { PageCount } { PageCount === 1 ? "page" : "pages" } found
                        </Body>
                        <Pressable
                            Accessibility={ {
                                Label: "Why pages are shown",
                                Role: "button"
                            } }
                            OnPress={ () => HelpSheet.current?.present() }
                            hitSlop={ 8 }
                            style={ [
                                onboardingResultStyles.helpButton,
                                { borderColor: Theme.Semantic.Border }
                            ] }>
                            <Description Weight="600">?</Description>
                        </Pressable>
                    </View>
                    <View
                        accessible={ false }
                        style={ onboardingResultStyles.disclosureChevron }>
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
                    <View
                        style={ [
                            onboardingResultStyles.pageList,
                            { borderColor: Theme.Semantic.Border }
                        ] }>
                        { Pages.length === 0
                            ? (
                                <Description Color={ Token.Semantic.Muted }>
                                    No regular pages are visible.
                                </Description>
                            )
                            : Pages.slice(0, 25).map((
                                Page: Domain.DataSource.OnboardingPage
                            ) => (
                                <View
                                    key={ Page.Id }
                                    style={ onboardingResultStyles.pageRow }>
                                    <Description NumberOfLines={ 2 }>
                                        { Page.Title }
                                    </Description>
                                </View>
                            )) }
                        { NumRemaining > 0
                            ? (
                                <Description Color={ Token.Semantic.Muted }>
                                    and { NumRemaining } more
                                </Description>
                            )
                            : null }
                    </View>
                )
                : null }

            <BottomSheet Ref={ HelpSheet }>
                <BottomSheetView style={ onboardingResultStyles.helpSheet }>
                    <View style={ onboardingResultStyles.helpSheetHeader }>
                        <ScreenTitle>Pages and databases are different</ScreenTitle>
                        <Description Color={ Token.Semantic.Muted }>
                            Notivex creates entries in databases, not regular pages.
                            Sharing a page is still useful: any databases beneath that
                            page are shared with Notivex automatically, so you can add a
                            whole page tree in one step.
                        </Description>
                    </View>
                    <Button
                        Appearance="Primary"
                        OnPress={ () => HelpSheet.current?.dismiss() }
                        Style={ onboardingStyles.cta }>
                        Got it
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
}: AccessOutcomeLayoutProps): React.JSX.Element => (
    <SafeAreaView style={ onboardingResultStyles.safeArea }>
        <ScrollView
            contentContainerStyle={ onboardingResultStyles.outcomeContent }
            showsVerticalScrollIndicator={ false }>
            <View style={ onboardingResultStyles.outcomeHeader }>
                <Heading1>{ Title }</Heading1>
                <Description>{ Subtitle }</Description>
            </View>
            {
                HeroImageAsset !== undefined &&
                <HeroImage Source={ HeroImageAsset } />
            }
            <View style={ onboardingResultStyles.outcomeActions }>
                { children }
            </View>
        </ScrollView>
    </SafeAreaView>
);

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
    const Theme = useTheme();
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
            .slice(0, 10)
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
                Next.add(DataSourceId);
            }

            return Next;
        });
    }, [ ]);
    const Continue = React.useCallback((): void =>
    {
        OnContinue(Data.Databases.filter((
            Database: Domain.DataSource.OnboardingDatabase
        ) =>
            SelectedIds.has(Database.DataSourceId)));
    }, [ Data.Databases, OnContinue, SelectedIds ]);

    return (
        <SafeAreaView style={ onboardingResultStyles.safeArea }>
            <ScrollView
                contentContainerStyle={ onboardingResultStyles.selectionContent }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={ false }>
                <View style={ onboardingResultStyles.outcomeHeader }>
                    <Heading1>Choose your databases</Heading1>
                    <Description>
                        These are the databases that Notivex will display for creating pages.
                    </Description>
                </View>

                { Data.DatabaseCount > 10
                    ? (
                        <Input
                            Clear
                            OnCancel={ () => SetSearch("") }
                            OnChangeText={ SetSearch }
                            Placeholder="Search databases"
                            Search
                            Size="Large"
                            Value={ Search }
                        />
                    )
                    : null }

                <View style={ onboardingResultStyles.databaseTableSection }>
                    <Description
                        Style={ [
                            onboardingResultStyles.selectedDatabaseCount,
                            SelectedIds.size === 0 ? { opacity: 0 } : null
                        ] }
                        accessibilityElementsHidden={ SelectedIds.size === 0 }
                        importantForAccessibility={ SelectedIds.size === 0
                            ? "no-hide-descendants"
                            : "auto" }>
                        { SelectedIds.size } { SelectedIds.size === 1
                            ? "database"
                            : "databases" } selected
                    </Description>

                    <View
                        accessibilityRole="list"
                        style={ [
                            onboardingResultStyles.databaseTable,
                            { borderColor: Theme.Semantic.Border }
                        ] }>
                        { Databases.map((
                            Database: Domain.DataSource.OnboardingDatabase,
                            Index: number
                        ) => (
                            <View
                                accessibilityRole="none"
                                key={ Database.DataSourceId }
                                style={ [
                                    onboardingResultStyles.databaseRow,
                                    Index < Databases.length - 1
                                        ? {
                                            borderBottomColor: Theme.Semantic.Border,
                                            borderBottomWidth: 1
                                        }
                                        : null
                                ] }>
                                <Checkbox
                                    AccessibilityLabel={ `Select ${ Database.Title }` }
                                    Checked={ SelectedIds.has(Database.DataSourceId) }
                                    Disabled={ IsPending }
                                    OnCheckedChange={ () =>
                                        ToggleDatabase(Database.DataSourceId) }
                                />
                                <OnboardingDatabaseIcon { ...{ Database } } />
                                <ItemTitle
                                    NumberOfLines={ 2 }
                                    Style={ onboardingResultStyles.databaseTitle }>
                                    { Database.Title }
                                </ItemTitle>
                                <Description
                                    Color={ Token.Semantic.Muted }
                                    Style={ onboardingResultStyles.databaseCount }>
                                    { Database.HasMoreThan100Pages
                                        ? ">100 pages"
                                        : `${ Database.PageCount } ${
                                            Database.PageCount === 1 ? "page" : "pages"
                                        }` }
                                </Description>
                            </View>
                        )) }
                    </View>
                </View>

                { Databases.length === 0
                    ? (
                        <Description
                            Color={ Token.Semantic.Muted }
                            Style={ onboardingResultStyles.noSearchResults }>
                            No databases match “{ Search }”.
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
                    OnPress={ Continue }
                    Style={ onboardingStyles.cta }>
                    { SelectedIds.size === 0
                        ? "Select at least one database"
                        : `Continue with ${ SelectedIds.size } ${
                            SelectedIds.size === 1 ? "database" : "databases"
                        }` }
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

/** Loading state that avoids flashing for sub-second discovery responses. */
const DelayedSyncLoading = ({ Immediate }: { readonly Immediate: boolean }): React.JSX.Element =>
{
    const Theme = useTheme();
    const [ IsVisible, SetIsVisible ] = React.useState(Immediate);

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
            <SafeAreaView style={ onboardingResultStyles.loading }>
                <ActivityIndicator
                    accessibilityLabel="Checking Notion access"
                    color={ Theme.Semantic.Cursor }
                />
                <Description Color={ Token.Semantic.Muted }>
                    Checking what Notivex can access…
                </Description>
            </SafeAreaView>
        )
        : <View style={ onboardingResultStyles.loading } />;
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
    if (Status === "Syncing")
    {
        return <DelayedSyncLoading Immediate={ ShowLoading } />;
    }

    if (Status === "NoIntegration")
    {
        return (
            <AccessOutcomeLayout
                Subtitle={
                    "The authorization finished without adding the Notivex "
                    + "integration to your workspace."
                }
                Title="Notivex wasn’t added">
                <Button
                    Appearance="Primary"
                    Loading={ IsPending }
                    OnPress={ OnStartOver }
                    Style={ onboardingStyles.cta }>
                    Go back and start over
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ onboardingResultStyles.helpLink }>
                    Learn about third-party connections in Notion
                </Link>
            </AccessOutcomeLayout>
        );
    }

    if (Status === "NoAccess")
    {
        return (
            <AccessOutcomeLayout
                Subtitle="The integration is installed, but no pages or databases are shared with it yet."
                Title="Choose what Notivex can see">
                <Button
                    Appearance="Primary"
                    Loading={ IsPending }
                    OnPress={ OnAuthorize }
                    Style={ onboardingStyles.cta }>
                    Choose pages in Notion
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ onboardingResultStyles.helpLink }>
                    Learn about third-party connections in Notion
                </Link>
            </AccessOutcomeLayout>
        );
    }

    if (Status === "PagesOnly" && Data)
    {
        return (
            <AccessOutcomeLayout
                HeroImageAsset={ require("../../../Resource/Onboarding/Empty.png") }
                Subtitle={
                    "Notivex can see regular pages, but none of the shared page "
                    + "trees contain a database."
                }
                Title="No databases found">
                <PageAccessDisclosure
                    PageCount={ Data.PageCount }
                    Pages={ Data.Pages }
                />
                <Button
                    Appearance="Primary"
                    Loading={ IsPending }
                    OnPress={ OnAuthorize }
                    Style={ onboardingStyles.cta }>
                    Change access in Notion
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ onboardingResultStyles.helpLink }>
                    Learn about third-party connections in Notion
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
            Subtitle="We couldn’t finish checking your Notion access. Check your connection and try again."
            Title="We hit a snag">
            <Button
                Appearance="Primary"
                Loading={ IsPending }
                OnPress={ OnRetry }
                Style={ onboardingStyles.cta }>
                Try again
            </Button>
        </AccessOutcomeLayout>
    );
};

/** Props for the final onboarding screen. */
export interface DoneViewProps extends PendingOnboardingActionProps
{
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
    IsPending: Pending,
    OnCustomize,
    OnStart
}: DoneViewProps): React.JSX.Element => (
    <SafeAreaView style={ customizeFormsStyles.safeArea }>
        <View style={ customizeFormsStyles.header }>
            <Heading1>Optional: Customize Forms</Heading1>
            <Description>
                You&apos;re all set to start using Notivex. If you&apos;d like, you can
                edit the properties displayed when creating pages, create aliases
                for databases, and more.
            </Description>
        </View>
        <View style={ customizeFormsStyles.centerAction }>
            <Button
                Appearance="SoftBlue"
                Disabled={ Pending }
                OnPress={ OnCustomize }>
                Open database settings
            </Button>
        </View>
        <Button
            Appearance="Primary"
            Loading={ Pending }
            OnPress={ OnStart }
            Style={ onboardingStyles.cta }>
            Start using Notivex
        </Button>
    </SafeAreaView>
);

const customizeFormsStyles = StyleSheet.create({
    centerAction:
    {
        alignItems: "center",
        flex: 1,
        justifyContent: "center"
    },
    header:
    {
        gap: 12
    },
    safeArea:
    {
        flex: 1,
        paddingBottom: 40,
        paddingHorizontal: 32,
        paddingTop: 24
    }
});

const onboardingResultStyles = StyleSheet.create({
    databaseCount:
    {
        flexShrink: 0,
        fontSize: 12,
        textAlign: "right"
    },
    databaseEmoji:
    {
        fontSize: 20,
        lineHeight: 24
    },
    databaseIcon:
    {
        borderRadius: 4,
        height: 22,
        width: 22
    },
    databaseRow:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 56,
        paddingHorizontal: 12,
        paddingVertical: 9
    },
    databaseTable:
    {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden"
    },
    databaseTableSection:
    {
        gap: 8
    },
    databaseTitle:
    {
        flex: 1
    },
    disclosureChevron:
    {
        alignItems: "center",
        height: 24,
        justifyContent: "center",
        width: 24
    },
    disclosureHeader:
    {
        alignItems: "center",
        flexDirection: "row",
        gap: 10
    },
    disclosureSection:
    {
        gap: 10
    },
    disclosureTrigger:
    {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 44,
        paddingVertical: 8
    },
    helpButton:
    {
        alignItems: "center",
        borderRadius: 15,
        borderWidth: 1,
        height: 30,
        justifyContent: "center",
        width: 30
    },
    helpLink:
    {
        alignSelf: "center",
        fontSize: 12,
        textAlign: "center"
    },
    helpSheet:
    {
        flex: 1,
        gap: 24,
        paddingBottom: 32,
        paddingHorizontal: 24,
        paddingTop: 16
    },
    helpSheetHeader:
    {
        gap: 12
    },
    loading:
    {
        alignItems: "center",
        flex: 1,
        gap: 16,
        justifyContent: "center",
        padding: 32
    },
    noSearchResults:
    {
        paddingVertical: 12,
        textAlign: "center"
    },
    outcomeActions:
    {
        gap: 20
    },
    outcomeContent:
    {
        flexGrow: 1,
        gap: 24,
        paddingBottom: 40,
        paddingHorizontal: 32,
        paddingTop: 24
    },
    outcomeHeader:
    {
        gap: 8
    },
    pageList:
    {
        borderLeftWidth: 2,
        gap: 10,
        paddingLeft: 14,
        paddingVertical: 4
    },
    pageRow:
    {
        justifyContent: "center",
        minHeight: 24
    },
    safeArea:
    {
        flex: 1
    },
    selectedDatabaseCount:
    {
        minHeight: 20
    },
    selectionContent:
    {
        flexGrow: 1,
        gap: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
        paddingTop: 24
    }
});

const onboardingStyles = StyleSheet.create({
    center:
    {
        alignItems: "center",
        marginTop: 24
    },
    cta:
    {
        alignSelf: "stretch",
        minHeight: 48
    },
    note:
    {
        textAlign: "center"
    },
    spacer:
    {
        flex: 1
    }
});

const modalStyles = StyleSheet.create({
    container:
    {
        flex: 1
    },
    cta:
    {
        flex: 1
    },
    fullWidthCta:
    {
        width: "100%"
    },
    header:
    {
        gap: 8
    },
    safeArea:
    {
        flex: 1
    },
    scroll:
    {
        flexGrow: 1,
        gap: 32,
        paddingHorizontal: 32,
        paddingVertical: 24
    },
    spacer:
    {
        flexGrow: 1,
        minHeight: 24
    }
});

const signInStyles = StyleSheet.create({
    authIcon:
    {
        height: 24,
        width: 24
    },
    captionLink:
    {
        fontSize: 12,
        lineHeight: 16
    },
    copyright:
    {
        textAlign: "center"
    },
    cta:
    {
        marginHorizontal: 18
    },
    footer:
    {
        alignItems: "center",
        gap: 64
    },
    footerDetails:
    {
        alignItems: "center",
        gap: 14
    },
    footerLink:
    {
        fontSize: 12,
        lineHeight: 16,
        textDecorationLine: "none"
    },
    footerLinks:
    {
        flexDirection: "row",
        gap: 20,
        justifyContent: "center"
    },
    footerSpacer:
    {
        flex: 1.5
    },
    header:
    {
        alignItems: "center",
        gap: 0
    },
    headerText:
    {
        textAlign: "center"
    },
    legalCopy:
    {
        textAlign: "center"
    },
    spacer:
    {
        flex: 1
    }
});
