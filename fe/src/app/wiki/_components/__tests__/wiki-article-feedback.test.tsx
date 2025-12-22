import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { WikiArticleFeedback } from "../wiki-article-feedback";

jest.mock("../../../auth-token", () => ({
  getAccessToken: jest.fn(() => null),
}));

describe("WikiArticleFeedback", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("submits helpful=true and shows thank you", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ helpfulYes: 1, helpfulNo: 0, total: 1 }),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <WikiArticleFeedback
        slug="getting-started"
        lang="bg"
        initialSummary={{ helpfulYes: 0, helpfulNo: 0, total: 0 }}
      />,
    );

    const yesButton = screen.getByRole("button", { name: "Да" });

    await act(async () => {
      fireEvent.click(yesButton);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [postUrl, postInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(postUrl).toContain("/api/wiki/articles/getting-started/feedback");
    expect(postInit.method).toBe("POST");
    expect(postInit.headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
    expect(postInit.body).toBe(JSON.stringify({ helpful: true }));

    expect(
      await screen.findByText("Благодарим за обратната връзка!"),
    ).toBeInTheDocument();
  });
});
