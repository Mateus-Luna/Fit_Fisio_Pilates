import React, { useEffect, useState } from 'react';
import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';

interface ModalityEditModalProps {
  modality: Modality | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Modality) => void;
}

export function ModalityEditModal({
  modality,
  isOpen,
  onClose,
  onSuccess,
}: ModalityEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [requiresClass, setRequiresClass] = useState(false);
  const [capacityMode, setCapacityMode] = useState<'unlimited' | 'limited'>('unlimited');
  const [capacity, setCapacity] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (modality) {
      setName(modality.name || '');
      setDescription(modality.description || '');
      setMonthlyPrice(String(modality.monthlyPrice ?? ''));
      setRequiresClass(Boolean(modality.requiresClass));
      const hasCap =
        modality.capacity !== null &&
        modality.capacity !== undefined &&
        Number(modality.capacity) > 0;
      setCapacityMode(hasCap ? 'limited' : 'unlimited');
      setCapacity(hasCap ? String(modality.capacity) : '');
      setActive(Boolean(modality.active));
      setError('');
      setSuccessMsg('');
    }
  }, [modality, isOpen]);

  if (!isOpen || !modality) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modality) return;

    if (!name.trim()) {
      setError('Informe o nome da modalidade.');
      return;
    }

    const price = Number(monthlyPrice);
    if (Number.isNaN(price) || price < 0) {
      setError('Informe um valor mensal válido (maior ou igual a zero).');
      return;
    }

    let parsedCapacity: number | null = null;
    if (capacityMode === 'limited') {
      parsedCapacity = Number(capacity);
      if (!capacity || Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
        setError(
          'Informe um limite de alunos válido (número inteiro maior ou igual a 1).',
        );
        return;
      }
    }

    if (requiresClass && (!parsedCapacity || parsedCapacity < 1)) {
      setError(
        'Modalidades que exigem turma fixa necessitam de uma capacidade definida de alunos.',
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      let updated = await modalitiesService.update(modality.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        monthlyPrice: price,
        requiresClass,
        capacity: parsedCapacity,
      });

      // Se o status ativo/inativo mudou
      if (active !== modality.active) {
        if (active) {
          updated = await modalitiesService.activate(modality.id);
        } else {
          updated = await modalitiesService.deactivate(modality.id);
        }
      }

      setSuccessMsg('Informações da modalidade atualizadas com sucesso!');
      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error('Erro ao salvar modalidade:', err);
      setError('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modality-modal-overlay" onClick={onClose}>
      <div
        className="modality-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modality-modal-header">
          <div>
            <h2 id="modal-title">Editar Modalidade</h2>
            <p>Atualize as informações diretamente sem sair desta tela.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="modality-form-alert alert-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="modality-form-alert alert-success">
            <span>✅</span>
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modality-edit-form">
          <div className="form-group">
            <label htmlFor="modality-name">Nome da modalidade</label>
            <input
              id="modality-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Academia, Hidroginástica..."
              required
              className="form-input"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="modality-price">Valor da mensalidade (R$)</label>
              <input
                id="modality-price"
                type="number"
                step="0.01"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="0,00"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="modality-active">Status do serviço</label>
              <select
                id="modality-active"
                value={active ? 'active' : 'inactive'}
                onChange={(e) => setActive(e.target.value === 'active')}
                className="form-input"
              >
                <option value="active">● Ativa para matrículas</option>
                <option value="inactive">○ Inativa / Pausada</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="modality-requires-class">Exige turma e horário fixo?</label>
              <select
                id="modality-requires-class"
                value={requiresClass ? 'yes' : 'no'}
                onChange={(e) => {
                  const isYes = e.target.value === 'yes';
                  setRequiresClass(isYes);
                  if (isYes && capacityMode === 'unlimited') {
                    setCapacityMode('limited');
                    if (!capacity) setCapacity('8');
                  }
                }}
                className="form-input"
              >
                <option value="no">Não (Acesso livre / Horário flexível)</option>
                <option value="yes">Sim (Aulas em turmas com vagas)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modality-capacity-mode">Capacidade de alunos</label>
              <select
                id="modality-capacity-mode"
                value={capacityMode}
                onChange={(e) => {
                  const mode = e.target.value as 'unlimited' | 'limited';
                  setCapacityMode(mode);
                  if (mode === 'unlimited') {
                    setCapacity('');
                    if (requiresClass) {
                      setRequiresClass(false);
                    }
                  } else if (!capacity) {
                    setCapacity('8');
                  }
                }}
                className="form-input"
              >
                <option value="unlimited">Sem limite fixo de turma</option>
                <option value="limited">Definir limite de alunos (1, 2, 3...)</option>
              </select>
            </div>
          </div>

          {capacityMode === 'limited' && (
            <div className="form-group" style={{ marginTop: '-4px' }}>
              <label htmlFor="modality-capacity">
                Quantidade máxima de alunos {requiresClass ? 'por turma' : '(limite geral)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="modality-capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Ex.: 8"
                  className="form-input"
                  style={{ maxWidth: '180px' }}
                  required
                />
                <span style={{ fontSize: '13px', color: '#4b5563' }}>
                  alunos {requiresClass ? 'por turma/horário' : 'simultâneos ou cadastrados'}
                </span>
              </div>
            </div>
          )}

          {requiresClass && (
            <div className="capacity-tip-box">
              💡 <strong>Regra de capacidade:</strong> Máximo de 8 alunos para
              turmas de Natação e Hidroginástica; máximo de 5 alunos para
              Hidroterapia.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="modality-desc">Descrição e observações</label>
            <textarea
              id="modality-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito da modalidade, público-alvo ou detalhes de funcionamento..."
              className="form-textarea"
            />
          </div>

          <div className="modal-actions-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
