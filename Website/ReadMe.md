# `noteferry.sorrell.sh`

The marketing website for [NoteFerry](https://noteferry.sorrell.sh): a landing
page plus placeholder `/terms` and `/privacy` pages, built with Next.js
(App Router), Tailwind CSS v4, and shadcn/ui.

Almost everything here is static content — no API routes, no server-side
data fetching. The one exception is `/delete-account`, Google Play's
required web-based account-deletion page: it signs the visitor in with
Notion (reusing the same Supabase Auth provider the mobile app uses) and
calls the existing `DELETE /Account/` edge function directly from the
browser. That page is the only thing that needs the environment variables
below. NoteFerry targets four stores (Microsoft Store, Google
Play, Mac App Store, App Store); all four currently link to `#`
placeholders (see `content/site-config.ts`'s `storeUrls`) until the
corresponding build is published. The hero and closing CTA each show only
two of the four badges, guessed from the visitor's `User-Agent` (see
`lib/platform.ts` and `components/site/store-badges.tsx`); the full set
always stays reachable from the platforms table near the bottom of the
page (`components/site/sections/platforms.tsx`).

## Environment variables

Only `/delete-account` needs these — see `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL` — the NoteFerry Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — its publishable anon key (safe
  client-side; the API it talks to enforces auth and RLS server-side).

## Development

Run everything from the **repo root** (`e:\NoteFerry`), since this workspace
is part of the root npm workspace and shares its `package-lock.json`:

```sh
npm install
npm run dev --workspace=Website
```

Other scripts, also run with `--workspace=Website` from the root (or `npm
run <script>` from inside this directory):

- `build` — production build (`next build`)
- `start` — serve the production build (`next start`)
- `lint` — ESLint, using the monorepo's shared `Configuration/eslint.config.js`
- `typecheck` — `tsc --noEmit`

## Adding real screenshots / recordings

The hero and showcase sections render `PhoneFrame`/`BrowserFrame`
placeholders (`components/site/mockup/`) until given a real `src`. To swap
one in: drop the file into `public/screenshots/` and pass its path as the
`src` prop wherever that mockup is used (e.g. `components/site/sections/hero.tsx`).

## Deploying to Vercel

No `vercel.json` is needed. In the Vercel dashboard, create a project from
this repository and set:

- **Root Directory**: `Website`
- **Framework Preset**: Next.js (auto-detected)
- **Node.js Version**: 24.x (matches the repo's `.nvmrc` / `engines.node`)
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see "Environment variables" above) —
  everything else needs none
- *(optional)* **Ignored Build Step**: `git diff --quiet HEAD^ HEAD -- Website`,
  so pushes that only touch other workspaces (e.g. `Application/Mobile`)
  don't trigger a redeploy of this site.

Vercel should auto-detect the npm workspace and install from the root
lockfile; confirm this on the first deploy's build log.

### Domain

In **Settings → Domains**, add `noteferry.sorrell.sh`. Vercel will present a
`CNAME` target (typically `cname.vercel-dns.com`) — add that as a `CNAME`
record for the `noteferry` host at whatever DNS provider hosts `sorrell.sh`.
This is a manual step outside this repository.
