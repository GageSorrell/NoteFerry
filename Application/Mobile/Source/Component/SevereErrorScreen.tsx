/**
 * The branded full-screen fallback for Severe errors, shared by `App/error.tsx`
 * (the async Severe path -- `PresentError` -> `router.push("/error")`) and
 * `ErrorBoundary.tsx` (the synchronous render-crash path, which renders this
 * inline rather than navigating -- see that file's doc comment for why).
 * Modeled on `RestoringSessionScreen.tsx`'s branded full-screen pattern.
 *
 * @module noteferry/Component/SevereErrorScreen
 *
 * @file      SevereErrorScreen.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import * as MailComposer from "expo-mail-composer";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronUp from "lucide-react-native/icons/chevron-up";
import ExternalLink from "lucide-react-native/icons/external-link";
import type React from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button } from "@noteferry/ui/Primitive/Button";
import { ButtonLabel, Caption, Description, EmptyStateTitle, LabelText } from "@noteferry/ui/Primitive/Text";
import { Image } from "expo-image";
import { Screen } from "./Screen";
import type { Thunk } from "@sorrell/effect/Function";
import { useCallback, useState } from "react";
import { useTheme } from "@noteferry/ui/Core";
import { useTranslation } from "react-i18next";

/** {@inheritDoc SevereErrorScreen} */
export interface SevereErrorScreenProps
{
    /** Re-attempts recovery. What this means differs by caller -- see the module doc. */
    readonly OnRetry: Thunk;

    /**
     * The underlying error's message, if one is available. Shown in a
     * collapsed-by-default, monospace disclosure rather than inline, so it
     * doesn't compete with the plain-language message above it -- most
     * people never need to open it, but it's there for anyone reporting the
     * problem to support.
     */
    readonly ErrorDetail?: string | undefined;
}

export/**
       * @category Component
       * @since 1.0.0
       */
const SevereErrorScreen = ({ OnRetry, ErrorDetail }: SevereErrorScreenProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const { t } = useTranslation("errors");
    const [ IsDetailExpanded, SetIsDetailExpanded ] = useState(false);
    const HasErrorDetail = ErrorDetail !== undefined && ErrorDetail.trim().length > 0;

    const OnContactSupport = useCallback(async (): Promise<void> =>
    {
        const IsAvailable = await MailComposer.isAvailableAsync();

        if (!IsAvailable)
        {
            Alert.alert(
                t("severe.mail.unavailableTitle"),
                t("severe.mail.unavailableMessage")
            );

            return;
        }

        const body = Application.nativeApplicationVersion !== null && Application.nativeBuildVersion !== null
            ? t("severe.mail.body", {
                build: Application.nativeBuildVersion,
                version: Application.nativeApplicationVersion
            })
            : undefined;

        await MailComposer.composeAsync({
            body,
            recipients: [ "noteferry@sorrell.sh" ],
            subject: t("severe.mail.subject")
        });
    }, [ t ]);

    return (
        <Screen OuterProps={ { style: { backgroundColor: Theme.Semantic.BackgroundMain } } }>
            <View
                accessibilityLabel={ t("severe.title") }
                style={ {
                    alignItems: "center",
                    flex: 1,
                    gap: 20,
                    justifyContent: "center",
                    paddingHorizontal: 32
                } }>
                <Image
                    source={ Theme.Mode === "Dark"
                        ? require("../../Resource/Logo/NoteFerryLogoDark.png")
                        : require("../../Resource/Logo/NoteFerryLogoLight.png") }
                    style={ { height: 56, width: 56 } }
                />
                <View style={ { alignItems: "center", gap: 8 } }>
                    <EmptyStateTitle Style={ { textAlign: "center" } }>
                        { t("severe.title") }
                    </EmptyStateTitle>
                    <Description Style={ { textAlign: "center" } }>
                        { t("severe.message") }
                    </Description>
                </View>
                <View style={ { flexDirection: "row", gap: 12 } }>
                    <Button Appearance="Primary" OnPress={ OnRetry } Size="Small">
                        { t("severe.retry") }
                    </Button>
                    <Button Appearance="Link" OnPress={ () => void OnContactSupport() } Size="Small">
                        <ButtonLabel Color={ Theme.Semantic.Primary }>
                            { t("severe.contactSupport") }
                        </ButtonLabel>
                        {/* Signals that this opens the device's email app rather than
                          * navigating within NoteFerry -- same icon/sizing "Leave a
                          * review" uses in `settings.tsx` for the same reason. */}
                        <ExternalLink
                            color={ Theme.Semantic.Primary }
                            size={ 14 }
                            strokeWidth={ 1.8 }
                        />
                    </Button>
                </View>
                { HasErrorDetail && (
                    <View style={ { alignSelf: "stretch" } }>
                        {/* A `Button` (gesture-handler-backed, like "Try again"/"Contact
                          * support" above), not the bare `@noteferry/ui` `Pressable` used
                          * for this same disclosure pattern in `template-section.tsx` --
                          * confirmed live that a plain RN `Pressable` silently stops
                          * receiving touches specifically when reached through
                          * `ErrorBoundary`'s crash-recovery render path (a real device
                          * install, real ADB touch events, isolated with a minimal
                          * reproduction outside ErrorBoundary that worked fine). Likely an
                          * RN/Fabric responder-reattachment quirk after an error-boundary
                          * recovery, not something fixable at this call site -- `Button`
                          * sidesteps it by using gesture-handler's touch system instead of
                          * RN's built-in responder system. */}
                        <Button
                            Appearance="Link"
                            AccessibilityLabel={ t("severe.errorDetails") }
                            OnPress={ () => SetIsDetailExpanded((Current: boolean) => !Current) }
                            Size="Small"
                            Style={ {
                                alignItems: "center",
                                alignSelf: "center",
                                flexDirection: "row",
                                gap: 4
                            } }>
                            <LabelText Color={ Theme.Semantic.Muted }>
                                { t("severe.errorDetails") }
                            </LabelText>
                            { IsDetailExpanded
                                ? <ChevronUp color={ Theme.Semantic.Muted } size={ 16 } />
                                : <ChevronDown color={ Theme.Semantic.Muted } size={ 16 } /> }
                        </Button>
                        { IsDetailExpanded && (
                            <ScrollView
                                style={ {
                                    backgroundColor: Theme.Semantic.BackgroundInput,
                                    borderColor: Theme.Semantic.Border,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    maxHeight: 160,
                                    padding: 12
                                } }>
                                <Caption
                                    Color={ Theme.Semantic.Muted }
                                    Family="Mono"
                                    selectable>
                                    { ErrorDetail }
                                </Caption>
                            </ScrollView>
                        ) }
                    </View>
                ) }
            </View>
        </Screen>
    );
};

SevereErrorScreen.displayName = "SevereErrorScreen";
