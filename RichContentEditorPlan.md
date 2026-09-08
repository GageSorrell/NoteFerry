# Rich Notion body editing and compatibility notices

## Summary

Add `@noteferry/notion-markdown` under `Package/` and a Notion-style block editor under `@noteferry/ui/rich-editor`.

The editor is built around a single `react-native-enriched-markdown` `EnrichedMarkdownTextInput` instance holding the entire document — not one input instance orchestrated per block, which would only produce the illusion of a single editor. Block-level controls (type conversion, indentation, and the block picker) are composed around that one input's own selection state rather than around separately-managed component instances. The package requires React Native New Architecture and an Expo native rebuild. ([Enriched Markdown README](https://github.com/software-mansion/enriched-markdown/blob/main/packages/react-native-enriched-markdown/README.md))

`notion-x-to-md` will be used only as a conversion-design reference, never as a dependency or unofficial Notion client. ([notion-x-to-md](https://github.com/NotionX/react-notion-x/tree/master/packages/notion-x-to-md))

`@noteferry/notion-markdown` parses and serializes GitHub-Flavored Markdown (GFM) syntax where it maps directly onto a supported construct — strikethrough and autolinks for links. Nothing in the supported subset needs a custom NoteFerry tag convention: every remaining construct (paragraphs, headings, lists, quotes, code, dividers, equations, links) already has native Markdown syntax. ([GitHub Flavored Markdown Spec](https://github.github.com/gfm/))

## Implementation changes

- Create `@noteferry/notion-markdown` with:
  - Official Notion block and rich-text types only.
  - `NotionBlocksToMarkdown(blocks, options)` with omission-by-default behavior and `FailOnUnsupported: true` support.
  - `MarkdownToNotionBlocks(markdown)` producing official API-compatible block objects.
  - A shared unsupported-element descriptor containing block type, display label, count, and reason (`NotionApi`, `NoteFerry`, or `Unknown`).
  - Support limited to: paragraphs, headings, bulleted list items, numbered list items, to-dos, quotes, code, dividers, and equations (as a rich-text-level construct), plus links. Headings are `heading_1`–`heading_3` only — Notion's official block model has no fourth, fifth, or sixth level, so a Markdown heading deeper than `###` is reported unsupported (`Reason: "NotionApi"`) rather than silently clamped to `heading_3`. Subscript and superscript are permanently out of scope for the same hard-API-ceiling reason, not a deliberate choice like the exclusions below: Notion's rich-text `annotations` object has exactly six fields — `bold`, `italic`, `strikethrough`, `underline`, `code`, `color` — confirmed in the installed `@notionhq/client` types, with no representation for either. A typed `^text^` or `~text~` span is recognized and reported unsupported (`Reason: "NotionApi"`) rather than silently accepted as literal caret/tilde characters, the same treatment as a heading deeper than `###`. Everything else in Notion's `POST /v1/pages` `children` union — colors, callouts, toggles, columns, tables, images, non-image media, embeds, bookmarks, synced blocks, breadcrumbs, tabs, table of contents, templates, and page links — is deliberately out of scope and reported as omitted (`Reason: "NoteFerry"`) like any other unbuilt construct, regardless of whether Notion's API would accept it. ([Create a page](https://developers.notion.com/reference/post-page), [Block reference](https://developers.notion.com/reference/block))
  - Inline and block equations are two separate constructs, both syntactically and at the conversion layer, matching Notion's own model: single-dollar delimiters (`$E = mc^2$`) for inline equations, converting to a rich-text item with `type: "equation"` (a distinct rich-text item type from `type: "text"`, confirmed in the installed `@notionhq/client` types); double-dollar delimiters (`$$...$$`) on their own line(s) for block equations, converting to Notion's dedicated `equation` block. `\$` escapes to a literal dollar sign, extending the existing backslash-escape mechanism rather than a separate rule.
  - Round-trip fixtures for the full supported subset — nested lists across all three list types, block and inline equations, links, and unknown elements — including fixtures asserting that every excluded construct (colors, callouts, toggles, columns, tables, images, non-image media, and the rest of the excluded `children` union) is consistently omitted rather than partially converted. ([Working with Markdown content](https://developers.notion.com/guides/data-apis/working-with-markdown-content))

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
  - A single `EnrichedMarkdownTextInput` instance holding the entire document as one continuous Markdown value — not one input instance per block. This replaces the current implementation (`RichContentEditor.tsx`’s `EditorBlockInput`, rendered once per block-array entry with `multiline={false}`), which is exactly the "multiple orchestrated editors giving the illusion of one editor" pattern this architecture corrects.
  - `EnrichedMarkdownText` remains the read-only rendered variant for non-editing content (e.g. template body previews), unaffected by this change.
  - The existing pure block-list state (`RichEditorDocumentFromMarkdown`/`ToMarkdown`, `InsertRichEditorBlock`, `DeleteRichEditorBlock`, `UpdateRichEditorBlock`, etc. in `State.ts`) stays valid as the data model for block-level operations, since none of it assumes multiple component instances — only the rendering layer changes. Block-type conversion, indentation, and the block picker act on whichever block the single input’s current selection offset maps onto, rather than on a separately-tracked "active" component instance.
  - The native input is confirmed to support multiple block-level constructs — consecutive headings, lists, quotes, code fences, dividers — within one continuous value, so this is no longer an open risk to spike. Dividers render as literal `---` syntax within that same single input’s text, the same way any other block-level construct does.
  - List nesting is handled by the native input's own `indentList()`/`outdentList()` commands, confirmed present on `EnrichedMarkdownTextInputInstance` — indenting or outdenting a list item is a dedicated native call, not NoteFerry splicing whitespace into the document string mid-edit. Its `StyleState`'s `unorderedList`/`orderedList` entries also carry a live `depth`, confirming the input tracks nesting as a native concept rather than something reconstructed from indentation on the JS side.
  - Notion-like mobile block picker, opened from an insert control in the keyboard accessory bar and offering exactly the supported set (paragraph, heading 1–3, bulleted/numbered/checklist list items, quote, code, divider, equation) and no more, plus inline formatting controls, link controls, and checkbox/list controls. Do not implement a slash-triggered picker; a typed `/` remains ordinary document text.
  - The same "exactly the supported set, no more" principle applies to raw typed Markdown syntax, not just the block picker and toolbar: any construct outside the supported subset must not render as that construct when its syntax is typed directly, even if the native input would otherwise recognize it. An editor that visually renders something successfully and then silently drops it at save time is worse than one that never rendered it at all. The codebase already has a partial precedent — `formatMenuConfig={ { spoiler: { enabled: false } } }` in the current `RichContentEditor.tsx` disables spoiler from the format menu — but that only confirmed to control menu visibility; whether it also stops *typed* spoiler syntax from rendering, as opposed to only hiding the menu button while raw syntax still activates it, is unverified and needs its own check, since spoiler is otherwise a confirmed, real, enabled-by-default editable-input feature (`toggleSpoiler`, `StyleState.spoiler`).
  - Subscript and superscript specifically must not render either. Unlike spoiler, neither `md4cFlags` nor `MarkdownStyle.superscript`/`subscript` are exposed anywhere on the editable `EnrichedMarkdownTextInput`'s public API at all — confirmed absent from its `NativeProps` — so there's no obvious flag to disable. This resolves one of two ways depending on unverified native behavior: if the editable input simply never recognizes `^text^`/`~text~` syntax (nothing in its type surface suggests it does), this is already satisfied with no work needed; if it recognizes it unconditionally regardless of the missing config surface, NoteFerry needs its own workaround — e.g. intercepting or escaping the pattern before it reaches the native input — since there's no exposed flag to turn off the way there is for spoiler.
  - Checklists (`to_do`) are in scope, but the toggle interaction while editing still needs its own mechanism. `enableTaskListItemToggle` and the checkbox rendering it controls (`taskList` styling — `checkboxSize`/`checkboxBorderRadius` — plus an `onTaskListItemPress` event) are real, confirmed native features, proving the checkbox machinery exists in the package — but confirmed wired only to the read-only `EnrichedMarkdownText` renderer, not `EnrichedMarkdownTextInput`. Nothing in the editable input's `NativeProps`, `StyleState`, or `Commands` exposes an equivalent, so toggling a checked item while actively editing likely needs a NoteFerry-built tap handler that rewrites the `[ ]`/`[x]` marker directly (e.g. via `insertText`/selection manipulation) rather than a native toggle command. This needs its own spike, separate from the general multi-block and nesting confirmations above.
  - An "insert equation" toolbar control inserts `$...$` (inline) or, on its own line, `$$...$$` (block) at the cursor; its accessibility label needs the standard locale treatment like every other toolbar button.
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

- Unit-test every supported block conversion, nested children across all three list types, annotations, links, block and inline equations, Markdown round trips, and 2,000-character rich-text chunking.
- Test unsupported conversion omission by default and failure when `FailOnUnsupported` is enabled, including that colors, callouts, toggles, columns, tables, images, non-image media, and the rest of the excluded `children` union are consistently omitted rather than partially converted, and that a Markdown heading deeper than `###` and any subscript/superscript span are reported unsupported rather than silently clamped or dropped without a trace.
- Test template refresh caching, schema migration, body-inspection failures, warning counts, and strict create validation.
- Test create-page requests contain only official Notion API shapes and correctly chunk large bodies.
- React Native tests should cover editor insertion/reordering, inline formatting, keyboard toolbar behavior, template materialization, collision prompts, icon substitution, collapsed lists, sheet wording, the default/disabled visibility setting, and the equation-insertion toolbar control for both inline and block placement.
- Specifically for the single-input architecture: validate that block-type conversion, the accessory-bar block picker, and indentation controls correctly resolve to the right paragraph/heading/list item from the single input's selection offset as the document grows across many blocks, that a typed `/` remains ordinary text, and that inline dividers render correctly alongside multiple headings, lists, and other block types within one continuous multi-paragraph value.
- Test that typed syntax for every out-of-scope construct — spoiler specifically, subscript, superscript, and anything else the native input might recognize unconditionally — renders as plain, unstyled text in the editor rather than as that construct, not just that it fails to convert at save time.
- Perform emulator QA with `agent-device`: inspect Notion’s body editor, keyboard accessory bar, cursor/selection controls, and equivalent NoteFerry flows; capture screenshots for visual comparison and verify accessibility labels.

## Assumptions and constraints

- The selected template behavior is to materialize supported content into NoteFerry’s editor and create explicit page children, not send Notion’s `template_id`; this is necessary because Notion forbids combining template application with explicit children. ([Create a page](https://developers.notion.com/reference/post-page))
- Existing plain body strings remain valid Markdown paragraphs.
- The single-input editor architecture relies on `react-native-enriched-markdown` rendering multiple block-level Markdown constructs (consecutive headings, lists, quotes, code fences, dividers) within one continuous multi-paragraph value — confirmed as supported.
- List nesting relies on the editable input's own `indentList()`/`outdentList()` commands and `StyleState` depth tracking — confirmed present in the installed package types, not something NoteFerry needs to build indentation mechanics for.
- Checklist toggling while editing is unconfirmed: the native checkbox rendering and tap-to-toggle (`enableTaskListItemToggle`, `onTaskListItemPress`, `taskList` styling) are confirmed real but wired only to the read-only `EnrichedMarkdownText` renderer, not the editable `EnrichedMarkdownTextInput`, per the installed package's type definitions. Needs a spike to determine whether the editable input renders checklist markers at all, and how toggling gets built if it doesn't do so natively.
- Subscript and superscript are permanently out of scope regardless of editor capability: Notion's rich-text `annotations` object has no field for either (`bold`, `italic`, `strikethrough`, `underline`, `code`, `color` only, confirmed in the installed `@notionhq/client` types), so there's no create-page shape to convert to. Separately, and moot given that: the package's own `superscript`/`subscript` parsing (`md4cFlags`, `MarkdownStyle.superscript`/`subscript`) is also confirmed wired only to the read-only `EnrichedMarkdownText` renderer, not the editable input.
- Every out-of-scope construct must not render as that construct in the editor when its Markdown syntax is typed directly — not just fail to convert at save time. Whether the editable input actually honors this for constructs it might recognize unconditionally (spoiler despite `formatMenuConfig` disabling only its menu entry, subscript/superscript with no exposed disable flag at all, or anything else) is unverified and needs a runtime spike; the native input's exposed configuration surface doesn't obviously guarantee it for constructs with no corresponding disable flag.
- Equation rendering assumes `react-native-enriched-markdown`'s `enableMath` flag (currently `false` in `Application/Mobile/package.json`) renders LaTeX live, rather than just recognizing the span as a distinct style state without rendering it. This is unconfirmed and needs verification before the editor-side design is committed to — either way is workable, but it determines whether equations need their own custom rendering path or fall out of the native input for free.
