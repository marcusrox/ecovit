import type { Project, RoomLabel } from "./project";
import {
  floorAreaGeometry,
  type ConstructedArea,
  type RoomRegion,
} from "./rooms";

export type RoomArea = { label: RoomLabel; region?: RoomRegion };
export type UsefulArea = { area: number | null; count: number; review: number };
const useful = (rooms: RoomArea[]): UsefulArea => {
  const valid = rooms.filter((r) => r.region);
  return {
    area: valid.length
      ? valid.reduce((sum, r) => sum + r.region!.area, 0)
      : null,
    count: rooms.length,
    review: rooms.length - valid.length,
  };
};

/** One derivation per floor; the document only renders these shared results. */
export function projectAreas(doc: Project) {
  const floors = [...doc.model.floors]
    .sort((a, b) => a.level - b.level)
    .map((floor) => {
      const geometry = floorAreaGeometry(doc, floor.id);
      const rooms: RoomArea[] = doc.model.roomLabels
        .filter((l) => l.floorId === floor.id)
        .map((label) => ({
          label,
          region: label.review ? undefined : geometry.rooms.at(label.reference),
        }));
      return {
        floor,
        rooms,
        useful: useful(rooms),
        constructed: geometry.constructed,
      };
    });
  const closed = floors.some((f) => f.constructed.closed);
  const pending = floors.some((f) => f.constructed.pending);
  const constructed: ConstructedArea = {
    area:
      closed || !pending
        ? floors.reduce((sum, f) => sum + (f.constructed.area ?? 0), 0)
        : null,
    closed,
    pending,
  };
  return {
    floors,
    useful: useful(floors.flatMap((f) => f.rooms)),
    constructed,
  };
}
