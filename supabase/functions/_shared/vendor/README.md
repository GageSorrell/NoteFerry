# Vendored workspace packages (`@noteferry/domain`, `@noteferry/api`, `@noteferry/notion-markdown`)

`domain.js` and `api.js` are **generated** single-file ESM bundles of the built `@noteferry/domain` and `@noteferry/api` packages, with `effect` (and `@noteferry/domain` for `api.js`) left external so they resolve via the function `deno.json` import map.

They exist because the Supabase Edge (Deno) bundler cannot import files outside the `supabase/` directory. Vendoring keeps the contracts inside `supabase/functions/`, resolvable by both `supabase functions serve` and deploy.

`notion-markdown.js` is the corresponding pure conversion bundle used by the server's Notion adapter. Its official Notion SDK imports are type-only and do not add a runtime dependency to the edge function.

## Regenerate

Run whenever `@noteferry/domain` or `@noteferry/api` change (rebuild the packages first):

```sh
npm run build --workspace @noteferry/domain
npm run build --workspace @noteferry/api
npm run build --workspace @noteferry/notion-markdown

npx esbuild Package/Domain/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' \
  --outfile=supabase/functions/_shared/vendor/domain.js

npx esbuild Package/Api/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' --external:@noteferry/domain \
  --outfile=supabase/functions/_shared/vendor/api.js

npx esbuild Package/NotionMarkdown/Distribution/index.js --bundle --format=esm \
  --platform=neutral \
  --outfile=supabase/functions/_shared/vendor/notion-markdown.js
```

Then redeploy: `npx supabase functions deploy api --project-ref <ref>`.
