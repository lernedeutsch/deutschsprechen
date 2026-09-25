const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const MODULE_DIRS = [
  "lessons/a1",
  "lessons/aktivt-trenieren.a1",
  "lessons/sprich-nach.a1",
  "lessons/ubungen.a1",
  "lessons/dialoge.a1",
  "lessons/dikatat.a1"
];

function productionPages() {
  const pages = [];
  for (const dir of MODULE_DIRS) {
    const absolute = path.join(ROOT, dir);
    if (!fs.existsSync(absolute)) continue;
    for (const name of fs.readdirSync(absolute)) {
      if (!name.endsWith(".html")) continue;
      const file = path.join(absolute, name);
      // Tiny files in this repository are intentional future placeholders.
      if (fs.statSync(file).size < 1500) continue;
      pages.push("/" + path.join(dir, name).split(path.sep).join("/"));
    }
  }
  return pages.sort();
}

const pages = productionPages();

test("quality gate discovers a meaningful A1 surface", async () => {
  expect(pages.length).toBeGreaterThan(20);
});

for (const target of pages) {
  test(`A1 smoke: ${target}`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    const response = await page.goto(target, { waitUntil: "domcontentloaded" });
    expect(response, "Page should return an HTTP response").not.toBeNull();
    expect(response.status(), `HTTP status for ${target}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();

    // Catch JavaScript crashes that previously slipped through when CI tested
    // only Lektion 1. Network/backend availability is intentionally not part
    // of this local frontend smoke gate.
    await page.waitForTimeout(100);
    expect(pageErrors, `JavaScript errors on ${target}`).toEqual([]);

    // Guard the tablet/phone layout against accidental horizontal breakage.
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(
      overflow.scrollWidth,
      `Horizontal overflow on ${target}: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`
    ).toBeLessThanOrEqual(overflow.clientWidth + 4);
  });
}
