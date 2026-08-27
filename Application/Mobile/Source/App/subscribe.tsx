/**
 * Store-backed monthly, yearly, and lifetime NoteFerry Pro checkout.
 *
 * @module noteferry/App/subscribe
 *
 * @file      subscribe.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Alert, Linking, ScrollView, View } from "react-native";
import { Body, Description, Heading1, Heading2, LabelText } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { MakeStyles, Token, ViewStyle } from "@noteferry/ui/Core";
import {
    PACKAGE_TYPE,
    PURCHASES_ERROR_CODE,
    type PurchasesError,
    type PurchasesPackage
} from "react-native-purchases";
import { useMemo, useState } from "react";
import { PurchaseSyncPendingError } from "@/Domain/Subscription/SubscriptionProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from "@/Domain/Subscription";
import { useTranslation } from "react-i18next";

const TermsUrl = "https://noteferry.sorrell.sh/terms" as const;
const PrivacyUrl = "https://noteferry.sorrell.sh/privacy" as const;

const Term = (Package: PurchasesPackage): "Monthly" | "Yearly" | "Lifetime" | null =>
{
    if (Package.packageType === PACKAGE_TYPE.MONTHLY)
    {
        return "Monthly";
    }

    if (Package.packageType === PACKAGE_TYPE.ANNUAL)
    {
        return "Yearly";
    }

    if (Package.packageType === PACKAGE_TYPE.LIFETIME)
    {
        return "Lifetime";
    }
    return null;
};

const SubscribeScreen = (): React.JSX.Element =>
{
    const Styles = useStyles();
    const {
        IsFinishingPurchase,
        IsStoreAvailable,
        Packages,
        Purchase,
        Refresh,
        Restore,
        Sale
    } = useSubscription();
    const { t } = useTranslation("subscription");

    type Term = ReturnType<typeof Term>;
    interface Option
    {
        readonly Package: PurchasesPackage;
        readonly Term: Term;
    }

    const Options = useMemo(() => Packages
        .map((Package: PurchasesPackage) => ({ Package, Term: Term(Package) }))
        .filter((Option: { Term: unknown; }): Option is Option => Option.Term !== null), [ Packages ]);
    const [ Selected, SetSelected ] = useState<"Monthly" | "Yearly" | "Lifetime">("Yearly");
    const [ IsBusy, SetIsBusy ] = useState(false);
    const SelectedPackage = Options.find((Option: Option) => Option.Term === Selected)?.Package;
    const MonthlyPrice = Options.find((Option: Option) => Option.Term === "Monthly")?.Package.product.price;

    const TermLabels: Record<"Monthly" | "Yearly" | "Lifetime", string> = {
        Lifetime: t("subscribe.plan.term.lifetime"),
        Monthly: t("subscribe.plan.term.monthly"),
        Yearly: t("subscribe.plan.term.yearly")
    };

    const Buy = async (): Promise<void> =>
    {
        if (!SelectedPackage)
        {
            return;
        }

        SetIsBusy(true);
        try
        {
            await Purchase(SelectedPackage);
            Alert.alert(t("subscribe.alerts.purchaseSuccess.title"), t("subscribe.alerts.purchaseSuccess.body"));
        }
        catch (Error_)
        {
            if (Error_ instanceof PurchaseSyncPendingError)
            {
                Alert.alert(t("purchaseSyncPending.title"), t("purchaseSyncPending.body"));
                return;
            }

            const PurchaseError = Error_ as PurchasesError;
            if (PurchaseError.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
            {
                Alert.alert(
                    t("subscribe.alerts.purchaseNotCompleted.title"),
                    PurchaseError.message ?? t("subscribe.alerts.purchaseNotCompleted.body")
                );
            }
        }
        finally
        {
            SetIsBusy(false);
        }
    };

    const RestorePurchases = async (): Promise<void> =>
    {
        SetIsBusy(true);
        try
        {
            await Restore();
            Alert.alert(t("subscribe.alerts.restoreSuccess.title"), t("subscribe.alerts.restoreSuccess.body"));
        }
        catch (Error_)
        {
            Alert.alert(t("subscribe.alerts.restoreFailed.title"), String(Error_));
        }
        finally
        {
            SetIsBusy(false);
        }
    };

    const RetrySetup = async (): Promise<void> =>
    {
        try
        {
            await Refresh();
        }
        catch
        {
            Alert.alert(t("subscribe.alerts.stillFinishingSetup.title"), t("subscribe.alerts.stillFinishingSetup.body"));
        }
    };

    return (
        <View style={ Styles.Container }>
            <SafeAreaView
                edges={ [ "bottom" ] }
                style={ Styles.SafeArea }>
                <ScrollView contentContainerStyle={ Styles.Content }>
                    <Heading1>{ t("subscribe.heading") }</Heading1>
                    <Description>
                        { t("subscribe.description") }
                    </Description>
                    { Sale ? <Body>{ Sale.Copy }</Body> : null }

                    { Options.map((Option: Option) =>
                    {
                        const IsSelected = Selected === Option.Term;
                        const AnnualSavings = Option.Term === "Yearly" && MonthlyPrice
                            ? Math.max(
                                0,
                                Math.round((1 - Option.Package.product.price / (MonthlyPrice * 12)) * 100)
                            )
                            : 0;
                        const TermLabel = TermLabels[Option.Term!];

                        return (
                            <Pressable
                                Accessibility={ {
                                    Label: t("subscribe.plan.accessibilityLabel", {
                                        price: Option.Package.product.priceString,
                                        term: TermLabel
                                    }),
                                    Role: "radio",
                                    State: { checked: IsSelected }
                                } }
                                OnPress={ () => SetSelected(Option.Term!) }
                                key={ Option.Term }
                                style={ [ Styles.Card, IsSelected && Styles.SelectedCard ] }>
                                <View style={ Styles.CardHeading }>
                                    <Heading2>{ TermLabel }</Heading2>
                                    { Option.Term === "Yearly"
                                        ? <LabelText>
                                            { AnnualSavings > 0
                                                ? t("subscribe.plan.savePercent", { percent: AnnualSavings })
                                                : t("subscribe.plan.bestValue") }
                                        </LabelText>
                                        : null }
                                </View>
                                <Body>{ Option.Package.product.priceString }</Body>
                                <Description>
                                    { Option.Term === "Lifetime"
                                        ? t("subscribe.plan.lifetimeDescription")
                                        : t("subscribe.plan.renewingDescription") }
                                </Description>
                            </Pressable>
                        );
                    }) }

                    { !IsStoreAvailable
                        ? <Description>
                            { t("subscribe.storeUnavailable") }
                        </Description>
                        : null }

                    <Button
                        Disabled={ IsBusy || IsFinishingPurchase || !SelectedPackage }
                        OnPress={ () => void Buy() }>
                        { IsBusy || IsFinishingPurchase
                            ? t("subscribe.actions.finishingSetup")
                            : t("subscribe.actions.continueWith", { term: TermLabels[Selected] }) }
                    </Button>
                    <Button
                        Appearance="Link"
                        Disabled={ IsBusy }
                        OnPress={ RestorePurchases }>
                        { t("subscribe.actions.restore") }
                    </Button>
                    { IsFinishingPurchase
                        ? (
                            <Button
                                Appearance="Link"
                                OnPress={ () => void RetrySetup() }>
                                { t("subscribe.actions.retrySetup") }
                            </Button>
                        )
                        : null }

                    <Description>
                        { t("subscribe.legalNotice") }
                    </Description>
                    <View style={ Styles.Links }>
                        <Button
                            Appearance="Link"
                            OnPress={ () => void Linking.openURL(TermsUrl) }>
                            { t("subscribe.terms") }
                        </Button>
                        <Button
                            Appearance="Link"
                            OnPress={ () => void Linking.openURL(PrivacyUrl) }>
                            { t("subscribe.privacy") }
                        </Button>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SubscribeScreen;

const useStyles = MakeStyles({
    Card: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundModal,
        borderColor: Token.Semantic.Border,
        borderRadius: 14,
        borderWidth: 1,
        gap: Token.Spacing.S,
        padding: Token.Spacing.L
    }),
    CardHeading: ViewStyle({ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }),
    Container: ViewStyle({ backgroundColor: Token.Semantic.BackgroundSidebar, flex: 1 }),
    Content: ViewStyle({ gap: Token.Spacing.L, padding: Token.Spacing.Xl }),
    Links: ViewStyle({ flexDirection: "row", gap: Token.Spacing.M }),
    SafeArea: ViewStyle({ flex: 1 }),
    SelectedCard: ViewStyle({ borderColor: Token.Semantic.Blue, borderWidth: 2 })
});
