import Dexie, { type Table } from "dexie";
import type { Project } from "../domain/project";
import { validateProject } from "./files";
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
    updatedAt: row.updatedAt,
    walls: row.doc.model.walls.length,
  }));
export async function loadProject(id: string) {
  const row = await projects.get(id);
  if (!row) throw new Error("Projeto não encontrado.");
  return validateProject(row.doc);
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
