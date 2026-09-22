const { test, expect } = require("@playwright/test");

const pages = [
  { path: "/", marker: "body" },
  { path: "/nele.html", marker: "body", allowsBackendErrors: true },
  { path: "/lessons/a1/index.html", marker: "body" },
  { path: "/lessons/a1/lektion-1.html", marker: "body" },
  { path: "/lessons/a1/lektion-2.html", marker: "body" },
  { path: "/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html", marker: "body" },
  { path: "/lessons/sprich-nach.a1/sprich-nach1.html", marker: "body" },
  { path: "/lessons/ubungen.a1/ubungen1.html", marker: "body" },
  { path: "/lessons/dialoge.a1/dialoge1.html", marker: "body" },
  { path: "/lessons/dikatat.a1/diktat1.html", marker: "body" }
];

const trainingModules = [
  {
    label: "Aktiv trainieren",
    href: "../aktivt-trenieren.a1/aktiv-trenieren1.html",
    expectedPath: "/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html"
  },
  {
    label: "Sprich nach",
    href: "../sprich-nach.a1/sprich-nach1.html",
    expectedPath: "/lessons/sprich-nach.a1/sprich-nach1.html"
  },
  {
    label: "Übungen",
    href: "../ubungen.a1/ubungen1.html",
    expectedPath: "/lessons/ubungen.a1/ubungen1.html"
  },
  {
    label: "Dialoge",
    href: "../dialoge.a1/dialoge1.html",
    expectedPath: "/lessons/dialoge.a1/dialoge1.html"
  },
  {
    label: "Diktat",
    href: "../dikatat.a1/diktat1.html",
    expectedPath: "/lessons/dikatat.a1/diktat1.html"
  }
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
    await page.waitForTimeout(300);

    const relevantErrors = item.allowsBackendErrors
      ? errors.filter(error =>
          !error.includes("Failed to load resource: net::ERR_FAILED") &&
          !error.includes("Nele Welcome Fehler: TypeError: Failed to fetch")
        )
      : errors;

    expect(
      relevantErrors,
      `Browser errors on ${item.path}:\n${relevantErrors.join("\n")}`
    ).toEqual([]);
  });
}

test("main Nele interface is present", async ({ page }) => {
  await page.goto("/nele.html", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Nele", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Neu anfangen", { exact: false })).toBeVisible();
});

for (const module of trainingModules) {
  test(`Lektion 1 opens ${module.label}`, async ({ page }) => {
    await page.goto("/lessons/a1/lektion-1.html", { waitUntil: "domcontentloaded" });

    const link = page.locator(`a[href="${module.href}"]`).first();
    await expect(link, `${module.label} link should be visible`).toBeVisible();

    await Promise.all([
      page.waitForURL(url => url.pathname === module.expectedPath),
      link.click()
    ]);

    expect(new URL(page.url()).pathname).toBe(module.expectedPath);
    await expect(page.locator("body")).toBeVisible();
  });
}

test("A1 training buttons do not overflow the viewport", async ({ page }) => {
  await page.goto("/lessons/a1/lektion-1.html", { waitUntil: "domcontentloaded" });

  for (const module of trainingModules) {
    const link = page.locator(`a[href="${module.href}"]`).first();
    await expect(link).toBeVisible();

    const box = await link.boundingBox();
    expect(box, `${module.label} should have a layout box`).not.toBeNull();

    const viewport = page.viewportSize();
    expect(box.x, `${module.label} starts outside the viewport`).toBeGreaterThanOrEqual(0);
    expect(
      box.x + box.width,
      `${module.label} extends past the right edge of the viewport`
    ).toBeLessThanOrEqual(viewport.width + 1);
  }
});
