import styles from "./App.module.css";

export function Brand() {
  return (
    <div className={styles.brand}>
      <svg width="31" height="31" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M3 16 16 4l13 12v13H3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 20h12M10 24h12M16 16v12"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <strong>
        ecovit<span>ESTÚDIO MODULAR</span>
      </strong>
    </div>
  );
}
