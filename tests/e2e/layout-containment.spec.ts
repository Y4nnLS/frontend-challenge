import { expect, test, type Page } from "@playwright/test";

const viewports = [1440, 1280, 1155, 1024, 768, 414, 390];

async function reset(page: Page) {
  await page.goto("/");
  await page.evaluate(() => fetch("/api/__mock/reset", { method: "POST" }));
}

async function seedCart(page: Page) {
  for (const slug of ["jaguar", "toucan", "orchid", "river"]) {
    await page.goto(`/nft/${slug}`);
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("status")).toContainText(
      "adicionado ao carrinho",
    );
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await reset(page);
});

test("cart keeps products and wallet summary in independent columns or rows", async ({
  page,
}) => {
  await seedCart(page);

  for (const width of viewports) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/cart");
    await expect(page.locator(".cart-item")).toHaveCount(4);
    await expect(page.locator(".order-summary")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".cart-item-art")
          .first()
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page);

    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const { left, right, top, bottom } = element.getBoundingClientRect();
        return { left, right, top, bottom };
      };
      const controls = Array.from(document.querySelectorAll(".cart-item")).map(
        (item) => {
          const quantity = item
            .querySelector(".cart-quantity")
            ?.getBoundingClientRect();
          const remove = item
            .querySelector(".cart-remove-button")
            ?.getBoundingClientRect();
          if (!quantity || !remove)
            throw new Error("Cart controls are missing");
          return { quantityRight: quantity.right, removeLeft: remove.left };
        },
      );
      return {
        items: rect(".cart-items"),
        summary: rect(".order-summary"),
        controls,
      };
    });

    if (width > 1080) {
      expect(geometry.items.right).toBeLessThanOrEqual(
        geometry.summary.left + 1,
      );
    } else {
      expect(geometry.summary.top).toBeGreaterThanOrEqual(
        geometry.items.bottom - 1,
      );
    }
    geometry.controls.forEach(({ quantityRight, removeLeft }) => {
      expect(quantityRight).toBeLessThanOrEqual(removeLeft + 1);
    });

    await expect(page.locator(".cart-quantity").first()).not.toContainText(
      "Edições",
    );
    await expect(
      page.locator(".cart-remove-button").first().locator("svg"),
    ).toBeVisible();
    await page.screenshot({
      path: `qa-visual/layout-fix/cart-${width}.png`,
      fullPage: true,
      scale: "css",
    });
  }
});

test("NFT detail contains its gallery and purchase information at every viewport", async ({
  page,
}) => {
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/nft/jaguar");
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042" }),
    ).toBeVisible();
    await expect(page.locator(".detail-art .nft-image")).toHaveJSProperty(
      "complete",
      true,
    );
    await expect
      .poll(() =>
        page
          .locator(".detail-art .nft-image")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(page.locator(".detail-thumbnails img")).toHaveCount(4);
    await expectNoHorizontalOverflow(page);

    if (width > 1080) {
      const geometry = await page.evaluate(() => {
        const gallery = document
          .querySelector(".detail-gallery")
          ?.getBoundingClientRect();
        const information = document
          .querySelector(".detail-information")
          ?.getBoundingClientRect();
        if (!gallery || !information)
          throw new Error("Detail columns are missing");
        return {
          galleryRight: gallery.right,
          informationLeft: information.left,
        };
      });
      expect(geometry.galleryRight).toBeLessThanOrEqual(
        geometry.informationLeft + 1,
      );
    } else if (width >= 761) {
      const geometry = await page.evaluate(() => {
        const gallery = document
          .querySelector(".detail-gallery")
          ?.getBoundingClientRect();
        const information = document
          .querySelector(".detail-information")
          ?.getBoundingClientRect();
        if (!gallery || !information)
          throw new Error("Detail rows are missing");
        return {
          galleryBottom: gallery.bottom,
          informationTop: information.top,
        };
      });
      expect(geometry.informationTop).toBeGreaterThanOrEqual(
        geometry.galleryBottom - 1,
      );
    }

    if (width > 760) {
      await page.getByRole("button", { name: "Visualização 3" }).click();
      await expect(
        page.getByRole("button", { name: "Visualização 3" }),
      ).toHaveAttribute("aria-pressed", "true");
    }

    await page.screenshot({
      path: `qa-visual/layout-fix/detail-${width}.png`,
      fullPage: true,
      scale: "css",
    });
  }
});
