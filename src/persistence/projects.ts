import { z } from 'zod';
import { parseProjectDocument } from '../domain/project';
import type { ProjectDocument } from '../domain/project';
import { getSupabase } from './supabase';
import { AppError, normalizeError } from './errors';

const metadata = z.object({ id: z.uuid(), name: z.string(), current_revision: z.number().int().positive(), created_at: z.iso.datetime({ offset: true }), updated_at: z.iso.datetime({ offset: true }) });
const saved = z.object({ id: z.uuid(), revision: z.number().int().positive(), updated_at: z.iso.datetime({ offset: true }) });
export type ProjectMetadata = z.infer<typeof metadata>;
export type ProjectCursor = { createdAt: string; id: string };
export type LoadedProject = { id: string; document: ProjectDocument; revision: number; updatedAt: string };
const fields = 'id,name,current_revision,created_at,updated_at';

export async function listProjects(cursor?: ProjectCursor): Promise<{ items: ProjectMetadata[]; nextCursor?: ProjectCursor }> {
  try {
    let query = getSupabase().from('projects').select(fields).is('deleted_at', null).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(21);
    if (cursor) {
      const id = z.uuid().parse(cursor.id);
      const date = z.iso.datetime({ offset: true }).parse(cursor.createdAt);
      query = query.or(`created_at.lt.${date},and(created_at.eq.${date},id.lt.${id})`);
    }
    const { data, error } = await query;
    if (error) throw error;
    const rows = z.array(metadata).parse(data);
    const items = rows.slice(0, 20);
    const last = items.at(-1);
    return { items, nextCursor: rows.length > 20 && last ? { createdAt: last.created_at, id: last.id } : undefined };
  } catch (error) { throw normalizeError(error); }
}

export async function loadProject(id: string): Promise<LoadedProject> {
  try {
    if (!z.uuid().safeParse(id).success) throw new AppError('NOT_FOUND');
    const { data, error } = await getSupabase().from('projects').select(`${fields},document`).eq('id', id).is('deleted_at', null).maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND');
    const parsed = metadata.extend({ document: z.unknown() }).parse(data);
    return { id: parsed.id, document: parseProjectDocument(parsed.document), revision: parsed.current_revision, updatedAt: parsed.updated_at };
  } catch (error) { throw normalizeError(error); }
}

export async function createProject(projectId: string, document: ProjectDocument) {
  try {
    z.uuid().parse(projectId);
    const valid = parseProjectDocument(document);
    const { data, error } = await getSupabase().rpc('create_project', { p_project_id: projectId, p_document: valid });
    if (error) throw error;
    return saved.parse(data);
  } catch (error) { throw normalizeError(error); }
}
