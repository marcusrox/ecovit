import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadProject } from '../persistence/projects';
import type { LoadedProject } from '../persistence/projects';
import { normalizeError } from '../persistence/errors';
import styles from './EditorPage.module.css';

export function EditorPage() {
  const { projectId = '' } = useParams();
  return <ProjectEditor key={projectId} projectId={projectId} />;
}
function ProjectEditor({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<LoadedProject | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void loadProject(projectId).then(result => { if (active) setProject(result); }).catch(cause => { if (active) setError(normalizeError(cause).message); });
    return () => { active = false; };
  }, [projectId, retry]);
  if (!project) return <main className={styles.loading}><Link to="/projetos">← Meus projetos</Link>{error ? <><p role="alert">{error}</p><button onClick={() => { setError(''); setRetry(r => r + 1); }}>Tentar novamente</button></> : <p role="status">Abrindo projeto…</p>}</main>;
  const doc = project.document;
  return <div className={styles.editor}>
    <header className={styles.header}><Link to="/projetos">← Meus projetos</Link><div><h1>{doc.name}</h1><span>{doc.floor.name} · Revisão {project.revision}</span></div><span className={styles.cloud}>✓ Carregado da nuvem</span></header>
    <aside className={styles.sidebar}><p className={styles.eyebrow}>PROJETO</p><h2>Configuração</h2><dl><dt>Base do tijolo</dt><dd>{doc.brickSystem.lengthMm} × {doc.brickSystem.widthMm} mm</dd><dt>Altura do tijolo</dt><dd>{doc.brickSystem.heightMm} mm</dd><dt>Junta horizontal</dt><dd>{doc.brickSystem.horizontalJointMm} mm</dd><dt>Junta vertical</dt><dd>0 mm</dd><dt>Altura padrão</dt><dd>{doc.defaultWallHeightMm} mm</dd></dl><p className={styles.eyebrow}>ELEMENTOS</p><p>{doc.floor.walls.length} paredes · {doc.floor.openings.length} aberturas</p><p className={styles.note}>A configuração será editável nos próximos marcos.</p></aside>
    <main className={styles.canvas} aria-label="Área do editor"><div className={styles.canvasTop}><span>Planta · {doc.floor.name}</span><span>Unidade: mm</span></div><section className={styles.placeholder}><span className={styles.symbol} aria-hidden="true">⌑</span><p className={styles.eyebrow}>A BASE ESTÁ PRONTA</p><h2>Seu projeto, um novo começo.</h2><p>O documento está salvo na nuvem.<br />Desenho de paredes e paginação chegam nos próximos marcos.</p><span className={styles.pill}>Editor vazio · M0</span></section><div className={styles.origin} aria-hidden="true">↑ Y<br />└──→ X</div></main>
    <footer className={styles.footer}><span>Visualização inicial · Sem ferramentas de desenho</span><span>Perfil orthogonal-half-bond-v1 · Schema 1</span></footer>
  </div>;
}
