import { expect, test } from "@playwright/test";
import { messages } from "./messages";

const t = messages("en");

test.describe("KAABIL Station / kiosk mode", () => {
  test("start station, call helper, idle warning wipes the session", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("kaabil", JSON.stringify({ state: { locale: "en", localeChosen: true }, version: 1 }));
      }
    });
    await page.clock.install();
    await page.goto("/station");
    await page.getByRole("button", { name: /Pilani/ }).first().click();
    await page.getByRole("button", { name: t("station.start") }).click();
    await expect(page).toHaveURL(/\/welcome$/);

    // Choose a language → home, with the kiosk strip visible
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    const helper = page.getByRole("button", { name: t("station.kiosk.helper") });
    await expect(helper).toBeVisible();
    await helper.click();
    await expect(page.getByRole("status").filter({ hasText: t("station.kiosk.helperPanelBody") })).toBeVisible();

    // Leave something personal in the session
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("kaabil")!);
      s.state.parchiJobs = ["j1"];
      s.state.profile = { ...s.state.profile, name: "Test Visitor" };
      localStorage.setItem("kaabil", JSON.stringify(s));
    });

    // 2 minutes idle → 90 s warning
    await page.clock.fastForward(121_000);
    await page.clock.runFor(2_000);
    await expect(page.getByTestId("idle-warning")).toBeVisible();

    // Countdown runs out → session wiped, kiosk stays on, back to language screen
    await page.clock.runFor(91_000);
    await expect(page).toHaveURL(/\/welcome$/);
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("kaabil")!).state);
    expect(state.kiosk.active).toBe(true);
    expect(state.kiosk.stationId).toBe("s1");
    expect(state.kiosk.assisted).toBe(false);
    expect(state.parchiJobs).toEqual([]);
    expect(state.profile.name).toBe("");
  });

  test("helper PIN is required to exit station mode", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("kaabil", JSON.stringify({ state: { locale: "en", localeChosen: true, kiosk: { active: true, stationId: "s1", assisted: false } }, version: 1 }));
      }
    });
    await page.goto("/");
    await page.getByRole("button", { name: t("station.kiosk.exit") }).click();
    const pin = page.getByRole("textbox", { name: t("station.kiosk.pinLabel") });
    await pin.fill("0000");
    await page.getByRole("button", { name: t("station.kiosk.exit") }).last().click();
    await expect(page.getByText(t("station.kiosk.pinWrong"))).toBeVisible();
    await pin.fill(process.env.NEXT_PUBLIC_STATION_PIN || "2468");
    await page.getByRole("button", { name: t("station.kiosk.exit") }).last().click();
    await expect(page).toHaveURL(/\/station$/);
    await expect(page.getByRole("button", { name: t("station.kiosk.helper") })).toHaveCount(0);
  });
});
