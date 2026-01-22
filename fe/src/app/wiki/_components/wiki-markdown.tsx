"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import Image from "next/image";

type MermaidRenderResult = string | { svg: string };

type MermaidInstance = {
  initialize?: (config: unknown) => void;
  render?: (
    id: string,
    code: string,
  ) => Promise<MermaidRenderResult> | MermaidRenderResult;
};

type MermaidModule = MermaidInstance & {
  default?: MermaidInstance;
};

let mermaidModulePromise: Promise<MermaidInstance> | null = null;

type TocEntry = {
  level: number;
  text: string;
  id: string;
};

function normalizeHeadingText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\s*#+\s*$/, "")
    .trim();
}

function stripInlineMarkdown(input: string): string {
  let out = input;

  out = out.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  out = out.replace(/`([^`]+)`/g, "$1");
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/\*([^*]+)\*/g, "$1");
  out = out.replace(/__([^_]+)__/g, "$1");
  out = out.replace(/_([^_]+)_/g, "$1");

  return normalizeHeadingText(out);
}

function slugify(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const slug = ascii
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "section";
}

function createSlugger() {
  const seen = new Map<string, number>();
  return (raw: string) => {
    const base = slugify(normalizeHeadingText(raw));
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

function extractTextFromChildren(children: unknown): string {
  if (children === null || children === undefined) {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((c) => extractTextFromChildren(c)).join("");
  }

  if (typeof children === "object") {
    const maybe = children as { props?: { children?: unknown } };
    return extractTextFromChildren(maybe.props?.children);
  }

  return "";
}

function buildToc(content: string): TocEntry[] {
  const lines = (content ?? "").split(/\r?\n/);
  const nextId = createSlugger();
  const entries: TocEntry[] = [];

  let inFence = false;
  let fenceMarker: string | null = null;

  for (const line of lines) {
    const fenceMatch = /^\s*(```+|~~~+)\s*/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (fenceMarker && marker.startsWith(fenceMarker[0])) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    const match = /^(#{1,4})\s+(.+)$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = stripInlineMarkdown(match[2]);
    if (!text) {
      continue;
    }

    entries.push({ level, text, id: nextId(text) });
  }

  return entries;
}

export function sanitizeMermaidSvg(svg: string): string {
  try {
    if (!svg || typeof svg !== "string") {
      return "";
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const root = doc.documentElement;

    if (!root || root.nodeName.toLowerCase() !== "svg") {
      return "";
    }

    const allowedTags = new Set([
      "svg",
      "g",
      "path",
      "rect",
      "circle",
      "ellipse",
      "line",
      "polyline",
      "polygon",
      "text",
      "tspan",
      "foreignObject",
      "div",
      "span",
      "p",
      "br",
      "defs",
      "marker",
      "style",
      "title",
      "desc",
      "clipPath",
      "mask",
      "pattern",
      "linearGradient",
      "radialGradient",
      "stop",
      "filter",
      "feGaussianBlur",
      "feOffset",
      "feMerge",
      "feMergeNode",
      "feColorMatrix",
      "feComponentTransfer",
      "feFuncR",
      "feFuncG",
      "feFuncB",
      "feFuncA",
      "feFlood",
      "feComposite",
      "feBlend",
    ]);

    const allowedAttrs = new Set([
      "id",
      "class",
      "xmlns",
      "xmlns:xhtml",
      "viewBox",
      "width",
      "height",
      "x",
      "y",
      "dx",
      "dy",
      "x1",
      "y1",
      "x2",
      "y2",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "d",
      "points",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-dasharray",
      "stroke-dashoffset",
      "opacity",
      "transform",
      "style",
      "font-family",
      "font-size",
      "font-style",
      "font-weight",
      "text-anchor",
      "alignment-baseline",
      "dominant-baseline",
      "baseline-shift",
      "textLength",
      "lengthAdjust",
      "marker-end",
      "marker-start",
      "refX",
      "refY",
      "orient",
      "markerWidth",
      "markerHeight",
      "preserveAspectRatio",
      "clip-path",
      "mask",
      "filter",
      "stop-color",
      "stop-opacity",
      "offset",
    ]);

    const decodeTextEntities = (input: string) =>
      input
        .replaceAll("&quot;", '"')
        .replaceAll("&#34;", '"')
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&");

    const removeNode = (node: Element) => {
      const parent = node.parentNode;
      if (parent) {
        parent.removeChild(node);
      }
    };

    const walk = (node: Element) => {
      const tag = node.nodeName;

      if (!allowedTags.has(tag)) {
        removeNode(node);
        return;
      }

      for (const attr of Array.from(node.attributes)) {
        const name = attr.name;
        const lower = name.toLowerCase();

        if (lower.startsWith("on")) {
          node.removeAttribute(name);
          continue;
        }

        if (!allowedAttrs.has(name) && !allowedAttrs.has(lower)) {
          node.removeAttribute(name);
          continue;
        }

        if (lower === "style") {
          const css = attr.value ?? "";
          const cleaned = css
            .replace(/@import\s+[^;]+;/gi, "")
            .replace(/url\((?!\s*#)[^)]*\)/gi, "");
          if (cleaned.trim().length === 0) {
            node.removeAttribute(name);
          } else {
            node.setAttribute(name, cleaned);
          }
        }

        if (
          (lower === "filter" || lower === "clip-path" || lower === "mask") &&
          attr.value &&
          !/^url\(#[-a-zA-Z0-9_]+\)$/.test(attr.value.trim())
        ) {
          node.removeAttribute(name);
        }
      }

      if (tag === "style") {
        const css = node.textContent ?? "";
        const cleaned = css
          .replace(/@import\s+[^;]+;/gi, "")
          .replace(/url\((?!\s*#)[^)]*\)/gi, "");
        node.textContent = cleaned;
      }

      if (tag === "title" || tag === "desc") {
        const text = node.textContent;
        if (typeof text === "string" && text.includes("&")) {
          node.textContent = decodeTextEntities(text);
        }
      }

      for (const child of Array.from(node.children)) {
        walk(child);
      }
    };

    walk(root);

    return root.outerHTML;
  } catch {
    return "";
  }
}

function loadMermaid(): Promise<MermaidInstance> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((mod: MermaidModule) => {
      const mermaid = mod.default ?? mod;

      if (typeof mermaid.initialize === "function") {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
          flowchart: { htmlLabels: true, nodeSpacing: 60, rankSpacing: 95 },
          themeVariables: {
            background: "#ffffff",
            fontSize: "14px",
            textColor: "#111827",
            lineColor: "#374151",
          },
        });
      }

      return mermaid;
    });
  }

  return mermaidModulePromise;
}

export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fullscreenViewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mod = await loadMermaid();
        if (!mod || typeof mod.render !== "function") {
          setError("Mermaid диаграмата не можа да бъде рендерирана.");
          setSvg(null);
          return;
        }

        if (!containerRef.current || cancelled) {
          return;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const result = await mod.render(id, code);
        const svg: string = typeof result === "string" ? result : result.svg;

        const sanitized = sanitizeMermaidSvg(svg);
        if (!sanitized) {
          setError("Mermaid диаграмата не можа да бъде рендерирана.");
          setSvg(null);
          return;
        }

        if (!cancelled) {
          setError(null);
          setSvg(sanitized);
          setScale(1);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Mermaid диаграмата не можа да бъде рендерирана.";
          setError(message);
          setSvg(null);
        }
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const viewport = fullscreenViewportRef.current;
      if (!viewport) {
        return;
      }

      const step = e.shiftKey ? 220 : 80;
      switch (e.key) {
        case "ArrowLeft":
          viewport.scrollLeft -= step;
          e.preventDefault();
          break;
        case "ArrowRight":
          viewport.scrollLeft += step;
          e.preventDefault();
          break;
        case "ArrowUp":
          viewport.scrollTop -= step;
          e.preventDefault();
          break;
        case "ArrowDown":
          viewport.scrollTop += step;
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen]);

  if (error) {
    return (
      <pre className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
        {error}
      </pre>
    );
  }

  const clamp = (value: number) => Math.min(8, Math.max(0.2, value));
  const zoomIn = () => setScale((v) => clamp(Math.round((v + 0.1) * 10) / 10));
  const zoomOut = () => setScale((v) => clamp(Math.round((v - 0.1) * 10) / 10));
  const zoomReset = () => setScale(1);

  const onPrint = () => {
    if (typeof window === "undefined") {
      return;
    }

    const svgToPrint =
      svg ??
      containerRef.current?.querySelector?.("svg")?.outerHTML ??
      containerRef.current?.innerHTML ??
      "";

    if (!svgToPrint) {
      window.alert("Nothing to print yet. The diagram is still loading.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert(
        "Pop-up blocked. Please allow pop-ups to print the diagram.",
      );
      return;
    }

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mermaid diagram</title>
    <style>
      @page { margin: 12mm; }
      html, body { height: 100%; }
      body { margin: 0; background: #fff; color: #111; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      .wrap { padding: 12mm; }
      .wrap svg { width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <div class="wrap">${svgToPrint}</div>
    <script>
      window.onload = function () {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // ignore
      }
    }, 150);
  };

  const getActiveViewport = () =>
    fullscreen ? fullscreenViewportRef.current : viewportRef.current;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) {
      return;
    }

    const viewport = getActiveViewport();
    if (!viewport) {
      return;
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    };
    setIsPanning(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }

    const viewport = getActiveViewport();
    if (!viewport) {
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    viewport.scrollLeft = drag.startScrollLeft - dx;
    viewport.scrollTop = drag.startScrollTop - dy;
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsPanning(false);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) {
      return;
    }

    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    setScale((v) => clamp(Math.round((v + direction * 0.1) * 10) / 10));
  };

  const DiagramContent = (
    <div className="relative">
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={zoomReset}
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={() => setFullscreen(true)}
        >
          Fullscreen
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={onPrint}
        >
          Print
        </button>
      </div>

      <div ref={viewportRef} className="overflow-auto" onWheel={onWheel}>
        <div
          className={isPanning ? "cursor-grabbing select-none" : "cursor-grab"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {svg ? (
              <div
                dangerouslySetInnerHTML={{ __html: svg }}
                className="mermaid"
              />
            ) : (
              <div ref={containerRef} className="mermaid" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {DiagramContent}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-2">
          <div className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2">
            <div className="text-xs font-semibold text-zinc-700">Mermaid</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={onPrint}
              >
                Print
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={zoomOut}
              >
                -
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={zoomReset}
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={zoomIn}
              >
                +
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={() => setFullscreen(false)}
              >
                Close
              </button>
            </div>
          </div>

          <div
            ref={fullscreenViewportRef}
            className="mt-2 w-full flex-1 overflow-auto rounded-md bg-white p-3"
            onWheel={onWheel}
          >
            <div
              className={
                isPanning ? "cursor-grabbing select-none" : "cursor-grab"
              }
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPan}
              onPointerCancel={endPan}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {svg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: svg }}
                    className="mermaid"
                  />
                ) : (
                  <div ref={containerRef} className="mermaid" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function WikiMarkdown({ content }: { content: string }) {
  const tocEntries = useMemo(() => buildToc(content), [content]);
  const headingIdAllocatorRef = useRef<{
    used: Set<string>;
    counts: Map<string, number>;
  } | null>(null);
  
  const headingIndexRef = useRef(0);

  useEffect(() => {
    headingIndexRef.current = 0;
  }, [content]);

  useEffect(() => {
    headingIdAllocatorRef.current = {
      used: new Set(tocEntries.map((e) => e.id)),
      counts: new Map<string, number>(),
    };
  }, [tocEntries]);

  const baseAttributes =
    (defaultSchema.attributes as Record<string, unknown> | undefined) ?? {};
  const anchorAttributes = (baseAttributes.a as string[] | undefined) ?? [];
  const imgAttributes = (baseAttributes.img as string[] | undefined) ?? [];
  const spanAttributes = (baseAttributes.span as string[] | undefined) ?? [];
  const divAttributes = (baseAttributes.div as string[] | undefined) ?? [];
  const h1Attributes = (baseAttributes.h1 as string[] | undefined) ?? [];
  const h2Attributes = (baseAttributes.h2 as string[] | undefined) ?? [];
  const h3Attributes = (baseAttributes.h3 as string[] | undefined) ?? [];
  const h4Attributes = (baseAttributes.h4 as string[] | undefined) ?? [];
  const baseProtocols =
    (defaultSchema.protocols as Record<string, unknown> | undefined) ?? {};
  const hrefProtocols = (baseProtocols.href as string[] | undefined) ?? [];
  const srcProtocols = (baseProtocols.src as string[] | undefined) ?? [];

  const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
      ...((defaultSchema.tagNames as string[] | undefined) ?? []),
      "a",
      "img",
      "span",
      "div",
      "input",
      "label",
      "u",
      "sup",
      "sub",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
    ],
    attributes: {
      ...baseAttributes,
      a: Array.from(
        new Set([
          ...anchorAttributes,
          "href",
          "title",
          "target",
          "rel",
          "className",
        ]),
      ),
      span: Array.from(
        new Set([
          ...spanAttributes,
          "className",
          "style",
          "aria-hidden",
          "role",
        ]),
      ),
      div: Array.from(
        new Set([...divAttributes, "className", "style", "aria-hidden"]),
      ),
      input: ["type", "checked", "disabled"],
      label: ["className"],
      h1: Array.from(new Set([...h1Attributes, "id", "className"])),
      h2: Array.from(new Set([...h2Attributes, "id", "className"])),
      h3: Array.from(new Set([...h3Attributes, "id", "className"])),
      h4: Array.from(new Set([...h4Attributes, "id", "className"])),
      img: Array.from(
        new Set([
          ...imgAttributes,
          "src",
          "alt",
          "title",
          "width",
          "height",
          "className",
          "loading",
        ]),
      ),
      table: ["className"],
      thead: ["className"],
      tbody: ["className"],
      tfoot: ["className"],
      tr: ["className"],
      th: ["className", "colSpan", "rowSpan", "scope"],
      td: ["className", "colSpan", "rowSpan"],
      colgroup: ["className"],
      col: ["className", "span"],
    },
    protocols: {
      ...baseProtocols,
      href: Array.from(
        new Set(["http", "https", "mailto", "tel", ...hrefProtocols]),
      ),
      src: Array.from(new Set(["http", "https", ...srcProtocols])),
    },
  };

  const components: Components = {
    p({ children, ...props }) {
      const raw = extractTextFromChildren(children);
      const marker = raw.trim().toLowerCase();
      if (marker === "[[toc]]") {
        if (!tocEntries.length) {
          return null;
        }

        return (
          <nav className="wiki-toc" aria-label="Съдържание">
            <div className="wiki-toc-title">Съдържание</div>
            <ul className="wiki-toc-list">
              {tocEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="wiki-toc-item"
                  style={{ marginLeft: `${Math.max(0, entry.level - 1) * 12}px` }}
                >
                  <a href={`#${entry.id}`}>{entry.text}</a>
                </li>
              ))}
            </ul>
          </nav>
        );
      }

      return <p {...props}>{children}</p>;
    },
    a({ children, rel, target, ...props }) {
      const nextRel =
        target === "_blank"
          ? Array.from(
              new Set(`${rel ?? ""} noopener noreferrer`.trim().split(/\s+/)),
            ).join(" ")
          : rel;

      return (
        <a {...props} target={target} rel={nextRel}>
          {children}
        </a>
      );
    },
    img({ src, alt, title, ...props }) {
      if (!src || typeof src !== "string") {
        return null;
      }

      const widthRaw = (props as { width?: unknown }).width;
      const heightRaw = (props as { height?: unknown }).height;

      const width =
        typeof widthRaw === "number"
          ? widthRaw
          : Number.parseInt(String(widthRaw ?? ""), 10);
      const height =
        typeof heightRaw === "number"
          ? heightRaw
          : Number.parseInt(String(heightRaw ?? ""), 10);

      const safeWidth = Number.isFinite(width) && width > 0 ? width : 800;
      const safeHeight = Number.isFinite(height) && height > 0 ? height : 450;

      return (
        <span className="my-4 block">
          <Image
            src={src}
            alt={alt ?? ""}
            title={title}
            width={safeWidth}
            height={safeHeight}
            sizes="100vw"
            className={(props as { className?: string }).className}
            style={{ maxWidth: "100%", height: "auto" }}
            loader={({ src: url }) => url}
            unoptimized
          />
        </span>
      );
    },
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match?.[1];

      if (language === "mermaid") {
        const code = String(children ?? "").trim();
        return <MermaidDiagram code={code} />;
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const renderHeading = (
    level: 1 | 2 | 3 | 4,
    children: ReactNode,
    props: Record<string, unknown>,
  ) => {
    const text = normalizeHeadingText(extractTextFromChildren(children));
    let id: string | null = null;

    for (let i = headingIndexRef.current; i < tocEntries.length; i++) {
      const entry = tocEntries[i];
      if (entry.level !== level) {
        continue;
      }
      if (entry.text !== text) {
        continue;
      }
      id = entry.id;
      headingIndexRef.current = i + 1;
      break;
    }

    if (!id) {
      const allocator = headingIdAllocatorRef.current;
      if (!allocator) {
        id = slugify(text);
      } else {
        const base = slugify(normalizeHeadingText(text));
        const next = (allocator.counts.get(base) ?? 0) + 1;
        allocator.counts.set(base, next);

        let candidate = next === 1 ? base : `${base}-${next}`;
        while (allocator.used.has(candidate)) {
          const n = (allocator.counts.get(base) ?? 0) + 1;
          allocator.counts.set(base, n);
          candidate = `${base}-${n}`;
        }
        allocator.used.add(candidate);
        id = candidate;
      }
    }

    const Tag = `h${level}` as const;
    return (
      <Tag {...props} id={id}>
        <a
          className="wiki-heading-anchor"
          href={`#${id}`}
          aria-label={`Линк към ${text}`}
        >
          #
        </a>
        {children}
      </Tag>
    );
  };

  components.h1 = ({ children, ...props }) =>
    renderHeading(1, children as ReactNode, props as Record<string, unknown>);
  components.h2 = ({ children, ...props }) =>
    renderHeading(2, children as ReactNode, props as Record<string, unknown>);
  components.h3 = ({ children, ...props }) =>
    renderHeading(3, children as ReactNode, props as Record<string, unknown>);
  components.h4 = ({ children, ...props }) =>
    renderHeading(4, children as ReactNode, props as Record<string, unknown>);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeSanitize, sanitizeSchema]]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
