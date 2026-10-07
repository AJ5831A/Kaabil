import { expect, test, type Page } from "@playwright/test";
import { LANG_LABEL, PILANI, messages } from "./messages";

/** Click the first visible button whose accessible name matches one of `names`. */
async function clickFirstVisible(page: Page, names: string[]) {
  for (const name of names) {
    const btn = page.getByRole("button", { name, exact: true });
    const n = await btn.count();
    for (let i = 0; i < n; i++) {
      const b = btn.nth(i);
      if ((await b.isVisible().catch(() => false)) && (await b.isEnabled().catch(() => false))) {
        // Buttons can re-render mid-transition; a short timeout lets the loop retry.
        const ok = await b.click({ timeout: 3000 }).then(() => true, () => false);
        if (ok) return true;
      }
    }
  }
  return false;
}

for (const locale of ["hi", "en"] as const) {
  test.describe(`main journey (${locale})`, () => {
    const t = messages(locale);

    test("language → home → discover → profile → jobs → parchi", async ({ page }) => {
      // 1. Language-first onboarding (fresh visitor lands on /welcome)
      await page.goto("/");
      await expect(page).toHaveURL(/\/welcome$/);
      await page.getByRole("button", { name: LANG_LABEL[locale], exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);

      // 2. Home shows the four big choices in the chosen language
      for (const k of ["discover", "learn", "jobs", "parchi"]) {
        await expect(page.getByRole("link", { name: t(`home.tiles.${k}.label`) }).first()).toBeVisible();
      }

      // 3. Discover: pick an interest, step through the activities
      await page.getByRole("link", { name: t("home.tiles.discover.label") }).first().click();
      await expect(page).toHaveURL(/\/discover/);
      const begin = page.getByRole("button", { name: t("discover.start"), exact: true });
      const cooking = page.getByRole("button", { name: t("common.interests.cooking"), exact: true }).first();
      // Clicks can land mid route-transition; retry until they take effect.
      await expect(async () => {
        if (await begin.isVisible()) await begin.click();
        await expect(cooking).toBeVisible({ timeout: 1500 });
      }).toPass({ timeout: 20_000 });
      await expect(async () => {
        if ((await cooking.getAttribute("aria-pressed")) !== "true") await cooking.click();
        await expect(cooking).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
      }).toPass({ timeout: 10_000 });
      const reveal = page.getByText(t("discover.reveal.eyebrow"));
      const advance = [t("discover.skipActivity"), t("common.actions.continue"), t("common.actions.next"), t("discover.activityDone"), t("common.actions.done")];
      const homeCooking = page.getByRole("button", { name: t("discover.experience.items.home_cooking"), exact: true });
      for (let i = 0; i < 25 && !(await reveal.isVisible()); i++) {
        if ((await homeCooking.isVisible()) && (await homeCooking.getAttribute("aria-pressed")) !== "true") await homeCooking.click();
        if (!(await clickFirstVisible(page, advance))) await page.waitForTimeout(400);
        await page.waitForTimeout(250);
      }
      // 4. Skill profile reveal
      await expect(reveal).toBeVisible();

      // 5. Nearby jobs around Pilani
      await page.goto("/jobs/nearby");
      const pilani = page.getByRole("button", { name: PILANI[locale], exact: true });
      if (await pilani.first().isVisible().catch(() => false)) await pilani.first().click();
      const kitchen = page.getByRole("link", { name: new RegExp(t("common.jobCategories.kitchen_helper")) }).first();
      await expect(kitchen).toBeVisible();
      await kitchen.click();
      await expect(page).toHaveURL(/\/jobs\/j\d+/);
      await expect(page.getByText("ABC Food Services").first()).toBeVisible();

      // 6. Add to Parchi, then open the Job Parchi preview
      await page.getByRole("button", { name: new RegExp(t("jobs.detail.addParchi")) }).first().click();
      await page.getByRole(/* tile may be a link or a button */ "link", { name: new RegExp(t("jobs.detail.printParchi")) })
        .or(page.getByRole("button", { name: new RegExp(t("jobs.detail.printParchi")) }))
        .first()
        .click();
      await expect(page).toHaveURL(/\/parchi\/job\//);
      // On-screen preview (the .print-root copy is only shown when printing).
      await expect(page.getByTestId("parchi-job")).toBeVisible();
      await expect(page.getByTestId("parchi-job")).toContainText("ABC Food Services");

      // 7. "My Job Options" slip includes the saved job
      await page.goto("/parchi/options");
      await expect(page.getByTestId("parchi-options")).toContainText("ABC Food Services");
    });
  });
}
