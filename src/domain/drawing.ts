import { bounds, length, snap, type Point, type Wall } from "./project";
import { wallAxis, wallStart } from "./openings";

/** The cursor hotspot selects a cell, rather than the nearest grid vertex. */
export const cursorCell = (p: Point, module: number): Point => ({
  x: Math.floor(p.x / module) * module,
  y: Math.floor(p.y / module) * module,
});

export function openingCell(wall: Wall, p: Point, module: number) {
  const axis = wallAxis(wall),
    start = wallStart(wall),
    size = length(wall);
  const s = p[axis] - start;
  if (s < 0 || s > size) return null;
  const offset = Math.min(size - module, Math.floor(s / module) * module);
  const b = bounds(wall, module);
  return { cell: { x: b.x, y: b.y, [axis]: start + offset }, offset };
}

/** Include the selected start cell in either direction; endpoints remain modular. */
export function openingDrawRange(
  offset: number,
  position: number,
  module: number,
  forward: boolean,
) {
  const anchor = offset + (forward ? 0 : module);
  const end = forward
    ? Math.max(offset + module, snap(position, module))
    : Math.min(offset, snap(position, module));
  return { offset: Math.min(anchor, end), width: Math.abs(end - anchor) };
}

export function wallDraw(
  cell: Point,
  press: Point,
  cursor: Point,
  module: number,
  floorId: string,
  height: number,
  side: 1 | -1,
  target?: Point | null,
): Wall | null {
  const dx = cursor.x - press.x,
    dy = cursor.y - press.y;
  if (!dx && !dy) return null;
  const horizontal = Math.abs(dx) >= Math.abs(dy),
    axis = horizontal ? "x" : "y";
  const forward = (horizontal ? dx : dy) > 0;
  const cross = horizontal ? "y" : "x";
  const a = {
    ...cell,
    [axis]: cell[axis] + (forward ? 0 : module),
    [cross]: cell[cross] + (side === -1 ? module : 0),
  };
  const rawEnd =
    target && target[cross] === a[cross] ? target[axis] : cursor[axis];
  const endpoint = forward
    ? Math.max(cell[axis] + module, snap(rawEnd, module))
    : Math.min(cell[axis], snap(rawEnd, module));
  return {
    id: "preview-wall",
    floorId,
    a,
    b: { ...a, [axis]: endpoint },
    side,
    height,
  };
}
