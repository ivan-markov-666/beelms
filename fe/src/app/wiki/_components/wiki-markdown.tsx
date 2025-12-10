"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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

function loadMermaid(): Promise<MermaidInstance> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((mod: MermaidModule) => {
      const mermaid = mod.default ?? mod;

      if (typeof mermaid.initialize === "function") {
        mermaid.initialize({ startOnLoad: false });
      }

      return mermaid;
    });
  }

  return mermaidModulePromise;
}

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mod = await loadMermaid();
        if (!mod || typeof mod.render !== "function") {
          setError("Mermaid диаграмата не можа да бъде рендерирана.");
          return;
        }

        if (!containerRef.current || cancelled) {
          return;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const result = await mod.render(id, code);
        const svg: string =
          typeof result === "string" ? result : result.svg;

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) {
          setError("Mermaid диаграмата не можа да бъде рендерирана.");
        }
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
        {error}
      </pre>
    );
  }

  return <div ref={containerRef} className="mermaid" />;
}

export function WikiMarkdown({ content }: { content: string }) {
  const components: Components = {
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

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
