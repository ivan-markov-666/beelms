type RehypePlugin = (...args: unknown[]) => unknown;

// Jest runs in CJS, while rehype-sanitize is ESM. For unit tests that import
// WikiMarkdown, we don't need the real sanitizer implementation.
//
// This mock behaves like a rehype plugin factory and passes through the tree.
const rehypeSanitize: RehypePlugin = () => {
  return (tree: unknown) => tree;
};

export const defaultSchema = {};

export default rehypeSanitize;
