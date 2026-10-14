"use dom";

/**
 * A hidden, persistent KaTeX rasterizer running inside an Expo DOM
 * Component's WebView. Inline (`$...$`) equations cannot render live —
 * React Native only allows `Text`/`Image` inside a `Text` tree (see
 * `MentionPill.tsx`'s doc comment) — so each requested expression is
 * rendered off-screen, wrapped in an SVG `<foreignObject>`, and rasterized
 * to a PNG data URI via `<canvas>`, which a plain RN `<Image>` can then
 * display inline. This exact round trip was verified on-device in the
 * Milestone 6a spike.
 *
 * One instance is shared per screen by `EquationRasterizerProvider`, which
 * owns the result cache and de-duplicates requests — this component is a
 * pure worker: it rasterizes whatever `PendingExpressions` it hasn't
 * already started, and reports each result back individually.
 *
 * @module noteferry/Component/Equation/KatexInlineRasterizer
 * @internal
 *
 * @file      KatexInlineRasterizer.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DOMProps } from "expo/dom";

export interface KatexInlineRasterizerProps {
  readonly dom?: DOMProps;
  readonly PendingExpressions: readonly string[];
  readonly OnResult: (Expression: string, Uri: string, Width: number, Height: number) => void;
  readonly OnResultError: (Expression: string, Message: string) => void;
}

export default function KatexInlineRasterizer({ PendingExpressions, OnResult, OnResultError }: KatexInlineRasterizerProps): React.ReactElement {
  const StartedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const NewExpressions = PendingExpressions.filter((Expression) => !StartedRef.current.has(Expression));
    for (const Expression of NewExpressions) {
      StartedRef.current.add(Expression);
      void RasterizeOne(Expression, OnResult, OnResultError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PendingExpressions]);

  return <div style={{ display: "none" }} />;
}

async function RasterizeOne(
  Expression: string,
  OnResult: (Expression: string, Uri: string, Width: number, Height: number) => void,
  OnResultError: (Expression: string, Message: string) => void,
): Promise<void> {
  const Container = document.createElement("div");
  Container.style.position = "fixed";
  Container.style.top = "-9999px";
  Container.style.left = "-9999px";
  Container.style.display = "inline-block";
  document.body.appendChild(Container);

  try {
    katex.render(Expression, Container, { throwOnError: true, displayMode: false });
    await new Promise<void>((Resolve) => requestAnimationFrame(() => Resolve()));

    const Rect = Container.getBoundingClientRect();
    const Width = Math.max(1, Math.ceil(Rect.width));
    const Height = Math.max(1, Math.ceil(Rect.height));

    const CssText = Array.from(document.styleSheets)
      .flatMap((Sheet) => {
        try {
          return Array.from(Sheet.cssRules).map((Rule) => Rule.cssText);
        } catch {
          return [];
        }
      })
      .join("\n");

    const Svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Width}" height="${Height}">`,
      `<foreignObject width="100%" height="100%">`,
      `<div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block"><style>${CssText}</style>${Container.innerHTML}</div>`,
      `</foreignObject></svg>`,
    ].join("");

    const SvgUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(Svg)}`;

    const Img = new Image();
    await new Promise<void>((Resolve, Reject) => {
      Img.onload = () => Resolve();
      Img.onerror = () => Reject(new Error("SVG image failed to load"));
      Img.src = SvgUri;
    });

    const Scale = Math.min(window.devicePixelRatio || 1, 3);
    const Canvas = document.createElement("canvas");
    Canvas.width = Width * Scale;
    Canvas.height = Height * Scale;
    const Ctx = Canvas.getContext("2d");
    if (!Ctx) throw new Error("2D canvas context unavailable");
    Ctx.scale(Scale, Scale);
    Ctx.drawImage(Img, 0, 0, Width, Height);

    OnResult(Expression, Canvas.toDataURL("image/png"), Width, Height);
  } catch (CaughtError) {
    OnResultError(Expression, CaughtError instanceof Error ? CaughtError.message : String(CaughtError));
  } finally {
    document.body.removeChild(Container);
  }
}
