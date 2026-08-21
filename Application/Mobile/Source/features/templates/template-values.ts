/**
 * Pure helpers shared by the two places a Notion template's own property
 * values turn into `create-page.tsx` form state: the automatic
 * pre-population on first load, and the header template switcher's
 * keep/overwrite flow. Also the pure array-reshuffle helper backing the
 * database-settings templates list's drag-to-reorder.
 *
 * @module notivex/features/templates/template-values
 *
 * @file      template-values.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";

/**
 * A template-sourced value for one of `create-page.tsx`'s form fields —
 * structurally the same union as that screen's own (private) `FieldValue`
 * type, minus `FileMediaValue` (template snapshots never carry a `Files`
 * value — see `CachedDataSourceTemplate`'s doc comment).
 */
export type TemplateFieldValue =
    | boolean
    | Domain.Property.DatePropertyInput
    | string
    | ReadonlyArray<Domain.Id.NotionOptionId>;

/**
 * Converts one of a template's own snapshotted property values into the form
 * value `create-page.tsx` stores per property — the inverse of that screen's
 * own `Values → Inputs` submit mapping. Returns `undefined` for a value type
 * a create-page form field can't represent (`Relation`/`People`, which are
 * already excluded from `CachedDataSourceTemplate.Properties`, and any future
 * type this mapper hasn't been taught yet).
 *
 * @category Templates
 * @since 1.0.0
 */
export function InputToFieldValue(Input: Domain.Property.PropertyInput): TemplateFieldValue | undefined
{
    switch (Input.Type)
    {
        case "Title":
        case "RichText":
        case "Url":
        case "Email":
        case "PhoneNumber":
            return Input.Value;
        case "Number":
            return String(Input.Value);
        case "Checkbox":
            return Input.Value;
        case "Date":
            return Input;
        case "Select":
        case "Status":
            return Input.OptionId;
        case "MultiSelect":
            return Input.OptionIds;
        default:
            return undefined;
    }
}

/** One property a template would set on the create-page form. */
export interface TemplateFieldAssignment
{
    readonly PropertyId: Domain.Id.NotionPropertyId;
    readonly Value: TemplateFieldValue;
}

/**
 * Every `{PropertyId, Value}` pair a template's own snapshot would apply to
 * a create-page form, skipping any property `InputToFieldValue` can't
 * represent.
 *
 * @category Templates
 * @since 1.0.0
 */
export function ResolveTemplateFieldValues(
    Template: Domain.DataSource.CachedDataSourceTemplate
): ReadonlyArray<TemplateFieldAssignment>
{
    const Assignments: Array<TemplateFieldAssignment> = [];

    for (const Entry of Template.Properties)
    {
        const Value = InputToFieldValue(Entry.Value);

        if (Value !== undefined)
        {
            Assignments.push({ PropertyId: Entry.PropertyId, Value });
        }
    }

    return Assignments;
}

/**
 * Rebuilds a full template order from a reordered *visible* subsequence,
 * leaving every hidden template's position untouched. Needed because the
 * `Sortable` list only ever holds the non-hidden ids — `NextVisibleOrder` is
 * its `OnValueChange` result — while `TemplateConfiguration.TemplateOrder`
 * is the single source of truth for every known template, hidden or not.
 *
 * @category Templates
 * @since 1.0.0
 */
export function ApplyVisibleReorder(
    FullOrder: ReadonlyArray<Domain.Id.NotionTemplateId>,
    Hidden: ReadonlyArray<Domain.Id.NotionTemplateId>,
    NextVisibleOrder: ReadonlyArray<string>
): ReadonlyArray<Domain.Id.NotionTemplateId>
{
    const HiddenSet = new Set(Hidden);
    const VisibleQueue = [ ...NextVisibleOrder ] as Array<Domain.Id.NotionTemplateId>;

    return FullOrder.map((TemplateId: Domain.Id.NotionTemplateId): Domain.Id.NotionTemplateId =>
        HiddenSet.has(TemplateId) ? TemplateId : (VisibleQueue.shift() ?? TemplateId));
}
