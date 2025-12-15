import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import mermaid from "mermaid";

import { MermaidDiagram } from "../_components/wiki-markdown";

jest.mock("mermaid", () => {
  const api = {
    initialize: jest.fn(),
    render: jest.fn(),
  };

  return {
    __esModule: true,
    default: api,
    ...api,
  };
});

describe("MermaidDiagram", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (window as unknown as { alert: jest.Mock }).alert = jest.fn();

    const openMock = jest.fn(() => {
      return {
        document: {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
        },
        focus: jest.fn(),
        print: jest.fn(),
      };
    });

    (window as unknown as { open: jest.Mock }).open = openMock as unknown as jest.Mock;
  });

  it("renders controls and opens fullscreen", async () => {
    const mermaidApi = mermaid as unknown as { initialize: jest.Mock; render: jest.Mock };

    mermaidApi.render.mockResolvedValue({
      svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
  <g>
    <foreignObject x="0" y="0" width="100" height="40">
      <div xmlns="http://www.w3.org/1999/xhtml">Hello</div>
    </foreignObject>
  </g>
</svg>`,
    });

    render(<MermaidDiagram code="flowchart LR\nA-->B" />);

    await waitFor(() => expect(mermaidApi.render).toHaveBeenCalled());

    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("prints diagram using window.open", async () => {
    const mermaidApi = mermaid as unknown as { render: jest.Mock };

    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><text>OK</text></svg>`;
    mermaidApi.render.mockResolvedValue({ svg });

    const openMock = window.open as unknown as jest.Mock;

    render(<MermaidDiagram code="flowchart LR\nA-->B" />);

    await waitFor(() => expect(mermaidApi.render).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "Print" }));

    expect(openMock).toHaveBeenCalled();

    const printWindow = openMock.mock.results[0]?.value as {
      document: { write: jest.Mock };
    };

    expect(printWindow.document.write).toHaveBeenCalled();
    const written = String(printWindow.document.write.mock.calls[0]?.[0] ?? "");
    expect(written).toContain("<svg");
  });
});
