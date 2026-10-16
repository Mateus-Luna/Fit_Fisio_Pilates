import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedModalityId, setSelectedModalityId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Modal de Criação / Edição de Turma
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formName, setFormName] = useState('');
  const [formModalityId, setFormModalityId] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('08:50');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [classesData, modalitiesData, studentsData] = await Promise.all([
        classesService.findAll(),
        modalitiesService.findAll(),
        studentsService.findAll(),
      ]);
      setClasses(classesData);
      setModalities(modalitiesData);
      setStudents(studentsData);
    } catch {
      setError('Não foi possível carregar as turmas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setEditingClass(null);
    setFormName('');
    const firstMod = modalities[0];
    setFormModalityId(firstMod ? firstMod.id : '');
    setFormCapacity(firstMod?.capacity ? String(firstMod.capacity) : '8');
    setFormDayOfWeek(1);
    setFormStartTime('08:00');
    setFormEndTime('08:50');
    setFormActive(true);
    setFormError('');
    setIsModalOpen(true);
  }

  function handleOpenEdit(c: Class) {
    setEditingClass(c);
    setFormName(c.name);
    setFormModalityId(c.modalityId);
    setFormCapacity(c.capacity ? String(c.capacity) : '');
    const firstSched = c.schedules && c.schedules[0];
    setFormDayOfWeek(firstSched ? firstSched.dayOfWeek : 1);
    setFormStartTime(firstSched ? firstSched.startTime : '08:00');
    setFormEndTime(firstSched ? firstSched.endTime : '08:50');
    setFormActive(c.active);
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Informe o nome da turma.');
      return;
    }
    if (!formModalityId) {
      setFormError('Selecione a modalidade da turma.');
      return;
    }
    if (!formStartTime || !formEndTime) {
      setFormError('Informe os horários de início e término.');
      return;
    }
    if (formStartTime >= formEndTime) {
      setFormError('O horário de início deve ser anterior ao de término.');
      return;
    }

    const selectedMod = modalities.find((m) => m.id === formModalityId);
    const capNum = formCapacity ? Number(formCapacity) : null;
    if (capNum && capNum < 1) {
      setFormError('A capacidade de alunos deve ser pelo menos 1.');
      return;
    }
    if (selectedMod?.capacity && capNum && capNum > selectedMod.capacity) {
      setFormError(
        `A capacidade (${capNum}) não pode exceder o limite da modalidade (${selectedMod.capacity}).`
      );
      return;
    }

    try {
      setFormSaving(true);
      setFormError('');

      const schedulesPayload: ClassSchedule[] = [
        {
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
        },
      ];

      if (editingClass) {
        await classesService.update(editingClass.id, {
          name: formName.trim(),
          modalityId: formModalityId,
          capacity: capNum,
          schedules: schedulesPayload,
          active: formActive,
        });
        setFeedback('Turma atualizada com sucesso!');
      } else {
        await classesService.create({
          name: formName.trim(),
          modalityId: formModalityId,
          capacity: capNum,
          schedules: schedulesPayload,
          active: formActive,
        });
        setFeedback('Turma cadastrada com sucesso!');
      }

      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Erro ao salvar turma.');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(c: Class) {
    if (c.enrolledCount && c.enrolledCount > 0) {
      alert(`Não é possível excluir esta turma pois existem ${c.enrolledCount} aluno(s) vinculados a ela.`);
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a turma "${c.name}"?`)) {
      return;
    }

    try {
      await classesService.remove(c.id);
      setFeedback('Turma excluída com sucesso.');
      await loadData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao excluir turma.');
    }
  }

  async function handleToggleActive(c: Class) {
    try {
      await classesService.update(c.id, { active: !c.active });
      setFeedback(`Turma ${!c.active ? 'ativada' : 'desativada'} com sucesso.`);
      await loadData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao alterar status da turma.');
    }
  }

  const filteredClasses = classes.filter((c) => {
    if (selectedModalityId !== 'ALL' && c.modalityId !== selectedModalityId) {
      return false;
    }
    return true;
  });

  return (
    <div className="page" id="classes-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
            Turmas
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Gerencie as turmas, capacidades configuradas e alunos vinculados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/schedules"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>📅</span>
            Ver Grade de Horários
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>+</span>
            Nova Turma
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #a7f3d0',
          }}
        >
          ✓ {feedback}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Filtro por Modalidade */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
          Filtrar por Modalidade:
        </span>
        <select
          value={selectedModalityId}
          onChange={(e) => setSelectedModalityId(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            background: '#ffffff',
            color: '#334155',
          }}
        >
          <option value="ALL">Todas as modalidades ({classes.length})</option>
          {modalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Carregando turmas...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
            Nenhuma turma encontrada.
          </p>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Clique no botão "+ Nova Turma" para cadastrar turmas e vincular seus horários.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredClasses.map((cls) => {
            const isFull = cls.capacity ? (cls.enrolledCount || 0) >= cls.capacity : false;
            const sched = cls.schedules && cls.schedules[0];
            const dayName = sched ? DAY_NAMES[sched.dayOfWeek] : 'Dia flexível';
            const timeRange = sched ? `${sched.startTime} - ${sched.endTime}` : 'Sem horário fixo';

            // Alunos desta turma
            const enrolledStudents = students.filter((s) =>
              (s.enrollments || []).some(
                (e) =>
                  e.classId === cls.id &&
                  ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status)
              )
            );

            return (
              <div
                key={cls.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: cls.active ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  opacity: cls.active ? 1 : 0.8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#0d9488',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {cls.modality?.name || 'Modalidade'}
                      </span>
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        {cls.name}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: cls.active ? '#dcfce7' : '#f1f5f9',
                        color: cls.active ? '#166534' : '#64748b',
                        border: `1px solid ${cls.active ? '#bbf7d0' : '#e2e8f0'}`,
                      }}
                    >
                      {cls.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📅</span>
                      <strong style={{ color: '#0d9488' }}>{dayName}</strong>
                      <span>• {timeRange}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Ocupação:</span>
                      <strong style={{ fontSize: '13px', color: isFull ? '#dc2626' : '#15803d' }}>
                        {cls.enrolledCount || 0} / {cls.capacity || 'Ilimitado'} alunos
                      </strong>
                      {isFull && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#dc2626',
                            background: '#fee2e2',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Sem Vagas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview de Alunos Matriculados */}
                  {enrolledStudents.length > 0 && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Alunos Vinculados ({enrolledStudents.length}):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {enrolledStudents.slice(0, 4).map((s) => (
                          <span
                            key={s.id}
                            style={{
                              fontSize: '11px',
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                        {enrolledStudents.length > 4 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', padding: '2px 4px' }}>
                            +{enrolledStudents.length - 4} outros
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '12px',
                    marginTop: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cls)}
                    style={{
                      fontSize: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {cls.active ? 'Desativar' : 'Ativar'}
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cls)}
                      style={{
                        fontSize: '12px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #0d9488',
                        background: '#f0fdfa',
                        color: '#0d9488',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(cls)}
                      style={{
                        fontSize: '12px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                      title={cls.enrolledCount && cls.enrolledCount > 0 ? 'Não é possível excluir com alunos vinculados' : 'Excluir turma'}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Turma */}
      {isModalOpen && (
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {editingClass ? 'Editar Turma' : 'Cadastrar Nova Turma'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '8px 12px', marginBottom: '14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Identificação da Turma *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Hidro Manhã 1, Natação Adulto Noite"
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
                    Modalidade *
                  </label>
                  <select
                    value={formModalityId}
                    onChange={(e) => {
                      setFormModalityId(e.target.value);
                      const mod = modalities.find((m) => m.id === e.target.value);
                      if (mod?.capacity) setFormCapacity(String(mod.capacity));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {modalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Capacidade de Alunos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="Ex: 8"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Dia da Semana *
                  </label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value={1}>Segunda</option>
                    <option value={2}>Terça</option>
                    <option value={3}>Quarta</option>
                    <option value={4}>Quinta</option>
                    <option value={5}>Sexta</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 8px',
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
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  <span>Turma ativa para novas matrículas</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSaving}
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
                  disabled={formSaving}
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
                  {formSaving ? 'Salvando...' : 'Salvar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
