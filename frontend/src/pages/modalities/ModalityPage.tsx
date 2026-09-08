import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';
import {
  studentsService,
  type Student,
} from '../../services/students.service';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const MODALITY_ICONS: Record<string, string> = {
  academia: '🏋️',
  hidroginastica: '🏊',
  hidroterapia: '💧',
  'natacao-adulto': '🏊‍♂️',
  'natacao-crianca': '🧒',
  pilates: '🧘',
  fisioterapia: '🩺',
};

export default function ModalityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [modality, setModality] = useState<Modality | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de Edição Direta
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequiresClass, setEditRequiresClass] = useState(false);
  const [editCapacityMode, setEditCapacityMode] = useState<'unlimited' | 'limited'>('unlimited');
  const [editCapacity, setEditCapacity] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [modalitiesData, studentsData] = await Promise.all([
          modalitiesService.findAll(),
          studentsService.findAll(),
        ]);

        const found = modalitiesData.find(
          (item) => slugify(item.name) === slug,
        );

        if (!found) {
          setError('Modalidade não encontrada.');
          return;
        }

        setModality(found);
        setStudents(studentsData);
        initFormValues(found);
      } catch {
        setError('Não foi possível carregar as informações da modalidade.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  function initFormValues(item: Modality) {
    setEditName(item.name || '');
    setEditPrice(String(item.monthlyPrice ?? ''));
    setEditDescription(item.description || '');
    setEditRequiresClass(Boolean(item.requiresClass));
    const hasCap =
      item.capacity !== null &&
      item.capacity !== undefined &&
      Number(item.capacity) > 0;
    setEditCapacityMode(hasCap ? 'limited' : 'unlimited');
    setEditCapacity(hasCap ? String(item.capacity) : '');
    setEditActive(Boolean(item.active));
    setSaveError('');
  }

  function handleStartEditing() {
    if (modality) {
      initFormValues(modality);
    }
    setIsEditing(true);
    setSaveSuccess('');
  }

  function handleCancelEditing() {
    if (modality) {
      initFormValues(modality);
    }
    setIsEditing(false);
    setSaveError('');
    if (searchParams.get('edit')) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }

  async function handleSaveEditing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modality) return;

    if (!editName.trim()) {
      setSaveError('Informe o nome da modalidade.');
      return;
    }

    const price = Number(editPrice);
    if (Number.isNaN(price) || price < 0) {
      setSaveError('Informe um valor mensal válido (maior ou igual a zero).');
      return;
    }

    let parsedCapacity: number | null = null;
    if (editCapacityMode === 'limited') {
      parsedCapacity = Number(editCapacity);
      if (!editCapacity || Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
        setSaveError(
          'Informe um limite de alunos válido (número inteiro maior ou igual a 1).',
        );
        return;
      }
    }

    if (editRequiresClass && (!parsedCapacity || parsedCapacity < 1)) {
      setSaveError(
        'Modalidades que exigem turma fixa necessitam de uma capacidade definida de alunos.',
      );
      return;
    }

    try {
      setSaveLoading(true);
      setSaveError('');

      let updated = await modalitiesService.update(modality.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        monthlyPrice: price,
        requiresClass: editRequiresClass,
        capacity: parsedCapacity,
      });

      if (editActive !== modality.active) {
        if (editActive) {
          updated = await modalitiesService.activate(modality.id);
        } else {
          updated = await modalitiesService.deactivate(modality.id);
        }
      }

      setModality(updated);
      setSaveSuccess('Modalidade atualizada com sucesso!');
      setIsEditing(false);

      if (searchParams.get('edit')) {
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }

      // Se o nome foi alterado e gerou novo slug, atualiza a rota
      const newSlug = slugify(updated.name);
      if (newSlug !== slug) {
        navigate(`/modalities/${newSlug}`, { replace: true });
      }
    } catch (err) {
      console.error('Erro ao salvar modalidade:', err);
      setSaveError('Não foi possível salvar as alterações. Verifique os dados e tente novamente.');
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="modality-detail-container">
        <Link to="/" className="back-nav-link">
          ← Voltar ao Dashboard
        </Link>
        <div className="empty-state">
          <p>Carregando modalidade...</p>
        </div>
      </div>
    );
  }

  if (error || !modality) {
    return (
      <div className="modality-detail-container">
        <Link to="/" className="back-nav-link">
          ← Voltar ao Dashboard
        </Link>
        <div className="empty-state">
          <span>⚠️</span>
          <p>{error || 'Modalidade não encontrada.'}</p>
        </div>
      </div>
    );
  }

  const icon = (slug && MODALITY_ICONS[slug]) || '🏅';

  // Alunos matriculados nesta modalidade
  const enrolledStudents = students.filter((s: Student) => {
    if (!s.active || !s.enrollments) return false;
    return s.enrollments.some(
      (e) =>
        e.status === 'ACTIVE' &&
        (e.modalityId === modality.id ||
          slugify(e.modality?.name || '') === slug),
    );
  });

  return (
    <div className="modality-detail-container">
      <Link to="/" className="back-nav-link">
        ← Voltar ao Dashboard
      </Link>

      <div className="page-header">
        <div>
          <h1>
            {icon} {modality.name}
          </h1>
          <p>{modality.description || 'Modalidade cadastrada no FitFisio.'}</p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEditing}
            className="btn-edit-main"
            id="btn-edit-modality"
          >
            ✏️ Editar modalidade
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancelEditing}
            className="btn-secondary"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="modality-form-alert alert-success">
          <span>✅</span>
          <p>{saveSuccess}</p>
        </div>
      )}

      {isEditing ? (
        <div className="inline-edit-card">
          <div className="inline-edit-card-header">
            <h3>✏️ Editar Informações de {modality.name}</h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Alterações aplicadas diretamente no sistema
            </span>
          </div>

          {saveError && (
            <div className="modality-form-alert alert-error">
              <span>⚠️</span>
              <p>{saveError}</p>
            </div>
          )}

          <form onSubmit={handleSaveEditing} className="modality-edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Nome da modalidade</label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="edit-price">Valor mensal padrão (R$)</label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-active">Status do serviço</label>
                <select
                  id="edit-active"
                  value={editActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditActive(e.target.value === 'active')}
                  className="form-input"
                >
                  <option value="active">● Ativa para matrículas</option>
                  <option value="inactive">○ Inativa / Pausada</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="edit-requires-class">Exige turma e horário fixo?</label>
                <select
                  id="edit-requires-class"
                  value={editRequiresClass ? 'yes' : 'no'}
                  onChange={(e) => {
                    const isYes = e.target.value === 'yes';
                    setEditRequiresClass(isYes);
                    if (isYes && editCapacityMode === 'unlimited') {
                      setEditCapacityMode('limited');
                      if (!editCapacity) setEditCapacity('8');
                    }
                  }}
                  className="form-input"
                >
                  <option value="no">Não (Acesso livre / Horário flexível)</option>
                  <option value="yes">Sim (Aulas em turmas com vagas)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-capacity-mode">Capacidade de alunos</label>
                <select
                  id="edit-capacity-mode"
                  value={editCapacityMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'unlimited' | 'limited';
                    setEditCapacityMode(mode);
                    if (mode === 'unlimited') {
                      setEditCapacity('');
                      if (editRequiresClass) {
                        setEditRequiresClass(false);
                      }
                    } else if (!editCapacity) {
                      setEditCapacity('8');
                    }
                  }}
                  className="form-input"
                >
                  <option value="unlimited">Sem limite fixo de turma</option>
                  <option value="limited">Definir limite de alunos (1, 2, 3...)</option>
                </select>
              </div>
            </div>

            {editCapacityMode === 'limited' && (
              <div className="form-group" style={{ marginTop: '-4px' }}>
                <label htmlFor="edit-capacity">
                  Quantidade máxima de alunos {editRequiresClass ? 'por turma' : '(limite geral)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="edit-capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    required
                    placeholder="Ex.: 8"
                    className="form-input"
                    style={{ maxWidth: '180px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>
                    alunos {editRequiresClass ? 'por turma/horário' : 'simultâneos ou cadastrados'}
                  </span>
                </div>
              </div>
            )}

            {editRequiresClass && (
              <div className="capacity-tip-box">
                💡 <strong>Regra recomendada:</strong> Máximo de 8 alunos para
                turmas de Natação e Hidroginástica; máximo de 5 alunos para
                Hidroterapia.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-desc">Descrição e observações</label>
              <textarea
                id="edit-desc"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descreva detalhes, objetivos ou regras desta modalidade..."
                className="form-textarea"
              />
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="btn-secondary"
                disabled={saveLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saveLoading}
              >
                {saveLoading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="modality-detail-card">
          <div className="modality-meta-grid">
            <div className="modality-meta-item">
              <strong>Valor Mensal</strong>
              <span>{formatCurrency(modality.monthlyPrice)}</span>
            </div>

            <div className="modality-meta-item">
              <strong>Status do Serviço</strong>
              <span
                style={{
                  color: modality.active ? '#059669' : '#dc2626',
                }}
              >
                {modality.active ? '● Ativa para matrículas' : '○ Inativa'}
              </span>
            </div>

            <div className="modality-meta-item">
              <strong>Controle de Turma</strong>
              <span>{modality.requiresClass ? 'Sim (Horários)' : 'Livre'}</span>
            </div>

            <div className="modality-meta-item">
              <strong>Capacidade Máxima</strong>
              <span>
                {modality.capacity
                  ? `Até ${modality.capacity} alunos${modality.requiresClass ? '/turma' : ''}`
                  : 'Sem limite fixo de turma'}
              </span>
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Alunos com Matrícula Ativa ({enrolledStudents.length})
            </h3>

            {enrolledStudents.length === 0 ? (
              <div
                style={{
                  background: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontSize: '13px',
                }}
              >
                Nenhum aluno cadastrado com matrícula ativa nesta modalidade no
                momento.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {enrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px' }}>
                        {student.name}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Telefone: {student.phone} •{' '}
                        {student.type === 'CHILD' ? 'Criança' : 'Adulto'}
                      </span>
                    </div>

                    <Link
                      to="/students"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#4f46e5',
                        textDecoration: 'none',
                      }}
                    >
                      Ver aluno →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}