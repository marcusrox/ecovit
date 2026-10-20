import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { imageCatalog } from "../src/domain/image-catalog";
import { inspectImage } from "../src/domain/reference-image";

it.each([
  ["escada-reta-16", 0],
  ["escada-u-16", 1],
  ["escada-u-assimetrica-16", 1],
  ["escada-l-16", 1],
  ["escada-u-tres-lances-16", 2],
])(
  "%s contém 16 pisos distintos, sem incluir patamares nem sobrepor degraus",
  (id, landings) => {
    const svg = readFileSync(`public/catalog/m10/sources/${id}-r1.svg`, "utf8");
    const treads = [...svg.matchAll(/<rect data-tread="true"[^>]+/g)].map(
      ([tag]) =>
        Object.fromEntries(
          ["x", "y", "width", "height"].map((key) => [
            key,
            Number(tag.match(new RegExp(`${key}="([\\d.]+)"`))![1]),
          ]),
        ),
    );
    expect(treads).toHaveLength(16);
    expect([...svg.matchAll(/<rect data-landing="true"/g)]).toHaveLength(
      landings,
    );
    expect([...svg.matchAll(/<rect /g)]).toHaveLength(16 + Number(landings));
    for (const [index, a] of treads.entries()) {
      expect(a.width * a.height).toBeGreaterThan(0);
      for (const b of treads.slice(index + 1)) {
        const overlapX =
          Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY =
          Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(overlapX > 0 && overlapY > 0).toBe(false);
      }
    }
  },
);

it("Arquitetura distribui onze artes PNG válidas com fontes vetoriais, sem substituir IDs anteriores", () => {
  const items = imageCatalog.filter((i) => i.category === "Arquitetura");
  expect(items).toHaveLength(11);
  expect(items.filter((i) => i.id.startsWith("escada-"))).toHaveLength(5);
  for (const item of items) {
    const info = inspectImage(
      new Uint8Array(
        readFileSync(`public/catalog/m10/${item.asset}-r${item.revision}.png`),
      ),
    );
    expect(info.mime).toBe("image/png");
    expect(Math.max(info.width, info.height)).toBe(1600);
    const svg = readFileSync(
      `public/catalog/m10/sources/${item.asset}-r${item.revision}.svg`,
      "utf8",
    );
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).not.toMatch(/<image|<text|<script/);
  }
  expect(imageCatalog.filter((i) => i.category !== "Arquitetura")).toHaveLength(
    48,
  );
});
