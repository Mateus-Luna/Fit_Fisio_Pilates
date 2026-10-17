
import { useRef, useState } from 'react';
import { backupService } from '../../services/backup.service';

export default function SettingsPage() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState('');
  const [backupError, setBackupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleDoBackup() {
    try {
      setBackupLoading(true);
      setBackupError('');
      setBackupFeedback('');

      await backupService.exportBackup();

      setBackupFeedback('Backup solicitado com sucesso.');
    } catch (err: any) {
      setBackupError(
        err?.response?.data?.message ||
          'Erro ao realizar backup dos dados.',
      );
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

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      `Deseja realmente restaurar os dados a partir de "${file.name}"?\n\n` +
        'A restauração pode substituir dados existentes. Recomendamos fazer um backup antes de continuar.',
    );

    if (!confirmed) return;

    try {
      setBackupLoading(true);
      setBackupError('');
      setBackupFeedback('');

      const backupData: unknown = JSON.parse(await file.text());
      const result = await backupService.restoreBackup(backupData);

      const counts = result.counts
        ? ` (Alunos: ${result.counts.students}, Modalidades: ${result.counts.modalities}, Turmas: ${result.counts.classes}, Matrículas: ${result.counts.enrollments})`
        : '';

      setBackupFeedback(
        (result.message || 'Restauração concluída com sucesso.') + counts,
      );
    } catch (err: any) {
      console.error('Erro na restauração:', err);

      setBackupError(
        err?.response?.data?.message ||
          'Arquivo de backup inválido ou falha ao restaurar os dados.',
      );
    } finally {
      setBackupLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>
            Gerencie o backup e a restauração dos dados do FitFisio.
          </p>
        </div>
      </div>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>💾 Backup e Restauração</h2>
            <p>
              Proteja os dados do sistema criando cópias de segurança ou
              restaurando um backup anterior.
            </p>
          </div>
        </div>

        {backupFeedback && (
          <div className="success-message" role="status">
            ✓ {backupFeedback}
          </div>
        )}

        {backupError && (
          <div className="error-message" role="alert">
            ⚠️ {backupError}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={handleDoBackup}
            disabled={backupLoading}
          >
            {backupLoading ? 'Processando...' : '📥 Fazer backup'}
          </button>

          <button
            type="button"
            onClick={handleTriggerRestore}
            disabled={backupLoading}
          >
            {backupLoading ? 'Processando...' : '📤 Restaurar backup'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <p style={{ fontSize: 13, color: '#64748b', marginTop: 16 }}>
          O arquivo de restauração deve ser um backup JSON compatível com
          o FitFisio. Antes de restaurar, guarde uma cópia dos dados atuais.
        </p>
      </section>
    </div>
  );
}
