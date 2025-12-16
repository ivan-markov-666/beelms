"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Mark, Node, mergeAttributes, type Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { CodeBlock } from "@tiptap/extension-code-block";
import TurndownService from "turndown";
import * as turndownGfm from "turndown-plugin-gfm";
import DOMPurify from "dompurify";
import { marked } from "marked";

function normalizeMarkdownForEditor(markdown: string): string {
  if (!markdown) {
    return "";
  }

  try {
    const html = marked.parse(markdown) as string;
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    });
  } catch {
    return "";
  }
}

function normalizeLinkHref(raw: string): string | null {
  const href = raw.trim();

  if (!href) {
    return null;
  }

  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) {
    return href;
  }

  return null;
}

function normalizeImageSrc(raw: string): string | null {
  const src = raw.trim();

  if (!src) {
    return null;
  }

  if (/^(https?:\/\/|\/)/i.test(src)) {
    return src;
  }

  return null;
}

function createTurndown(): TurndownService {
  const service = new TurndownService({
    codeBlockStyle: "fenced",
    emDelimiter: "_",
  });

  // Best effort: enable GFM tables/strikethrough.
  const gfm = (turndownGfm as unknown as { gfm?: unknown }).gfm;
  const tables = (turndownGfm as unknown as { tables?: unknown }).tables;
  const strikethrough = (turndownGfm as unknown as { strikethrough?: unknown })
    .strikethrough;

  const plugins = [gfm, tables, strikethrough].filter(Boolean);
  if (plugins.length) {
    service.use(plugins as unknown as Parameters<TurndownService["use"]>[0]);
  }

  service.addRule("fencedCodeBlockWithLanguage", {
    filter(node) {
      if (!node || node.nodeName !== "PRE") {
        return false;
      }
      const first = (node as HTMLElement).firstElementChild;
      return !!first && first.nodeName === "CODE";
    },
    replacement(_content, node) {
      const pre = node as HTMLElement;
      const codeEl = pre.firstElementChild as HTMLElement | null;
      const rawCode = codeEl?.textContent ?? "";

      const codeClassName = codeEl?.getAttribute("class") ?? "";
      const preClassName = pre.getAttribute("class") ?? "";
      const className = `${codeClassName} ${preClassName}`.trim();
      const match = /language-([a-zA-Z0-9_-]+)/.exec(className);
      const language = match?.[1] ?? "";

      const fence = "```";
      const info = language ? language : "";

      const trimmedCode = rawCode.replace(/\n+$/, "");

      return `\n\n${fence}${info}\n${trimmedCode}\n${fence}\n\n`;
    },
  });

  service.addRule("underline", {
    filter(node) {
      return node.nodeName === "U";
    },
    replacement(content) {
      return `<u>${content}</u>`;
    },
  });

  service.addRule("superscript", {
    filter(node) {
      return node.nodeName === "SUP";
    },
    replacement(content) {
      return `<sup>${content}</sup>`;
    },
  });

  service.addRule("subscript", {
    filter(node) {
      return node.nodeName === "SUB";
    },
    replacement(content) {
      return `<sub>${content}</sub>`;
    },
  });

  service.addRule("image", {
    filter(node) {
      return node.nodeName === "IMG";
    },
    replacement(_content, node) {
      const img = node as HTMLElement;
      const src = img.getAttribute("src") ?? "";
      const alt = img.getAttribute("alt") ?? "";
      const title = img.getAttribute("title") ?? "";

      if (!src) {
        return "";
      }

      const escapedTitle = title.replace(/"/g, "\\\"");
      const titleSuffix = escapedTitle ? ` \"${escapedTitle}\"` : "";
      return `![${alt}](${src}${titleSuffix})`;
    },
  });

  return service;
}

const UnderlineMark = Mark.create({
  name: "underline",
  parseHTML() {
    return [{ tag: "u" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
});

const ImageNode = Node.create({
  name: "image",
  inline: true,
  group: "inline",
  draggable: true,
  selectable: true,
  atom: true,
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          normalizeImageSrc(element.getAttribute("src") ?? ""),
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});

const SuperscriptMark = Mark.create({
  name: "superscript",
  excludes: "subscript",
  parseHTML() {
    return [{ tag: "sup" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes), 0];
  },
});

const SubscriptMark = Mark.create({
  name: "subscript",
  excludes: "superscript",
  parseHTML() {
    return [{ tag: "sub" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(HTMLAttributes), 0];
  },
});

const LinkMark = Mark.create({
  name: "link",
  inclusive: false,
  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          normalizeLinkHref(element.getAttribute("href") ?? ""),
      },
    };
  },
  parseHTML() {
    return [{ tag: "a[href]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes), 0];
  },
});

const CodeBlockWithLanguage = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const code = element.querySelector("code");
          const className = code?.getAttribute("class") ?? "";
          const match = /language-([a-zA-Z0-9_-]+)/.exec(className);
          return match?.[1] ?? null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const language = attributes.language as string | null;
          if (!language) {
            return {};
          }
          return { class: `language-${language}` };
        },
      },
    };
  },
});

export type WikiRichEditorProps = {
  markdown: string;
  onChangeMarkdown: (markdown: string) => void;
  disabled?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
};

export function WikiRichEditor({
  markdown,
  onChangeMarkdown,
  disabled,
  onEditorReady,
}: WikiRichEditorProps) {
  const turndown = useMemo(() => createTurndown(), []);

  const [, bumpSelectionVersion] = useState(0);

  const onEditorReadyRef = useRef<WikiRichEditorProps["onEditorReady"]>(
    onEditorReady,
  );

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
  }, [onEditorReady]);

  const [tableMessage, setTableMessage] = useState<string | null>(null);
  const tableMessageTimeoutRef = useRef<number | null>(null);

  const lastEmittedMarkdownRef = useRef<string>(markdown);
  const pendingEmitTimeoutRef = useRef<number | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      UnderlineMark,
      SuperscriptMark,
      SubscriptMark,
      LinkMark,
      ImageNode,
      CodeBlockWithLanguage,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeMarkdownForEditor(markdown),
    editorProps: {
      attributes: {
        id: "content",
        class:
          "tiptap-content min-h-[60vh] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500",
      },
      transformPastedHTML(html: string) {
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      },
    },
    onSelectionUpdate: () => {
      bumpSelectionVersion((v) => v + 1);
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      if (pendingEmitTimeoutRef.current) {
        window.clearTimeout(pendingEmitTimeoutRef.current);
      }

      pendingEmitTimeoutRef.current = window.setTimeout(() => {
        const html = editor.getHTML();
        const sanitizedHtml = DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
        });

        const nextMarkdown = turndown.turndown(sanitizedHtml).trim();

        if (nextMarkdown !== lastEmittedMarkdownRef.current) {
          lastEmittedMarkdownRef.current = nextMarkdown;
          onChangeMarkdown(nextMarkdown);
        }
      }, 400);
    },
  });

  useEffect(() => {
    onEditorReadyRef.current?.(editor);
    return () => {
      onEditorReadyRef.current?.(null);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (markdown === lastEmittedMarkdownRef.current) {
      return;
    }

    lastEmittedMarkdownRef.current = markdown;
    const html = normalizeMarkdownForEditor(markdown);

    try {
      editor.commands.setContent(html, { emitUpdate: false });
    } catch {
      // ignore
    }
  }, [editor, markdown]);

  if (!editor) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        Зареждане на rich editor...
      </div>
    );
  }

  const btnBase =
    "rounded border px-2 py-1 text-xs font-semibold hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50";

  const btnActive = "bg-white border-zinc-400 text-zinc-900";
  const btnIdle = "bg-white/40 border-zinc-300 text-zinc-800";

  const isCaptionParagraph = (node: PMNode | null | undefined) => {
    if (!node || node.type.name !== "paragraph") {
      return false;
    }

    if (!node.textContent.trim()) {
      return false;
    }

    let allItalic = true;
    node.descendants((n) => {
      if (!allItalic) {
        return false;
      }
      if (n.isText) {
        const hasItalic = n.marks.some((mark) => mark.type.name === "italic");
        if (!hasItalic) {
          allItalic = false;
          return false;
        }
      }
      return true;
    });

    return allItalic;
  };

  const findClosestImageInSelectionBlock = (): { pos: number; node: PMNode } | null => {
    const { state } = editor;
    const { selection } = state;

    if (selection instanceof NodeSelection && selection.node.type.name === "image") {
      return { pos: selection.from, node: selection.node };
    }

    const $from = state.doc.resolve(selection.from);

    let blockDepth: number | null = null;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).isBlock) {
        blockDepth = d;
        break;
      }
    }

    if (blockDepth === null) {
      return null;
    }

    const blockStart = $from.start(blockDepth);
    const blockNode = $from.node(blockDepth);

    const imagesInBlock: Array<{ pos: number; node: PMNode }> = [];
    blockNode.descendants((n, pos) => {
      if (n.type.name === "image") {
        imagesInBlock.push({ pos: blockStart + pos, node: n });
      }
      return true;
    });

    if (!imagesInBlock.length) {
      return null;
    }

    const best = imagesInBlock.reduce<{ pos: number; node: PMNode; dist: number }>(
      (acc, cur) => {
        const dist = Math.abs(cur.pos - selection.from);
        if (dist < acc.dist) {
          return { pos: cur.pos, node: cur.node, dist };
        }
        return acc;
      },
      {
        pos: imagesInBlock[0].pos,
        node: imagesInBlock[0].node,
        dist: Math.abs(imagesInBlock[0].pos - selection.from),
      },
    );

    return { pos: best.pos, node: best.node };
  };

  const canActOnImage = !!findClosestImageInSelectionBlock();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-sky-300 bg-sky-100 p-2">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
            Text
          </span>

          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            Undo
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            Redo
          </button>

          <div className="mx-1 h-5 w-px bg-sky-200" />

          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("paragraph") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            P
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("heading", { level: 1 }) ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("heading", { level: 2 }) ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("heading", { level: 3 }) ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("heading", { level: 4 }) ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          >
            H4
          </button>

          <div className="mx-1 h-5 w-px bg-sky-200" />

          <button
            type="button"
            className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnIdle}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("italic") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("underline") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleMark("underline").run()}
          >
            Underline
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("strike") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            Strike
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("superscript") ? btnActive : btnIdle
            }`}
            onClick={() =>
              editor.chain().focus().toggleMark("superscript").run()
            }
          >
            Sup
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("subscript") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleMark("subscript").run()}
          >
            Sub
          </button>
          <button
            type="button"
            className={`${btnBase} ${editor.isActive("link") ? btnActive : btnIdle}`}
            onClick={() => {
              const currentHref = editor.getAttributes("link").href as
                | string
                | undefined;
              const input = window.prompt(
                "URL (http(s)://, mailto:, tel:, /...)",
                currentHref ?? "",
              );

              if (input === null) {
                return;
              }

              const href = normalizeLinkHref(input);
              if (!href) {
                window.alert("Невалиден URL.");
                return;
              }

              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setMark("link", { href })
                .run();
            }}
          >
            Link
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() =>
              editor.chain().focus().extendMarkRange("link").unsetMark("link").run()
            }
            disabled={!editor.isActive("link")}
          >
            Unlink
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => {
              const input = window.prompt(
                "Image URL (http(s):// or /...)",
                "",
              );
              if (input === null) {
                return;
              }

              const src = normalizeImageSrc(input);
              if (!src) {
                window.alert("Невалиден URL за изображение.");
                return;
              }

              const alt = window.prompt("Alt text (optional)", "") ?? "";
              const title = window.prompt("Title (optional)", "") ?? "";

              editor
                .chain()
                .focus()
                .insertContent({
                  type: "image",
                  attrs: { src, alt, title },
                })
                .run();
            }}
          >
            Image
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            disabled={!canActOnImage}
            onClick={() => {
              const match = findClosestImageInSelectionBlock();
              if (!match) {
                return;
              }

              const attrs = match.node.attrs as {
                src?: string | null;
                alt?: string | null;
                title?: string | null;
              };

              const alt = window.prompt("Alt text (optional)", attrs.alt ?? "");
              if (alt === null) {
                return;
              }

              const title = window.prompt(
                "Title (optional)",
                attrs.title ?? "",
              );
              if (title === null) {
                return;
              }

              editor.commands.focus();
              const { state, view } = editor;
              const nextAttrs = {
                ...(match.node.attrs as Record<string, unknown>),
                alt,
                title,
              };
              const tr = state.tr.setNodeMarkup(match.pos, undefined, nextAttrs);
              view.dispatch(tr);
            }}
          >
            Edit image
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            disabled={!canActOnImage}
            onClick={() => {
              const match = findClosestImageInSelectionBlock();
              if (!match) {
                return;
              }

              const { state } = editor;
              const $img = state.doc.resolve(match.pos);
              let blockDepth: number | null = null;
              for (let d = $img.depth; d > 0; d--) {
                if ($img.node(d).isBlock) {
                  blockDepth = d;
                  break;
                }
              }

              if (blockDepth !== null) {
                const insertPos = $img.after(blockDepth);
                const maybeCaptionNode = state.doc.nodeAt(insertPos);
                if (isCaptionParagraph(maybeCaptionNode)) {
                  editor.commands.deleteRange({
                    from: insertPos,
                    to: insertPos + (maybeCaptionNode?.nodeSize ?? 0),
                  });
                }
              }

              editor
                .chain()
                .focus()
                .deleteRange({
                  from: match.pos,
                  to: match.pos + match.node.nodeSize,
                })
                .run();
            }}
          >
            Remove image
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            disabled={!canActOnImage}
            onClick={() => {
              const match = findClosestImageInSelectionBlock();
              if (!match) {
                return;
              }

              const { state } = editor;
              const $img = state.doc.resolve(match.pos);

              let blockDepth: number | null = null;
              for (let d = $img.depth; d > 0; d--) {
                if ($img.node(d).isBlock) {
                  blockDepth = d;
                  break;
                }
              }

              if (blockDepth === null) {
                return;
              }

              const insertPos = $img.after(blockDepth);
              const maybeCaptionNode = state.doc.nodeAt(insertPos);

              const hasCaption = isCaptionParagraph(maybeCaptionNode);
              const currentCaption = hasCaption
                ? maybeCaptionNode?.textContent ?? ""
                : "";

              const nextCaption = window.prompt(
                "Caption (optional). Keep it short. Empty removes caption.",
                currentCaption,
              );

              if (nextCaption === null) {
                return;
              }

              const trimmed = nextCaption.trim();
              if (!trimmed) {
                if (hasCaption && maybeCaptionNode) {
                  editor.commands.deleteRange({
                    from: insertPos,
                    to: insertPos + maybeCaptionNode.nodeSize,
                  });
                }
                return;
              }

              const captionParagraph = {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [{ type: "italic" }],
                    text: trimmed,
                  },
                ],
              };

              if (hasCaption && maybeCaptionNode) {
                editor.commands.insertContentAt(
                  { from: insertPos, to: insertPos + maybeCaptionNode.nodeSize },
                  captionParagraph,
                );
                return;
              }

              editor.commands.insertContentAt(insertPos, captionParagraph);
            }}
          >
            Caption
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("bulletList") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullets
          </button>
          <button
            type="button"
            className={`${btnBase} ${
              editor.isActive("orderedList") ? btnActive : btnIdle
            }`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbered
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-violet-300 bg-violet-100 p-2">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
            Table
          </span>

          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            Insert
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            +Row
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            +Col
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            -Row
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            -Col
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => {
              if (tableMessageTimeoutRef.current) {
                window.clearTimeout(tableMessageTimeoutRef.current);
              }

              if (!editor.can().mergeCells()) {
                setTableMessage(
                  "Не може да се слеят клетки: маркирай правоъгълна група от повече от една клетка.",
                );
                tableMessageTimeoutRef.current = window.setTimeout(() => {
                  setTableMessage(null);
                }, 10000);
                return;
              }

              setTableMessage(null);
              editor.chain().focus().mergeCells().run();
            }}
          >
            Merge
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            Split
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            Header row
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          >
            Header col
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-100 p-2">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Mermaid
          </span>

          <button
            type="button"
            className={`${btnBase} ${btnIdle}`}
            onClick={() => {
              editor.chain().focus().insertContent({
                type: "codeBlock",
                attrs: { language: "mermaid" },
                content: [{ type: "text", text: "graph TD\n  A[Start] --> B[Next]" }],
              }).run();
            }}
          >
            Insert
          </button>
        </div>
      </div>

      {tableMessage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {tableMessage}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
