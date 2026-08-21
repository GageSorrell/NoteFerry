# `notivex.sorrell.sh`

The marketing website for [Notivex](https://notivex.sorrell.sh): a landing
page plus placeholder `/terms` and `/privacy` pages, built with Next.js
(App Router), Tailwind CSS v4, and shadcn/ui.

This is a fully static site — no environment variables, no API routes, no
backend calls. The App Store / Play Store buttons currently link to `#`
placeholders (see `content/site-config.ts`'s `storeUrls`) until the app is
published.

## Development

Run everything from the **repo root** (`e:\Notivex`), since this workspace
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
- **Environment Variables**: none
- *(optional)* **Ignored Build Step**: `git diff --quiet HEAD^ HEAD -- Website`,
  so pushes that only touch other workspaces (e.g. `Application/Mobile`)
  don't trigger a redeploy of this site.

Vercel should auto-detect the npm workspace and install from the root
lockfile; confirm this on the first deploy's build log.

### Domain

In **Settings → Domains**, add `notivex.sorrell.sh`. Vercel will present a
`CNAME` target (typically `cname.vercel-dns.com`) — add that as a `CNAME`
record for the `notivex` host at whatever DNS provider hosts `sorrell.sh`.
This is a manual step outside this repository.
