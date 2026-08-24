/** Free and Notivex Pro comparison, allowance, and purchase entry point. */

import { Body, Button, Description, Heading1, Heading2 } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { ScrollView, View } from "react-native";
import { FeatureMatrix } from "@/features/subscription/feature-matrix";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSubscription } from "@/Domain/Subscription";
import type { PurchasesPackage } from "react-native-purchases";

const PlansScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Allowance, Packages, Status } = useSubscription();
    const PriceSummary = Packages.length > 0
        ? Packages.map((Package: PurchasesPackage) => Package.product.priceString).join(" · ")
        : "Localized store pricing appears at checkout.";

    return (
        <View style={ Styles.Container }>
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <ScrollView contentContainerStyle={ Styles.Content }>
                    <Heading1>Get Notivex™ Premium</Heading1>
                    <Description>
                        Free keeps capture, accessibility, reliability, and account controls.
                        Pro unlocks customization, more destinations, and removes advertising.
                    </Description>

                    { Status?.EnforcementEnabled && !Status.Active && Allowance
                        ? (
                            <View style={ Styles.Usage }>
                                <Heading2>Your current usage</Heading2>
                                <Body>
                                    { Allowance.Used } of { Allowance.Limit } pages used in the
                                    last { Allowance.WindowMinutes } minutes.
                                </Body>
                            </View>
                        )
                        : null }

                    <FeatureMatrix />

                    <View style={ Styles.Pricing }>
                        <Heading2>One tier, three ways to buy</Heading2>
                        <Body>{ PriceSummary }</Body>
                        <Description>
                            Monthly and yearly renew automatically. Lifetime is a one-time purchase.
                        </Description>
                    </View>

                    <Button OnPress={ () => router.push("/subscribe") }>
                        View subscription options
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default PlansScreen;

const useStyles = MakeStyles({
    Container: ViewStyle({ backgroundColor: Token.Semantic.BackgroundSidebar, flex: 1 }),
    Content: ViewStyle({ gap: Token.Spacing.L, padding: Token.Spacing.Xl }),
    Pricing: ViewStyle({ gap: Token.Spacing.S }),
    SafeArea: ViewStyle({ flex: 1 }),
    Usage: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderRadius: 12,
        gap: Token.Spacing.S,
        padding: Token.Spacing.L
    })
});
