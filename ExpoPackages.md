I’d make `Spacing` and `Size` deliberately different:

* `Spacing` answers: **how much empty space goes between or around things?**
* `Size` answers: **how large is the thing itself?**

For a Notion-like mobile UI, I would keep both fairly small and semantic.

## `Spacing`

I would export a base scale plus a few semantic aliases.

```ts
export const Spacing = {
    None: 0,
    ExtraSmall: 4,
    Small: 8,
    Medium: 12,
    Large: 16,
    ExtraLarge: 24,
    DoubleExtraLarge: 32,
} as const;
```

That gives you a compact scale:

```text
0, 4, 8, 12, 16, 24, 32
```

I would avoid a huge Tailwind-like spacing scale unless the library genuinely needs it.

Then add semantic values where the spacing has a stable design meaning:

```ts
export const SemanticSpacing = {
    ScreenHorizontal: 16,
    ScreenVertical: 16,

    SectionGap: 24,
    GroupGap: 16,

    RowHorizontal: 16,
    RowVertical: 12,

    ControlGap: 8,
    IconTextGap: 8,

    InlineGap: 4,

    SheetHorizontal: 16,
    SheetVertical: 16,

    ModalHorizontal: 20,
} as const;
```

However, I would probably expose them from one namespace:

```ts
export const Spacing = {
    None: 0,

    ExtraSmall: 4,
    Small: 8,
    Medium: 12,
    Large: 16,
    ExtraLarge: 24,
    DoubleExtraLarge: 32,

    ScreenHorizontal: 16,
    ScreenVertical: 16,

    SectionGap: 24,
    GroupGap: 16,

    RowHorizontal: 16,
    RowVertical: 12,

    ControlGap: 8,
    IconTextGap: 8,
    InlineGap: 4,

    SheetHorizontal: 16,
    SheetVertical: 16,
} as const;
```

Then components can say:

```ts
paddingHorizontal: Spacing.ScreenHorizontal,
gap: Spacing.IconTextGap,
```

instead of:

```ts
paddingHorizontal: 16,
gap: 8,
```

### What should use `Spacing`

Things like:

```text
padding
margin
gap
rowGap
columnGap

distance between icon and text
distance between sections
screen gutters
sheet padding
list padding
form spacing
```

Not:

```text
button height
icon dimensions
avatar diameter
touch target size
```

Those belong in `Size`.

---

# `Size`

I would make this much more semantic.

Something like:

```ts
export const Size = {
    IconExtraSmall: 12,
    IconSmall: 16,
    IconMedium: 20,
    IconLarge: 24,
    IconExtraLarge: 32,

    ControlSmall: 32,
    ControlMedium: 40,
    ControlLarge: 48,

    TouchTargetMinimum: 44,

    AvatarSmall: 24,
    AvatarMedium: 32,
    AvatarLarge: 40,

    PageIconSmall: 20,
    PageIconMedium: 28,
    PageIconLarge: 40,

    Checkbox: 20,
    SwitchHeight: 28,

    ListRowMinimumHeight: 44,

    HeaderHeight: 52,

    BottomNavigationHeight: 56,

    SheetHandleWidth: 36,
    SheetHandleHeight: 4,
} as const;
```

The exact values can evolve, but I like the category structure.

I would actually consider nesting `Size`, because these names become easier to browse:

```ts
export const Size = {
    Icon: {
        ExtraSmall: 12,
        Small: 16,
        Medium: 20,
        Large: 24,
        ExtraLarge: 32,
    },

    Control: {
        Small: 32,
        Medium: 40,
        Large: 48,
    },

    TouchTarget: {
        Minimum: 44,
    },

    Avatar: {
        Small: 24,
        Medium: 32,
        Large: 40,
    },

    PageIcon: {
        Small: 20,
        Medium: 28,
        Large: 40,
    },

    Checkbox: {
        Default: 20,
    },

    ListRow: {
        MinimumHeight: 44,
    },

    Header: {
        Height: 52,
    },

    BottomNavigation: {
        Height: 56,
    },

    SheetHandle: {
        Width: 36,
        Height: 4,
    },
} as const;
```

I prefer this version.

It gives you nice usage:

```ts
Size.Icon.Medium
Size.Control.Large
Size.Avatar.Small
Size.TouchTarget.Minimum
```

instead of a giant flat list.

---

# I would avoid putting these in `Size`

I would not put these here:

```text
font sizes
border radii
border widths
shadow dimensions
spacing
```

Those should live separately:

```text
Typography
Radii
Borders
Shadows
Spacing
Size
```

For example:

```ts
Typography.Body.FontSize
Radii.Medium
Borders.Thin
Spacing.Large
Size.Icon.Medium
```

That separation makes the design system easier to reason about.

---

# One thing I'd strongly recommend

Have both a **raw scale** and **semantic component dimensions**, but don't force everything through the raw scale.

For instance, this is fine:

```ts
Spacing.Medium
```

because spacing tends to repeat naturally.

But I would not do:

```ts
Size.Medium
```

because "medium size" is meaningless without context.

Is that:

* 20 px?
* 32 px?
* 40 px?

So I would use:

```ts
Size.Icon.Medium
Size.Control.Medium
Size.Avatar.Medium
```

rather than:

```ts
Size.Small
Size.Medium
Size.Large
```

That distinction is important.

## My recommended starting point

```ts
export const Spacing = {
    None: 0,
    ExtraSmall: 4,
    Small: 8,
    Medium: 12,
    Large: 16,
    ExtraLarge: 24,
    DoubleExtraLarge: 32,

    ScreenHorizontal: 16,
    ScreenVertical: 16,
    SectionGap: 24,
    GroupGap: 16,
    RowHorizontal: 16,
    RowVertical: 12,
    ControlGap: 8,
    IconTextGap: 8,
    InlineGap: 4,
    SheetHorizontal: 16,
    SheetVertical: 16,
} as const;

export const Size = {
    Icon: {
        ExtraSmall: 12,
        Small: 16,
        Medium: 20,
        Large: 24,
        ExtraLarge: 32,
    },

    Control: {
        Small: 32,
        Medium: 40,
        Large: 48,
    },

    TouchTarget: {
        Minimum: 44,
    },

    Avatar: {
        Small: 24,
        Medium: 32,
        Large: 40,
    },

    PageIcon: {
        Small: 20,
        Medium: 28,
        Large: 40,
    },

    Checkbox: {
        Default: 20,
    },

    ListRow: {
        MinimumHeight: 44,
    },

    Header: {
        Height: 52,
    },

    BottomNavigation: {
        Height: 56,
    },

    SheetHandle: {
        Width: 36,
        Height: 4,
    },
} as const;
```

For a Notion-like UI, I would intentionally keep the **spacing scale tighter than something like Material Design**. The restrained density is part of the look.
