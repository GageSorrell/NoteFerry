# Vendored contracts (`@noteferry/domain`, `@noteferry/api`)

`domain.js` and `api.js` are **generated** single-file ESM bundles of the built
`@noteferry/domain` and `@noteferry/api` packages, with `effect` (and `@noteferry/domain`
for `api.js`) left external so they resolve via the function `deno.json` import map.

They exist because the Supabase Edge (Deno) bundler cannot import files outside the
`supabase/` directory. Vendoring keeps the contracts inside `supabase/functions/`,
resolvable by both `supabase functions serve` and deploy.

## Regenerate

Run whenever `@noteferry/domain` or `@noteferry/api` change (rebuild the packages first):

```sh
npm run build --workspace @noteferry/domain
npm run build --workspace @noteferry/api

npx esbuild Package/Domain/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' \
  --outfile=supabase/functions/_shared/vendor/domain.js

npx esbuild Package/Api/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' --external:@noteferry/domain \
  --outfile=supabase/functions/_shared/vendor/api.js
```

Then redeploy: `npx supabase functions deploy api --project-ref <ref>`.
