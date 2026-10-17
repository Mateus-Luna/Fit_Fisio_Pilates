import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  classesService,
  type Class,
  type ClassSchedule,
} from '../../services/classes.service';
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

  // Estados para Horários / Turmas
  const [classes, setClasses] = useState<Class[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleCapacity, setScheduleCapacity] = useState('');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1);
  const [scheduleStartTime, setScheduleStartTime] = useState('08:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('08:50');
  const [scheduleActive, setScheduleActive] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleFeedback, setScheduleFeedback] = useState('');

  const SCHEDULE_MODALITY_SLUGS = [
    'hidroginastica',
    'hidroterapia',
    'natacao-adulto',
    'natacao-crianca',
    'fisioterapia',
  ];

  const allowsSchedules = Boolean(
    modality?.requiresClass ||
      (slug && SCHEDULE_MODALITY_SLUGS.includes(slug)) ||
      (modality && SCHEDULE_MODALITY_SLUGS.includes(slugify(modality.name)))
  );

  async function reloadClasses(modalityId: string) {
    try {
      const data = await classesService.findAll(modalityId);
      setClasses(data);
    } catch (e) {
      console.error('Erro ao recarregar turmas:', e);
    }
  }

  function handleOpenCreateSchedule() {
    setEditingClass(null);
    setScheduleName('');
    setScheduleCapacity(modality?.capacity ? String(modality.capacity) : '8');
    setScheduleDayOfWeek(1);
    setScheduleStartTime('08:00');
    setScheduleEndTime('08:50');
    setScheduleActive(true);
    setScheduleError('');
    setIsScheduleModalOpen(true);
  }

  function handleOpenEditSchedule(c: Class) {
    setEditingClass(c);
    setScheduleName(c.name);
    setScheduleCapacity(c.capacity ? String(c.capacity) : '');
    const firstSched = c.schedules && c.schedules[0];
    setScheduleDayOfWeek(firstSched ? firstSched.dayOfWeek : 1);
    setScheduleStartTime(firstSched ? firstSched.startTime : '08:00');
    setScheduleEndTime(firstSched ? firstSched.endTime : '08:50');
    setScheduleActive(c.active);
    setScheduleError('');
    setIsScheduleModalOpen(true);
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!modality) return;

    if (!scheduleName.trim()) {
      setScheduleError('Informe a identificação da turma ou horário.');
      return;
    }

    if (!scheduleStartTime || !scheduleEndTime) {
      setScheduleError('Informe os horários de início e término.');
      return;
    }

    if (scheduleStartTime >= scheduleEndTime) {
      setScheduleError('O horário de início deve ser anterior ao de término.');
      return;
    }

    const capNum = scheduleCapacity ? Number(scheduleCapacity) : null;
    if (capNum && capNum < 1) {
      setScheduleError('A capacidade de alunos deve ser pelo menos 1.');
      return;
    }

    if (modality.capacity && capNum && capNum > modality.capacity) {
      setScheduleError(
        `A capacidade (${capNum}) não pode ultrapassar o limite configurado na modalidade (${modality.capacity}).`
      );
      return;
    }

    // Verificar conflito de horários com outras turmas desta modalidade
    const otherClasses = classes.filter((c) => c.id !== editingClass?.id && c.active);
    const hasConflict = otherClasses.some((c) =>
      (c.schedules || []).some(
        (s) =>
          s.dayOfWeek === scheduleDayOfWeek &&
          scheduleStartTime < s.endTime &&
          scheduleEndTime > s.startTime
      )
    );
    if (hasConflict) {
      const confirmConflict = window.confirm(
        'Atenção: Já existe outro horário cadastrado para este mesmo dia da semana e faixa horária. Deseja prosseguir mesmo assim?'
      );
      if (!confirmConflict) return;
    }

    try {
      setScheduleLoading(true);
      setScheduleError('');

      const schedulesPayload: ClassSchedule[] = [
        {
          dayOfWeek: scheduleDayOfWeek,
          startTime: scheduleStartTime,
          endTime: scheduleEndTime,
        },
      ];

      if (editingClass) {
        await classesService.update(editingClass.id, {
          name: scheduleName.trim(),
          capacity: capNum,
          schedules: schedulesPayload,
          active: scheduleActive,
        });
        setScheduleFeedback('Horário atualizado com sucesso!');
      } else {
        await classesService.create({
          name: scheduleName.trim(),
          modalityId: modality.id,
          capacity: capNum,
          schedules: schedulesPayload,
          active: scheduleActive,
        });
        setScheduleFeedback('Horário cadastrado com sucesso!');
      }

      setIsScheduleModalOpen(false);
      await reloadClasses(modality.id);
      setTimeout(() => setScheduleFeedback(''), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setScheduleError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao salvar horário.'));
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleToggleActiveClass(c: Class) {
    if (!modality) return;
    try {
      await classesService.update(c.id, { active: !c.active });
      await reloadClasses(modality.id);
      setScheduleFeedback(`Horário ${!c.active ? 'ativado' : 'desativado'} com sucesso.`);
      setTimeout(() => setScheduleFeedback(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao alterar status do horário.');
    }
  }

  async function handleDeleteClass(c: Class) {
    if (!modality) return;
    if (c.enrolledCount && c.enrolledCount > 0) {
      alert(
        `Não é possível excluir esta turma/horário pois existem ${c.enrolledCount} aluno(s) vinculados a ela.`
      );
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a turma/horário "${c.name}"?`)) {
      return;
    }

    try {
      await classesService.remove(c.id);
      await reloadClasses(modality.id);
      setScheduleFeedback('Horário excluído com sucesso.');
      setTimeout(() => setScheduleFeedback(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao excluir horário.');
    }
  }

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

        try {
          const classesData = await classesService.findAll(found.id);
          setClasses(classesData);
        } catch {
          setClasses([]);
        }
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

  // Alunos matriculados nesta modalidade (qualquer status de matrícula relevante)
  const modalityEnrollments = students.flatMap((s: Student) => {
    if (!s.enrollments) return [];
    return s.enrollments
      .filter(
        (e) =>
          e.status !== 'CANCELLED' &&
          (e.modalityId === modality.id ||
            slugify(e.modality?.name || '') === slug),
      )
      .map((e) => ({
        student: s,
        enrollment: e,
      }));
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

          {/* Seção de Gerenciamento de Horários e Turmas (Exclusiva para modalidades com horários) */}
          {allowsSchedules && (
            <div
              style={{
                marginBottom: '28px',
                padding: '20px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      margin: 0,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>📅</span>
                    Horários e Turmas Disponíveis ({classes.length})
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Cadastre e organize as faixas de horário e turmas específicas para {modality.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateSchedule}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#0d9488',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  + Novo Horário / Turma
                </button>
              </div>

              {scheduleFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: '1px solid #a7f3d0',
                  }}
                >
                  ✓ {scheduleFeedback}
                </div>
              )}

              {classes.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '24px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#334155' }}>
                    Nenhum horário cadastrado para esta modalidade.
                  </p>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    Clique no botão acima para adicionar turmas com dia da semana, faixa de horário e capacidade.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {classes.map((cls) => {
                    const sched = cls.schedules && cls.schedules[0];
                    const dayName = sched ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][sched.dayOfWeek] : 'Dia flexível';
                    const timeRange = sched ? `${sched.startTime} - ${sched.endTime}` : 'Sem horário fixo';
                    const isFull = cls.capacity ? (cls.enrolledCount || 0) >= cls.capacity : false;

                    return (
                      <div
                        key={cls.id}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          border: cls.active ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                          background: cls.active ? '#f8fafc' : '#f1f5f9',
                          opacity: cls.active ? 1 : 0.75,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                              {cls.name}
                            </strong>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: cls.active ? '#dcfce7' : '#f1f5f9',
                                color: cls.active ? '#166534' : '#64748b',
                                border: `1px solid ${cls.active ? '#bbf7d0' : '#e2e8f0'}`,
                              }}
                            >
                              {cls.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: '#0d9488' }}>{dayName}</span> • {timeRange}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>Vagas: </span>
                              <strong style={{ color: isFull ? '#dc2626' : '#15803d' }}>
                                {cls.enrolledCount || 0} / {cls.capacity || 'Ilimitado'}
                              </strong>
                              {isFull && (
                                <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                  Esgotado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActiveClass(cls)}
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            {cls.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSchedule(cls)}
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #0d9488',
                              background: '#f0fdfa',
                              color: '#0d9488',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls)}
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                            title={cls.enrolledCount && cls.enrolledCount > 0 ? 'Não é possível excluir com alunos vinculados' : 'Excluir horário'}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#1e293b',
                }}
              >
                Alunos Matriculados nesta Modalidade ({modalityEnrollments.length})
              </h3>

              <Link
                to={`/enrollments/new?modalityId=${modality.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#0d9488',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                + Matricular Aluno nesta Modalidade
              </Link>
            </div>

            {modalityEnrollments.length === 0 ? (
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
                Nenhum aluno matriculado nesta modalidade no momento.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {modalityEnrollments.map(({ student, enrollment }) => {
                  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                    ACTIVE: { bg: '#dcfce7', text: '#166534', label: 'Homologada / Ativa' },
                    AWAITING_APPROVAL: { bg: '#dbeafe', text: '#1e40af', label: 'Aguardando Homologação' },
                    PENDING_DOCUMENTATION: { bg: '#fef3c7', text: '#92400e', label: 'Pendente Documentos' },
                    SUSPENDED: { bg: '#f3e8ff', text: '#6b21a8', label: 'Suspensa' },
                  };
                  const badge = statusColors[enrollment.status] || {
                    bg: '#f1f5f9',
                    text: '#475569',
                    label: enrollment.status,
                  };

                  return (
                    <div
                      key={enrollment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                            {student.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.text,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Telefone: {student.phone} •{' '}
                          {student.type === 'CHILD' ? 'Criança' : 'Adulto'}
                          {enrollment.finalPrice ? ` • Mensalidade: R$ ${Number(enrollment.finalPrice).toFixed(2)}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Link
                          to={`/enrollments/${enrollment.id}`}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#0d9488',
                            textDecoration: 'none',
                          }}
                        >
                          Ver Matrícula & Recibo →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Horário */}
      {isScheduleModalOpen && modality && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {editingClass ? 'Editar Horário / Turma' : `Novo Horário para ${modality.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div style={{ padding: '8px 12px', marginBottom: '14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px' }}>
                ⚠️ {scheduleError}
              </div>
            )}

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Identificação da Turma ou Horário *
                </label>
                <input
                  type="text"
                  required
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Ex: Turma Manhã 1, Natação Adulto Ter/Qui 07:00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Dia da Semana *
                  </label>
                  <select
                    value={scheduleDayOfWeek}
                    onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Capacidade de Alunos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={modality.capacity || undefined}
                    value={scheduleCapacity}
                    onChange={(e) => setScheduleCapacity(e.target.value)}
                    placeholder={modality.capacity ? `Máx: ${modality.capacity}` : 'Ex: 8'}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {modality.capacity && (
                    <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Limite da modalidade: {modality.capacity} alunos
                    </small>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={scheduleActive}
                    onChange={(e) => setScheduleActive(e.target.checked)}
                  />
                  <span>Horário ativo para novas matrículas</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={scheduleLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {scheduleLoading ? 'Salvando...' : 'Salvar Horário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}