import { useEffect, useState, useRef } from 'react';
import {
  settingsService,
  type SystemSetting,
} from '../../services/settings.service';
import { backupService } from '../../services/backup.service';

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

  // Estados de Backup e Restauração
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState('');
  const [backupError, setBackupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleDoBackup() {
    try {
      setBackupLoading(true);
      setBackupError('');
      setBackupFeedback('');
      await backupService.exportBackup();
      setBackupFeedback('Arquivo de backup gerado e baixado com sucesso!');
      setTimeout(() => setBackupFeedback(''), 5000);
    } catch (err: any) {
      setBackupError(err?.response?.data?.message || 'Erro ao realizar backup dos dados.');
    } finally {
      setBackupLoading(false);
    }
  }

  function handleTriggerRestore() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      `Deseja realmente restaurar os dados a partir do arquivo "${file.name}"?\n\n` +
      `ATENÇÃO: As tabelas do sistema (alunos, famílias, modalidades, turmas, matrículas e finanças) serão atualizadas com o conteúdo do backup.`
    );

    if (!confirmRestore) return;

    try {
      setBackupLoading(true);
      setBackupError('');
      setBackupFeedback('');

      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await backupService.restoreBackup(parsed);
      const countsStr = res.counts
        ? ` (Alunos: ${res.counts.students}, Modalidades: ${res.counts.modalities}, Turmas: ${res.counts.classes}, Matrículas: ${res.counts.enrollments})`
        : '';

      setBackupFeedback((res.message || 'Backup restaurado com sucesso!') + countsStr);
      await loadSettings();
    } catch (err: any) {
      console.error('Erro na restauração:', err);
      setBackupError(err?.response?.data?.message || 'Arquivo de backup inválido ou falha ao restaurar dados.');
    } finally {
      setBackupLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>
            Gerencie as configurações gerais, parâmetros e segurança do FitFisio.
          </p>
        </div>
      </div>

      {/* SEÇÃO DE BACKUP E RESTAURAÇÃO DE DADOS */}
      <section className="card" style={{ marginBottom: '24px', borderLeft: '4px solid #0d9488' }}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>💾</span>
              Backup e Restauração do Sistema
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Faça cópias de segurança de todas as informações (alunos, famílias, modalidades, turmas, matrículas, pagamentos, configurações e documentos) ou restaure dados salvos.
            </p>
          </div>
        </div>

        {backupFeedback && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid #a7f3d0',
            }}
          >
            ✓ {backupFeedback}
          </div>
        )}

        {backupError && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid #fecaca',
            }}
          >
            ⚠️ {backupError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDoBackup}
            disabled={backupLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span>📥</span>
            {backupLoading ? 'Processando...' : 'Fazer backup'}
          </button>

          <button
            type="button"
            onClick={handleTriggerRestore}
            disabled={backupLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>📤</span>
            {backupLoading ? 'Processando...' : 'Restaurar backup'}
          </button>

          {/* Input oculto para selecionar o arquivo .json de backup */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Formato: arquivo <strong>.json</strong> completo gerado pelo FitFisio.
          </span>
        </div>
      </section>

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