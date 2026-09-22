const { test, expect } = require("@playwright/test");

const pages = [
  { path: "/", marker: "body" },
  { path: "/nele.html", marker: "body" },
  { path: "/lessons/a1/index.html", marker: "body" },
  { path: "/lessons/a1/lektion-1.html", marker: "body" },
  { path: "/lessons/a1/lektion-2.html", marker: "body" },
  { path: "/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html", marker: "body" },
  { path: "/lessons/sprich-nach.a1/sprich-nach1.html", marker: "body" },
  { path: "/lessons/ubungen.a1/ubungen1.html", marker: "body" },
  { path: "/lessons/dialoge.a1/dialoge1.html", marker: "body" },
  { path: "/lessons/dikatat.a1/diktat1.html", marker: "body" }
];

for (const item of pages) {
  test(`loads without browser errors: ${item.path}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    const response = await page.goto(item.path, { waitUntil: "domcontentloaded" });
    expect(response, "Page should return a response").not.toBeNull();
    expect(response.status(), `HTTP status for ${item.path}`).toBeLessThan(400);
    await expect(page.locator(item.marker)).toBeVisible();
    await page.waitForTimeout(500);

    expect(errors, `Browser errors on ${item.path}:\n${errors.join("\n")}`).toEqual([]);
  });
}

test("main Nele interface is present", async ({ page }) => {
  await page.goto("/nele.html", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Nele", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Neu anfangen", { exact: false })).toBeVisible();
});

test("A1 lesson navigation opens local destinations", async ({ page }) => {
  await page.goto("/lessons/a1/lektion-1.html", { waitUntil: "domcontentloaded" });
  const links = page.locator('a[href]:not([href^="#"]):not([href^="http"]):not([href^="mailto:"]):not([href^="tel:"])');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    expect(href).toBeTruthy();
  }
});
