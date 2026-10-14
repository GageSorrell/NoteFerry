/**
 * @module noteferry/Storybook/NotionMarkdownText
 * @internal
 *
 * @file      NotionMarkdownText.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { NotionMarkdownText } from "@noteferry/react-native-notion-markdown";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Alert } from "react-native";

const SampleMarkdown = `# Notion markdown text

## Headings and text
### Level 3
#### Level 4

A paragraph with **bold**, *italic*, ~~strike~~, \`code\`, and a [link](https://notion.so).
Colored text: <span color="red">red</span>, <span color="blue_bg">blue background</span>, and <span underline="true">underlined</span>.
An inline equation: $E = mc^2$.
A mention: <mention-user url="u1">Ada Lovelace</mention-user>.

## Lists
- Bulleted item
\t- Nested item
- [ ] Unchecked to-do
- [x] Checked to-do
1. First numbered item
1. Second numbered item

## Quote
> A quoted thought {color="gray"}

## Callout
<callout icon="💡" color="blue_bg">
\tCallouts hold nested blocks, not inline text.
\t- Including lists.
</callout>

## Toggle
<details>
<summary>Click to expand</summary>
\tThis content is collapsed by default.
</details>

## Code
\`\`\`typescript
const milestone = 3;
\`\`\`

## Equation block
$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

---

That's every Milestone 1-3 construct.`;

const meta =
    {
        component: NotionMarkdownText,
        title: "NotionMarkdown/NotionMarkdownText"
    } satisfies Meta<typeof NotionMarkdownText>;

export default meta;

type Story = StoryObj<typeof meta>;

// A read-only render of every Milestone 1-3 construct -- the same sample
// used by the dev-only `notion-markdown-lab.tsx` screen.
export const FullDocument: Story =
    {
        args: {
            Markdown: SampleMarkdown,
            OnLinkPress: (Url) => Alert.alert("Link pressed", Url),
            OnMentionPress: (Mention) => Alert.alert("Mention pressed", JSON.stringify(Mention))
        }
    };

export const SingleParagraph: Story =
    {
        args: {
            Markdown: "A paragraph with **bold**, *italic*, and a [link](https://notion.so)."
        }
    };
