const { test, expect } = require("@playwright/test");

async function mockBrowserSpeech(page) {
  await page.addInitScript(() => {
    class FakeUtterance {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.voice = null;
        this.onend = null;
        this.onerror = null;
      }
    }

    const fakeSpeech = {
      getVoices: () => [{ lang: "de-DE", name: "Test German Voice" }],
      cancel: () => {},
      addEventListener: () => {},
      speak: utterance => {
        setTimeout(() => {
          if (typeof utterance.onend === "function") utterance.onend();
        }, 0);
      }
    };

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: fakeSpeech
    });
  });
}

test("Sprich nach: start, repeat, next sentence and restart work", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/sprich-nach.a1/sprich-nach1.html", { waitUntil: "domcontentloaded" });

  await page.locator("#start-btn").click();
  await expect(page.locator("#repeat-btn")).toBeVisible();
  await expect(page.locator("#next-btn")).toBeVisible();

  const before = (await page.locator("#progress-count").textContent()).trim();
  await page.locator("#repeat-btn").click();
  await page.locator("#next-btn").click();
  await expect(page.locator("#progress-count")).not.toHaveText(before);

  await page.locator("#restart-btn").click();
  await expect(page.locator("#progress-count")).toContainText("1");
});

test("Übungen: correct answers complete exercise 1", async ({ page }) => {
  await page.goto("/lessons/ubungen.a1/ubungen1.html", { waitUntil: "domcontentloaded" });

  const exercise = page.locator("#ex1_1");
  const inputs = exercise.locator("input[data-answer]");
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    await input.fill(await input.getAttribute("data-answer"));
  }

  await page.locator('button[onclick="checkExercise(\'ex1_1\')"]').click();
  await expect(page.locator("#done-ex1_1")).toBeVisible();
  await expect(page.locator("#exercise-progress-count")).toContainText("1 / 5");
});

test("Diktat: hint, skip and restart controls work", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/dikatat.a1/diktat1.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stat-progress")).toContainText("1/10");

  await page.locator("#hint-btn").click();
  await expect(page.locator("#hint-text")).toHaveClass(/show/);
  await expect(page.locator("#hint-text")).not.toHaveText("");

  await page.locator("#skip-btn").click();
  await expect(page.locator("#stat-progress")).toContainText("2/10");

  for (let i = 0; i < 9; i++) {
    await page.locator("#skip-btn").click();
  }

  await expect(page.locator("#final")).toHaveClass(/show/);
  await page.locator("#restart-btn").click();
  await expect(page.locator("#stat-progress")).toContainText("1/10");
});

test("Dialoge: microphone flow can start and stop", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.addInitScript(() => {
    class FakeRecognition {
      constructor() {
        this.lang = "";
        this.continuous = false;
        this.interimResults = true;
        this.maxAlternatives = 3;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() {}
      stop() {
        if (typeof this.onend === "function") this.onend();
      }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
  });

  await page.goto("/lessons/dialoge.a1/dialoge1.html", { waitUntil: "domcontentloaded" });
  await page.locator("#gate-btn").click();

  await expect(page.locator("#layout")).toHaveClass(/show/);
  await expect(page.locator("#mic-btn")).toBeVisible();
  await expect(page.locator("#text-answer-input")).toBeVisible();

  await expect(page.locator("#mic-btn")).toBeEnabled({ timeout: 5000 });
  await page.locator("#mic-btn").click();
  await expect(page.locator("#mic-status")).toContainText("Ich höre zu");

  await page.locator("#mic-btn").click();
  await expect(page.locator("#mic-status")).toContainText("Mikrofon anklicken");
});

test("Aktiv trainieren: greeting reset returns score to zero", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#greeting-counter")).toContainText("0 / 3");
  await page.locator('.answer-button[data-gruss="morgen"]').click();
  await expect(page.locator("#greeting-counter")).toContainText("1 / 3");

  await page.locator("#restart-button").click();
  await expect(page.locator("#greeting-counter")).toContainText("0 / 3");
});
