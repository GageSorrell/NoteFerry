/**
 * Escaping rules for Notion's Enhanced Markdown format.
 *
 * Per https://developers.notion.com/guides/data-apis/enhanced-markdown:
 * "Use backslashes to escape special characters." Escaping never applies
 * inside code (fenced or inline) — that content is taken verbatim.
 */

export const EscapableCharacters: ReadonlySet<string> = new Set([
  "\\", "*", "~", "`", "$", "[", "]", "<", ">", "{", "}", "|", "^",
]);

/** Backslash-escapes every special character in a plain-text run. */
export function EscapeText(Text: string): string {
  let Result = "";
  for (const Character of Text) {
    if (EscapableCharacters.has(Character)) Result += "\\";
    Result += Character;
  }
  return Result;
}
