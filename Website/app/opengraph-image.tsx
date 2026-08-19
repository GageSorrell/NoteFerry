/**
 * Generates the social share card via Next's metadata-route convention,
 * so no external design tool or static asset is needed for the OG image.
 *
 * @file      opengraph-image.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site-config";

export/** The generated image's pixel dimensions. */
const size = { height: 630, width: 1200 };

export/** The generated image's content type. */
const contentType = "image/png";

/**
 * Renders the OG card: dark background, the tagline, and the site name.
 */
export default function OpengraphImage()
{
    return new ImageResponse(
        (
            <div
                style={ {
                    alignItems: "flex-start",
                    background: "#191919",
                    color: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "sans-serif",
                    height: "100%",
                    justifyContent: "center",
                    padding: "96px",
                    width: "100%"
                } }>
                <div
                    style={ {
                        background: "rgb(35,131,226)",
                        borderRadius: 9999,
                        display: "flex",
                        fontSize: 24,
                        fontWeight: 600,
                        padding: "10px 28px"
                    } }>
                    { siteConfig.name }
                </div>
                <div style={ { display: "flex", fontSize: 72, fontWeight: 700, marginTop: 40 } }>
                    { siteConfig.tagline }
                </div>
                <div
                    style={ {
                        color: "rgba(255,255,255,0.6)",
                        display: "flex",
                        fontSize: 28,
                        marginTop: 24,
                        maxWidth: 900
                    } }>
                    { siteConfig.description }
                </div>
            </div>
        ),
        { ...size }
    );
}
