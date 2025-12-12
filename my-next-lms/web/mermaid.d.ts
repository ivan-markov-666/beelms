declare module "mermaid" {
  export type MermaidConfig = unknown;

  export function initialize(config: MermaidConfig): void;

  export function render(
    id: string,
    code: string,
  ): Promise<string | { svg: string }> | string | { svg: string };

  const mermaid: {
    initialize: typeof initialize;
    render: typeof render;
  };

  export default mermaid;
}
