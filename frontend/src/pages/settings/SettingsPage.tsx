import { useEffect, useState } from 'react';
import {
  settingsService,
  type SystemSetting,
} from '../../services/settings.service';

interface SettingForm {
  key: string;
  value: string;
  description: string;
}

const emptyForm: SettingForm = {
  key: '',
  value: '',
  description: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [form, setForm] = useState<SettingForm>(emptyForm);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');

      const data = await settingsService.findAll();
      setSettings(data);
    } catch {
      setError('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(
    field: keyof SettingForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(setting: SystemSetting) {
    setEditingKey(setting.key);

    setForm({
      key: setting.key,
      value: setting.value,
      description: setting.description ?? '',
    });

    setError('');
  }

  function cancelEditing() {
    setEditingKey(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.key.trim()) {
      setError('Informe a chave da configuração.');
      return;
    }

    if (!form.value.trim()) {
      setError('Informe o valor da configuração.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingKey) {
        await settingsService.update(editingKey, {
          value: form.value,
          description: form.description || undefined,
        });
      } else {
        await settingsService.create({
          key: form.key.trim(),
          value: form.value,
          description: form.description || undefined,
        });
      }

      cancelEditing();
      await loadSettings();
    } catch (error: any) {
      const message =
        error?.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(
          message ||
            'Não foi possível salvar a configuração.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(key: string) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a configuração "${key}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await settingsService.remove(key);
      await loadSettings();
    } catch (error: any) {
      const message =
        error?.response?.data?.message;

      setError(
        message ||
          'Não foi possível excluir a configuração.',
      );
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>
            Gerencie as configurações gerais do FitFisio.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="card">
        <h2>
          {editingKey
            ? 'Editar configuração'
            : 'Nova configuração'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="setting-key">
                Chave
              </label>

              <input
                id="setting-key"
                type="text"
                value={form.key}
                disabled={editingKey !== null}
                onChange={(event) =>
                  handleChange(
                    'key',
                    event.target.value,
                  )
                }
                placeholder="Ex.: company_name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="setting-value">
                Valor
              </label>

              <input
                id="setting-value"
                type="text"
                value={form.value}
                onChange={(event) =>
                  handleChange(
                    'value',
                    event.target.value,
                  )
                }
                placeholder="Valor da configuração"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="setting-description">
              Descrição
            </label>

            <textarea
              id="setting-description"
              value={form.description}
              onChange={(event) =>
                handleChange(
                  'description',
                  event.target.value,
                )
              }
              placeholder="Descreva para que esta configuração serve"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Salvando...'
                : editingKey
                  ? 'Salvar alterações'
                  : 'Criar configuração'}
            </button>

            {editingKey && (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Configurações cadastradas</h2>
            <p>
              {settings.length}{' '}
              {settings.length === 1
                ? 'configuração'
                : 'configurações'}
            </p>
          </div>
        </div>

        {loading ? (
          <p>Carregando configurações...</p>
        ) : settings.length === 0 ? (
          <p>
            Nenhuma configuração cadastrada.
          </p>
        ) : (
          <div className="settings-list">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="setting-item"
              >
                <div className="setting-info">
                  <strong>{setting.key}</strong>

                  <span>
                    {setting.value}
                  </span>

                  {setting.description && (
                    <small>
                      {setting.description}
                    </small>
                  )}
                </div>

                <div className="setting-actions">
                  <button
                    type="button"
                    onClick={() =>
                      startEditing(setting)
                    }
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemove(setting.key)
                    }
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}