import styles from "./App.module.css";

// Common 24-unit grid keeps toolbar and contextual symbols independent of fonts.
const paths = {
  select: "M5 3v16l4-4 4 7 3-2-4-7h6Z",
  wall: "M3 5h18v14H3ZM3 12h18M9 5v7m6 0v7",
  door: "M4 21h16M6 21V3h12v18M6 3l9 3v15M12 12h.01",
  window: "M4 4h16v16H4ZM12 4v16M4 12h16",
  opening: "M4 21V3h16v18M2 21h4m12 0h4",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6M10 15v6",
  undo: "M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3",
  redo: "m15 5 5 5-5 5M20 10H10a6 6 0 0 0-6 6v3",
  left: "m14 6-6 6 6 6",
  right: "m10 6 6 6-6 6",
  close: "m6 6 12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4",
  fit: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8Z",
  info: "M12 8h.01M11 12h1v5M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
  plan: "M3 3h18v18H3ZM3 13h10V3m0 10v8m0-8h8",
} as const;

export function Icon({
  name,
  size = 18,
}: {
  name: keyof typeof paths;
  size?: number;
}) {
  return (
    <svg
      className={styles.icon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
