import { afterEach, beforeEach, expect, it, vi } from "vitest";
import crops from "../src/editor/furniture-crops.json";

const urls = Object.keys(crops);
let imageSize = 1024;
let decode: () => Promise<void>;
let draw: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  imageSize = 1024;
  decode = () => Promise.resolve();
  draw = vi.fn();
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = imageSize;
      naturalHeight = imageSize;
      decode() {
        return decode();
      }
    },
  );
  vi.stubGlobal("document", {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: draw }),
    }),
  });
});
afterEach(() => vi.unstubAllGlobals());

it("reusa recorte, imagem e níveis após fechar e reabrir; liberações repetidas não descartam outro usuário", async () => {
  const { acquireFurnitureBitmap: acquire, furnitureBitmapLevel: level } =
    await import("../src/editor/furniture-bitmaps");
  const first = acquire(urls[0]);
  const second = acquire(urls[0]);
  const bitmap = await first.promise;
  expect(bitmap.crop).toEqual(crops[urls[0] as keyof typeof crops]);
  const reduced = level(bitmap, 32, 32);
  const calls = draw.mock.calls.length;
  expect(calls).toBeGreaterThan(0);
  first.release();
  first.release();
  second.release();
  const reopened = acquire(urls[0]);
  expect(await reopened.promise).toBe(bitmap);
  expect(level(bitmap, 32, 32)).toBe(reduced);
  expect(draw).toHaveBeenCalledTimes(calls);
  reopened.release();
});

it("não retém bytes privados depois da última liberação", async () => {
  const { acquireFurnitureBitmap: acquire } =
    await import("../src/editor/furniture-bitmaps");
  const url = "data:image/png;base64,private";
  const first = acquire(url);
  const concurrent = acquire(url);
  await first.promise;
  first.release();
  expect(concurrent.promise).toBe(first.promise);
  concurrent.release();
  const reopened = acquire(url);
  expect(reopened.promise).not.toBe(first.promise);
  await reopened.promise;
  reopened.release();
});

it("falha de decode permite nova tentativa sem exigir fechar todos os usuários", async () => {
  const { acquireFurnitureBitmap: acquire } =
    await import("../src/editor/furniture-bitmaps");
  decode = () => Promise.reject(new Error("decode failed"));
  const failed = acquire(urls[0]);
  await expect(failed.promise).rejects.toThrow("decode failed");
  decode = () => Promise.resolve();
  const retry = acquire(urls[0]);
  await expect(retry.promise).resolves.toBeDefined();
  failed.release();
  expect(acquire(urls[0]).promise).toBe(retry.promise);
  retry.release();
});

it("carga abandonada não volta ao cache ao terminar depois de outra aquisição", async () => {
  const { acquireFurnitureBitmap: acquire } =
    await import("../src/editor/furniture-bitmaps");
  let finish!: () => void;
  decode = () =>
    new Promise<void>((resolve) => {
      finish = resolve;
    });
  const abandoned = acquire(urls[0]);
  abandoned.release();
  decode = () => Promise.resolve();
  const current = acquire(urls[0]);
  await current.promise;
  finish();
  await abandoned.promise;
  expect(acquire(urls[0]).promise).toBe(current.promise);
  current.release();
});

it("descarta os recursos ociosos menos recentes, preservando recursos ainda em uso", async () => {
  const { acquireFurnitureBitmap: acquire } =
    await import("../src/editor/furniture-bitmaps");
  const pinned = acquire(urls[0]);
  await pinned.promise;
  const entries = [];
  for (const url of urls.slice(1, 34)) {
    const entry = acquire(url);
    await entry.promise;
    entry.release();
    entries.push(entry);
  }
  expect(acquire(urls[0]).promise).toBe(pinned.promise);
  expect(acquire(urls[33]).promise).toBe(entries[32].promise);
  const evicted = acquire(urls[1]);
  expect(evicted.promise).not.toBe(entries[0].promise);
  await evicted.promise;
});

it("limita a estimativa RGBA ociosa, incluindo os níveis reduzidos", async () => {
  const { acquireFurnitureBitmap: acquire } =
    await import("../src/editor/furniture-bitmaps");
  imageSize = 4096;
  const entries = [];
  for (const url of urls.slice(0, 4)) {
    const entry = acquire(url);
    await entry.promise;
    entry.release();
    entries.push(entry);
  }
  expect(acquire(urls[0]).promise).not.toBe(entries[0].promise);
  const last = acquire(urls[3]);
  const bitmap = await last.promise;
  bitmap.levels.push({
    image: { width: 8192, height: 8192 } as HTMLCanvasElement,
    crop: bitmap.crop,
  });
  last.release();
  expect(acquire(urls[3]).promise).not.toBe(last.promise);
});
