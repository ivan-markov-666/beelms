import React from "react";

// Simple Jest mock for react-markdown that just renders children inside a span
// and forwards props that tests might rely on (className, etc.).
// This avoids ESM transform issues in Jest while preserving rendered text.

export type ReactMarkdownProps = {
  children?: React.ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export default function ReactMarkdownMock({
  children,
  className,
  remarkPlugins,
  rehypePlugins,
  components,
  ...rest
}: ReactMarkdownProps) {
  void remarkPlugins;
  void rehypePlugins;
  void components;

  return (
    <span data-testid="react-markdown-mock" className={className} {...rest}>
      {children}
    </span>
  );
}
