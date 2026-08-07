/**
 *
 *
 * @module notivex/components/external-link
 *
 * @file      external-link.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { ComponentProps, MouseEvent } from "react";
import { type Href, Link } from "expo-router";
import { WebBrowserPresentationStyle, openBrowserAsync } from "expo-web-browser";
import type { GestureResponderEvent } from "react-native";

/* eslint-disable jsdoc/require-jsdoc */

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props)
{
    return (
        <Link
            { ...{ ...rest, href } }
            onPress={ async (event: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) =>
            {
                if (process.env.EXPO_OS !== "web")
                {
                    event.preventDefault();
                    await openBrowserAsync(
                        href,
                        {
                            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC
                        }
                    );
                }
            } }
            target="_blank"
        />
    );
}
