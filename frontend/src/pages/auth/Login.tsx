
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [setupMode, setSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSetup() {
      try {
        const response = await api.get<{ registered: boolean }>(
          '/auth/has-user',
        );

        if (mounted) {
          setSetupMode(!response.data.registered);
        }
      } catch {
        if (mounted) {
          setSetupError(
            'Não foi possível verificar a configuração inicial. Verifique se o sistema está funcionando e tente novamente.',
          );
        }
      } finally {
        if (mounted) {
          setCheckingSetup(false);
        }
      }
    }

    void checkSetup();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      if (setupMode) {
        await api.post('/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }

      await login(email.trim(), password);
      navigate('/');
    } catch {
      setError(
        setupMode
          ? 'Não foi possível configurar a conta. Confira os dados e tente novamente.'
          : 'E-mail ou senha inválidos.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSetup) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">FITFISIO</div>
          <p className="login-description">
            Verificando configuração...
          </p>
        </div>
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">FITFISIO</div>
          <h1>Não foi possível iniciar</h1>
          <div className="form-error">{setupError}</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">FITFISIO</div>

        <h1>{setupMode ? 'Configuração inicial' : 'Bem-vinda!'}</h1>

        <p className="login-description">
          {setupMode
            ? 'Crie a conta de acesso para começar a utilizar o sistema.'
            : 'Entre para administrar seu espaço.'}
        </p>

        <form onSubmit={handleSubmit}>
          {setupMode && (
            <label>
              Nome
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome da responsável"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete={setupMode ? 'new-password' : 'current-password'}
              minLength={setupMode ? 8 : undefined}
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading
              ? setupMode
                ? 'Configurando...'
                : 'Entrando...'
              : setupMode
                ? 'Configurar e continuar'
                : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
