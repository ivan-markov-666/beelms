import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
  };
});

describe("SocialPreviewCard", () => {
  it("renders twitter summary card", async () => {
    const { SocialPreviewCard } = await import("../page");

    render(
      <SocialPreviewCard
        platform="twitter"
        domain="example.com"
        title="Title"
        description="Desc"
        imageUrl="https://cdn.example/img.png"
        twitterCardType="summary"
      />,
    );

    expect(screen.getByText("Twitter / X preview")).toBeInTheDocument();
    expect(screen.getByText("Card: summary")).toBeInTheDocument();
    expect(screen.queryByText("App card")).not.toBeInTheDocument();
    expect(screen.queryByText("Player card")).not.toBeInTheDocument();
  });

  it("renders twitter app card details", async () => {
    const { SocialPreviewCard } = await import("../page");

    render(
      <SocialPreviewCard
        platform="twitter"
        domain="example.com"
        title="Title"
        description="Desc"
        imageUrl="https://cdn.example/img.png"
        twitterCardType="app"
        twitterAppName="Bee App"
      />,
    );

    expect(screen.getByText("Card: app")).toBeInTheDocument();
    expect(screen.getByText("App card")).toBeInTheDocument();
    expect(screen.getByText("Install / Open: Bee App")).toBeInTheDocument();
  });

  it("renders twitter player card overlay + player metadata", async () => {
    const { SocialPreviewCard } = await import("../page");

    render(
      <SocialPreviewCard
        platform="twitter"
        domain="example.com"
        title="Title"
        description="Desc"
        imageUrl={null}
        twitterCardType="player"
        twitterPlayerUrl="https://player.example/embed"
        twitterPlayerWidth={640}
        twitterPlayerHeight={360}
      />,
    );

    expect(screen.getByText("Card: player")).toBeInTheDocument();
    expect(screen.getByText("Player card")).toBeInTheDocument();
    expect(screen.getByText("Player: 640×360")).toBeInTheDocument();
    expect(
      screen.getByText("https://player.example/embed"),
    ).toBeInTheDocument();
    expect(screen.getByText("▶")).toBeInTheDocument();
  });

  it("renders facebook/linkedin preview without twitter card badge", async () => {
    const { SocialPreviewCard } = await import("../page");

    render(
      <SocialPreviewCard
        platform="facebook"
        domain="example.com"
        title="Title"
        description="Desc"
        imageUrl="https://cdn.example/img.png"
      />,
    );

    expect(screen.getByText("Facebook / LinkedIn preview")).toBeInTheDocument();
    expect(screen.queryByText(/Card:/)).not.toBeInTheDocument();
  });
});
