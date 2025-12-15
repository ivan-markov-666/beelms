import { sanitizeMermaidSvg } from "../_components/wiki-markdown";

describe("sanitizeMermaidSvg", () => {
  it("removes disallowed tags and event handler attributes", () => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('xss')">
  <script>alert('xss')</script>
  <foreignObject><div xmlns="http://www.w3.org/1999/xhtml" onclick="alert('xss')">X</div></foreignObject>
  <g id="ok"><text dx="10" dy="5">OK</text></g>
</svg>`;

    const sanitized = sanitizeMermaidSvg(svg);

    expect(sanitized).toContain("<svg");
    expect(sanitized).toContain("<g");
    expect(sanitized).toContain("<text");
    expect(sanitized.toLowerCase()).toContain("foreignobject");

    expect(sanitized.toLowerCase()).not.toContain("<script");
    expect(sanitized.toLowerCase()).not.toContain("onload=");
    expect(sanitized.toLowerCase()).not.toContain("onclick=");

    expect(sanitized).toContain("dx=\"10\"");
    expect(sanitized).toContain("dy=\"5\"");
  });

  it("sanitizes style tags by removing @import and external url()", () => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg">
  <style>
    @import url('https://evil.com/x.css');
    .a { fill: red; background-image: url(https://evil.com/a.png); }
    .b { filter: url(#good); }
  </style>
  <g class="a"><text>OK</text></g>
</svg>`;

    const sanitized = sanitizeMermaidSvg(svg);
    const lower = sanitized.toLowerCase();

    expect(lower).toContain("<style");
    expect(lower).not.toContain("@import");
    expect(lower).not.toContain("url(https://");
    expect(lower).toContain("url(#good)");
  });

  it("returns empty string when input is not a valid svg", () => {
    expect(sanitizeMermaidSvg("<div>nope</div>")).toBe("");
    expect(sanitizeMermaidSvg("")).toBe("");
  });
});
