# Notion Android rich-editor reference captures

Captured on 2026-09-08 from Notion on a Samsung Galaxy Z Fold 4 in the folded 904 x 2316 viewport. The created page is titled `NoteFerry Rich Editor Reference 2026-09-08`.

## Primary captures

- `02-titled-page-keyboard.png`: Large page title with the initial mobile page-creation accessory row and SwiftKey visible.
- `03-empty-body-focused.png`: Empty body focus state and the default Notion editing accessory row.
- `04-insert-block-menu-top.png`: Top of the insert picker, including Text, Heading 1-4, bulleted list, numbered list, to-do list, and toggle list.
- `06-turn-into-menu.png`: Block conversion picker opened from the keyboard accessory.
- `07-inline-format-menu.png`: Inline formatting accessory with color, bold, italic, underline, strikethrough, link, and code controls.
- `08-link-dialog-empty-selection.png`: Link destination dialog, search field, cancel action, and recent-page results.
- `10-bulleted-list-before-indent.png`: Bulleted-list editing state with disabled outdent plus enabled indent, move-up, and move-down controls.
- `11-bulleted-list-indented.png`: Nested bulleted item after indentation; the marker changes from a filled bullet to a hollow bullet and outdent becomes enabled.
- `12-numbered-list-indented.png`: Nested numbered item after indentation; the marker changes from `2.` to `a.`.
- `13-checklist-indented-editing.png`: Nested checklist editing state with native checkbox controls and list manipulation actions.
- `14-checklist-toggled-editing.png`: Readable result after tapping a checkbox while editing; the child is checked, blue, and struck through.
- `15-turn-into-lower.png`: Lower block-conversion choices, including Callout, Block equation, Synced block, toggle headings, and columns.
- `16-turn-into-quote-code-divider.png`: Middle block-conversion choices, including Code and Quote, alongside unsupported NoteFerry candidates such as Toggle list and Page.
- `19-final-page-upper.png`: Continuous mixed-block page showing the title, paragraph, three heading levels, inline formatting, nested bulleted and numbered lists, quote, divider, and code-block chrome.
- `21-insert-menu-equation.png`: Insert picker region containing Table of contents, Block equation, Button, Breadcrumb, Tabs, and Synced block.
- `22-block-equation-inserted.png`: Newly inserted block-equation editor with `Add a TeX equation`, a focused input, and Done.
- `23-block-equation-editing.png`: TeX equation editing state after entering `E = mc^2`.
- `24-block-equation-rendered.png`: Rendered block equation in the continuous mixed-block document, alongside quote, divider, code, and list content.
- `25-text-selection-handles.png`: Android text selection handle and context menu while the Notion keyboard accessory remains visible.

## Implementation observations

- Notion uses one continuous vertically scrolling page surface, while Android accessibility exposes each block as a distinct editable node.
- The default accessory row is horizontally scrollable and changes by context: text blocks expose insert, formatting, files, conversion, undo, and comment actions, while lists prioritize outdent, indent, move up, and move down.
- Nested bullets and numbered lists visibly change marker style, and the disabled states of indent/outdent update immediately after mutation.
- Checkboxes remain directly tappable during editing; tapping one dismisses the keyboard, marks it checked, colors it blue, and strikes through its text.
- The insert and conversion pickers contain substantially more block types than NoteFerry supports, so the NoteFerry picker should intentionally present the restricted supported set from `RichContentEditorPlan.md`.
- Notion treats block equations as a dedicated TeX-entry flow with a live rendered result, not as an ordinary text-format toggle.
- Notion's link flow opens a dedicated destination/search surface instead of editing a raw Markdown URL inline.
- The accessibility identifiers observed for the editing accessory include `mab.button.insert`, `bold.italic.underline`, `mab.button.turnInto`, `mab.button.indent.prioritized`, `mab.button.unindent.prioritized`, `mab.button.moveUp.prioritized`, `mab.button.moveDown.prioritized`, `mab.button.link`, and `mab.button.code`.

Files prefixed with `00-`, `01-`, the filtered slash experiment, and duplicate `05-`/`18-` captures are retained as session diagnostics and are not required as implementation references.
