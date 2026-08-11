/**
 * Combined welcome + sign-in — the first thing a new user sees. Signing in with
 * Notion is the only action; on success the session appears and the navigator
 * moves on to granting access. Dismissing the browser leaves the user here.
 *
 * @module notivex/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AuthButton, Caption, Description, HeroTitle, Link } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { Semantic } from "@notivex/ui/Token";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";

const SignInScreen = () =>
{
    const Router = UseLazyRouter();

    return (
        <OnboardingScreen
            Header={
                <View style={ styles.header }>
                    <Image
                        source={ require("../../assets/NotivexLogoLight.png") }
                        style={ { height: 52, marginBottom: 16, width: 52 } }
                    />
                    <HeroTitle Style={ styles.headerText }>
                        Your notes, faster.
                    </HeroTitle>
                    <HeroTitle
                        Color={ Semantic.Muted }
                        Style={ [ styles.headerText, { fontFamily: "Roboto", fontWeight: "bold" } ] }
                        Weight="600">
                        Log in with your Notion account
                    </HeroTitle>
                </View>
            }
            Hero={ require("../../assets/Onboarding/Welcome.png") }
            Subtitle="Log in with your Notion account"
            Title="Your notes, faster.">
            <View style={ styles.spacer } />
            <AuthButton
                Icon={
                    <Image
                        source={ require("../../assets/Onboarding/NotionLogoLight.svg") }
                        style={ styles.authIcon }
                    />
                }
                OnPress={ Router.push("/sign-in-modal-step-one") }
                Style={ styles.cta }>
                Continue with Notion
            </AuthButton>
            <View style={ styles.footerSpacer } />
            <View style={ styles.footer }>
                <View style={ { gap: 32 } }>
                    <View style={ { flexDirection: "row", justifyContent: "center" } }>
                        <Description Style={ { fontSize: 14 } }>
                            Don’t have a Notion account?{"  "}
                        </Description>
                        <Link Style={ { fontSize: 14 } }>
                            Sign up
                        </Link>
                    </View>
                    <Caption Style={ styles.legalCopy }>
                        By continuing, you acknowledge that you understand{"\n"}
                        and agree to the{" "}
                        <Link Style={ styles.captionLink }>
                            Terms &amp; Conditions
                        </Link>
                        {" "}and{" "}
                        <Link Style={ styles.captionLink }>
                            Privacy Policy
                        </Link>
                    </Caption>
                </View>
                <View style={ styles.footerDetails }>
                    <View style={ styles.footerLinks }>
                        <Link Style={ styles.footerLink }>Privacy &amp; terms</Link>
                        <Link Style={ styles.footerLink }>Need help?</Link>
                    </View>
                    <Description Style={ styles.copyright }>
                        © 2026 Notivex.
                    </Description>
                </View>
            </View>
        </OnboardingScreen>
    );
};

const styles = StyleSheet.create({
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

export default SignInScreen;
