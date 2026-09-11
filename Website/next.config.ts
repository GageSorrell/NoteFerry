/**
 * Next.js configuration for the NoteFerry marketing website.
 *
 * The site is fully static (no server actions, no dynamic routes, no
 * environment-dependent data), so no custom `images`/`redirects` config is
 * needed today — Vercel's default Next.js build handles this project with
 * zero additional configuration beyond the security headers below.
 *
 * @file      next.config.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { NextConfig } from "next";

/*
 * Allows Next's own hydration/inline scripts (`'unsafe-inline'` — a strict
 * nonce-based policy isn't practical for a fully static export) plus the
 * two third parties this site actually loads client-side:
 * `googletagmanager.com`/`google-analytics.com` for `GoogleAnalytics`
 * (only ever loaded after cookie consent), and the NoteFerry Supabase
 * project for `/delete-account`'s sign-in and delete call.
 */
const SupabaseOrigin = "https://mbstkyukxldzhwmnsall.supabase.co";
const ContentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self' data:",
    `connect-src 'self' ${ SupabaseOrigin } https://www.google-analytics.com `
        + "https://www.googletagmanager.com https://region1.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
].join("; ");

const config: NextConfig = {
    async headers()
    {
        return [
            {
                headers: [
                    { key: "Content-Security-Policy", value: ContentSecurityPolicy },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload"
                    }
                ],
                source: "/:path*"
            }
        ];
    }
};

export default config;
