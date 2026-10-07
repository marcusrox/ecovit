import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSession } from './session-context';
import { isSupabaseConfigured } from '../persistence/supabase';
import { requestPasswordReset, signIn, signUp, updatePassword } from '../persistence/auth';
import { normalizeError } from '../persistence/errors';
import styles from './App.module.css';

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'callback';
const titles: Record<Mode, string> = { login: 'Seu próximo projeto começa aqui.', register: 'Crie espaço para suas ideias.', forgot: 'Vamos recuperar seu acesso.', reset: 'Escolha uma nova senha.', callback: 'Confirmação de conta' };

export function AuthPage({ mode }: { mode: Mode }) {
  // Uma instância por rota evita mensagens e senhas herdadas entre formulários.
  return <AuthForm key={mode} mode={mode} />;
}
function AuthForm({ mode }: { mode: Mode }) {
  const { session, loading, error: sessionError } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const callbackError = new URLSearchParams(window.location.hash.slice(1)).get('error_description') ?? new URLSearchParams(window.location.search).get('error_description');
  if (session && (mode === 'login' || mode === 'callback') && !callbackError) return <Navigate to="/projetos" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    setBusy(true); setError(''); setNotice('');
    try {
      const result = mode === 'login' ? await signIn(email, password) : mode === 'register' ? await signUp(email, password) : mode === 'forgot' ? await requestPasswordReset(email) : await updatePassword(password);
      if (result.error) {
        const code = result.error.code;
        if (code === 'invalid_credentials') throw new Error('LOGIN_INVALID');
        if (code === 'email_not_confirmed') throw new Error('EMAIL_UNCONFIRMED');
        throw result.error;
      }
      if (mode === 'register') setNotice('Cadastro recebido. Se necessário, confirme sua conta pelo link enviado ao seu e-mail.');
      if (mode === 'forgot') setNotice('Se houver uma conta para este e-mail, você receberá um link de recuperação.');
      if (mode === 'reset') setNotice('Senha atualizada. Você pode voltar aos seus projetos.');
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'LOGIN_INVALID' ? 'E-mail ou senha incorretos. Confira os dados e tente novamente.' : cause instanceof Error && cause.message === 'EMAIL_UNCONFIRMED' ? 'Confirme seu e-mail antes de entrar. Confira também a pasta de spam.' : normalizeError(cause).message);
    } finally { setBusy(false); }
  }
  const disabled = busy || loading || !isSupabaseConfigured || (mode === 'reset' && !session);
  return <main className={styles.authLayout}>
    <section className={styles.authIntro} aria-label="Ecovit">
      <Link to="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">e</span>ecovit<span className={styles.brandDot}>®</span></Link>
      <div className={styles.introCopy}><p className={styles.eyebrow}>IDEIAS QUE GANHAM FORMA</p><h1>Da primeira linha<br />ao próximo<br /><em>espaço.</em></h1><p>Um lugar para planejar seus projetos<br />em tijolo ecológico.</p></div>
      <div className={styles.brickArt} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <footer className={styles.introFooter}><span>PROJETAR COM PROPÓSITO</span><span>01 / BASE</span></footer>
    </section>
    <section className={styles.authContent}>
      <span className={styles.release}>ECOVIT / M0</span>
      <div className={styles.authFormWrap}>
        <p className={styles.eyebrow}>BEM-VINDO AO ECOVIT</p><h2>{titles[mode]}</h2>
        <p className={styles.muted}>{mode === 'login' ? 'Entre na sua conta para acessar seus projetos.' : mode === 'register' ? 'Seus projetos ficam privados e vinculados à sua conta.' : mode === 'forgot' ? 'Informe o e-mail cadastrado para receber um link.' : mode === 'reset' ? 'Use pelo menos 8 caracteres.' : 'Aguarde a verificação do link recebido por e-mail.'}</p>
        {!isSupabaseConfigured && <div className={styles.warning} role="status"><strong>Conexão com a nuvem não configurada</strong><p>Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local e reinicie a aplicação. O acesso estará disponível após a configuração.</p></div>}
        {(error || sessionError || callbackError) && <p className={styles.error} role="alert">{error || sessionError || (callbackError && 'O link de acesso é inválido ou expirou. Solicite um novo link.')}</p>}
        {notice && <p className={styles.success} role="status">{notice}</p>}
        {mode === 'callback' ? <p><Link to="/entrar">Voltar para entrar</Link> · <Link to="/recuperar-senha">Recuperar acesso</Link></p> : <form onSubmit={submit} className={styles.form}>
          {mode !== 'reset' && <label>E-mail<input name="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" required maxLength={254} /></label>}
          {mode !== 'forgot' && <label>{mode === 'reset' ? 'Nova senha' : 'Senha'}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 8} required /></label>}
          {mode === 'login' && <Link className={styles.forgot} to="/recuperar-senha">Esqueceu sua senha?</Link>}
          {mode === 'reset' && !session && !loading && <p className={styles.warning}>Abra o link enviado ao seu e-mail para redefinir a senha.</p>}
          <button className={styles.primary} disabled={disabled}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar na minha conta →' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link de recuperação' : 'Salvar nova senha'}</button>
        </form>}
        <p className={styles.authSwitch}>{mode === 'login' ? <>Ainda não tem conta? <Link to="/criar-conta">Criar uma conta</Link></> : <Link to={notice && mode === 'reset' ? '/projetos' : '/entrar'}>{notice && mode === 'reset' ? 'Ir para projetos' : 'Voltar para entrar'}</Link>}</p>
      </div>
      <footer className={styles.authFooter}>Planejamento consciente. Construção com futuro.</footer>
    </section>
  </main>;
}
