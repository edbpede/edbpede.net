import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * The site is one prerendered page: a logo ringed by five links to the sibling
 * subdomains. These tests cover what a visitor can actually do with it — reach
 * the five destinations, see the marks that identify them, and read a
 * description on hover — plus the two properties that are easy to break
 * silently: the assets must really load, and the page must ship no JavaScript.
 */

/** The hub, in the order CircularNav.astro lays it out clockwise from the top. */
const LINKS = [
  { name: "Guides", href: "https://docs.edbpede.net", description: /Vejledninger/i },
  { name: "Portaler", href: "https://portaler.edbpede.net", description: /læringsplatforme/i },
  { name: "Eksamen", href: "https://eksamen.edbpede.net", description: /Prøveeksamener/i },
  { name: "Tunes", href: "https://tunes.edbpede.net", description: /lyd\/mp3/i },
  { name: "YouTube", href: "https://tube.edbpede.net", description: /YouTube-videoer/i },
];

/**
 * Addressed by destination, not by accessible name: every link's name also
 * contains its hover description, so "Tunes — Download YouTube-videoer" and
 * "YouTube" both match a name query for YouTube. The href is the unambiguous
 * identity, and it is the thing the page exists to get right.
 */
function hubLink(page: Page, href: string): Locator {
  return page.locator(`a[href="${href}"]`);
}

/** An <img> with a broken src is still "visible", so assert the decoded image. */
async function assertImageLoaded(image: Locator, label: string) {
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth), { message: label })
    .toBeGreaterThan(0);
}

test.describe("the page", () => {
  test("loads and identifies itself", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("EDB Pede");
  });

  test("ships no JavaScript", async ({ page }) => {
    // The whole point of this page: an Astro static route with no island. A
    // stray `client:*` directive or a hydrated component would add a <script>
    // here, and that is worth failing on rather than discovering in a bundle.
    await page.goto("/");
    await expect(page.locator("script")).toHaveCount(0);
  });
});

test.describe("the centre logo", () => {
  test("renders and its SVG actually loads", async ({ page }) => {
    await page.goto("/");
    const logo = page.getByAltText("EdBPede Logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/edbpede.svg");
    await assertImageLoaded(logo, "centre logo");
  });
});

test.describe("the five hub links", () => {
  test("point at the right subdomains, and nowhere else", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main a")).toHaveCount(LINKS.length);

    for (const { name, href } of LINKS) {
      const link = hubLink(page, href);
      await expect(link, href).toHaveCount(1);
      // The label under the mark is how a visitor knows which one they are on.
      await expect(link, href).toContainText(name);
    }
  });

  test("each carries a rendered mark", async ({ page }) => {
    await page.goto("/");

    // Four are Iconify sets inlined by astro-icon; Portaler is a local SVG file
    // served through a plain <img> (the `isImage` branch in CircularNav.astro).
    for (const { name, href } of LINKS) {
      const link = hubLink(page, href);
      const mark = name === "Portaler" ? link.locator("img") : link.locator("svg");
      await expect(mark, name).toHaveCount(1);
    }

    const portalerMark = page.getByAltText("Portaler");
    await expect(portalerMark).toHaveAttribute("src", "/str_logo_icon.svg");
    await assertImageLoaded(portalerMark, "Portaler mark");
  });

  test("reveal their description on hover", async ({ page }) => {
    await page.goto("/");

    for (const { name, href, description } of LINKS) {
      const link = hubLink(page, href);
      const tooltip = link.getByText(description);

      // The tooltip is always in the DOM and hidden by opacity alone, so
      // toBeVisible() cannot tell the two states apart.
      await expect(tooltip, name).toHaveCSS("opacity", "0");
      await link.hover();
      await expect(tooltip, name).toHaveCSS("opacity", "1");
    }
  });
});

test.describe("layout", () => {
  test("keeps every link inside a phone-width viewport", async ({ page }) => {
    // html/body set `overflow-x: hidden`, so a link pushed off-screen would not
    // widen the document — it would just be silently unreachable. Measure the
    // links themselves instead of the document.
    const width = 390;
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");

    for (const { name, href } of LINKS) {
      const box = await hubLink(page, href).boundingBox();
      expect(box, name).not.toBeNull();
      if (box === null) continue;
      expect(box.width, name).toBeGreaterThan(0);
      expect(box.x, name).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, name).toBeLessThanOrEqual(width);
      expect(box.y, name).toBeGreaterThanOrEqual(0);
    }
  });
});
