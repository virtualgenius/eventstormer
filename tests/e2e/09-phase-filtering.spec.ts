import { test, expect } from "@playwright/test";

test.describe("Phase-based element filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/eventstormer/");
  });

  test("should start with Chaotic Exploration phase and show only Event and Hotspot", async ({
    page,
  }) => {
    // Check phase selector shows correct initial phase
    const phaseSelect = page.locator("#phase-select");
    await expect(phaseSelect).toHaveValue("chaotic-exploration");

    // Check only Event and Hotspot buttons are visible
    await expect(page.getByRole("button", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hotspot" })).toBeVisible();

    // Check other buttons are NOT visible
    await expect(
      page.getByRole("button", { name: "Vertical Line" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Actor" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "System" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Opportunity" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Glossary" })
    ).not.toBeVisible();
  });

  test("should show Vertical Line, Lane, and Theme when switching to Enforce Timeline", async ({
    page,
  }) => {
    const phaseSelect = page.locator("#phase-select");
    await phaseSelect.selectOption("enforce-timeline");

    // Check phase changed
    await expect(phaseSelect).toHaveValue("enforce-timeline");

    // Check Event and Hotspot are still visible
    await expect(page.getByRole("button", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hotspot" })).toBeVisible();

    // Check new elements are visible
    await expect(
      page.getByRole("button", { name: "Vertical Line" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Lane" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();

    // Check Actor, System, Opportunity, Glossary are NOT visible
    await expect(
      page.getByRole("button", { name: "Actor" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "System" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Opportunity" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Glossary" })
    ).not.toBeVisible();
  });

  test("should show Actor and System when switching to People and Systems", async ({
    page,
  }) => {
    const phaseSelect = page.locator("#phase-select");
    await phaseSelect.selectOption("people-and-systems");

    await expect(phaseSelect).toHaveValue("people-and-systems");

    // Check all previous elements are still visible
    await expect(page.getByRole("button", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hotspot" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Vertical Line" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Lane" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();

    // Check Actor and System are visible
    await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "System" })).toBeVisible();

    // Check Opportunity and Glossary are NOT visible
    await expect(
      page.getByRole("button", { name: "Opportunity" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Glossary" })
    ).not.toBeVisible();
  });

  test("should show Opportunity when switching to Problems and Opportunities", async ({
    page,
  }) => {
    const phaseSelect = page.locator("#phase-select");
    await phaseSelect.selectOption("problems-and-opportunities");

    await expect(phaseSelect).toHaveValue("problems-and-opportunities");

    // Check all previous elements are still visible
    await expect(page.getByRole("button", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hotspot" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Vertical Line" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Lane" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "System" })).toBeVisible();

    // Check Opportunity is visible
    await expect(
      page.getByRole("button", { name: "Opportunity" })
    ).toBeVisible();

    // Check Glossary is NOT visible
    await expect(
      page.getByRole("button", { name: "Glossary" })
    ).not.toBeVisible();
  });

  test("should show all elements including Glossary in Glossary phase", async ({
    page,
  }) => {
    const phaseSelect = page.locator("#phase-select");
    await phaseSelect.selectOption("glossary");

    await expect(phaseSelect).toHaveValue("glossary");

    // Check all elements are visible
    await expect(page.getByRole("button", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hotspot" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Vertical Line" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Lane" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "System" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Opportunity" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Glossary" })).toBeVisible();
  });

  test("should display human-readable phase labels in dropdown", async ({
    page,
  }) => {
    const phaseSelect = page.locator("#phase-select");

    // Check option labels
    const options = await phaseSelect.locator("option").allTextContents();
    expect(options).toEqual([
      "Chaotic Exploration",
      "Enforcing the Timeline",
      "People and Systems",
      "Problems and Opportunities",
      "Glossary",
    ]);
  });
});
