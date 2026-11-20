import { test, expect } from "./auth";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
} from "../../src/domain/project";
import { imageCatalog } from "../../src/domain/image-catalog";
import { standardElement } from "../../src/domain/image-elements";

test(
  "cabeçalho estável no salvamento e barra em uma linha, com rótulos e ícones compactos",
  { tag: "@interface" },
  async ({ page }) => {
    const d = createProject(
      "Residência com nome longo para conferir o cabeçalho do editor",
      { length: 2500, width: 1250, height: 700 },
      2100,
    );
    d.project.groutSettings = defaultGroutSettings(false);
    d.project.channelLevels = [];
    const first = d.model.floors[0];
    first.name = "Pavimento térreo com nome longo";
    const second = {
      ...first,
      id: crypto.randomUUID(),
      name: "Superior",
      level: 28000,
    };
    d.model.floors.push(second);
    d.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, first.id, 2100, 1)!,
    ];
    d.model.imageElements = [standardElement(imageCatalog[0], first.id)];
    await page.getByTestId("import-file").setInputFiles({
      name: "toolbar.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect(page.getByTestId("drawing")).toBeVisible();
    const before = await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      return JSON.stringify((await import(path)).useStore.getState().doc);
    });
    const header = page.getByRole("banner");
    const floor = header.getByLabel("Pavimento", { exact: true });
    const plus = header.getByRole("button", {
      name: "Novo pavimento",
      exact: true,
    });
    const bar = page.getByRole("group", {
      name: "Ferramentas do editor",
      exact: true,
    });
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(floor).toBeVisible();
      await expect(plus).toBeVisible();
      const status = header.getByRole("status");
      const initialStatus = (await status.boundingBox())!;
      const initialFloor = (await floor.boundingBox())!;
      const initialPlus = (await plus.boundingBox())!;
      for (const [saved, text] of [
        ["saving", "Salvando…"],
        ["uncertain", "Confirmação pendente"],
        ["conflict", "Conflito"],
        ["unavailable", "Sem conexão"],
        ["error", "Não salvo"],
        ["saved", "Salvo"],
      ] as const) {
        await page.evaluate(async (saved) => {
          const path = "/src/state/store.ts";
          (await import(path)).useStore.setState({ saved });
        }, saved);
        await expect(status).toHaveText(text);
        expect((await status.boundingBox())!.width).toBe(initialStatus.width);
        expect(
          await status.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
        expect(await floor.boundingBox()).toEqual(initialFloor);
        expect(await plus.boundingBox()).toEqual(initialPlus);
      }
      await expect(bar.getByLabel("Pavimento", { exact: true })).toHaveCount(0);
      for (const name of [
        "Selecionar",
        "Parede",
        "Terreno",
        "Laje",
        "Porta",
        "Janela",
        "Vão",
        "Medida",
        "Etiqueta",
        "Fechamento",
        "Mobiliários",
      ]) {
        const button = bar.getByRole("button", { name, exact: true });
        await expect(button).toBeVisible();
        await expect(button.locator("svg")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      }
      const wall = bar.getByRole("button", { name: "Parede", exact: true });
      const size = (await wall.boundingBox())!;
      if (width === 1366) expect(size.width).toBeGreaterThan(32);
      else expect(size.width).toBe(32);
      await bar
        .getByRole("button", { name: "Selecionar", exact: true })
        .focus();
      await page.keyboard.press("Tab");
      await expect(wall).toBeFocused();
      expect(
        await wall.evaluate((el) => getComputedStyle(el, "::after").content),
      ).toBe('"Parede"');
      expect(
        await wall.evaluate((el) => getComputedStyle(el, "::after").display),
      ).toBe("block");
      for (const mode of ["Planta", "Fiada"]) {
        await bar.getByRole("button", { name: mode, exact: true }).click();
        const layout = await bar.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          const controls = [...el.querySelectorAll("button,select,input")]
            .filter((c) => c.getClientRects().length)
            .map((c) => c.getBoundingClientRect());
          const centers = controls.map((c) => c.y + c.height / 2);
          return {
            oneRow: Math.max(...centers) - Math.min(...centers) <= 1,
            inside: controls.every(
              (c) => c.left >= bounds.left && c.right <= bounds.right,
            ),
            pageFits: document.documentElement.scrollWidth <= innerWidth,
          };
        });
        expect(layout).toEqual({ oneRow: true, inside: true, pageFits: true });
        await page.screenshot({
          path: `.tools/editor-toolbar-${mode}-${width}.png`,
        });
      }
      await bar.getByRole("button", { name: "Planta", exact: true }).click();
    }
    await floor.selectOption(second.id);
    await expect(page.getByRole("contentinfo")).toContainText("Superior");
    await floor.selectOption(first.id);
    await plus.click();
    await expect(
      page.getByRole("heading", { name: "Novo pavimento", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(plus).toBeFocused();
    expect(
      await page.evaluate(async () => {
        const path = "/src/state/store.ts";
        return JSON.stringify((await import(path)).useStore.getState().doc);
      }),
    ).toBe(before);
  },
);
