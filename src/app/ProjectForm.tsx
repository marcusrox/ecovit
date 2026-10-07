import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmptyDocument } from '../domain/project';
import { createProject } from '../persistence/projects';
import { normalizeError } from '../persistence/errors';
import styles from './App.module.css';

export function ProjectForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const attempt = useRef<{ serialized: string; id: string; floorId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(''); setBusy(true);
    try {
      const serialized = JSON.stringify([...form.entries()]);
      // Uma resposta perdida pode ser repetida com os mesmos IDs e documento.
      if (attempt.current?.serialized !== serialized) attempt.current = { serialized, id: crypto.randomUUID(), floorId: crypto.randomUUID() };
      const document = createEmptyDocument(String(form.get('name')), { lengthMm: Number(form.get('length')), heightMm: Number(form.get('height')), horizontalJointMm: Number(form.get('joint')), defaultWallHeightMm: Number(form.get('wallHeight')) });
      document.floor.id = attempt.current.floorId;
      const result = await createProject(attempt.current.id, document);
      navigate(`/projetos/${result.id}`);
    } catch (cause) { setError(normalizeError(cause).message); }
    finally { setBusy(false); }
  }
  return <section className={styles.newProject} aria-labelledby="new-project-title">
    <h2 id="new-project-title">Novo projeto</h2><p className={styles.muted}>Defina o ponto de partida. Todas as medidas abaixo estão em milímetros.</p>
    <form className={styles.form} onSubmit={submit}>
      <label>Nome do projeto<input name="name" autoFocus required maxLength={160} placeholder="Ex.: Casa do jardim" /></label>
      <div className={styles.formGrid}>
        <label>Base do tijolo (mm)<select name="length" defaultValue="250"><option value="250">250 × 125</option><option value="300">300 × 150</option></select></label>
        <label>Altura do tijolo (mm)<input name="height" type="number" min="1" step="1" placeholder="Ex.: 70" required /></label>
        <label>Junta horizontal (mm)<input name="joint" type="number" min="0" max="10" step="1" defaultValue="0" required /></label>
        <label>Altura padrão das paredes (mm)<input name="wallHeight" type="number" min="1" step="1" defaultValue="2800" required /></label>
      </div>
      <p className={styles.hint}>Os presets são atalhos dimensionais, sem homologação de fabricante. A altura da parede inclui o módulo superior com sua junta. Junta vertical: 0 mm. Até 60 fiadas por parede.</p>
      <label className={styles.checkbox}><input type="checkbox" required />Confirmo a altura do tijolo e as juntas informadas.</label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button className={styles.primary} disabled={busy}>{busy ? 'Criando na nuvem…' : 'Criar projeto'}</button><button type="button" onClick={onCancel} disabled={busy}>Cancelar</button></div>
    </form>
  </section>;
}
