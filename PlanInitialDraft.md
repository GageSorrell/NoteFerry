For your app, I would **not** tell Codex to recreate every control that exists in Notion. I would have it create a reusable Expo design system covering the parts of Notion's mobile visual language that your app will actually need: page creation, property editing, navigation, pickers, menus, and settings.

The current Notion mobile app remains very sparse and content-first, with persistent mobile navigation, `+` and `•••` affordances in places where desktop Notion can rely on hover, and mobile-specific navigation rather than simply shrinking the desktop UI. ([Notion][1])

I'd structure the package approximately like this:

```text
src/
├── components/
│   ├── actions/
│   ├── data-display/
│   ├── feedback/
│   ├── forms/
│   ├── layout/
│   ├── navigation/
│   ├── overlays/
│   ├── pages/
│   └── properties/
├── hooks/
├── icons/
├── theme/
└── utilities/
```

## 1. Design-system foundations

Have Codex implement these **before** creating components.

```text
theme/
├── Colors.ts
├── Typography.ts
├── Spacing.ts
├── Radii.ts
├── Borders.ts
├── Shadows.ts
├── Motion.ts
├── Sizes.ts
└── Theme.ts
```

In particular, I'd define semantic tokens rather than hard-coded colors:

```ts
Theme.Color.Background
Theme.Color.BackgroundSecondary
Theme.Color.Surface
Theme.Color.SurfacePressed

Theme.Color.Text
Theme.Color.TextSecondary
Theme.Color.TextTertiary
Theme.Color.TextDisabled

Theme.Color.Border
Theme.Color.BorderStrong

Theme.Color.Icon
Theme.Color.IconSecondary

Theme.Color.Accent
Theme.Color.Danger
Theme.Color.Warning
Theme.Color.Success
```

Also support:

```ts
"light"
"dark"
"system"
```

from day one.

This matters because Notion's aesthetic depends less on distinctive individual widgets and more on **consistent typography, low-contrast separators, restrained backgrounds, compact spacing, and subdued interaction states**.

I would explicitly tell Codex:

> Avoid excessive cards, shadows, borders, and colored surfaces. Prefer whitespace, typography, subtle separators, and pressed-state backgrounds.

That instruction will probably make more difference than specifying exact border radii.

---

# 2. Typography

I'd make typography an actual component rather than using React Native's `Text` everywhere.

### `Text`

With variants approximately like:

```ts
<Text Variant="pageTitle" />
<Text Variant="title" />
<Text Variant="heading" />
<Text Variant="body" />
<Text Variant="label" />
<Text Variant="caption" />
<Text Variant="metadata" />
```

And attributes such as:

```ts
<Text
    Variant="body"
    Weight="medium"
    Color="secondary"
    NumberOfLines={1}
/>
```

I'd avoid creating dozens of very specialized typography components like `PageTitleText`, `MenuLabelText`, etc. The variant system should handle those.

---

# 3. Basic action components

These are the foundation of almost everything else.

### `Button`

Variants:

```ts
<Button Variant="primary" />
<Button Variant="secondary" />
<Button Variant="ghost" />
<Button Variant="destructive" />
```

Sizes:

```ts
"small"
"medium"
"large"
```

And support:

```ts
<Button
    Icon={PlusIcon}
    Loading={IsCreating}
>
    Create page
</Button>
```

Notion uses buttons relatively sparingly, so I'd keep them understated.

### `IconButton`

This will be extremely important:

```tsx
<IconButton
    Icon={MoreHorizontalIcon}
    AccessibilityLabel="More actions"
/>
```

Variants could include:

```text
default
subtle
filled
```

You'll use it for:

* back;
* close;
* search;
* `+`;
* `•••`;
* clear;
* chevrons;
* page actions.

### `Pressable`

I'd also expose your own low-level:

```tsx
<Pressable>
```

wrapping React Native's interaction behavior so that pressed opacity/background, disabled state, haptics, and hit targets are standardized.

---

# 4. List components

These will probably become some of the most-used components in your app.

### `ListItem`

Think of the ubiquitous Notion row:

```text
┌──────────────────────────────────┐
│ 📄  Recipes                  ›   │
│     Personal recipes             │
└──────────────────────────────────┘
```

API roughly:

```tsx
<ListItem
    Icon={PageIcon}
    Title="Recipes"
    Description="Personal recipes"
    Trailing={<ChevronRightIcon />}
    OnPress={...}
/>
```

Support:

```text
Leading
Title
Description
Trailing
Selected
Disabled
Destructive
OnPress
OnLongPress
```

### `ListSection`

For groups such as:

```text
GENERAL

Workspace                  ›
Default database           ›
Default template           ›
```

Something like:

```tsx
<ListSection
    Header="General"
    Footer="Pages will be created in this database by default."
>
    ...
</ListSection>
```

### `ExpandableListItem`

Useful for Notion-like page/database hierarchies:

```text
⌄ 📁 Projects
     📄 Window Manager
     📄 Mobile App
```

Notion specifically exposes nested pages this way on mobile. ([Notion][1])

---

# 5. Inputs

For your particular app, these are especially important.

### `TextInput`

A Notion-styled basic input.

### `TextArea`

For longer page content.

### `SearchInput`

Distinct enough to warrant its own component:

```tsx
<SearchInput
    Value={Search}
    Placeholder="Search"
    OnChange={SetSearch}
/>
```

Include:

* search icon;
* clear button;
* autofocus option;
* loading state.

### `TitleInput`

I would actually make this separate from `TextInput`.

Notion page titles are visually part of the document rather than appearing like conventional boxed form controls.

For example:

```tsx
<TitleInput
    Placeholder="Untitled"
    Value={Title}
/>
```

It should look like a page title, not:

```text
┌───────────────────────┐
│ Page title            │
└───────────────────────┘
```

### `SearchableSelect`

This will underpin a lot of property UI.

---

# 6. Selection controls

Implement:

```text
Checkbox
Radio
Switch
SegmentedControl
```

I'd make `Checkbox` capable of a Notion-style todo appearance too.

Also:

### `SelectionIndicator`

A low-level checkmark/radio indicator that can be placed inside menu rows rather than requiring every selectable item to look like a traditional form control.

---

# 7. Notion-style properties

This is where I'd invest particularly heavily because of what your app does.

Have a common component:

### `PropertyRow`

For example:

```text
Aa  Name             Grocery list
#   Quantity         4
⌄   Category         Food
◷   Date             Aug 4, 2026
☑   Purchased        ✓
```

API:

```tsx
<PropertyRow
    Icon={CalendarIcon}
    Name="Date"
    Value={<DatePropertyValue Value={Date} />}
    OnPress={...}
/>
```

Then make property-specific components.

I would create at least:

```text
TitleProperty
RichTextProperty
NumberProperty
SelectProperty
MultiSelectProperty
StatusProperty
DateProperty
CheckboxProperty
UrlProperty
EmailProperty
PhoneNumberProperty
```

and probably subsequently:

```text
RelationProperty
PeopleProperty
FilesProperty
CreatedTimeProperty
CreatedByProperty
LastEditedTimeProperty
LastEditedByProperty
FormulaProperty
RollupProperty
```

But distinguish between:

### `*PropertyValue`

A compact representation:

```text
🟢 In progress
```

and:

### `*PropertyEditor`

The interactive editing UI:

```tsx
<SelectPropertyEditor
    Options={Options}
    Value={Value}
    OnChange={SetValue}
/>
```

That distinction will pay off enormously.

---

# 8. Notion tag/chip components

### `Tag`

Essential for select/status properties:

```text
[ Personal ]
[ In progress ]
[ High priority ]
```

Give it variants derived from Notion-style semantic colors:

```ts
"gray"
"brown"
"orange"
"yellow"
"green"
"blue"
"purple"
"pink"
"red"
```

I'd support:

```tsx
<Tag
    Color="green"
    Removable
>
    Complete
</Tag>
```

### `TagGroup`

Handles wrapping and multiple selections.

---

# 9. Page/database selectors

For your app these should be **first-class components**, not generic selects hacked into shape later.

### `WorkspacePicker`

### `DatabasePicker`

Something like:

```text
Search databases...

⭐ Recipes
   Personal

📚 Reading List
   Personal

💼 Tasks
   Work
```

### `PagePicker`

Support hierarchical pages.

### `ParentPicker`

A specialization specifically for selecting where a new page goes.

Notion itself uses mobile-specific selection UI when choosing where pages should be created or moved. ([Notion VIP][2])

### `TemplatePicker`

Probably very valuable for your app:

```text
Use template

○ None
○ Meeting note
● Journal entry
○ Recipe
```

---

# 10. Menus and overlays

These are essential to making the app actually *feel* like Notion.

### `BottomSheet`

Probably the single most important overlay primitive.

Use it as the foundation for:

* pickers;
* property editors;
* actions;
* page destination selection;
* filters;
* sorting.

Support:

```text
Handle
Title
Description
Scrollable content
Sticky footer
Keyboard avoidance
Detents
```

### `ActionSheet`

Higher-level wrapper:

```tsx
<ActionSheet>
    <ActionSheet.Item Icon={DuplicateIcon}>
        Duplicate
    </ActionSheet.Item>

    <ActionSheet.Item Icon={TrashIcon} Destructive>
        Delete
    </ActionSheet.Item>
</ActionSheet>
```

### `Menu`

For anchored menus where appropriate, particularly tablets.

### `ContextMenu`

Useful for long-press interactions.

### `Dialog`

For decisions that really need confirmation.

Do **not** use dialogs for ordinary selection. Use sheets.

### `Toast`

For:

```text
Page created
Copied to clipboard
Connection failed
```

### `Snackbar`

If you want actions:

```text
Page deleted                         Undo
```

I would probably choose either `Toast` + actionable toast support or `Snackbar`, rather than maintaining two almost-identical systems.

---

# 11. Headers and navigation

### `PageHeader`

Something like:

```text
‹                New page       •••
```

with:

```tsx
<PageHeader
    Title="New page"
    LeadingAction="back"
    TrailingActions={[...]}
 />
```

Support transparent/in-content and solid/scrolled variants.

### `LargeTitleHeader`

Potentially:

```text
Settings
```

for top-level screens.

### `BottomNavigation`

The current Notion mobile experience has persistent bottom navigation, including core destinations such as Home, Search, Inbox, and new-page creation. ([Notion][1])

Even if your app doesn't need all those destinations, implementing a reusable Notion-like bottom navigation component makes sense.

### `TabBar`

Also useful for small sets of top-level modes.

The 2026 Notion mobile design has moved toward more prominent top-level mobile destinations, so it's worth having a lightweight tab component rather than assuming everything belongs in a drawer. ([FLO.W][3])

### `NavigationRow`

For settings/navigation screens:

```text
Appearance                         ›
Default page                       ›
Notion account                     ›
```

---

# 12. Page-specific components

For a Notion integration, I'd create several components deliberately modeled around page concepts.

### `PageIcon`

Supports:

```text
emoji
image
fallback icon
```

### `PageIconPicker`

### `PageTitle`

Display equivalent of `TitleInput`.

### `PagePreview`

Something like:

```text
┌─────────────────────────────────
│ 📚
│ Reading List
│ Personal · Books
└─────────────────────────────────
```

But visually I'd keep this closer to a row than a conventional raised card.

### `PageRow`

For recent pages/results:

```text
📄 Grocery List
   Recipes / Lists
```

### `PageBreadcrumb`

Compact mobile representation of:

```text
Personal / Recipes / Pasta
```

### `PageMetadata`

For secondary information.

---

# 13. Page creation components

These can make your UI library particularly well suited to the app rather than being a generic RN component library.

### `CreatePageForm`

Composition of lower-level components.

```text
🍝  Pasta Recipes

Database
Recipes                              ›

Properties

Type                     Recipe      ›
Cuisine                  Italian     ›
Rating                   —           ›

              Create page
```

### `QuickCreateSheet`

This sounds particularly appropriate for the app you're building.

For example:

```text
New page

[ Untitled                         ]

Add to
📚 Recipes                         ›

Template
📄 Recipe                          ›

                          Create
```

### `CreatePageButton`

Potentially a floating/centralized quick action used throughout your app.

---

# 14. Empty/loading/error states

Definitely put these in the library rather than recreating them screen by screen:

```text
ActivityIndicator
Skeleton
SkeletonText
SkeletonRow

EmptyState
ErrorState
OfflineState
LoadingState
```

Keep Notion-like empty states restrained:

```text
        ◇

No pages yet

Pages you create here will
appear in this list.

Create a page
```

rather than giant illustrations.

---

# 15. Icons

I would put an abstraction around your icon library:

```tsx
<Icon
    Source={Icons.Search}
    Size="medium"
    Color="secondary"
/>
```

And standardize at least:

```text
ArrowLeft
ArrowRight
ChevronDown
ChevronRight
Check
Close
Plus
Minus
MoreHorizontal
Search
Settings
Home
Inbox
Edit
Trash
Duplicate
Share
ExternalLink
Star
Clock
Calendar
Database
Page
Folder
Template
Link
Globe
Lock
Unlock
User
Users
Info
Warning
Refresh
```

I'd use **your own icon set or a licensed general-purpose set whose visual weight resembles Notion's**, rather than copying Notion's proprietary icon assets.

---

# 16. A few utility components that agents often forget

These tend to make the difference between a coherent library and a pile of UI.

### `Divider`

```tsx
<Divider />
```

### `Spacer`

If you use explicit spacing primitives.

### `Stack`

```tsx
<Stack Gap="small">
```

and:

```tsx
<Row Gap="small" Align="center">
```

### `SafeArea`

### `KeyboardAvoidingView`

or preferably a higher-level:

### `KeyboardScreen`

that handles:

* safe areas;
* keyboard avoidance;
* scrolling;
* keyboard dismissal.

### `ScrollScreen`

Provides standard Notion-like screen padding and navigation behavior.

### `Separator`

Could perhaps just be `Divider`.

---

# 17. Accessibility should be part of the components

I would put this directly into Codex's specification.

Every interactive primitive should implement sensible:

```text
accessibilityRole
accessibilityLabel
accessibilityState
minimum touch target
font scaling
screen-reader semantics
disabled state
focus state
```

Also don't reproduce Notion's exact pixel dimensions if that would result in touch targets that are too small. The *visual* affordance can be small while the actual `Pressable` hit area remains at least approximately 44–48 points.

---

# What I'd actually tell Codex to implement first

I would **not** ask it to produce all ~60 components at once.

For a first version of the package, I'd give it this exact scope:

```text
FOUNDATIONS
ThemeProvider
useTheme
Colors
Typography
Spacing
Radii
Sizes

LAYOUT
Stack
Row
Screen
ScrollScreen
Divider

TYPOGRAPHY
Text

ACTIONS
Pressable
Button
IconButton

INPUT
TextInput
TextArea
TitleInput
SearchInput
Checkbox
Switch

DATA DISPLAY
Icon
Tag
TagGroup
ListItem
ListSection
PageIcon
PageRow

NAVIGATION
PageHeader
NavigationRow

OVERLAYS
BottomSheet
ActionSheet
Dialog
Toast

NOTION PROPERTIES
PropertyRow
TitleProperty
RichTextProperty
NumberProperty
SelectProperty
MultiSelectProperty
StatusProperty
DateProperty
CheckboxProperty
UrlProperty

NOTION PICKERS
WorkspacePicker
DatabasePicker
PagePicker
TemplatePicker

COMPOSITIONS
QuickCreateSheet
CreatePageForm

FEEDBACK
ActivityIndicator
Skeleton
EmptyState
ErrorState
```

That is enough to build a surprisingly large percentage of your actual application without prematurely making a `Calendar`, `KanbanBoard`, `DatabaseTable`, rich block editor, etc.

## One architectural choice I would emphasize

Make the hierarchy:

```text
Primitive
    ↓
Generic component
    ↓
Notion-specific component
    ↓
Application composition
```

For example:

```text
Pressable
    ↓
ListItem
    ↓
PropertyRow
    ↓
CreatePageForm
```

and:

```text
BottomSheet
    ↓
SearchablePicker
    ↓
DatabasePicker
```

rather than implementing `DatabasePicker`, `PagePicker`, `TemplatePicker`, and `StatusPropertyEditor` as four completely unrelated giant components.

I'd also tell Codex that **Android and iOS should share the visual design, but not necessarily every interaction implementation**. A bottom sheet, context menu, keyboard behavior, haptics, safe-area handling, and native picker may need platform-specific implementations behind one common API. The target should be “Notion's cross-platform product identity with native-feeling mobile behavior,” not pixel-identical Android and iOS behavior.

One other important point: since your app appears to be primarily about **quickly creating Notion pages**, I'd resist having Codex build a full Notion block editor initially. Your biggest UI investment should instead be `QuickCreateSheet` + the property system + highly polished database/page/template pickers. That's likely to comprise the characteristic experience of the app.

If you want, I can also turn this into a **ready-to-paste `AGENTS.md` specification for Codex**, including component APIs, directory structure, Expo/React Native conventions, Storybook/testing requirements, and instructions for matching Notion's styling.

[1]: https://www.notion.com/th/help/workspaces-on-mobile?nxtPslug=workspaces-on-mobile&utm_source=chatgpt.com "Workspaces on mobile – ศูนย์ช่วยเหลือ Notion"
[2]: https://uno.notion.vip/notion-releases-new-mobile-menu-and-move-to-feature/?utm_source=chatgpt.com "Notion Releases New Mobile Menu and \"Move To\" Feature"
[3]: https://21notion.com/en/notion-updates?utm_source=chatgpt.com "Notion Updates | FLO.W 思流"
