import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from './session-context';
import { listProjects } from '../persistence/projects';
import type { ProjectCursor, ProjectMetadata } from '../persistence/projects';
import { normalizeError } from '../persistence/errors';
import { signOut } from '../persistence/auth';
import { ProjectForm } from './ProjectForm';
import styles from './App.module.css';

export function ProjectsPage() {
  const { session } = useSession();
  const [items, setItems] = useState<ProjectMetadata[]>([]);
  const [cursor, setCursor] = useState<ProjectCursor>();
  const [loading, setLoading] = useState(true);
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [creating, setCreating] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void listProjects().then(result => {
      if (active) { setItems(result.items); setCursor(result.nextCursor); }
    }).catch(cause => { if (active) setError(normalizeError(cause).message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry, session?.user.id]);
  async function more() {
    setMoreBusy(true); setError('');
    try { const result = await listProjects(cursor); setItems(old => [...old, ...result.items]); setCursor(result.nextCursor); }
    catch (cause) { setError(normalizeError(cause).message); }
    finally { setMoreBusy(false); }
  }
  async function logout() {
    setLogoutBusy(true);
    try { const result = await signOut(); if (result.error) throw result.error; }
    catch (cause) { setError(normalizeError(cause).message); }
    finally { setLogoutBusy(false); }
  }
  return <div className={styles.workspace}>
    <header className={styles.header}><Link to="/projetos" className={styles.brand}><span className={styles.brandMark}>e</span>ecovit</Link><nav aria-label="Principal"><span className={styles.activeNav}>Projetos</span></nav><div className={styles.account}><span>{session?.user.email}</span><button onClick={() => void logout()} disabled={logoutBusy}>{logoutBusy ? 'Saindo…' : 'Sair'}</button></div></header>
    <main className={styles.projectsMain}>
      <div className={styles.pageTitle}><div><p className={styles.eyebrow}>SEU ESPAÇO DE TRABALHO</p><h1>Meus projetos<span className={styles.titleDot}>.</span></h1><p className={styles.muted}>O primeiro passo para construir suas ideias.</p></div><button className={styles.primary} onClick={() => setCreating(true)} disabled={creating}>＋ Novo projeto</button></div>
      {creating && <ProjectForm onCancel={() => setCreating(false)} />}
      {error && <div className={styles.error} role="alert">{error} <button onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1); }}>Tentar novamente</button></div>}
      {loading ? <p role="status">Carregando projetos…</p> : !error && items.length === 0 ? <section className={styles.empty}><div className={styles.emptyIcon} aria-hidden="true">▱</div><p className={styles.eyebrow}>UMA FOLHA EM BRANCO, MUITAS POSSIBILIDADES</p><h2>Vamos começar seu primeiro projeto?</h2><p>Defina o tijolo e organize a base do seu próximo espaço.</p><button onClick={() => setCreating(true)} disabled={creating}>Criar meu primeiro projeto →</button></section> : <section className={styles.projectGrid} aria-label="Lista de projetos">{items.map(project => <Link to={`/projetos/${project.id}`} key={project.id} className={styles.projectCard}><div className={styles.projectPreview} aria-hidden="true">▱</div><div><span className={styles.eyebrow}>PROJETO PRIVADO · REV. {project.current_revision}</span><h2>{project.name}</h2><p>Atualizado em {new Date(project.updated_at).toLocaleDateString('pt-BR')}</p></div><span aria-hidden="true">↗</span></Link>)}</section>}
      {cursor && <button onClick={() => void more()} disabled={moreBusy}>{moreBusy ? 'Carregando…' : 'Carregar mais projetos'}</button>}
      <footer className={styles.workspaceFooter}><span>Projetos privados, vinculados à sua conta.</span><span>ECOVIT · BASE M0</span></footer>
    </main>
  </div>;
}
