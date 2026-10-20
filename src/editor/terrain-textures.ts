import type { Terrain } from "../domain/project";

// Original procedural materials, revision 1. A tile covers 4 × 4 nominal metres.
// All marks wrap at tile boundaries; neither the image nor its scale depends on the ring.
export const TERRAIN_TILE_WORLD = 40_000;
export function terrainTexture(material: Terrain["material"]) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 800;
  const ctx = tile.getContext("2d")!;
  let seed = 1103;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const bases = {
    grass: [123, 148, 88],
    earth: [161, 124, 91],
    sand: [221, 204, 163],
    gravel: [166, 166, 158],
    pavers: [184, 181, 169],
  };
  const [r, g, b] = bases[material];
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 800, 800);
  const wrap = (
    x: number,
    y: number,
    margin: number,
    draw: (x: number, y: number) => void,
  ) => {
    const xs = [x],
      ys = [y];
    if (x < margin) xs.push(x + 800);
    if (x > 800 - margin) xs.push(x - 800);
    if (y < margin) ys.push(y + 800);
    if (y > 800 - margin) ys.push(y - 800);
    xs.forEach((a) => ys.forEach((b) => draw(a, b)));
  };
  if (material !== "pavers") {
    for (let i = 0; i < 180; i++) {
      const x = random() * 800,
        y = random() * 800,
        radius = 18 + random() * 75;
      const light = random() > 0.5;
      wrap(x, y, radius, (a, b) => {
        const gradient = ctx.createRadialGradient(a, b, 0, a, b, radius);
        const color = light ? "255,243,201" : "55,48,26";
        gradient.addColorStop(0, `rgba(${color},0.075)`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(a - radius, b - radius, radius * 2, radius * 2);
      });
    }
  }
  const count =
    material === "grass" ? 42000 : material === "gravel" ? 15000 : 55000;
  for (let i = 0; i < count; i++) {
    const x = random() * 800,
      y = random() * 800,
      variation = (random() - 0.5) * (material === "gravel" ? 85 : 55);
    ctx.fillStyle = `rgba(${r + variation},${g + variation},${b + variation},0.55)`;
    if (material === "grass") {
      const dx = (random() - 0.5) * 4,
        dy = 1 + random() * 4;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.6 + random() * 0.6;
      wrap(x, y, 6, (a, b) => {
        ctx.beginPath();
        ctx.moveTo(a, b);
        ctx.lineTo(a + dx, b + dy);
        ctx.stroke();
      });
    } else if (material === "gravel") {
      const radius = 0.8 + random() * 2.8,
        angle = random() * Math.PI;
      wrap(x, y, 5, (a, b) => {
        ctx.beginPath();
        ctx.ellipse(a, b, radius, radius * 0.65, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(60,61,55,0.2)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });
    } else {
      const size = material === "earth" ? 0.5 + random() * 1.5 : 0.5 + random();
      wrap(x, y, 3, (a, b) => ctx.fillRect(a, b, size, size));
    }
  }
  if (material === "pavers") {
    // Staggered 20 × 10 cm illustrative pavers; joints are visual, not a specification.
    ctx.strokeStyle = "rgba(83,84,78,.6)";
    ctx.lineWidth = 1.4;
    for (let row = 0; row < 40; row++) {
      const y = row * 20;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
      for (let col = -1; col < 21; col++) {
        const x = col * 40 + (row % 2) * 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 20);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,245,.17)";
        ctx.fillRect(x + 2, y + 2, 36, 1);
      }
    }
  }
  return tile;
}
