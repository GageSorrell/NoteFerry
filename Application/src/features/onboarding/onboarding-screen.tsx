/**
 * The shared visual template for every onboarding screen: a header near the
 * top, a central graphic whose centre sits roughly a third of the way down the
 * screen, and the instructions plus interactive elements below it. The graphic
 * is a plain coloured placeholder for now — real artwork lands later.
 *
 * @module notivex/features/onboarding/onboarding-screen
 *
 * @file      onboarding-screen.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Description, Heading1 } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { HeroImage } from "@/Component/HeroImage";
import type { ImageAsset } from "@/Domain/Utility/Asset";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/** {@inheritDoc OnboardingScreen} */
export interface OnboardingScreenProps
{
    readonly Title: string;
    readonly Subtitle?: string | undefined;
    readonly Header?: ReactNode;

    readonly Hero: ImageAsset;

    readonly children?: ReactNode;
}
export/**
       * Lays out one onboarding step using the shared template: header, central
       * graphic, then the step's own content.
       *
       * @category Component
       * @since 1.0.0
       */
const OnboardingScreen = ({
    Header,
    Hero,
    Title,
    Subtitle,
    children
}: OnboardingScreenProps): ReactNode =>
{
    return (
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <View style={ styles.header }>
                    { Header ?? (
                        <>
                            <Heading1>
                                { Title }
                            </Heading1>
                            { Subtitle === undefined
                                ? null
                                : (
                                    <Description>
                                        { Subtitle }
                                    </Description>
                                ) }
                        </>
                    ) }
                </View>

                <HeroImage Source={ Hero } />
                <View style={ styles.content }>
                    { children }
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container:
    {
        flex: 1
    },
    content:
    {
        flex: 1,
        gap: 24,
        marginTop: 32
    },
    graphic:
    {
        borderRadius: 28,
        height: 168,
        width: 168
    },
    graphicWrap:
    {
        alignItems: "center",
        marginTop: 40
    },
    header:
    {
        gap: 8
    },
    safeArea:
    {
        flex: 1,
        paddingHorizontal: 32,
        paddingVertical: 24
    }
});
