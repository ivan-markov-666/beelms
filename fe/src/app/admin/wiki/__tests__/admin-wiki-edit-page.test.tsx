import { fireEvent, render, screen } from "@testing-library/react";
import AdminWikiEditPage from "../[slug]/edit/page";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useParams: () => ({ slug: "getting-started" }),
  };
});

function makeArticle(overrides?: Partial<{
  id: string;
  slug: string;
  language: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
  versions: { id: string; version: number; language: string; title: string; createdAt: string; createdBy: string | null }[];
}>) {
  return {
    id: "1",
    slug: "getting-started",
    language: "bg",
    title: "Начало с QA4Free",
    content: "Съдържание на статията",
    status: "active",
    updatedAt: "2025-11-25T00:00:00.000Z",
    ...overrides,
  };
}

function makeVersion(overrides?: Partial<{
  id: string;
  version: number;
  language: string;
  title: string;
  createdAt: string;
  createdBy: string | null;
}>) {
  return {
    id: "version-1",
    version: 1,
    language: "bg",
    title: "Първа версия",
    createdAt: "2025-11-20T00:00:00.000Z",
    createdBy: "admin-user-id",
    ...overrides,
  };
}

describe("AdminWikiEditPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("renders edit form with loaded article data", async () => {
    const article = makeArticle();

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => article,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminWikiEditPage />);

    const titleInput = (await screen.findByLabelText(
      "Заглавие",
    )) as HTMLInputElement;
    const contentTextarea = screen.getByLabelText(
      "Съдържание",
    ) as HTMLTextAreaElement;
    const statusSelect = screen.getByLabelText(
      "Статус",
    ) as HTMLSelectElement;

    expect(titleInput.value).toBe("Начало с QA4Free");
    expect(contentTextarea.value).toBe("Съдържание на статията");
    expect(statusSelect.value).toBe("active");
  });

  it("submits updated article and shows success message", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const initialArticle = makeArticle({ status: "draft" });
    const updatedArticle = makeArticle({
      title: "Начало с QA4Free (обновено)",
      status: "active",
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialArticle,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedArticle,
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminWikiEditPage />);

    const titleInput = (await screen.findByLabelText(
      "Заглавие",
    )) as HTMLInputElement;

    fireEvent.change(titleInput, {
      target: { value: "Начало с QA4Free (обновено)" },
    });

    const saveButton = screen.getByRole("button", { name: "Запази" });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText("Промените са запазени успешно."),
    ).toBeInTheDocument();

    const restoreCall = (fetchMock as jest.Mock).mock.calls.find(
      ([url, options]) =>
        typeof url === "string" &&
        url.includes("/admin/wiki/articles/") &&
        (options as RequestInit | undefined)?.method === "PUT",
    );

    expect(restoreCall).toBeDefined();
    const [, putOptions] = restoreCall as [string, RequestInit];
    const headers = (putOptions as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("shows error message when save fails with server error", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const initialArticle = makeArticle();

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialArticle,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminWikiEditPage />);

    const titleInput = (await screen.findByLabelText(
      "Заглавие",
    )) as HTMLInputElement;

    fireEvent.change(titleInput, {
      target: { value: "Нов тестов title" },
    });

    const saveButton = screen.getByRole("button", { name: "Запази" });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText("Възникна грешка при запис на промените."),
    ).toBeInTheDocument();
  });

  it("renders versions list with rollback actions", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const article = makeArticle();
    const versions = [
      makeVersion({ id: "version-1", version: 1, title: "Първа версия" }),
      makeVersion({ id: "version-2", version: 2, title: "Втора версия" }),
    ];

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => article,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => versions,
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminWikiEditPage />);

    expect(
      await screen.findByText("Версии на статията"),
    ).toBeInTheDocument();

    expect(await screen.findByText("v1")).toBeInTheDocument();
    expect(screen.getByText("Първа версия")).toBeInTheDocument();

    const rollbackButtons = screen.getAllByRole("button", { name: "Върни" });
    expect(rollbackButtons.length).toBeGreaterThan(0);
  });

  it("restores a selected version and updates the form", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const initialArticle = makeArticle({
      title: "Начално заглавие",
      content: "Първоначално съдържание",
    });
    const versions = [
      makeVersion({
        id: "version-1",
        version: 1,
        title: "Стара версия",
      }),
    ];
    const restoredArticle = makeArticle({
      title: "Стара версия",
      content: "Съдържание от старата версия",
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialArticle,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => versions,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => restoredArticle,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => versions,
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(<AdminWikiEditPage />);

    const rollbackButton = await screen.findByRole("button", { name: "Върни" });
    rollbackButton.click();

    expect(
      await screen.findByText(
        "Статията беше върната към избраната версия.",
      ),
    ).toBeInTheDocument();

    const titleInput = screen.getByLabelText(
      "Заглавие",
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("Стара версия");

    const restoreCall = (fetchMock as jest.Mock).mock.calls.find(
      ([url, options]) =>
        typeof url === "string" &&
        url.includes("/versions/") &&
        (options as RequestInit | undefined)?.method === "POST",
    );

    expect(restoreCall).toBeDefined();
    const [, restoreOptions] = restoreCall as [string, RequestInit];
    const headers = restoreOptions.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");

    confirmSpy.mockRestore();
  });

  it("shows error message when restore fails with server error", async () => {
    window.localStorage.setItem("qa4free_access_token", "test-token");

    const initialArticle = makeArticle();
    const versions = [makeVersion()];

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialArticle,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => versions,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(<AdminWikiEditPage />);

    const rollbackButton = await screen.findByRole("button", { name: "Върни" });
    rollbackButton.click();

    expect(
      await screen.findByText(
        "Възникна грешка при връщане към избраната версия.",
      ),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
