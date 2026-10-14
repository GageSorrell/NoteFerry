"use dom";

/**
 * Live KaTeX rendering for a block (`$$...$$`) equation, running inside an
 * Expo DOM Component's WebView. No Text-nesting constraint applies here
 * (unlike the inline case — see `KatexInlineRasterizer.tsx`), so this
 * renders directly into visible DOM rather than rasterizing to an image.
 *
 * Sizing: the parent wrapper passes `dom={{ matchContents: true }}`, so the
 * native host view tracks this document's real content size — no manual
 * `ResizeObserver`/native-callback height-reporting bridge needed (verified
 * on-device in the Milestone 6a spike, along with real (non-tofu) glyph
 * rendering, `throwOnError` not crashing the WebView, and Metro correctly
 * bundling `katex/dist/katex.min.css`'s font assets).
 *
 * @module noteferry/Component/Equation/KatexBlockEquation
 * @internal
 *
 * @file      KatexBlockEquation.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DOMProps } from "expo/dom";

export interface KatexBlockEquationProps {
  readonly dom?: DOMProps;
  readonly Expression: string;
  /** Fires once `katex.render` has synchronously succeeded. */
  readonly OnReady: () => void;
  /** Fires with KaTeX's error message if `throwOnError` catches a malformed expression. */
  readonly OnError: (Message: string) => void;
}

export default function KatexBlockEquation({ Expression, OnReady, OnError }: KatexBlockEquationProps): React.ReactElement {
  const Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!Ref.current) return;
    try {
      katex.render(Expression, Ref.current, { throwOnError: true, displayMode: true });
      OnReady();
    } catch (CaughtError) {
      OnError(CaughtError instanceof Error ? CaughtError.message : String(CaughtError));
    }
  }, [Expression, OnReady, OnError]);

  return (
    <div style={{ backgroundColor: "#F7F6F3", borderRadius: 6, padding: 12, fontSize: 18 }}>
      <div ref={Ref} />
    </div>
  );
}
