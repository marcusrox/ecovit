// Static artwork preparation only; never imported or executed by the application.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = resolve(root, "public/catalog/m10");
const sources = resolve(directory, "sources");
const tread = (x, y, width, height) =>
  `<rect data-tread="true" x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#stone)" stroke="#777b76" stroke-width="0.8"/>`;
const landing = (x, y, width, height) =>
  `<rect data-landing="true" x="${x}" y="${y}" width="${width}" height="${height}" fill="#e3e3de" stroke="#777b76" stroke-width="0.8"/>`;
const flight = (x, y, count, horizontal = false) =>
  Array.from({ length: count }, (_, i) =>
    tread(
      x + (horizontal ? i * 28 : 0),
      y + (horizontal ? 0 : i * 28),
      horizontal ? 28 : 100,
      horizontal ? 100 : 28,
    ),
  ).join("");
const route = (d, x, y) =>
  `<circle cx="${x}" cy="${y}" r="2.8" fill="#515a53"/><path d="${d}" fill="none" stroke="#515a53" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"/>`;

// Coordinates and suggested footprints are illustrative, not stair engineering.
const items = [
  {
    id: "escada-reta-16",
    name: "Escada reta (16 degraus)",
    width: 100,
    depth: 448,
    flights: [16],
    art: flight(0, 0, 16) + route("M50 434 V16", 50, 434),
  },
  {
    id: "escada-u-16",
    name: "Escada em U (16 degraus)",
    width: 220,
    depth: 324,
    flights: [8, 8],
    art:
      landing(0, 0, 220, 100) +
      flight(0, 100, 8) +
      flight(120, 100, 8) +
      route("M50 310 V50 H170 V308", 50, 310),
  },
  {
    id: "escada-u-assimetrica-16",
    name: "Escada em U assimétrica (16 degraus)",
    width: 220,
    depth: 380,
    flights: [10, 6],
    art:
      landing(0, 0, 220, 100) +
      flight(0, 100, 10) +
      flight(120, 100, 6) +
      route("M50 366 V50 H170 V252", 50, 366),
  },
  {
    id: "escada-l-16",
    name: "Escada em L (16 degraus)",
    width: 324,
    depth: 324,
    flights: [8, 8],
    art:
      landing(0, 0, 100, 100) +
      flight(0, 100, 8) +
      flight(100, 0, 8, true) +
      route("M50 310 V50 H308", 50, 310),
  },
  {
    id: "escada-u-tres-lances-16",
    name: "Escada em U com 3 lances (16 degraus)",
    width: 212,
    depth: 424,
    flights: [4, 8, 4],
    art:
      landing(0, 0, 100, 100) +
      landing(0, 324, 100, 100) +
      flight(100, 324, 4, true) +
      flight(0, 100, 8) +
      flight(100, 0, 4, true) +
      route("M198 374 H50 V50 H196", 198, 374),
  },
  {
    id: "caminho-placas-concreto",
    name: "Caminho de placas de concreto",
    width: 80,
    depth: 400,
    art: Array.from(
      { length: 6 },
      (_, i) =>
        `<rect x="0" y="${i * 70}" width="80" height="50" rx="1.6" fill="url(#stone)" stroke="#8b8d86" stroke-width="0.7"/>`,
    ).join(""),
  },
  {
    id: "caminho-blocos-concreto",
    name: "Caminho de blocos intertravados",
    width: 120,
    depth: 240,
    art: `<defs><clipPath id="pavers"><rect width="120" height="240" rx="1"/></clipPath></defs><g clip-path="url(#pavers)">${Array.from({ length: 12 }, (_, row) => Array.from({ length: 4 }, (_, col) => `<rect x="${col * 40 - (row % 2) * 20}" y="${row * 20}" width="40" height="20" rx="0.8" fill="${(row + col) % 3 === 0 ? "#d3d4ce" : "#e1e1dc"}" stroke="#8b8d86" stroke-width="0.65"/>`).join("")).join("")}</g>`,
  },
  {
    id: "bloco-concreto-contencao",
    revision: 2,
    name: "Bloco de concreto para contenção",
    width: 40,
    depth: 20,
    art: `<path d="M0 0 H40 V20 H0 Z M5 5 H17 V15 H5 Z M23 5 H35 V15 H23 Z" fill="#dedfd9" fill-rule="evenodd" stroke="#858880" stroke-width="0.55" stroke-linejoin="round"/>`,
  },
  {
    id: "rampa-reta",
    name: "Rampa reta",
    width: 100,
    depth: 400,
    art:
      `<rect width="100" height="400" fill="url(#stone)" stroke="#777b76" stroke-width="0.8"/><path d="M5 395 V5 M95 395 V5" stroke="#b4b8af" stroke-width="0.8"/>` +
      route("M50 380 V20", 50, 380),
  },
  {
    id: "floreira-concreto",
    name: "Floreira de concreto",
    width: 120,
    depth: 40,
    art: `<rect width="120" height="40" rx="2" fill="url(#stone)" stroke="#858880" stroke-width="0.65"/><rect x="5" y="5" width="110" height="30" rx="1" fill="#8d8c76"/>${Array.from({ length: 7 }, (_, i) => `<g transform="translate(${14 + i * 15},20)"><ellipse rx="9" ry="12" fill="${i % 2 ? "#8e9b79" : "#a5ae8d"}"/><ellipse cx="-3" cy="-3" rx="5" ry="8" transform="rotate(-35)" fill="#b5bba0"/><ellipse cx="4" cy="3" rx="4" ry="7" transform="rotate(30)" fill="#7f8e6c"/></g>`).join("")}`,
  },
  {
    id: "banco-concreto",
    name: "Banco de concreto",
    width: 140,
    depth: 40,
    art: `<rect width="140" height="40" rx="1.8" fill="url(#stone)" stroke="#858880" stroke-width="0.7"/><path d="M3 3 H137 M3 37 H137" stroke="#c6c9c0" stroke-width="0.6"/>`,
  },
];

const only = process.argv[2];
if (only && !items.some((item) => item.id === only)) {
  throw new Error(`Unknown catalog item: ${only}`);
}
await mkdir(sources, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  for (const item of items) {
    if (only && item.id !== only) continue;
    const revision = item.revision ?? 1;
    const margin = 4;
    const width = item.width + margin * 2,
      height = item.depth + margin * 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${margin} -${margin} ${width} ${height}" width="${width}" height="${height}"><defs><linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eeeee9"/><stop offset="1" stop-color="#d9dcd4"/></linearGradient><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="#515a53"/></marker></defs>${item.art}</svg>`;
    await writeFile(
      resolve(sources, `${item.id}-r${revision}.svg`),
      svg + "\n",
    );
    const png = await page.evaluate(
      async ({ svg, width, height }) => {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        const scale = 1600 / Math.max(width, height);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { svg, width, height },
    );
    await writeFile(
      resolve(directory, `${item.id}-r${revision}.png`),
      Buffer.from(png, "base64"),
    );
    console.log(item.id);
  }
} finally {
  await browser.close();
}
const path = resolve(directory, "provenance.json");
const provenance = JSON.parse(await readFile(path, "utf8"));
const historicalItems =
  provenance.architecture.historicalItems ??
  provenance.architecture.items.filter(
    (item) => item.id === "bloco-concreto-contencao" && item.revision === 1,
  );
provenance.architecture = {
  historicalItems,
  method:
    "Original deterministic SVG artwork rasterized to PNG using Chromium; no image editing or generative service at runtime.",
  source: "scripts/generate-architecture-catalog.mjs",
  references:
    "Five stair layout sketches attached by the requester; layout inspiration only, no copied pixels, logos, text or watermarks.",
  style:
    "Neutral orthographic plan, thin gray outlines, muted concrete fill, transparent background.",
  dimensions:
    "Generic editable illustrative footprints; not construction dimensions or structural verification.",
  stairs:
    "Exactly 16 tread rectangles per stair; landings excluded. Direction arrow follows the path from the starting dot.",
  items: items.map(({ id, name, width, depth, flights, revision = 1 }) => ({
    id,
    name,
    category: "Arquitetura",
    revision,
    widthCm: width,
    depthCm: depth,
    source: `sources/${id}-r${revision}.svg`,
    ...(flights ? { flights, treads: 16 } : {}),
  })),
};
await writeFile(path, JSON.stringify(provenance, null, 2) + "\n");
