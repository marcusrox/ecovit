import {
  ArrowRight,
  BrickWall,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  DoorClosed,
  Download,
  Info,
  House,
  LoaderCircle,
  LockKeyhole,
  MousePointer2,
  PanelsTopLeft,
  Plus,
  Minus,
  Redo2,
  Scan,
  SlidersHorizontal,
  SquareDashed,
  SquareSplitHorizontal,
  TriangleAlert,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import styles from "./App.module.css";

// Semantic names remain stable across screens; only this module imports Lucide.
const icons = {
  select: MousePointer2,
  wall: BrickWall,
  door: DoorClosed,
  window: SquareSplitHorizontal,
  opening: SquareDashed,
  settings: SlidersHorizontal,
  undo: Undo2,
  redo: Redo2,
  left: ChevronLeft,
  right: ChevronRight,
  close: X,
  plus: Plus,
  copy: Copy,
  delete: Trash2,
  minus: Minus,
  download: Download,
  upload: Upload,
  fit: Scan,
  info: Info,
  plan: PanelsTopLeft,
  next: ArrowRight,
  saved: Check,
  warning: TriangleAlert,
  saving: LoaderCircle,
  readonly: LockKeyhole,
  home: House,
} as const;
const sizes = { compact: 16, control: 18, card: 24, feature: 32 } as const;

export function Icon({
  name,
  size = "control",
}: {
  name: keyof typeof icons;
  size?: keyof typeof sizes;
}) {
  const Glyph = icons[name];
  return (
    <Glyph
      className={styles.icon}
      size={sizes[size]}
      color="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    />
  );
}
