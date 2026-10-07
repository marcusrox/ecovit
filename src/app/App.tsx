import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './SessionProvider';
import { useSession } from './session-context';
import { AuthPage } from './AuthPage';
import { ProjectsPage } from './ProjectsPage';
import { EditorPage } from '../editor/EditorPage';
import styles from './App.module.css';

function RequireSession() {
  const { session, loading, error } = useSession();
  if (loading) return <main className={styles.center} role="status">Verificando sua sessão…</main>;
  if (error) return <main className={styles.center} role="alert">{error}</main>;
  return session ? <Outlet /> : <Navigate to="/entrar" replace />;
}
function NotFound() {
  return <main className={styles.center}><h1>Página não encontrada</h1><Link to="/projetos">Voltar aos projetos</Link></main>;
}
export function App() {
  return <BrowserRouter><SessionProvider><Routes>
    <Route path="/" element={<Navigate to="/projetos" replace />} />
    <Route path="/entrar" element={<AuthPage mode="login" />} />
    <Route path="/criar-conta" element={<AuthPage mode="register" />} />
    <Route path="/recuperar-senha" element={<AuthPage mode="forgot" />} />
    <Route path="/auth/callback" element={<AuthPage mode="callback" />} />
    <Route path="/auth/redefinir-senha" element={<AuthPage mode="reset" />} />
    <Route element={<RequireSession />}>
      <Route path="/projetos" element={<ProjectsPage />} />
      <Route path="/projetos/:projectId" element={<EditorPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes></SessionProvider></BrowserRouter>;
}
