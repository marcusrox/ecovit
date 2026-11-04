import sharp from "sharp";
import { parseFile, validateProject } from "../src/persistence/document";
import { canonical } from "../src/persistence/remote-document";
import { withoutResult, type Project } from "../src/domain/project";
import { images } from "../src/persistence/remote-document";

sharp.cache(false);
async function checkImage(data: string) {
  const bytes = Buffer.from(data, "base64");
  if (!bytes.length || bytes.length > 10 * 1024 * 1024)
    throw new Error("Imagem deve ter até 10 MiB.");
  const decoder = sharp(bytes, {
    limitInputPixels: 16_000_000,
    failOn: "warning",
    animated: false,
  });
  const info = await decoder.metadata();
  if (!["png", "jpeg"].includes(info.format) || (info.pages ?? 1) !== 1)
    throw new Error("Use PNG ou JPEG válido, sem animação.");
  await decoder.raw().toBuffer();
  return {
    mime: info.format === "png" ? "image/png" : "image/jpeg",
    width: info.width,
    height: info.height,
  };
}
process.once(
  "message",
  async (input: { doc?: unknown; sourceFile?: string; image?: string }) => {
    try {
      if (input.image) {
        process.send?.({ result: await checkImage(input.image) });
        return;
      }
      const doc = validateProject(input.doc);
      if (input.sourceFile) {
        const source = parseFile(input.sourceFile);
        if (canonical(withoutResult(source)) !== canonical(withoutResult(doc)))
          throw new Error("O arquivo importado difere da intenção enviada.");
      }
      for (const { image } of images(doc)) {
        const info = await checkImage(image.data);
        if (
          info.mime !== image.mime ||
          info.width !== image.width ||
          info.height !== image.height
        )
          throw new Error("Imagem com dimensões ou tipo inconsistentes.");
      }
      process.send?.({ result: { doc: withoutResult(doc as Project) } });
    } catch (error) {
      process.send?.({
        error: error instanceof Error ? error.message : "Arquivo inválido.",
      });
    }
  },
);
