import * as React from "react";
import type { Block } from "../Ast.js";
import { EnsureEditableBlocks } from "../EditorDocument.js";
import { Parse } from "../Parser.js";
import { Serialize } from "../Serializer.js";

export interface UseNotionMarkdownDocumentResult {
  readonly Blocks: readonly Block[];
  readonly Markdown: string;
  /** Replaces the whole block array, emits the resulting Markdown via `OnChange`, and returns it. */
  readonly Commit: (Next: readonly Block[]) => string;
  /**
   * The current block array, read from a ref that `Commit` updates
   * synchronously — unlike `Blocks`, it is never a render behind, so event
   * handlers and imperative calls that run between renders see every commit.
   */
  readonly GetBlocks: () => readonly Block[];
  /** Increments whenever `Value` is replaced from outside (anything other than an echo of this hook's own last emission). */
  readonly Revision: number;
}

/**
 * Bridges a controlled Markdown string (`Value`/`OnChange`, the same
 * convention `@noteferry/ui`'s `RichContentEditor` already uses) to this
 * package's parsed `Block[]` AST. Internal state is the source of truth
 * between commits — `Value` is only re-parsed when it changes to something
 * other than what this hook itself last emitted, so a parent that just
 * echoes `OnChange` back in doesn't cause a redundant reparse (and doesn't
 * disturb in-progress editing elsewhere, e.g. a focused block's draft text).
 */
export function useNotionMarkdownDocument(Value: string, OnChange?: (Markdown: string) => void): UseNotionMarkdownDocumentResult {
  const [Blocks, SetBlocks] = React.useState<readonly Block[]>(() => EnsureEditableBlocks(Parse(Value).Blocks));
  const [Revision, SetRevision] = React.useState(0);
  const LastEmitted = React.useRef(Value);
  const BlocksRef = React.useRef(Blocks);

  React.useEffect(() => {
    if (Value !== LastEmitted.current) {
      LastEmitted.current = Value;
      const Next = EnsureEditableBlocks(Parse(Value).Blocks);
      BlocksRef.current = Next;
      SetBlocks(Next);
      SetRevision((Current) => Current + 1);
    }
  }, [Value]);

  const Commit = React.useCallback(
    (Next: readonly Block[]): string => {
      const Editable = EnsureEditableBlocks(Next);
      BlocksRef.current = Editable;
      SetBlocks(Editable);
      const NextMarkdown = Serialize({ Blocks: Editable });
      // An unchanged document is not re-emitted, so committing the same draft twice (e.g. a flush followed by a blur) notifies the host once.
      if (NextMarkdown !== LastEmitted.current) {
        LastEmitted.current = NextMarkdown;
        OnChange?.(NextMarkdown);
      }
      return NextMarkdown;
    },
    [OnChange],
  );

  const GetBlocks = React.useCallback((): readonly Block[] => BlocksRef.current, []);

  const Markdown = React.useMemo(() => Serialize({ Blocks }), [Blocks]);

  return { Blocks, Markdown, Commit, GetBlocks, Revision };
}
