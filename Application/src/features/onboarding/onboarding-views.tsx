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

import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
    AuthButton,
    Body,
    Button,
    Caption,
    Description,
    HeroTitle,
    Link,
    ScreenTitle
} from "@notivex/ui/Primitive";
import { Token, UseTheme } from "@notivex/ui";
import { HeroImage } from "@/Component";
import { Image } from "expo-image";
import type { ImageAsset } from "@/Domain/Utility";
import type { NotionSyncStatus } from "@/features/onboarding/use-notion-sync";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { Semantic } from "@notivex/ui/Token";

/** Props shared by views with a single primary action. */
export interface OnboardingActionProps
{
    readonly OnContinue: () => void;
}

/** Props for views whose primary action can be pending. */
export interface PendingOnboardingActionProps
{
    readonly Pending: boolean;
}

/** Props for retryable sync states. */
export interface RetryableOnboardingActionProps
{
    readonly OnRetry: () => void;
}

/** Props for the welcome/sign-in screen. */
export interface SignInViewProps
{
    readonly OnContinue: () => void;
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
                    source={ require("../../../assets/NotivexLogoLight.png") }
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
        Hero={ require("../../../assets/Onboarding/Welcome.png") }
        Subtitle="Log in with your Notion account"
        Title="Your notes, faster.">
        <View style={ signInStyles.spacer } />
        <AuthButton
            Icon={
                <Image
                    source={ require("../../../assets/Onboarding/NotionLogoLight.svg") }
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
    readonly OnContinue: () => void;
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
    const ModalBackground = UseTheme().Semantic.BackgroundModal;

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
                    <HeroImage Source={ require("../../../assets/Onboarding/SignInModalStepOne.png") } />
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
    readonly OnBack: () => void;
    readonly OnSignIn: () => void;
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
    Pending
}: SignInModalStepTwoViewProps): React.JSX.Element =>
{
    const Theme = UseTheme();
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
                    <HeroImage Source={ require("../../../assets/Onboarding/SignInModalStepTwo.png") } />
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
                                source={ require("../../../assets/Onboarding/NotionLogoLight.svg") }
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

/** Props for the content-integration grant screen. */
export interface GrantViewProps extends PendingOnboardingActionProps
{
    readonly OnGrant: () => void;
}

export/**
       * Renders the content-integration grant screen and its pending state.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const GrantView = ({ OnGrant, Pending }: GrantViewProps): React.JSX.Element => (
    <OnboardingScreen
        Hero={ require("../../../assets/Onboarding/Grant.png") }
        Subtitle="Pick the databases and pages Notivex can write to — nothing else is ever touched."
        Title="Give Notivex a place to write">
        <View style={ onboardingStyles.spacer } />
        <Body
            Color={ Token.Semantic.Muted }
            Style={ onboardingStyles.note }>
            You can change what&apos;s shared anytime, right from Notion.
        </Body>
        <Button
            Appearance="Primary"
            Loading={ Pending }
            OnPress={ OnGrant }
            Style={ onboardingStyles.cta }>
            Choose pages in Notion
        </Button>
    </OnboardingScreen>
);

/** Props for the four post-grant synchronization states. */
export interface SyncViewProps
{
    readonly OnContinue: () => void;
    readonly OnRetry: () => void;
    readonly Status: NotionSyncStatus;
}

export/**
       * Renders one exhaustive post-grant synchronization state.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const SyncView = ({
    OnContinue,
    OnRetry,
    Status
}: SyncViewProps): React.JSX.Element =>
{
    if (Status === "Ready")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle="Your workspace is ready to go."
                Title="All connected">
                <View style={ onboardingStyles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ OnContinue }
                    Style={ onboardingStyles.cta }>
                    Continue
                </Button>
            </OnboardingScreen>
        );
    }

    if (Status === "Empty")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle={
                    "Nothing's shared with Notivex yet. Share a page or database "
                    + "in Notion, then try again."
                }
                Title="Nothing shared yet">
                <View style={ onboardingStyles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ OnRetry }
                    Style={ onboardingStyles.cta }>
                    Try again
                </Button>
                <Button
                    Appearance="Link"
                    OnPress={ OnContinue }
                    Style={ onboardingStyles.cta }>
                    I&apos;ll do this later
                </Button>
            </OnboardingScreen>
        );
    }

    if (Status === "Error")
    {
        return (
            <OnboardingScreen
                Hero={ "" as ImageAsset }
                Subtitle="We couldn't reach Notion. Check your connection and try again."
                Title="We hit a snag">
                <View style={ onboardingStyles.spacer } />
                <Button
                    Appearance="Primary"
                    OnPress={ OnRetry }
                    Style={ onboardingStyles.cta }>
                    Try again
                </Button>
            </OnboardingScreen>
        );
    }

    return (
        <OnboardingScreen
            Hero={ "" as ImageAsset }
            Subtitle={
                "Notion is updating the Notivex integration with access to "
                + "the pages and databases you selected. This can take up to 30 seconds."
            }
            Title="Waiting for Notion">
            <View style={ onboardingStyles.center }>
                <ActivityIndicator
                    accessibilityLabel={
                        "Waiting for Notion to share the selected pages and "
                        + "databases with Notivex"
                    }
                />
            </View>
        </OnboardingScreen>
    );
};

/** Props for the final onboarding screen. */
export interface DoneViewProps extends PendingOnboardingActionProps
{
    readonly OnStart: () => void;
}

export/**
       * Renders the final onboarding screen and its pending state.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const DoneView = ({ OnStart, Pending }: DoneViewProps): React.JSX.Element => (
    <OnboardingScreen
        Hero={ "" as ImageAsset }
        Subtitle="Capture a thought and it lands in Notion in seconds."
        Title="You're all set">
        <View style={ onboardingStyles.spacer } />
        <Button
            Appearance="Primary"
            Loading={ Pending }
            OnPress={ OnStart }
            Style={ onboardingStyles.cta }>
            Start using Notivex
        </Button>
    </OnboardingScreen>
);

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
