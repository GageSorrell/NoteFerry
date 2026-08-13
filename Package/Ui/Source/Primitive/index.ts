/**
 * Style/layout + overlay + composite/data primitives for `@notivex/ui`.
 * Phase 1 (style/layout, no overlay complexity), Phase 2 (`BottomSheet`,
 * `Dialog`, `Popover`, `Tooltip`, the `Menu`/`DropdownMenu`/`ContextMenu`
 * family, `Select`, `Toast`), and Phase 3 (`Tabs`, `Autocomplete`,
 * `Combobox`, `Command`, `Calendar`, `Form`, `TagsInput`, `Sortable`,
 * `ScrollArea`) — see the project plan. `DateSheet` (a composite built on
 * `BottomSheet` + `Calendar` + `Switch` + `Popup`/`Menu`, replicating
 * Notion's mobile "edit Date property" sheet) sits above these phases
 * rather than in one of them.
 *
 * Phase 4 ports `@notion-kit/ui`'s higher-level "Block" tier (its top-level
 * `src/` directories other than `primitives/`) rather than any more
 * primitives: `IconBlock`/`IconMenu` (page icons — an emoji, a Lucide icon,
 * or an uploaded image), `Selectable` (long-press-to-enter, tap-to-toggle
 * multi-select), `TreeSheet` (a searchable/expandable page picker, after
 * source's `tree/` block), and `Cover`/`CoverPicker` (page cover images).
 * Each file's own header comment details how it maps back to its
 * `@notion-kit/ui` source and what was deliberately simplified or dropped.
 *
 * @module @notivex/ui/Primitive
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export * from "./Avatar.js";
export * from "./Badge.js";
export * from "./Button.js";
export * from "./Checkbox.js";
export * from "./Field.js";
export * from "./Input.js";
export * from "./Label.js";
export * from "./Link.js";
export * from "./Meter.js";
export * from "./Pressable.js";
export * from "./RadioGroup.js";
export * from "./Separator.js";
export * from "./Skeleton.js";
export * from "./Spinner.js";
export * from "./Switch.js";
export * from "./Text.js";
export * from "./Textarea.js";

export * from "./Popup.js";
export * from "./BottomSheet.js";
export * from "./Dialog.js";
export * from "./AlertModal.js";
export * from "./Popover.js";
export * from "./Tooltip.js";
export * from "./Menu.js";
export * from "./DropdownMenu.js";
export * from "./ContextMenu.js";
export * from "./Select.js";
export * from "./Toast.js";

export * from "./Tabs.js";
export * from "./Autocomplete.js";
export * from "./Combobox.js";
export * from "./Command.js";
export * from "./Calendar.js";
export * from "./Form.js";
export * from "./TagsInput.js";
export * from "./Sortable.js";
export * from "./ScrollArea.js";
export * from "./DateSheet.js";
