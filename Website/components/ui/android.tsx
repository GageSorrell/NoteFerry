/**
 * A realistic Android device frame rendered as pure SVG — rounded body,
 * front camera cutout, and a screen area that clips whatever media (or
 * placeholder) is passed in to the correct rounded shape.
 *
 * Adapted from Magic UI's MIT-licensed `Android` component
 * (https://github.com/magicuidesign/magicui — apps/www/registry/magicui/android.tsx).
 * The upstream version embeds media directly inside the SVG via
 * `<image>`/`<foreignObject>`; this version instead overlays an HTML
 * `<img>`/`<video>`/placeholder on top of the bezel SVG, mirroring
 * `components/ui/iphone.tsx` so both device frames share one shape of
 * API (`src`, `videoSrc`, `alt`, `placeholder`) for `PhoneFrame` to swap
 * between.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const PHONE_WIDTH = 380;
const PHONE_HEIGHT = 830;
const SCREEN_X = 9;
const SCREEN_Y = 14;
const SCREEN_WIDTH = 360;
const SCREEN_HEIGHT = 800;
const SCREEN_RADIUS_X = 33;
const SCREEN_RADIUS_Y = 25;

const LEFT_PCT = (SCREEN_X / PHONE_WIDTH) * 100;
const TOP_PCT = (SCREEN_Y / PHONE_HEIGHT) * 100;
const WIDTH_PCT = (SCREEN_WIDTH / PHONE_WIDTH) * 100;
const HEIGHT_PCT = (SCREEN_HEIGHT / PHONE_HEIGHT) * 100;
const RADIUS_H = (SCREEN_RADIUS_X / SCREEN_WIDTH) * 100;
const RADIUS_V = (SCREEN_RADIUS_Y / SCREEN_HEIGHT) * 100;

export interface AndroidProps extends HTMLAttributes<HTMLDivElement>
{
    src?: string;
    videoSrc?: string;
    alt?: string;
    placeholder?: ReactNode;
}

export function Android({ src, videoSrc, alt, placeholder, className, style, ...props }: AndroidProps)
{
    const hasVideo = !!videoSrc;
    const hasMedia = hasVideo || !!src;
    const screenStyle = {
        borderRadius: `${ RADIUS_H }% / ${ RADIUS_V }%`,
        height: `${ HEIGHT_PCT }%`,
        left: `${ LEFT_PCT }%`,
        top: `${ TOP_PCT }%`,
        width: `${ WIDTH_PCT }%`
    };

    return (
        <div
            className={ cn("relative inline-block w-full align-middle leading-none", className) }
            style={ { aspectRatio: `${ PHONE_WIDTH }/${ PHONE_HEIGHT }`, ...style } }
            { ...props }>
            { hasVideo
                ? (
                    <div className="pointer-events-none absolute z-0 overflow-hidden" style={ screenStyle }>
                        <video
                            autoPlay
                            className="block size-full object-cover"
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            src={ videoSrc } />
                    </div>
                )
                : null }

            { !hasVideo && src
                ? (
                    <div className="pointer-events-none absolute z-0 overflow-hidden" style={ screenStyle }>
                        <img
                            alt={ alt ?? "" }
                            className="block size-full object-cover object-top"
                            src={ src } />
                    </div>
                )
                : null }

            { !hasMedia && placeholder
                ? (
                    <div className="pointer-events-none absolute z-0 overflow-hidden" style={ screenStyle }>
                        { placeholder }
                    </div>
                )
                : null }

            <svg
                className="absolute inset-0 size-full"
                fill="none"
                style={ { transform: "translateZ(0)" } }
                viewBox={ `0 0 ${ PHONE_WIDTH } ${ PHONE_HEIGHT }` }
                xmlns="http://www.w3.org/2000/svg">
                <path
                    className="fill-[#e5e5e5] dark:fill-[#404040]"
                    d="M376 153H378C379.105 153 380 153.895 380 155V249C380 250.105 379.105 251 378 251H376V153Z" />
                <path
                    className="fill-[#e5e5e5] dark:fill-[#404040]"
                    d="M376 301H378C379.105 301 380 301.895 380 303V351C380 352.105 379.105 353 378 353H376V301Z" />
                <path
                    className="fill-[#e5e5e5] dark:fill-[#404040]"
                    d="M0 42C0 18.8041 18.804 0 42 0H336C359.196 0 378 18.804 378 42V788C378 811.196 359.196 830 336 830H42C18.804 830 0 811.196 0 788V42Z" />
                <path
                    className="fill-white dark:fill-[#262626]"
                    d="M2 43C2 22.0132 19.0132 5 40 5H338C358.987 5 376 22.0132 376 43V787C376 807.987 358.987 825 338 825H40C19.0132 825 2 807.987 2 787V43Z" />

                <path
                    className="fill-[#e5e5e5] stroke-[#e5e5e5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
                    d={ `M${ SCREEN_X }.25 48C${ SCREEN_X }.25 29.3604 24.3604 14.25 43 14.25H335`
                        + "C353.64 14.25 368.75 29.3604 368.75 48V780C368.75 798.64 353.64 813.75 335 813.75"
                        + "H43C24.3604 813.75 9.25 798.64 9.25 780V48Z" }
                    mask={ hasMedia || placeholder ? "url(#screenPunch)" : undefined } />

                <circle className="fill-white dark:fill-[#262626]" cx="189" cy="28" r="9" />
                <circle className="fill-[#e5e5e5] dark:fill-[#404040]" cx="189" cy="28" r="4" />

                <defs>
                    <mask id="screenPunch" maskUnits="userSpaceOnUse">
                        <rect fill="white" height={ PHONE_HEIGHT } width={ PHONE_WIDTH } x="0" y="0" />
                        <rect
                            fill="black"
                            height={ SCREEN_HEIGHT }
                            rx={ SCREEN_RADIUS_X }
                            ry={ SCREEN_RADIUS_Y }
                            width={ SCREEN_WIDTH }
                            x={ SCREEN_X }
                            y={ SCREEN_Y } />
                    </mask>
                </defs>
            </svg>
        </div>
    );
}
