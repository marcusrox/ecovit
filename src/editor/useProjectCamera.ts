import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Camera = { x: number; y: number; scale: number };
type Size = { width: number; height: number };
type View = { centerX: number; centerY: number; scale: number };
export const projectViewKey = (id: string) => `ecovit:project-view:v1:${id}`;

export function readProjectView(id: string): View | null {
  try {
    const v = JSON.parse(localStorage.getItem(projectViewKey(id)) ?? "null");
    if (
      v &&
      Number.isFinite(v.centerX) &&
      Number.isFinite(v.centerY) &&
      Number.isFinite(v.scale) &&
      v.scale >= 0.0015 &&
      v.scale <= 0.12
    )
      return { centerX: v.centerX, centerY: v.centerY, scale: v.scale };
  } catch {
    /* Missing or inaccessible preferences do not block the editor. */
  }
  return null;
}

function saveProjectView(id: string, camera: Camera, size: Size): string {
  try {
    localStorage.setItem(
      projectViewKey(id),
      JSON.stringify({
        centerX: (size.width / 2 - camera.x) / camera.scale,
        centerY: (size.height / 2 - camera.y) / camera.scale,
        scale: camera.scale,
      }),
    );
    return "";
  } catch {
    return "Não foi possível salvar a visualização para a próxima abertura.";
  }
}

// The Canvas is mounted separately for each project ID.
export function useProjectCamera(id: string, panning: boolean) {
  const [saved] = useState(() => readProjectView(id));
  const [size, setSize] = useState<Size>({ width: 900, height: 700 });
  const [camera, setCamera] = useState<Camera>(() =>
    saved
      ? {
          x: 450 - saved.centerX * saved.scale,
          y: 350 - saved.centerY * saved.scale,
          scale: saved.scale,
        }
      : { x: 120, y: 100, scale: 0.012 },
  );
  const [error, setError] = useState("");
  const measured = useRef(false);
  const dimensions = useRef(size);
  const latest = useRef({ camera, size });
  useLayoutEffect(() => {
    latest.current = { camera, size };
  }, [camera, size]);

  const resize = useCallback(
    (next: Size) => {
      if (next.width <= 0 || next.height <= 0) return;
      const previous = dimensions.current;
      if (measured.current || saved)
        setCamera((c) => ({
          ...c,
          x: c.x + (next.width - previous.width) / 2,
          y: c.y + (next.height - previous.height) / 2,
        }));
      measured.current = true;
      dimensions.current = next;
      setSize(next);
    },
    [saved],
  );

  useEffect(() => {
    function save() {
      if (!measured.current) return;
      saveProjectView(id, latest.current.camera, latest.current.size);
    }
    const pagehide = () => {
      save();
    };
    window.addEventListener("pagehide", pagehide);
    return () => {
      save();
      window.removeEventListener("pagehide", pagehide);
    };
  }, [id]);

  useEffect(() => {
    if (!measured.current || panning) return;
    setError(saveProjectView(id, camera, size));
  }, [id, camera, size, panning]);
  return { camera, setCamera, size, resize, error };
}
