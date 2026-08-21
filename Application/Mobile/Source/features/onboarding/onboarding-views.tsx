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

import * as Application from "expo-application";
import type * as Domain from "@notivex/domain";
import * as MailComposer from "expo-mail-composer";
import * as React from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
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
import { ImageStyle, MakeStyles, TextStyle, Token, ViewStyle, useTheme } from "@notivex/ui";
import { Boolean } from "effect";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HeroImage, ResourceIcon } from "@/Component";
import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility";
import type { NotionSyncStatus } from "@/features/onboarding/use-notion-sync";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { SafeAreaView } from "react-native-safe-area-context";
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
const SignInView = ({ OnContinue }: SignInViewProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useSignInStyles();

    const HandleNeedHelp = React.useCallback(async () =>
    {
        const IsAvailable = await MailComposer.isAvailableAsync();

        if (!IsAvailable)
        {
            Alert.alert(
                "No mail app available",
                "Set up a mail account on this device to send feedback."
            );

            return;
        }

        const body = Application.nativeApplicationVersion !== null && Application.nativeBuildVersion !== null
            ? `\n\n—\nNotivex ${ Application.nativeApplicationVersion } `
                + `(${ Application.nativeBuildVersion })`
            : undefined;

        await MailComposer.composeAsync({
            body,
            recipients: [ "gage@sorrell.sh" ],
            subject: "Notivex Question"
        });
    }, [ ]);

    return (
        <OnboardingScreen
            Header={
                <View style={ [ Styles.Header, { paddingTop: 64 } ] }>
                    <Image
                        source={ Theme.Mode === "Dark"
                            ? require("../../../Resource/Logo/NotivexLogoDark.png")
                            : require("../../../Resource/Logo/NotivexLogoLight.png") }
                        style={ { height: 44, marginBottom: 16, width: 44 } }
                    />
                    <HeroTitle Style={ Styles.HeaderText }>
                        Your notes, faster.
                    </HeroTitle>
                    <HeroTitle
                        Color="#9D9A99"
                        Style={ [ Styles.HeaderText, { fontFamily: "Roboto", fontWeight: "bold" } ] }
                        Weight="600">
                        Log in with your Notion account
                    </HeroTitle>
                </View>
            }
            Hero={ undefined }
            Subtitle="Log in with your Notion account"
            Title="Your notes, faster.">
            { /* A narrow/short viewport (e.g. a Z Fold's outer screen) can wrap
                 the copy below enough that the footer no longer fits — this
                 was a fixed, non-scrolling layout, so it just clipped off the
                 bottom of the screen with no way to reach it. Scrollable now;
                 `flexGrow: 1` on the content container keeps `Spacer`/
                 `FooterSpacer` filling any leftover room (today's look) when
                 everything already fits. */ }
            <ScrollView
                contentContainerStyle={ Styles.ScrollContent }
                showsVerticalScrollIndicator={ false }
                style={ Styles.Scroll }>
                <View style={ Styles.Spacer } />
                <AuthButton
                    Icon={
                        <Image
                            source={ require("../../../Resource/Onboarding/NotionLogoLight.svg") }
                            style={ Styles.AuthIcon }
                        />
                    }
                    OnPress={ OnContinue }
                    Style={ Styles.Cta }>
                    Continue with Notion
                </AuthButton>
                <View style={ Styles.FooterSpacer } />
                <View style={ Styles.Footer }>
                    <View style={ { gap: 32 } }>
                        <View style={ { flexDirection: "row", justifyContent: "center" } }>
                            <Description Style={ { fontSize: 14 } }>
                                Don’t have a Notion account?{"  "}
                            </Description>
                            <Link
                                Appearance="Subtle"
                                Href="https://app.notion.com/signup"
                                Style={ { fontSize: 14, textDecorationLine: "underline" } }>
                                Sign up
                            </Link>
                        </View>
                        <Caption Style={ Styles.LegalCopy }>
                            By continuing, you acknowledge that you understand{"\n"}
                            and agree to the{" "}
                            <Link
                                Href="https://notivex.sorrell.sh/terms"
                                Style={ Styles.CaptionLink }>
                                Terms &amp; Conditions
                            </Link>
                            {" "}and{" "}
                            <Link
                                Href="https://notivex.sorrell.sh/privacy"
                                Style={ Styles.CaptionLink }>
                                Privacy Policy
                            </Link>
                        </Caption>
                    </View>
                    <View style={ Styles.FooterDetails }>
                        <View style={ Styles.FooterLinks }>
                            <Link
                                Href="https://notivex.sorrell.sh"
                                Style={ Styles.FooterLink }>Learn more</Link>
                            <Link
                                OnPress={ HandleNeedHelp }
                                Style={ Styles.FooterLink }>Need help?</Link>
                        </View>
                        <Description Style={ Styles.Copyright }>
                            © 2026 Gage Sorrell.  All Rights Reserved.
                        </Description>
                    </View>
                </View>
            </ScrollView>
        </OnboardingScreen>
    );
};

/** Props for the sign-in explanation modal. */
export interface SignInModalViewProps extends PendingOnboardingActionProps
{
    readonly OnSignIn: Thunk;
}

export/**
       * Renders the sign-in explanation modal, walking the user through the
       * two-step process (Notion sign-in, then database selection) before
       * they authenticate.
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

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <ScrollView
                    contentContainerStyle={ Styles.Scroll }
                    showsVerticalScrollIndicator={ false }
                    style={ Styles.SafeArea }>
                    <HeroImage Source={ require("../../../Resource/Onboarding/SignInModalStepTwo.png") } />
                    <Body>
                        First, you’ll sign into Notion and add the Notivex integration to
                        your workspace.
                    </Body>
                    <Body>
                        Then, you’ll choose which databases Notivex can see.
                    </Body>
                    <Body Style={ { color: TipColor, textAlign: "center" } }>
                        Tip: Giving Notivex access to a page also gives access to all{" "}
                        databases under that page.
                    </Body>
                    <View style={ Styles.Spacer } />
                    <AuthButton
                        Icon={
                            <Image
                                source={ require("../../../Resource/Onboarding/NotionLogoLight.svg") }
                                style={ { height: 24, width: 24 } }
                            />
                        }
                        Loading={ Pending }
                        OnPress={ OnSignIn }
                        Style={ Styles.FullWidthCta }>
                        Log in with Notion
                    </AuthButton>
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
    const Styles = useOnboardingResultStyles();
    const OnboardingStyles = useOnboardingStyles();
    const NumRemaining = Math.max(0, PageCount - Pages.length);

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
                            { PageCount } { PageCount === 1 ? "page" : "pages" } found
                        </Body>
                        <Pressable
                            Accessibility={ {
                                Label: "Why pages are shown",
                                Role: "button"
                            } }
                            OnPress={ () => HelpSheet.current?.present() }
                            hitSlop={ 8 }
                            style={ Styles.HelpButton }>
                            <Description Weight="600">?</Description>
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
                                    No regular pages are visible.
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
                                    and { NumRemaining } more
                                </Description>
                            )
                            : null }
                    </View>
                )
                : null }

            <BottomSheet Ref={ HelpSheet }>
                <BottomSheetView style={ Styles.HelpSheet }>
                    <View style={ Styles.HelpSheetHeader }>
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
                        Style={ OnboardingStyles.Cta }>
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
        <SafeAreaView style={ Styles.SafeArea }>
            <ScrollView
                contentContainerStyle={ Styles.SelectionContent }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={ false }>
                <View style={ Styles.OutcomeHeader }>
                    <Heading1>
                        Choose your databases
                    </Heading1>
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
                        { SelectedIds.size } { SelectedIds.size === 1
                            ? "database"
                            : "databases" } selected
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
                                    AccessibilityLabel={ `Select ${ Database.Title }` }
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
                            Style={ Styles.NoSearchResults }>
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
                    OnPress={ Continue }>
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
    const Styles = useOnboardingResultStyles();
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
            <SafeAreaView style={ Styles.Loading }>
                <ActivityIndicator
                    accessibilityLabel="Checking Notion access"
                    color={ Theme.Semantic.Cursor }
                />
                <Description Color={ Token.Semantic.Muted }>
                    Checking what Notivex can access…
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
                    Style={ OnboardingStyles.Cta }>
                    Go back and start over
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ Styles.HelpLink }>
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
                    Style={ OnboardingStyles.Cta }>
                    Choose pages in Notion
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ Styles.HelpLink }>
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
                    Style={ OnboardingStyles.Cta }>
                    Change access in Notion
                </Button>
                <Link
                    Href={ NotionConnectionsHelpUrl }
                    Style={ Styles.HelpLink }>
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
                Style={ OnboardingStyles.Cta }>
                Try again
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

    return (
        <OnboardingScreen
            Hero={ undefined }
            Subtitle="Get notified when Notivex finishes creating pages you submitted while offline."
            Title="Enable Notifications">
            <View style={ Styles.Spacer } />
            <Button
                Appearance="Blue"
                Loading={ Pending }
                OnPress={ OnEnable }
                Style={ Styles.Cta }>
                Enable notifications
            </Button>
            <Button
                Disabled={ Pending }
                OnPress={ OnSkip }
                Style={ Styles.Cta }>
                Not now
            </Button>
        </OnboardingScreen>
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
}: DoneViewProps): React.JSX.Element =>
{
    const Styles = useCustomizeFormsStyles();

    return (
        <SafeAreaView style={ Styles.SafeArea }>
            <View style={ Styles.Header }>
                <Heading1>
                    Optional: Customize Forms
                </Heading1>
                <HeroImage Source={ require("../../../Resource/Onboarding/Grant.png") } />
                <Description>
                    You&apos;re all set to start using Notivex. If you&apos;d like, you can
                    edit the properties displayed when creating pages, create aliases
                    for databases, and more.
                </Description>
            </View>
            <View style={ { flex: 1 } } />
            <View style={ Styles.CenterAction }>
                <Button
                    Disabled={ Pending }
                    OnPress={ OnCustomize }>
                    View database settings
                </Button>
                <Button
                    Appearance="Blue"
                    Loading={ Pending }
                    OnPress={ OnStart }>
                    Start using Notivex
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
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        flex: 1
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
    SafeArea: ViewStyle({
        flex: 1
    }),
    Scroll: ViewStyle({
        flexGrow: 1,
        gap: 32,
        marginTop: -24,
        paddingBottom: 24,
        paddingHorizontal: 32
    }),
    Spacer: ViewStyle({
        flexGrow: 1,
        minHeight: 24
    })
});

const useSignInStyles = MakeStyles({
    AuthIcon: ImageStyle({
        height: 24,
        width: 24
    }),
    CaptionLink: TextStyle({
        fontSize: 12,
        lineHeight: 16
    }),
    Copyright: TextStyle({
        textAlign: "center"
    }),
    Cta: ViewStyle({
        marginHorizontal: 18
    }),
    Footer: ViewStyle({
        alignItems: "center",
        gap: 64
    }),
    FooterDetails: ViewStyle({
        alignItems: "center",
        gap: 14
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
    FooterSpacer: ViewStyle({
        flex: 1.5
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
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    ScrollContent: ViewStyle({
        flexGrow: 1
    }),
    Spacer: ViewStyle({
        flex: 1
    })
});
