import Dexie, { type Table } from "dexie";
import type { Project } from "../domain/project";
import { importedCopy, validateProject } from "./files";
export const db = new Dexie("ecovit");
db.version(1).stores({ projects: "id, updatedAt" });
const projects = db.table("projects") as Table<{
  id: string;
  updatedAt: string;
  doc: Project;
}>;
export const saveProject = async (doc: Project) =>
  projects.put({ id: doc.project.id, updatedAt: doc.metadata.updatedAt, doc });
export const listProjects = async () =>
  (await projects.orderBy("updatedAt").reverse().toArray()).map((row) => ({
    id: row.id,
    name: row.doc.project.name,
    compatible: [9, 10, 11, 12, 13, 14, 15, 16].includes(row.doc.schemaVersion),
    updatedAt: row.updatedAt,
    walls: row.doc.model.walls.length,
  }));
export async function loadStoredProject(id: string) {
  const row = await projects.get(id);
  if (!row) throw new Error("Projeto não encontrado.");
  return row.doc;
}
export async function loadProject(id: string) {
  return validateProject(await loadStoredProject(id));
}
export async function deleteProject(id: string) {
  const release = await acquireProject(id);
  if (!release)
    throw new Error("Feche o projeto na outra aba antes de excluí-lo.");
  try {
    await projects.delete(id);
  } finally {
    release();
  }
}
export async function duplicateProject(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100)
    throw new Error("Informe um nome de 1 a 100 caracteres.");
  const source = await loadProject(id);
  const copy = structuredClone(importedCopy(source));
  copy.project.name = trimmed;
  copy.metadata.appVersion = "0.15.1";
  // The confirmed name/metadata may increase the portable intention size.
  // Geometry and the unchanged snapshot were already verified by loadProject.
  validateProject(copy, false);
  const release = await acquireProject(copy.project.id);
  if (!release)
    throw new Error("Não foi possível reservar a cópia do projeto.");
  try {
    await projects.add({
      id: copy.project.id,
      updatedAt: copy.metadata.updatedAt,
      doc: copy,
    });
  } finally {
    release();
  }
  return copy;
}
export async function acquireProject(id: string): Promise<(() => void) | null> {
  if (!navigator.locks)
    throw new Error(
      "Abra em Chrome ou Edge em localhost/HTTPS para editar com segurança.",
    );
  return new Promise((resolve, reject) => {
    navigator.locks
      .request(`ecovit:${id}`, { ifAvailable: true }, (lock) => {
        if (!lock) {
          resolve(null);
          return;
        }
        return new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
