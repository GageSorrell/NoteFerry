# Rich Notion body editing and compatibility notices

## Summary

Add `@noteferry/notion-markdown` under `Package/` and a Notion-style block editor under `@noteferry/ui/rich-editor`.

The editor will use `react-native-enriched-markdown` for rich inline text input, Markdown rendering, selection, links, and native formatting menus. Its current native input is strongest for inline styles and links, so block-level controls will be composed around it. The package requires React Native New Architecture and an Expo native rebuild. ([Enriched Markdown README](https://github.com/software-mansion/enriched-markdown/blob/main/packages/react-native-enriched-markdown/README.md))

`notion-x-to-md` will be used only as a conversion-design reference, never as a dependency or unofficial Notion client. ([notion-x-to-md](https://github.com/NotionX/react-notion-x/tree/master/packages/notion-x-to-md))

## Implementation changes

- Create `@noteferry/notion-markdown` with:
  - Official Notion block and rich-text types only.
  - `NotionBlocksToMarkdown(blocks, options)` with omission-by-default behavior and `FailOnUnsupported: true` support.
  - `MarkdownToNotionBlocks(markdown)` producing official API-compatible block objects.
  - A shared unsupported-element descriptor containing block type, display label, count, and reason (`NotionApi`, `NoteFerry`, or `Unknown`).
  - Recursive support for the official `POST /v1/pages` `children` union, including paragraphs, headings, lists, to-dos, quotes, code, equations, dividers, tables, images, files, audio, video, PDFs, columns, callouts, toggles, embeds, bookmarks, synced blocks, breadcrumbs, tabs, table of contents, templates, and page links. Types returned by Notion but not accepted by the official create-page API will be explicitly unsupported. ([Create a page](https://developers.notion.com/reference/post-page), [Block reference](https://developers.notion.com/reference/block))
  - Round-trip fixtures for Notion-flavored Markdown constructs such as `<callout>`, `<details>`, `<table>`, media tags, columns, and unknown elements. ([Working with Markdown content](https://developers.notion.com/guides/data-apis/working-with-markdown-content))

- Extend the server’s official Notion adapter:
  - Retrieve template block children recursively with pagination.
  - Convert template blocks through `@noteferry/notion-markdown`.
  - Cache each template’s supported `BodyMarkdown` and unsupported-element descriptors alongside its existing properties.
  - Keep template refresh best-effort; if body inspection fails, preserve the template but mark body inspection unavailable rather than inventing a warning.
  - Convert the create-page `Body` field from enriched Markdown to blocks with strict unsupported validation.
  - Send blocks through the official API only; chunk top-level children at the API’s limit and append additional chunks through the official block-children endpoint. ([Create a page](https://developers.notion.com/reference/post-page))

- Update the domain/cache schemas:
  - Add template body Markdown and unsupported-element metadata.
  - Bump the cached data-source schema version and provide a migration/default transform for existing templates.
  - Preserve the existing `Body` command field for compatibility, but document it as enriched Markdown rather than plain text.

- Add `@noteferry/ui/rich-editor`:
  - Block list state with insertion, deletion, reordering, nesting, and block-type conversion.
  - `EnrichedMarkdownTextInput` for text-bearing blocks and `EnrichedMarkdownText` for rendered content.
  - Notion-like slash/block picker, inline formatting controls, link controls, checkbox/list controls, and a keyboard accessory bar.
  - Selection/cursor actions positioned using the native input’s selection state.
  - Theme all controls through existing `@noteferry/ui` tokens and primitives.
  - Expose controlled Markdown value plus callbacks for change, focus, selection, and support metadata.

- Update the create-page screen:
  - Replace the plain `Textarea` with the rich editor.
  - Materialize the selected template’s supported body content into the editor.
  - Include template-body edits in dirty-state and template-switch collision handling.
  - Send the editor’s enriched Markdown through the existing page-create command.
  - Add a subtle upper-right overlay button: question-mark icon by default, yellow warning icon when the selected template contains unsupported elements.
  - Add a shared support bottom sheet. Its message should primarily explain Notion API limitations, while separately identifying any elements omitted because of NoteFerry implementation complexity.
  - Show the selected template’s omitted element list above the collapsed global unsupported-element list.

- Update database settings:
  - Add a yellow warning icon button beside any template whose cached body contains unsupported elements.
  - Reuse the same support sheet with database-settings wording.
  - Keep this template-row warning independent of the create-page overlay visibility setting.

- Add the app-wide boolean setting `ShowRichEditorSupportNotices`, defaulting to `true`.
  - Add it to `AppSettings`, `ResolvedAppSettings`, defaults, persistence, and general settings UI.
  - When false, hide only the question/warning overlay buttons over the create-page editor.
  - Add localized strings to every existing locale and extend the i18n parity tests.

## Validation

- Unit-test every supported block conversion, nested children, annotations, links, Markdown round trips, media URLs, tables, columns, and 2,000-character rich-text chunking.
- Test unsupported conversion omission by default and failure when `FailOnUnsupported` is enabled.
- Test template refresh caching, schema migration, body-inspection failures, warning counts, and strict create validation.
- Test create-page requests contain only official Notion API shapes and correctly chunk large bodies.
- React Native tests should cover editor insertion/reordering, inline formatting, keyboard toolbar behavior, template materialization, collision prompts, icon substitution, collapsed lists, sheet wording, and the default/disabled visibility setting.
- Perform emulator QA with `agent-device`: inspect Notion’s body editor, keyboard accessory bar, cursor/selection controls, and equivalent NoteFerry flows; capture screenshots for visual comparison and verify accessibility labels.

## Assumptions and constraints

- The selected template behavior is to materialize supported content into NoteFerry’s editor and create explicit page children, not send Notion’s `template_id`; this is necessary because Notion forbids combining template application with explicit children. ([Create a page](https://developers.notion.com/reference/post-page))
- Existing plain body strings remain valid Markdown paragraphs.
