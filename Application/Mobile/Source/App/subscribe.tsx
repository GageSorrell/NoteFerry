/** Store-backed monthly, yearly, and lifetime Notivex Pro checkout. */

import {
    Body,
    Button,
    Description,
    Heading1,
    Heading2,
    LabelText,
    Pressable
} from "@notivex/ui/Primitive";
import { Alert, Linking, ScrollView, View } from "react-native";
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { PACKAGE_TYPE, PURCHASES_ERROR_CODE, type PurchasesError, type PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { useSubscription } from "@/Domain/Subscription";
import { PurchaseSyncPendingError } from "@/Domain/Subscription/SubscriptionProvider";

const TermsUrl = "https://notivex.sorrell.sh/terms";
const PrivacyUrl = "https://notivex.sorrell.sh/privacy";

function Term(Package: PurchasesPackage): "Monthly" | "Yearly" | "Lifetime" | null
{
    if (Package.packageType === PACKAGE_TYPE.MONTHLY) return "Monthly";
    if (Package.packageType === PACKAGE_TYPE.ANNUAL) return "Yearly";
    if (Package.packageType === PACKAGE_TYPE.LIFETIME) return "Lifetime";
    return null;
}

export default function SubscribeScreen(): React.JSX.Element
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
    const Options = useMemo(() => Packages
        .map((Package) => ({ Package, Term: Term(Package) }))
        .filter((Option): Option is { Package: PurchasesPackage; Term: "Monthly" | "Yearly" | "Lifetime" } =>
            Option.Term !== null), [ Packages ]);
    const [ Selected, SetSelected ] = useState<"Monthly" | "Yearly" | "Lifetime">("Yearly");
    const [ IsBusy, SetIsBusy ] = useState(false);
    const SelectedPackage = Options.find((Option) => Option.Term === Selected)?.Package;
    const MonthlyPrice = Options.find((Option) => Option.Term === "Monthly")?.Package.product.price;

    const Buy = async (): Promise<void> =>
    {
        if (!SelectedPackage) return;
        SetIsBusy(true);
        try
        {
            await Purchase(SelectedPackage);
            Alert.alert("Notivex Pro is ready", "Your Pro features are now active.");
        }
        catch (Error_)
        {
            if (Error_ instanceof PurchaseSyncPendingError)
            {
                Alert.alert("Purchase successful—finishing setup", Error_.message);
                return;
            }

            const PurchaseError = Error_ as PurchasesError;
            if (PurchaseError.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
            {
                Alert.alert("Purchase not completed", PurchaseError.message ?? "Please try again.");
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
            Alert.alert("Purchases restored", "Your current entitlement has been refreshed.");
        }
        catch (Error_)
        {
            Alert.alert("Restore failed", String(Error_));
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
            Alert.alert("Still finishing setup", "Check your connection and try again shortly.");
        }
    };

    return (
        <View style={ Styles.Container }>
            <SafeAreaView style={ Styles.SafeArea } edges={ [ "bottom" ] }>
                <ScrollView contentContainerStyle={ Styles.Content }>
                    <Heading1>Notivex Pro</Heading1>
                    <Description>
                        Unlimited databases and capture, full customization, and no ads.
                    </Description>
                    { Sale ? <Body>{ Sale.Copy }</Body> : null }

                    { Options.map((Option) =>
                    {
                        const IsSelected = Selected === Option.Term;
                        const AnnualSavings = Option.Term === "Yearly" && MonthlyPrice
                            ? Math.max(0, Math.round((1 - Option.Package.product.price / (MonthlyPrice * 12)) * 100))
                            : 0;

                        return (
                            <Pressable
                                Accessibility={ {
                                    Label: `${Option.Term}, ${Option.Package.product.priceString}`,
                                    Role: "radio",
                                    State: { checked: IsSelected }
                                } }
                                OnPress={ () => SetSelected(Option.Term) }
                                key={ Option.Term }
                                style={ [ Styles.Card, IsSelected && Styles.SelectedCard ] }>
                                <View style={ Styles.CardHeading }>
                                    <Heading2>{ Option.Term }</Heading2>
                                    { Option.Term === "Yearly"
                                        ? <LabelText>{ AnnualSavings > 0 ? `Save ${AnnualSavings}%` : "Best value" }</LabelText>
                                        : null }
                                </View>
                                <Body>{ Option.Package.product.priceString }</Body>
                                <Description>
                                    { Option.Term === "Lifetime"
                                        ? "One-time purchase. Access lasts for the supported lifetime of the Notivex service."
                                        : "Auto-renews unless canceled through your store account." }
                                </Description>
                            </Pressable>
                        );
                    }) }

                    { !IsStoreAvailable
                        ? <Description>Store products are unavailable. Check your connection and try again.</Description>
                        : null }

                    <Button
                        Disabled={ IsBusy || IsFinishingPurchase || !SelectedPackage }
                        OnPress={ () => void Buy() }>
                        { IsBusy || IsFinishingPurchase
                            ? "Purchase successful—finishing setup…"
                            : `Continue with ${Selected}` }
                    </Button>
                    <Button Appearance="Link" Disabled={ IsBusy } OnPress={ () => void RestorePurchases() }>
                        Restore purchases
                    </Button>
                    { IsFinishingPurchase
                        ? (
                            <Button Appearance="Link" OnPress={ () => void RetrySetup() }>
                                Retry setup
                            </Button>
                        )
                        : null }

                    <Description>
                        By purchasing, you agree to the store billing terms and Notivex policies.
                    </Description>
                    <View style={ Styles.Links }>
                        <Button Appearance="Link" OnPress={ () => void Linking.openURL(TermsUrl) }>Terms</Button>
                        <Button Appearance="Link" OnPress={ () => void Linking.openURL(PrivacyUrl) }>Privacy</Button>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

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
