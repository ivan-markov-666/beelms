"use strict";

import fs from "fs";
import path from "path";

function collectFiles(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(fullPath, acc);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(fullPath);
    }
  }

  return acc;
}

describe("API URL helper guard", () => {
  it("ensures NEXT_PUBLIC_API_BASE_URL env is only read via api-url.ts", () => {
    const appDir = path.join(__dirname, "..");
    const guardTestFile = path.resolve(__filename);
    const files = collectFiles(appDir);

    const violations = files.filter((filePath) => {
      if (
        filePath.endsWith(`${path.sep}api-url.ts`) ||
        path.resolve(filePath) === guardTestFile
      ) {
        return false;
      }

      const content = fs.readFileSync(filePath, "utf8");
      return content.includes("process.env.NEXT_PUBLIC_API_BASE_URL");
    });

    expect(violations).toEqual([]);
  });
});
