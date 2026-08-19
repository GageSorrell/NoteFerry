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
import { MakeStyles, ViewStyle } from "@notivex/ui";
import { HeroImage } from "@/Component/HeroImage";
import type { ImageAsset } from "@/Domain/Utility/Asset";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

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
    const Styles = useStyles();
    const SubtitleView = () => Subtitle === undefined
        ? null
        : <Description>{ Subtitle }</Description>;

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea }>
                <View style={ Styles.Header }>
                    { Header ?? (
                        <>
                            <Heading1>
                                { Title }
                            </Heading1>
                            <SubtitleView />
                        </>
                    ) }
                </View>

                <HeroImage Source={ Hero } />
                <View style={ Styles.Content }>
                    { children }
                </View>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        flex: 1
    }),
    Content: ViewStyle({
        flex: 1,
        gap: 24,
        marginTop: 32
    }),
    Graphic: ViewStyle({
        borderRadius: 28,
        height: 168,
        width: 168
    }),
    GraphicWrap: ViewStyle({
        alignItems: "center",
        marginTop: 40
    }),
    Header: ViewStyle({
        gap: 8
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 24
    })
});
