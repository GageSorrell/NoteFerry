# Vendored workspace packages (`@noteferry/domain`, `@noteferry/api`, `@noteferry/notion-markdown`, `@noteferry/react-native-notion-markdown/Core`)

`domain.js` and `api.js` are **generated** single-file ESM bundles of the built `@noteferry/domain` and `@noteferry/api` packages, with `effect` (and `@noteferry/domain` for `api.js`) left external so they resolve via the function `deno.json` import map.

They exist because the Supabase Edge (Deno) bundler cannot import files outside the `supabase/` directory. Vendoring keeps the contracts inside `supabase/functions/`, resolvable by both `supabase functions serve` and deploy.

`notion-markdown.js` is the corresponding pure conversion bundle used by the server's Notion adapter. Its official Notion SDK imports are type-only and do not add a runtime dependency to the edge function. It converts the bodies of page-creation commands that carry no `BodyFormat`, which come from clients that predate the field.

`notion-markdown-core.js` is the React-free `./Core` entry of `@noteferry/react-native-notion-markdown`: the block editor's own parser, serializer, and Notion bridge, plus the request planner that splits a body across Create Page and Append Block Children calls. It converts `PlainText` and `NotionMarkdown` bodies, so the server reads the editor's Markdown with the same code that wrote it. It has no runtime dependencies at all.

## Regenerate

Run whenever `@noteferry/domain`, `@noteferry/api`, `@noteferry/notion-markdown`, or the parser, serializer, or Notion bridge of `@noteferry/react-native-notion-markdown` change (rebuild the packages first):

```sh
npm run build --workspace @noteferry/domain
npm run build --workspace @noteferry/api
npm run build --workspace @noteferry/notion-markdown
npm run build --workspace @noteferry/react-native-notion-markdown

npx esbuild Package/Domain/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' \
  --outfile=supabase/functions/_shared/vendor/domain.js

npx esbuild Package/Api/Distribution/index.js --bundle --format=esm \
  --platform=neutral --external:effect --external:'effect/*' --external:@noteferry/domain \
  --outfile=supabase/functions/_shared/vendor/api.js

npx esbuild Package/NotionMarkdown/Distribution/index.js --bundle --format=esm \
  --platform=neutral \
  --outfile=supabase/functions/_shared/vendor/notion-markdown.js

npx esbuild Package/ReactNativeNotionMarkdown/Distribution/Core.js --bundle --format=esm   --platform=neutral   --outfile=supabase/functions/_shared/vendor/notion-markdown-core.js
```

Each bundle is mapped to its package name in the function's `deno.json` import map; a new bundle needs a new entry there.

## Check

```sh
npm run check:functions
```

This type-checks the edge functions against the built packages and runs the workspace-only tests in `supabase/functions/_typecheck`. One of them rebuilds `notion-markdown-core.js` in memory and fails if the vendored file differs, so a stale bundle is caught before it is deployed.

Then redeploy: `npx supabase functions deploy api --project-ref <ref>`.
