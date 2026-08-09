import { expect, test } from "@playwright/test";

const APP = "http://calculator.localhost:4173";
const TIME = "http://time.localhost:4173";
const SEO = "http://seo.localhost:4173";
const calculatorSlugs = ["uk-salary-tax", "uk-mortgage", "uk-pension", "uk-personal-finance", "b2b-roi", "uk-healthcare-cost", "bmi", "bmr-tdee", "body-fat", "loan", "currency-converter"];
const content = "This useful sample content contains enough words to exercise the SEO tools and show reliable results today.";

test("each domain renders only its own tool home", async ({ page }) => {
  await page.goto(APP); await expect(page.getByText("Make a confident next move.")).toBeVisible(); await expect(page.getByText("Time, made clear.")).toHaveCount(0);
  await page.goto(TIME); await expect(page.getByText("Time, made clear.")).toBeVisible(); await expect(page.getByText("Better content, one check at a time.")).toHaveCount(0);
  await page.goto(SEO); await expect(page.getByText("Better content, one check at a time.")).toBeVisible(); await expect(page.getByText("Make a confident next move.")).toHaveCount(0);
});

for (const slug of calculatorSlugs) {
  test(`calculator ${slug} submits to the API and renders a result`, async ({ page }) => {
    await page.goto(`${APP}/#/${slug}`);
    const response = page.waitForResponse((candidate) => candidate.url().includes(`/api/v1/calculators/${slug}`) && candidate.request().method() === "POST");
    await page.getByRole("button", { name: "Calculate" }).click();
    expect((await response).status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Your result" })).toBeVisible();
  });
}

test("calculator error is friendly and cached repeat requests are labelled", async ({ page }) => {
  await page.goto(`${APP}/#/uk-mortgage`);
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText(/Fresh|Cached/, { exact: true })).toBeVisible();
  await page.getByLabel("Deposit (£)").fill("400000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("alert")).toContainText("We could not complete");
  await page.reload();
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Cached")).toBeVisible();
});

test("time tools update and call their correct backend endpoint", async ({ page }) => {
  await page.goto(`${TIME}/#/timezone-converter`);
  const timezoneResponse = page.waitForResponse((candidate) => candidate.url().includes("/api/v1/tools/time/timezone-converter"));
  await page.getByLabel("Zone 1 country").selectOption("America/New_York");
  expect((await timezoneResponse).status()).toBe(200);
  await expect(page.getByLabel("Zone 2 date")).toBeVisible();

  await page.goto(`${TIME}/#/age-calculator`);
  await page.getByLabel("Birth date").fill("2000-02-29");
  await expect(page.getByText(/years, .* months, .* days old/)).toBeVisible();

  await page.goto(`${TIME}/#/countdown-timer`);
  await page.getByLabel(/Event name/).fill("Launch");
  await expect(page.getByText("Countdown to Launch")).toBeVisible();
});

test("SEO tools analyse text, show results, and emit analytics events", async ({ page }) => {
  await page.goto(`${SEO}/#/word-counter`);
  const wordResponse = page.waitForResponse((candidate) => candidate.url().includes("/api/v1/tools/seo/word-counter"));
  await page.getByLabel("Text to analyse").fill(content);
  expect((await wordResponse).status()).toBe(200);
  await expect(page.getByText("Most frequent words")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window.dataLayer ?? []).some((event: unknown) => Array.isArray(event) && event[1] === "tool_used"))).toBeTruthy();

  await page.goto(`${SEO}/#/readability-score`);
  await expect(page.getByText("Flesch reading ease")).toBeVisible();
  await page.getByRole("button", { name: "Show technical scores" }).click();
  await expect(page.getByText("Gunning Fog")).toBeVisible();

  await page.goto(`${SEO}/#/keyword-density`);
  const keywordResponse = page.waitForResponse((candidate) => candidate.url().includes("/api/v1/tools/seo/keyword-density"));
  await page.getByLabel("Text to analyse").fill(content);
  await page.getByLabel(/Focus keyword/).fill("sample content");
  expect((await keywordResponse).status()).toBe(200);
  await expect(page.getByText("Top keywords")).toBeVisible();
});

for (const viewport of [{ name: "mobile", width: 375, height: 812 }, { name: "tablet", width: 768, height: 1024 }, { name: "desktop", width: 1920, height: 1080 }]) {
  test(`responsive layout and theme work at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(APP);
    await expect(page.getByLabel("Advertisement preview")).toBeVisible();
    await page.getByRole("button", { name: "Toggle colour theme" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("main")).toBeVisible();
  });
}
