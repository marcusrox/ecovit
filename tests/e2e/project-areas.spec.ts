import { test, expect } from "./auth";
import { createProject } from "../../src/domain/project";
import { addRoomLabel } from "../../src/domain/rooms";

test(
  "T-030 relatório, filtro global, localização e consulta sem gravação",
  { tag: "@interface" },
  async ({ page }) => {
    let d = createProject("T-030 Áreas do projeto", {
      length: 2000,
      width: 1000,
      height: 700,
    });
    const first = d.model.floors[0];
    const second = { ...first, id: crypto.randomUUID(), level: 28000 };
    d.model.floors.push(second);
    for (const [floor, w] of [
      [first, 30000],
      [second, 20000],
    ] as const) {
      const ring = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: 20000 },
        { x: 0, y: 20000 },
      ];
      d.model.roomBoundaries.push(
        ...ring.map((a, i) => ({
          id: crypto.randomUUID(),
          floorId: floor.id,
          a,
          b: ring[(i + 1) % 4],
        })),
      );
      d = addRoomLabel(d, floor.id, { x: 10000, y: 10000 }).doc;
    }
    d.model.roomLabels[0].name = "Sala";
    d.model.roomLabels[1].name = "Quarto";
    d.model.roomLabels[1].position = { x: 90000, y: 90000 };
    await page.getByTestId("import-file").setInputFiles({
      name: "areas.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByTestId("drawing")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      useStore.getState().inspect({ mode: "course", course: 2 });
    });
    const snapshot = () =>
      page.evaluate(async () => {
        const path = "/src/state/store.ts";
        const s = (await import(path)).useStore.getState();
        return JSON.stringify([
          s.doc,
          s.history,
          s.activeFloorId,
          s.select,
          s.mode,
          s.course,
        ]);
      });
    const before = await snapshot();
    const camera = await page
      .getByTestId("drawing")
      .getAttribute("data-camera");
    let writes = 0;
    page.on("request", (r) => {
      if (r.method() === "PUT" && r.url().includes("/api/projects/")) writes++;
    });
    const button = page.getByRole("button", { name: "Áreas", exact: true });
    await button.click();
    const modal = page.getByRole("dialog", { name: "Áreas do projeto" });
    await expect(
      modal.getByRole("heading", { name: "Áreas do projeto", exact: true }),
    ).toBeFocused();
    const summary = modal.getByRole("region", { name: "Resumo do projeto" });
    await expect(summary.getByText("10,00 m²", { exact: true })).toHaveCount(2);
    await expect(
      modal.getByLabel("Pavimentos do relatório de áreas"),
    ).toHaveValue("all");
    await modal
      .getByLabel("Pavimentos do relatório de áreas")
      .selectOption(second.id);
    const rooms = modal.getByRole("region", { name: "Ambientes", exact: true });
    await expect(rooms.getByRole("row")).toHaveCount(2);
    await expect(rooms.getByText("Quarto", { exact: true })).toBeVisible();
    await expect(rooms.getByText("4,00 m²", { exact: true })).toBeVisible();
    await expect(summary.getByText("10,00 m²", { exact: true })).toHaveCount(2);
    await page.screenshot({ path: ".tools/t030-areas.png", fullPage: true });
    expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    expect(await snapshot()).toBe(before);
    expect(await page.getByTestId("drawing").getAttribute("data-camera")).toBe(
      camera,
    );
    expect(writes).toBe(0);
    await button.click();
    await expect(
      modal.getByLabel("Pavimentos do relatório de áreas"),
    ).toHaveValue("all");
    await modal.getByRole("button", { name: /Localizar Quarto/ }).click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Quarto");
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const path = "/src/state/store.ts";
          const s = (await import(path)).useStore.getState();
          return [s.mode, s.activeFloorId, s.select];
        }),
      )
      .toEqual(["plan", second.id, d.model.roomLabels[1].id]);
    // Frame the valid region, rather than the label's deliberately distant position.
    const c = JSON.parse(
      (await page.getByTestId("drawing").getAttribute("data-camera"))!,
    );
    const box = (await page.getByTestId("drawing").boundingBox())!;
    expect(Math.abs((box.width / 2 - c.x) / c.scale - 10000)).toBeLessThan(1);
    expect(Math.abs((box.height / 2 - c.y) / c.scale - 10000)).toBeLessThan(1);
    expect(writes).toBe(0);
    // Consultation is also available in read-only recovery, with no stale area for a reviewed room.
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const s = useStore.getState();
      useStore.setState({
        readonly: true,
        doc: {
          ...s.doc,
          model: {
            ...s.doc.model,
            roomLabels: s.doc.model.roomLabels.map((l: { name: string }) =>
              l.name === "Quarto" ? { ...l, review: true } : l,
            ),
          },
        },
      });
    });
    await button.click();
    await expect(summary.getByText("6,00 m²", { exact: true })).toBeVisible();
    await expect(summary.getByText(/1 ambiente a revisar/)).toBeVisible();
    const reviewRow = rooms.getByRole("row").filter({ hasText: "Quarto" });
    await expect(
      reviewRow.getByText("Em revisão", { exact: true }),
    ).toBeVisible();
    await expect(reviewRow.getByText("4,00 m²", { exact: true })).toHaveCount(
      0,
    );
    await reviewRow.getByRole("button", { name: /Localizar/ }).click();
    const cameraReview = JSON.parse(
      (await page.getByTestId("drawing").getAttribute("data-camera"))!,
    );
    expect(
      Math.abs((box.width / 2 - cameraReview.x) / cameraReview.scale - 90000),
    ).toBeLessThan(1);
    expect(
      Math.abs((box.height / 2 - cameraReview.y) / cameraReview.scale - 90000),
    ).toBeLessThan(1);
    expect(writes).toBe(0);
  },
);
