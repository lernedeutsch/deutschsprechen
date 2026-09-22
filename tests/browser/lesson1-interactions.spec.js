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

test("Dialoge: microphone controls become available with speech recognition", async ({ page }) => {
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
  await expect(page.locator("#text-answer-send")).toBeVisible();
  await expect(page.locator("#gate-warning")).not.toHaveClass(/show/);
});

test("Aktiv trainieren: greeting answer and reset work", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#greeting-counter")).toContainText("0 / 3");
  await page.locator('.answer-button[data-gruss="morgen"]').click();
  await expect(page.locator("#greeting-counter")).toContainText("1 / 3");

  await page.evaluate(() => document.getElementById("restart-button").click());
  await expect(page.locator("#greeting-counter")).toContainText("0 / 3");
});


test("Aktiv trainieren: wrong greeting can be corrected", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/aktivt-trenieren.a1/aktiv-trenieren1.html", { waitUntil: "domcontentloaded" });

  await page.locator('.answer-button[data-gruss="abend"]').click();
  await expect(page.locator("#greeting-feedback")).toContainText("Versuch es noch einmal");
  await expect(page.locator("#greeting-counter")).toContainText("0 / 3");

  await page.locator('.answer-button[data-gruss="morgen"]').click();
  await expect(page.locator("#greeting-feedback")).toContainText("Richtig");
  await expect(page.locator("#greeting-counter")).toContainText("1 / 3");
});

test("Übungen: wrong answers stay retryable and can be corrected", async ({ page }) => {
  await page.goto("/lessons/ubungen.a1/ubungen1.html", { waitUntil: "domcontentloaded" });

  const exercise = page.locator("#ex1_1");
  const inputs = exercise.locator("input[data-answer]");
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill("falsch");
  }
  await page.locator('button[onclick="checkExercise(\'ex1_1\')"]').click();

  await expect(page.locator("#ex1_1-result")).toContainText("Versuch es noch einmal");
  await expect(page.locator("#done-ex1_1")).not.toBeVisible();
  await expect(page.locator("#exercise-progress-count")).toContainText("0 / 5");

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    await input.fill(await input.getAttribute("data-answer"));
  }
  await page.locator('button[onclick="checkExercise(\'ex1_1\')"]').click();

  await expect(page.locator("#done-ex1_1")).toBeVisible();
  await expect(page.locator("#exercise-progress-count")).toContainText("1 / 5");
});

test("Diktat: wrong answer shows correction and does not advance", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/dikatat.a1/diktat1.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stat-progress")).toContainText("1/10");
  await page.locator("#dict-input").fill("Das ist absichtlich falsch");
  await page.locator("#dict-input").press("Enter");

  await expect(page.locator("#feedback")).toContainText("Noch nicht ganz");
  await expect(page.locator("#stat-progress")).toContainText("1/10");
  await expect(page.locator("#dict-input")).toBeEnabled();
});

test("Dialoge: wrong answer stays on turn and offers another try", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/dialoge.a1/dialoge1.html", { waitUntil: "domcontentloaded" });

  const before = await page.evaluate(() => ({
    progress: document.getElementById("stat-progress").textContent.trim(),
    score: document.getElementById("stat-score").textContent.trim()
  }));

  await page.evaluate(() => evaluate("Das ist absichtlich falsch"));

  await expect(page.locator("#history-list")).toContainText("Das ist absichtlich falsch ✗");
  await expect(page.locator("#stat-progress")).toHaveText(before.progress);
  await expect(page.locator("#stat-score")).toHaveText(before.score);
  await expect(page.locator("#mic-status")).toContainText("Das war noch nicht richtig");

  await page.waitForTimeout(900);
  await expect(page.locator("#stat-progress")).toHaveText(before.progress);
});

test("Sprich nach: wrong typed sentence is rejected without advancing", async ({ page }) => {
  await mockBrowserSpeech(page);
  await page.goto("/lessons/sprich-nach.a1/sprich-nach1.html", { waitUntil: "domcontentloaded" });

  await page.locator("#start-btn").click();
  const before = (await page.locator("#progress-count").textContent()).trim();

  await page.locator("#text-input").fill("Das ist absichtlich falsch");
  await page.locator("#send-btn").click();

  await expect(page.locator("#you-said")).toHaveClass(/bad/);
  await expect(page.locator("#status-line")).toContainText("Nicht ganz");
  await expect(page.locator("#progress-count")).toHaveText(before);
});
