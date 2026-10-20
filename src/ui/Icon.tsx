import {
  ImagePlus,
  Armchair,
  TrianglesCenterlineDashedVertical,
  TrianglesCenterlineDashedHorizontal,
  Ellipsis,
  ArrowLeft,
  ArrowRight,
  BrickWall,
  Check,
  Copy,
  ListOrdered,
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
  Pencil,
  Plus,
  Minus,
  Redo2,
  Scan,
  SlidersHorizontal,
  Settings,
  Ruler,
  SquareDashed,
  RectangleHorizontal,
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
  furniture: Armchair,
  flipHorizontal: TrianglesCenterlineDashedVertical,
  flipVertical: TrianglesCenterlineDashedHorizontal,
  image: ImagePlus,
  more: Ellipsis,
  select: MousePointer2,
  wall: BrickWall,
  slab: RectangleHorizontal,
  door: DoorClosed,
  window: SquareSplitHorizontal,
  opening: SquareDashed,
  settings: SlidersHorizontal,
  preferences: Settings,
  measure: Ruler,
  undo: Undo2,
  redo: Redo2,
  left: ChevronLeft,
  right: ChevronRight,
  close: X,
  plus: Plus,
  copy: Copy,
  quantities: ListOrdered,
  delete: Trash2,
  minus: Minus,
  download: Download,
  upload: Upload,
  fit: Scan,
  info: Info,
  plan: PanelsTopLeft,
  next: ArrowRight,
  back: ArrowLeft,
  saved: Check,
  apply: Check,
  redraw: Pencil,
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
