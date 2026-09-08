I propose Milestone 1 be a narrow, end-to-end vertical slice that proves the core content pipeline before implementing templates, caching, warnings, or every Notion block type.

### Milestone 1: Rich-content foundation and basic editor

Scope:

- Create `@noteferry/notion-markdown`.
- Define official Notion-compatible types and conversion APIs.
- Support an initial reliable subset:
  - paragraphs
  - headings
  - bulleted and numbered lists
  - to-dos
  - quotes
  - code blocks
  - dividers
  - rich-text annotations and links
- Where the initial subset overlaps GitHub-Flavored Markdown (to-dos as GFM task-list items, strikethrough within rich-text annotations), parse and serialize using standard GFM syntax rather than a custom convention; the full plan extends this to tables and other elements with a direct GFM equivalent.
- Implement:
  - Markdown → Notion blocks
  - Notion blocks → enriched Markdown
  - unsupported-element descriptors
  - default omission and `FailOnUnsupported`
  - 2,000-character rich-text chunking
- Add fixtures and round-trip tests for that subset, including unknown elements.
- Install and validate `react-native-enriched-markdown` in the Expo development build, confirming the required New Architecture/native rebuild works.
- Build a small `@noteferry/ui/rich-editor` shell with:
  - controlled Markdown value
  - block insertion/deletion/reordering
  - basic block-type conversion
  - inline formatting
  - links
  - lists and checkboxes
  - slash picker
- Replace the current create-page `Textarea` with the basic editor, while continuing to send the existing `Body` field.

The milestone should end with this demonstrable flow:

> Enter formatted content in the editor → receive enriched Markdown → convert it to official Notion block objects → create a page successfully through the official API.

This directly validates the riskiest boundaries. The current app still renders the body as a plain `Textarea` ([create-page.tsx](<E:/NoteFerry/Application/Mobile/Source/App/create-page.tsx:1414>)), while the server currently wraps the entire body in one paragraph ([Pages.ts](<E:/NoteFerry/supabase/functions/_shared/Pages.ts:305>)). The cached data-source schema is already versioned at `2`, so template-body metadata can be added after the conversion contract is stable ([DataSource.ts](<E:/NoteFerry/Package/Domain/Source/DataSource.ts:33>)).

I would explicitly defer from Milestone 1:

- media, columns, synced blocks, embeds, tables, and other complex Notion constructs
- recursive template retrieval and body caching
- schema migration
- support-warning sheets and settings
- database-settings warnings
- full visual parity with Notion
- emulator comparison against the Notion app

Those should follow as Milestone 2, once the converter and editor contract have proven themselves. The key exit criteria are: native editor works in a rebuilt dev client, supported content round-trips without loss, unsupported content is reported deterministically, and a real create-page request contains only official Notion API shapes.
