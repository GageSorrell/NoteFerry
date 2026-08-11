# Writing Documentation

* Types of `unique symbol`s and `Props` interfaces of components should always have a TS Doc comment that is on only one line, and contains precisely an `@inheritDoc` tag referencing the corresponding `unique symbol` or component.

* All TS Doc comments that are just `@inheritDoc` or top-level (module) comments should end with a `@category` tag and a `@since` tag, such that the value in the `@since` tag is the current version in the module's `package.json`.

* Documentation should be written in the style of 20th century mathematical texts: proper and formal, but slightly warm and friendly.

* TS Doc comments should not reference Markdown files of implementation plans, especially plans for AI agents to follow.
