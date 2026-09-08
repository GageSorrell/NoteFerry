# Rich Notion body editing — extended scope

## Status

This is a **contingent plan**, not committed scope. It addresses the gaps identified after reviewing `RichContentEditorPlan.md` and `RichContentEditorFirstMilestone.md`, with concrete solutions for each. Neither of those documents is changed by this one — this is the plan to pick up *if* the more-involved option is pursued later. Numbering below matches the gap list it responds to.

## 1. Equations

Inline and block equations are treated as two separate constructs, both syntactically and at the conversion layer, matching Notion's own model:

- **Inline**: single-dollar delimiters (`$E = mc^2$`) within a text-bearing block, converting to a `RichTextItemRequest` with `type: "equation"` and an `expression` string — a distinct rich-text item type from `text`, confirmed in the installed `@notionhq/client` types (`RichTextItemRequest = RichTextItemRequestCommon & (TextRichTextItemRequest | MentionRichTextItemRequest | EquationRichTextItemRequest)`).
- **Block**: double-dollar delimiters (`$$...$$`) on their own line(s), converting to Notion's dedicated `equation` block (`{ type: "equation", equation: { expression } }`), not a paragraph containing an equation rich-text item.

Implementation notes:

- `MarkdownToNotionRichText`'s `ParseInlineRange` needs a new branch recognizing `$...$` spans, alongside the existing bold/italic/strikethrough/code/link markers in `Notion.ts`.
- `ParseMarkdownBlocks` needs a new top-level case for a line (or lines) wrapped in `$$`, alongside the existing fenced-code-block handling.
- Escaping: `\$` needs to fall through to a literal dollar sign, extending the existing backslash-escape mechanism (`Escaped`/`EscapeInlineText`) rather than introducing a separate escape rule.
- `react-native-enriched-markdown`'s `enableMath` flag is currently `false` in `Application/Mobile/package.json`. Before committing to this design, verify what it actually does when enabled — renders LaTeX live, or just recognizes the span as a distinct style state without rendering. Either is workable (equations are inherently textual), but it changes whether this needs its own custom rendering path in `RichContentEditor.tsx` or falls out of the native input for free.

**Localization**: no new strings from the syntax itself (nothing to translate — it's typed input). If a toolbar button for inserting an equation is added, its accessibility label needs the same locale treatment as every other toolbar button.

## 2. Mentions

Mentions degrade to their `plain_text` value and are not recognized by the editor as any kind of block or special inline construct — not even a placeholder.

- Confirmed via the installed SDK types: every mention response variant (`user`, `date`, `link_preview`, `link_mention`, `page`, `database`, `template_mention`, `custom_emoji`) shares `RichTextItemResponseCommon`, which always carries `plain_text`. `RichTextToMarkdown` in `Notion.ts` already has a fallback path here for non-`text` rich-text items — the only change is that mentions specifically stop being logged as an unsupported/omitted element. Today they're counted (`Reason: "NoteFerry"`, `DisplayLabel: "Mention"`); under this decision they become a silent substitution instead, since the intent is "this is handled," not "this is missing."
- One-directional only: this is a Notion → Markdown degrade. There is no Markdown → Notion path — typing `@` does nothing special, and no syntax is ever recognized as "insert a mention."
- Because the substitution is silent and looks correct (a user reading "@Jane Doe" in the editor has no visual cue it won't stay linked if the page is re-created), the support sheet's copy should say so explicitly — something like "mentions and dates referenced from Notion appear as plain text and won't stay linked" — even though it's no longer counted in the numeric omission total. Otherwise this reads as lossless when it isn't.
- Inline equations are the one non-text rich-text item type that does *not* fall under this treatment — they become properly supported under item 1, not degraded.

**Localization**: the new support-sheet sentence above needs the same locale-parity treatment as the rest of that sheet's wording.

## 3. Colors — via link variants

The full set, confirmed from the installed `ApiColor` type (20 values):

`default`, `gray`, `brown`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `red` — and each of the latter 9 with a `_background` variant, plus `default_background`. Note this is a single field on `annotations.color`, not independent foreground/background fields — a rich-text span can be one color *or* one background color, never both.

**Syntax**: reuse the existing link syntax with a reserved pseudo-scheme carrying the literal `ApiColor` value — `[text](color:red)`, `[text](color:blue_background)`. `ParseInlineRange`'s existing link-detection branch (triggered on `[`) gains a check for a `color:` prefix on the parsed target, setting `annotations.color` instead of `link.url`; `WrapAnnotations`/serialization mirrors this in reverse when `annotations.color !== "default"`. Because the `ApiColor` strings are already Markdown-safe tokens, no new escaping is needed — the syntax is literally the enum value.

**Known, accepted tradeoff**: Notion allows a rich-text span to be simultaneously a real hyperlink *and* colored; this syntax can't represent both at once, since color and link target both want the same bracket-target slot. Document this as a known limitation (a colored link converts as one or the other) rather than solving it with compound/nested syntax — the added parser complexity isn't worth it for what should be a rare combination.

**Editor UI**: a new toolbar button opens a swatch grid (two sections, "Text color" and "Background color", mirroring Notion's own picker), applying a selection by feeding the reserved `color:<value>` string through the native input's existing `setLink`/`insertLink` API — the same mechanism already used for real links in `RichContentEditor.tsx`, hence "link variants": no new native-input API surface, just a repurposed existing one.

**Open risk to verify before building**: `markdownStyle.link` in the current `RichContentEditor.tsx` usage appears to apply one uniform style to all links. It isn't yet confirmed whether a `color:` pseudo-link can render with per-instance styling (actual red text while editing) rather than looking like an ordinary blue underlined link. This needs a spike against the native input's actual capabilities before the design above is committed to.

**Localization**: 20 color names need display labels in the swatch picker. Worth structuring as a small number of templated strings (e.g. one "{Color} text" / "{Color} background" pattern plus 10 color-name strings) rather than 20 fully independent entries, to keep the per-locale footprint down — this is the single largest new string surface in this document.

## 4. Columns and toggle editing UX

No solution given — left as an unaddressed open question, same as item 8. How a single vertical mobile block list would author a horizontal N-column layout, and how nested toggle content would be represented in the block-list model beyond the existing simple list-depth mechanism, both remain undesigned. Revisit before either construct moves from "round-trip only" to "authorable in NoteFerry's editor."

## 5. `link_to_page` — view and remove only, never authored or modified

Confirmed via the installed SDK types that `link_to_page` *is* present in the block request union (`{ type: "page_id", page_id } | { type: "database_id", database_id } | ...`) — it's technically creatable. This is a deliberate scope decision, not an API limitation: NoteFerry never exposes a path to create or edit one, because doing so would need a workspace-wide page/database search UI, which is out of scope here.

- **Round-trip**: a `link_to_page` block read from a template body becomes a NoteFerry block that is view-only in the block list. It can be selected and deleted through the existing per-block toolbar delete — no new deletion UI needed — but has no text input, doesn't participate in the type-conversion picker, and is never re-sent through a create-page request, since NoteFerry never authors or edits the reference itself.
- **Long-press bottom sheet**: fetches the target via `GET /v1/pages/:id` (or `/v1/databases/:id` for the `database_id` variant). The installed `PageObjectResponse` type confirms everything needed is already in that response: `properties` (scan for the entry with `type: "title"`), `icon` (`PageIconResponse` — emoji/external/file/custom emoji), `cover` (`PageCoverResponse` — external/file), and a ready-to-use `url` field specifically for opening the page in Notion (web or, if installed, the Notion app intercepts its own domain). The sheet shows title, icon, and cover, with a button that opens that `url`.
- **Failure handling**: if the fetch fails (page deleted, no longer shared, permission revoked), the sheet should show a clear degraded message — "This page couldn't be loaded — it may have been deleted or you may no longer have access" — rather than a generic error, and the block should remain deletable even when its target can't be resolved.

**Localization**: the sheet's static copy (the "View in Notion" button label, the failed-fetch message) needs the standard locale treatment.

## 6. Synced blocks — not supported, no placeholder

A `synced_block` read from a template body is omitted entirely: no tag, no marker, nothing written into the Markdown output — distinct from every other unsupported construct in the base plan, which otherwise gets a placeholder or at least a counted omission.

One interpretation call worth flagging explicitly: "no placeholder representation" is read here as being about the *document* (no `<synced_block>`-style tag cluttering the Markdown), not about suppressing visibility entirely. The recommendation is that it should still be counted in the unsupported-element descriptor list (`Reason: "NoteFerry"`, since it's technically buildable per the API but deliberately excluded) so the support sheet still tells the user "this template had a synced block that got dropped" — fully silent, uncounted disappearance would be a worse outcome than what every other unsupported case already gets. Flagging this rather than assuming it, in case full silence (including the count) was intended instead.

A consequence worth stating plainly: the synced block's *children* — its actual content — are lost along with it. There's no attempt to unwrap and preserve the inner content as ordinary blocks, since that content is presented in Notion as specifically the synced block's rendering, and unwrapping it would misrepresent it as ordinary page content that was never really there as such.

## 7. `child_page`, `child_database`, `link_preview`, and the generic `unsupported` wrapper — already fully handled

This maps exactly onto the `NotionApiOnly` set already implemented in `Notion.ts`: `child_database`, `child_page`, `link_preview`, `meeting_notes`, `transcription`, and `unsupported`. No new work is needed here — this is already correctly built and classified `Reason: "NotionApi"`.

One small, self-contained improvement surfaced earlier and worth doing alongside anything else in this document: when `type === "unsupported"`, Notion's response nests the real type in `unsupported.block_type` (e.g. `"button"`, `"form"`). `ReadBlockType`/`AppendNotionBlock` currently only look at the outer `type`, so this collapses to the generic "Unsupported block" label. Reading that nested field and using it as the `DisplayLabel` instead turns a vague "Unsupported block (3)" into a specific "Button (3)" — no change to what's supported, just a more useful label.

**Localization**: no new impact beyond what already exists for these labels.

## 8. Rollback/retry for partial page creation

No solution proposed — left as an unaddressed open question, per instruction. Restated for reference: `CreateForUser` in `Pages.ts` calls `Notion.CreatePage` and then N sequential `Notion.AppendBlockChildren` calls for chunked bodies. A failure partway through leaves a partially-created page in Notion with no cleanup and no distinct error telling the user the page exists but is incomplete. Needs its own design pass later.

## 9. Localization

Rather than a separate mechanism, every item above that introduces a new user-facing string calls it out inline. Consolidated, the new string surfaces this document introduces are:

- Item 1: an "insert equation" toolbar button label, if one is added.
- Item 2: one new sentence in the support sheet explaining mention degradation.
- Item 3: the color-swatch picker's labels (the largest addition — 20 color names, ideally collapsed into a small templated set rather than 20 independent strings).
- Item 5: the `link_to_page` bottom sheet's "View in Notion" button and failed-fetch message.
- Item 7: no new strings, but worth noting for completeness — the conversion package's `DisplayLabel` constants (`BlockTypeLabels`, `UnsupportedTagLabels`) are English literals baked into `@noteferry/notion-markdown` itself, not routed through the app's i18n system. If the support sheet displays them directly (as it does today), they're either English-only by design or need translation at that display boundary. This is a latent gap in the base plan too, not something new introduced here, but worth resolving whenever the support sheet is actually built.

Every item above should go through the same locale-parity test extension the base plan already calls for on `ShowRichEditorSupportNotices`, not a separate process.

## 10. File-upload validation

Notion publishes concrete limits (per the "Working with files and media" guide):

- **Size**: free workspaces cap at 5 MiB per file; paid workspaces cap at 5 GiB per file.
- **Upload method threshold**: single-part upload suffices under 20 MB; multi-part upload is required above that, regardless of plan. This is already documented in the existing code's own docstring — `SendFileUpload` in `Notion.ts` explicitly notes it only handles "a single-part upload (files up to Notion's ~20MB single-part limit)". Multi-part upload is not implemented today.
- **Filenames**: capped at 900 bytes.
- **Type matching**: each media block category (audio/document/image/video) has its own extension/MIME allowlist, and files must match their block's category — already confirmed specifically for PDF blocks (`.pdf` only, per the block reference).

What NoteFerry can validate client-side today: extension/MIME type against the target card's category before upload starts (e.g. reject a `.docx` picked for a `Document` card) — this is fully knowable now.

What NoteFerry can *not* reliably validate today: the exact byte-size ceiling, since that depends on whether the connected workspace is free or paid, and nothing in the current connection/auth flow surfaces a workspace's plan. Recommendation: don't pre-validate against a guessed number; attempt the upload and surface Notion's own rejection as a friendly, translated error. Separately, investigate whether a workspace-plan or quota signal is obtainable through any endpoint NoteFerry could call (e.g. around `/v1/users/me` or a workspace-info surface) as a follow-up research task — if nothing surfaces it, this stays a real, permanent limitation NoteFerry has to work around rather than something it can pre-empt.

The 20 MB multi-part threshold is a real implementation requirement, not just a validation one: the existing `CreateFileUpload`/`SendFileUpload` plumbing (already used for property-level file fields) would need genuine multi-part support added before large media attachments work at all, confirmed by its own docstring's stated limit above.

**Localization**: client-side validation error messages ("This file type isn't supported for Document attachments," "This file is too large") need the standard locale treatment.
