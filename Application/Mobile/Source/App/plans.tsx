/**
 * Free and NoteFerry Pro comparison, allowance, and purchase entry point.
 *
 * @module noteferry/App/plans
 *
 * @file      plans.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Description, Heading1, Heading2 } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import { MakeStyles, Token, ViewStyle } from "@noteferry/ui/Core";
import { ScrollView, View } from "react-native";
import { FeatureMatrix } from "@/features/subscription/feature-matrix";
import type { PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";

const PlansScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const { Allowance, Packages, Status } = useSubscription();
    const { t } = useTranslation("subscription");
    const PriceSummary = Packages.length > 0
        ? Packages.map((Package: PurchasesPackage) => Package.product.priceString).join(" · ")
        : t("plans.pricing.fallback");

    return (
        <View style={ Styles.Container }>
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <ScrollView contentContainerStyle={ Styles.Content }>
                    <Heading1>{ t("plans.heading") }</Heading1>
                    <Description>
                        { t("plans.description") }
                    </Description>

                    { Status?.EnforcementEnabled && !Status.Active && Allowance
                        ? (
                            <View style={ Styles.Usage }>
                                <Heading2>{ t("plans.usage.heading") }</Heading2>
                                <Body>
                                    { t("plans.usage.description", {
                                        limit: Allowance.Limit,
                                        minutes: Allowance.WindowMinutes,
                                        used: Allowance.Used
                                    }) }
                                </Body>
                            </View>
                        )
                        : null }

                    <FeatureMatrix />

                    <View style={ Styles.Pricing }>
                        <Heading2>{ t("plans.pricing.heading") }</Heading2>
                        <Body>{ PriceSummary }</Body>
                        <Description>
                            { t("plans.pricing.description") }
                        </Description>
                    </View>

                    <Button OnPress={ () => router.push("/subscribe") }>
                        { t("plans.actions.viewOptions") }
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
