/**
 * Feedback / bug-report screen. One shared screen reached two ways from
 * Settings — "Submit feedback" and "Report a bug" — distinguished only by
 * the expo-router header text, driven by the `mode` param. Submitting
 * uploads a row to `app.feedback_submissions`, which emails NoteFerry via
 * Resend (`supabase/schemas/11_notifications.sql`); the server also
 * enforces a basic per-user rate limit.
 *
 * @module noteferry/app/feedback
 *
 * @file      feedback.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Alert, ScrollView, View } from "react-native";
import { Body, Description, LabelText } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import { Checkbox } from "@noteferry/ui/Primitive/Checkbox";
import { Textarea } from "@noteferry/ui/Primitive/Textarea";
import { MakeStyles, TextStyle, Token, ViewStyle } from "@noteferry/ui/Core";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SubmitFeedback } from "@/Domain/Runtime/NoteFerryApi";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useTranslation } from "react-i18next";

const MinimumMessageLength = 12;
const MaximumMessageLength = 4_000;

const IsBugReportMode = (Mode: string | undefined): boolean => Mode === "bug";

/* Finds a tagged domain error (e.g. `RateLimitExceeded`) buried inside an
 * Effect `FiberFailure`/`Cause`, the same way `create-page.tsx` does for
 * `FreeCreationWindowExceeded`. */
const FindTaggedError = (Error_: unknown): Record<string, unknown> | null =>
{
    const Seen = new Set<unknown>();
    const Queue: unknown[] = [ Error_ ];

    while (Queue.length > 0)
    {
        const Current = Queue.shift();
        if (!Current || typeof Current !== "object" || Seen.has(Current)) continue;
        Seen.add(Current);
        const Record_ = Current as Record<string, unknown>;
        if (typeof Record_._tag === "string") return Record_;
        Queue.push(Record_.cause, Record_.error, Record_.failure);
    }

    return null;
};

const FeedbackScreen = (): React.JSX.Element =>
{
    const Router = useLazyRouter();
    const Styles = useStyles();
    const { t } = useTranslation("feedback");
    const Params = useLocalSearchParams<{ mode?: string }>();
    const IsBugReport = IsBugReportMode(Params.mode);
    const HeaderTitle = IsBugReport ? t("titles.bugReport") : t("titles.feedback");

    const [ Message, SetMessage ] = useState("");
    const [ ShareContact, SetShareContact ] = useState(true);
    const [ IsSubmitting, SetIsSubmitting ] = useState(false);

    const TrimmedLength = Message.trim().length;
    const CanSubmit = TrimmedLength >= MinimumMessageLength && !IsSubmitting;

    const HandleSubmit = useCallback(async (): Promise<void> =>
    {
        if (!CanSubmit) return;

        SetIsSubmitting(true);

        try
        {
            await SubmitFeedback({
                Kind: IsBugReport ? "BugReport" : "Feedback",
                Message: Message.trim(),
                ShareContact
            });

            Alert.alert(
                t("alert.success.title"),
                IsBugReport
                    ? t("alert.success.bugReport")
                    : t("alert.success.feedback")
            );
            Router.back();
        }
        catch (Error_)
        {
            const Tagged = FindTaggedError(Error_);

            if (Tagged?._tag === "RateLimitExceeded")
            {
                Alert.alert(
                    t("alert.rateLimit.title"),
                    t("alert.rateLimit.message")
                );
            }
            else
            {
                /* eslint-disable-next-line no-console */
                console.error("Failed to submit feedback", Error_);
                Alert.alert(t("alert.failure.title"), t("alert.failure.message"));
            }
        }
        finally
        {
            SetIsSubmitting(false);
        }
    }, [ CanSubmit, IsBugReport, Message, Router, ShareContact, t ]);

    return (
        <View style={ Styles.Container }>
            <Stack.Screen options={ { headerShown: true, title: HeaderTitle } } />
            <SafeAreaView style={ Styles.SafeArea }>
                <Description Style={ Styles.Subtitle }>
                    { IsBugReport
                        ? t("subtitle.bugReport")
                        : t("subtitle.feedback") }
                </Description>

                <ScrollView
                    contentContainerStyle={ Styles.Form }
                    keyboardShouldPersistTaps="handled"
                    style={ Styles.Scroll }>
                    <Textarea
                        AccessibilityLabel={ IsBugReport
                            ? t("message.accessibilityLabel.bugReport")
                            : t("message.accessibilityLabel.feedback") }
                        Disabled={ IsSubmitting }
                        MaxLength={ MaximumMessageLength }
                        NumberOfLines={ 8 }
                        OnChangeText={ SetMessage }
                        Placeholder={ IsBugReport
                            ? t("message.placeholder.bugReport")
                            : t("message.placeholder.feedback") }
                        Style={ Styles.Message }
                        Value={ Message }
                    />
                    <LabelText Style={ Styles.Hint }>
                        { TrimmedLength < MinimumMessageLength
                            ? t("message.hint.belowMinimum", { count: TrimmedLength, min: MinimumMessageLength })
                            : t("message.hint.atMinimum", { count: TrimmedLength }) }
                    </LabelText>

                    <View style={ Styles.ShareRow }>
                        <Checkbox
                            AccessibilityLabel={ t("shareContact.accessibilityLabel") }
                            Checked={ ShareContact }
                            Disabled={ IsSubmitting }
                            OnCheckedChange={ SetShareContact }
                        />
                        <Body Style={ Styles.ShareLabel }>
                            { t("shareContact.label") }
                        </Body>
                    </View>

                    <Button
                        Appearance="Blue"
                        Disabled={ !CanSubmit }
                        Loading={ IsSubmitting }
                        OnPress={ () => void HandleSubmit() }
                        Style={ Styles.Submit }>
                        { t("submit") }
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const useStyles = MakeStyles({
    Container: ViewStyle({
        backgroundColor: Token.Semantic.BackgroundSidebar,
        flex: 1
    }),
    Form: ViewStyle({
        gap: Token.Spacing.M,
        paddingVertical: Token.Spacing.L
    }),
    Hint: TextStyle({
        marginTop: -4
    }),
    Message: TextStyle({
        minHeight: 160
    }),
    SafeArea: ViewStyle({
        flex: 1,
        paddingHorizontal: Token.Spacing.Xl,
        paddingVertical: Token.Spacing.L
    }),
    Scroll: ViewStyle({
        alignSelf: "stretch",
        flex: 1
    }),
    ShareLabel: TextStyle({
        flex: 1
    }),
    ShareRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.M
    }),
    Submit: ViewStyle({
        marginTop: Token.Spacing.M,
        minHeight: Token.Size.Control.Large
    }),
    Subtitle: TextStyle({
        marginBottom: Token.Spacing.S
    })
});

export default FeedbackScreen;
