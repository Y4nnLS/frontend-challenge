import { test, type Page } from "@playwright/test";

async function reset(page: Page) {
  await page.goto("/");
  await page.evaluate(() => fetch("/api/__mock/reset", { method: "POST" }));
  await page.reload();
}

async function addCartAndLogin(page: Page) {
  await page.goto("/nft/jaguar");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.locator(".mutation-notice").waitFor();
  await page.goto("/cart");
  await page.getByRole("link", { name: "Ir para pagamento" }).click();
  await page
    .getByRole("heading", { name: "Faça login para continuar" })
    .waitFor();
  await page
    .locator("main")
    .getByRole("link", { name: "Acessar área protegida" })
    .click();
  await page.getByLabel("E-mail").fill("ana@jungle.test");
  await page.getByLabel("Senha").fill("Jungle#123");
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function capture(
  page: Page,
  directory: string,
  name: string,
  mobile: boolean,
) {
  await page.locator(".kurio-app").waitFor();
  await page.waitForTimeout(500);
  const path = `qa-visual/pixel-perfect-final/${directory}/${name}.png`;
  if (mobile) await page.locator("#root").screenshot({ path });
  else await page.screenshot({ path, fullPage: true });
}

test("captura os frames preenchidos para comparação visual", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name.includes("mobile");
  const directory = mobile ? "mobile" : "desktop";
  if (mobile) await page.setViewportSize({ width: 414, height: 896 });
  else await page.setViewportSize({ width: 1440, height: 1000 });

  await reset(page);
  await page.goto("/");
  await capture(page, directory, "home", mobile);
  await page.goto("/login");
  await capture(page, directory, "login", mobile);
  await page.goto("/register");
  await capture(page, directory, "register", mobile);
  await page.goto("/nft/jaguar");
  await capture(page, directory, "nft-detail", mobile);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.locator(".mutation-notice").waitFor();
  for (const slug of ["toucan", "panther", "vine"]) {
    await page.goto(`/nft/${slug}`);
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.locator(".mutation-notice").waitFor();
  }
  await page.goto("/cart");
  await capture(page, directory, "cart", mobile);
  await page.getByRole("link", { name: "Ir para pagamento" }).click();
  await page
    .getByRole("heading", { name: "Faça login para continuar" })
    .waitFor();
  await page
    .locator("main")
    .getByRole("link", { name: "Acessar área protegida" })
    .click();
  await page.getByLabel("E-mail").fill("ana@jungle.test");
  await page.getByLabel("Senha").fill("Jungle#123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await capture(page, directory, "checkout", mobile);
  if (!mobile) {
    await page.getByRole("button", { name: "Revalidar cotação" }).click();
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await capture(page, directory, "order-confirmed", mobile);
  }
  await page.goto("/profile");
  await capture(page, directory, "profile", mobile);
  await page.goto("/wallets");
  await capture(page, directory, "wallets", mobile);
});

test("captura carrinho e checkout com sessão preexistente", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name.includes("mobile");
  const directory = mobile ? "mobile" : "desktop";
  if (mobile) await page.setViewportSize({ width: 414, height: 896 });
  else await page.setViewportSize({ width: 1440, height: 1000 });
  await reset(page);
  await addCartAndLogin(page);
  await capture(page, directory, "checkout-filled", mobile);
});
