import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Use the same alpha > 8 bounds as the browser, once per immutable catalog art.
const directory = new URL("../public/catalog/m10/", import.meta.url);
const target = new URL("../src/editor/furniture-crops.json", import.meta.url);
const crops = {};
for (const name of (await readdir(directory))
  .filter((n) => n.endsWith(".png"))
  .sort()) {
  const { data, info } = await sharp(fileURLToPath(new URL(name, directory)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels + info.channels - 1] > 8) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  if (right < left) throw new Error(`Arte inteiramente transparente: ${name}`);
  crops[`/catalog/m10/${name}`] = {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}
const output = JSON.stringify(crops, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8")) !== output)
    throw new Error(
      "Recortes desatualizados. Execute node scripts/generate-furniture-crops.mjs.",
    );
  console.log(
    `${Object.keys(crops).length} recortes conferidos contra os pixels originais.`,
  );
} else {
  await writeFile(target, output);
  console.log(`${Object.keys(crops).length} recortes gerados.`);
}
