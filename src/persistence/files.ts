import { MAX_FILE, parseFile, serializeFile } from "./document";
import type { Project } from "../domain/project";
export {
  MAX_FILE,
  parseFile,
  serializeFile,
  importedCopy,
  validateProject,
} from "./document";
export async function readFile(file: File): Promise<Project> {
  if (file.size > MAX_FILE)
    throw new Error("O arquivo excede o limite de 50 MB.");
  return parseFile(await file.text());
}
export function download(doc: Project) {
  const file = serializeFile(doc);
  const url = URL.createObjectURL(
    new Blob([file.text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.project.name.replace(/[^\p{L}\p{N} _-]/gu, "_") || "projeto"}.ecovit`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return file.omittedResult;
}
