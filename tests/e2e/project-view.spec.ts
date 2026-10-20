import { test, expect, type Page } from "@playwright/test";

async function create(page: Page, name: string) {
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByRole("textbox", { name: "Nome do projeto" }).fill(name);
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function view(page: Page) {
  const drawing = page.getByTestId("drawing");
  const box = (await drawing.boundingBox())!;
  const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return {
    scale: camera.scale as number,
    centerX: (box.width / 2 - camera.x) / camera.scale,
    centerY: (box.height / 2 - camera.y) / camera.scale,
  };
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const { doc, history } = useStore.getState();
    return JSON.stringify({ doc, history });
  });
}
async function expectView(
  page: Page,
  expected: Awaited<ReturnType<typeof view>>,
) {
  await expect
    .poll(async () => {
      const actual = await view(page);
      return Math.max(
        ...Object.keys(expected).map((key) =>
          Math.abs(
            actual[key as keyof typeof actual] -
              expected[key as keyof typeof expected],
          ),
        ),
      );
    })
    .toBeLessThan(0.001);
}

test("visualização por projeto: navegar, sair, atualizar e reabrir em outra janela", async ({
  page,
}) => {
  await page.goto("/");
  await create(page, "Vista A");
  const before = await snapshot(page);
  const box = (await page.getByTestId("drawing").boundingBox())!;
  await page.mouse.move(box.x + 300, box.y + 200);
  await page.mouse.wheel(0, -250);
  await page.getByRole("button", { name: "Ampliar zoom", exact: true }).click();
  await page.mouse.move(box.x + 300, box.y + 200);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(box.x + 450, box.y + 280, { steps: 5 });
  await page.mouse.up({ button: "middle" });
  const a = await view(page);
  expect(a.scale).toBeGreaterThan(0.012);
  expect(await snapshot(page)).toBe(before);
  await page.getByRole("button", { name: "Projetos", exact: true }).click();
  await create(page, "Vista B");
  expect((await view(page)).scale).toBe(0.012);
  await page.getByRole("button", { name: "Reduzir zoom", exact: true }).click();
  const b = await view(page);
  await page.reload();
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.getByRole("button", { name: /Vista A/ }).click();
  await expectView(page, a);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expectView(page, a);
  await page.getByRole("button", { name: "Projetos", exact: true }).click();
  await page.getByRole("button", { name: /Vista B/ }).click();
  await expectView(page, b);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  const fitted = await view(page);
  await page.reload();
  await page.getByRole("button", { name: /Vista B/ }).click();
  await expectView(page, fitted);
});

test("preferência inválida e falha de gravação não impedem edição", async ({
  page,
}) => {
  await page.goto("/");
  await create(page, "Vista inválida");
  await page.getByRole("button", { name: "Projetos", exact: true }).click();
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage))
      if (key.startsWith("ecovit:project-view:v1:"))
        localStorage.setItem(key, '{"scale":0,"centerX":null}');
  });
  await page.getByRole("button", { name: /Vista inválida/ }).click();
  expect((await view(page)).scale).toBe(0.012);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("ecovit:project-view:v1:")) throw new Error("quota");
      original.call(this, key, value);
    };
  });
  const before = await snapshot(page);
  await page.getByRole("button", { name: "Ampliar zoom", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível salvar a visualização",
  );
  expect((await view(page)).scale).toBeGreaterThan(0.012);
  expect(await snapshot(page)).toBe(before);
});
