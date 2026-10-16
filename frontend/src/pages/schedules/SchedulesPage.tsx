import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  classesService,
  type Class,
} from '../../services/classes.service';
import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';
import {
  studentsService,
  type Student,
} from '../../services/students.service';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Segunda-feira', short: 'Seg' },
  { day: 2, name: 'Terça-feira', short: 'Ter' },
  { day: 3, name: 'Quarta-feira', short: 'Qua' },
  { day: 4, name: 'Quinta-feira', short: 'Qui' },
  { day: 5, name: 'Sexta-feira', short: 'Sex' },
  { day: 6, name: 'Sábado', short: 'Sáb' },
];

const TIME_SLOTS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

const MODALITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hidroginastica: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  hidroterapia: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'natacao-adulto': { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
  'natacao-crianca': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  fisioterapia: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  pilates: { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
  academia: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SchedulesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modos de visualização: Grade Semanal ou Dia Específico
  const [viewMode, setViewMode] = useState<'WEEK' | 'DAY'>('WEEK');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedModalityId, setSelectedModalityId] = useState<string>('ALL');

  // Modal de Detalhes da Turma no Calendário
  const [activeModalClass, setActiveModalClass] = useState<Class | null>(null);

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
      setError('Não foi possível carregar os horários cadastrados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = classes.filter((c) => {
    if (selectedModalityId !== 'ALL' && c.modalityId !== selectedModalityId) {
      return false;
    }
    return true;
  });

  // Encontrar turmas em um dia e horário específico
  function getClassesForSlot(dayOfWeek: number, slotHour: string): Class[] {
    const slotH = parseInt(slotHour.split(':')[0], 10);

    return filteredClasses.filter((c) => {
      return (c.schedules || []).some((s) => {
        if (s.dayOfWeek !== dayOfWeek) return false;
        const startH = parseInt(s.startTime.split(':')[0], 10);
        return startH === slotH;
      });
    });
  }

  return (
    <div className="page" id="schedules-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
            Grade de Horários
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Visualização em calendário dos horários cadastrados, turmas e controle de ocupação.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to="/classes"
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
            <span>👥</span>
            Gerenciar Turmas
          </Link>

          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Atualizar grade"
          >
            ↻ Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Barra de Controles e Filtros do Calendário */}
      <div
        style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: viewMode === 'WEEK' ? '#0d9488' : 'transparent',
                color: viewMode === 'WEEK' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Semana Completa
            </button>

            <button
              type="button"
              onClick={() => setViewMode('DAY')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: viewMode === 'DAY' ? '#0d9488' : 'transparent',
                color: viewMode === 'DAY' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Visão por Dia
            </button>
          </div>

          {viewMode === 'DAY' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selectedDay === d.day ? '1px solid #0d9488' : '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: selectedDay === d.day ? 700 : 500,
                    backgroundColor: selectedDay === d.day ? '#f0fdfa' : '#ffffff',
                    color: selectedDay === d.day ? '#0d9488' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {d.short}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Modalidade:
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
            <option value="ALL">Todas ({classes.length} turmas)</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Carregando calendário de horários...
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflowX: 'auto',
          }}
        >
          {viewMode === 'WEEK' ? (
            /* TABELA SEMANA COMPLETA */
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                    Horário
                  </th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th
                      key={d.day}
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1e293b',
                        borderLeft: '1px solid #e2e8f0',
                      }}
                    >
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#64748b',
                        background: '#fafafa',
                        verticalAlign: 'top',
                      }}
                    >
                      {slot}
                    </td>

                    {DAYS_OF_WEEK.map((d) => {
                      const slotClasses = getClassesForSlot(d.day, slot);

                      return (
                        <td
                          key={d.day}
                          style={{
                            padding: '8px',
                            borderLeft: '1px solid #f1f5f9',
                            verticalAlign: 'top',
                            minHeight: '65px',
                            background: slotClasses.length > 0 ? '#fafafa' : '#ffffff',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {slotClasses.map((cls) => {
                              const modSlug = slugify(cls.modality?.name || '');
                              const styleColor = MODALITY_COLORS[modSlug] || {
                                bg: '#f1f5f9',
                                text: '#334155',
                                border: '#cbd5e1',
                              };
                              const sched = cls.schedules?.find((s) => s.dayOfWeek === d.day);
                              const isFull = cls.capacity ? (cls.enrolledCount || 0) >= cls.capacity : false;

                              return (
                                <div
                                  key={cls.id}
                                  onClick={() => setActiveModalClass(cls)}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: styleColor.bg,
                                    border: `1px solid ${styleColor.border}`,
                                    color: styleColor.text,
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  }}
                                  title="Clique para ver detalhes e alunos"
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                                      {cls.modality?.name}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: 600 }}>
                                      {sched ? `${sched.startTime}-${sched.endTime}` : slot}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                                    {cls.name}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: isFull ? '#dc2626' : '#059669' }}>
                                      {cls.enrolledCount || 0}/{cls.capacity || '∞'} vagas
                                    </span>
                                    {isFull && (
                                      <span style={{ fontSize: '9px', fontWeight: 800, background: '#fee2e2', color: '#b91c1c', padding: '1px 4px', borderRadius: '3px' }}>
                                        Esgotada
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* VISÃO POR DIA ESPECÍFICO */
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                  {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.name}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {classes.filter((c) => (c.schedules || []).some((s) => s.dayOfWeek === selectedDay)).length} turmas programadas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {TIME_SLOTS.map((slot) => {
                  const slotClasses = getClassesForSlot(selectedDay, slot);
                  if (slotClasses.length === 0) return null;

                  return (
                    <div
                      key={slot}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ width: '70px', fontWeight: 700, fontSize: '14px', color: '#0d9488' }}>
                        {slot}
                      </div>

                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                        {slotClasses.map((cls) => {
                          const modSlug = slugify(cls.modality?.name || '');
                          const styleColor = MODALITY_COLORS[modSlug] || {
                            bg: '#ffffff',
                            text: '#334155',
                            border: '#cbd5e1',
                          };
                          const sched = cls.schedules?.find((s) => s.dayOfWeek === selectedDay);
                          const isFull = cls.capacity ? (cls.enrolledCount || 0) >= cls.capacity : false;

                          return (
                            <div
                              key={cls.id}
                              onClick={() => setActiveModalClass(cls)}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '8px',
                                background: '#ffffff',
                                border: `1px solid ${styleColor.border}`,
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: styleColor.text,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {cls.modality?.name}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                                  {sched ? `${sched.startTime} às ${sched.endTime}` : slot}
                                </span>
                              </div>

                              <h4 style={{ margin: '4px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                                {cls.name}
                              </h4>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontSize: '12px', color: isFull ? '#dc2626' : '#15803d', fontWeight: 600 }}>
                                  {cls.enrolledCount || 0} de {cls.capacity || '∞'} vagas ocupadas
                                </span>
                                {isFull && (
                                  <span style={{ fontSize: '10px', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px' }}>
                                    Esgotada
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {TIME_SLOTS.every((slot) => getClassesForSlot(selectedDay, slot).length === 0) && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                    Nenhum horário cadastrado para este dia da semana.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALHES DA TURMA SELECIONADA NO CALENDÁRIO */}
      {activeModalClass && (
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
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase' }}>
                  {activeModalClass.modality?.name}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                  {activeModalClass.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalClass(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155', background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <strong>Horários Cadastrados: </strong>
                {activeModalClass.schedules?.map((s) => (
                  <span key={s.dayOfWeek + s.startTime} style={{ marginLeft: '4px' }}>
                    {DAYS_OF_WEEK.find((d) => d.day === s.dayOfWeek)?.name || 'Dia'} ({s.startTime} - {s.endTime})
                  </span>
                ))}
              </div>
              <div>
                <strong>Capacidade: </strong>
                <span>{activeModalClass.capacity ? `${activeModalClass.capacity} alunos` : 'Sem limite'}</span>
              </div>
              <div>
                <strong>Ocupação Atual: </strong>
                <span style={{ fontWeight: 700, color: (activeModalClass.enrolledCount || 0) >= (activeModalClass.capacity || 999) ? '#dc2626' : '#15803d' }}>
                  {activeModalClass.enrolledCount || 0} alunos vinculados
                </span>
              </div>
            </div>

            {/* Lista de Alunos nesta Turma */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                Alunos Matriculados nesta Turma:
              </h4>

              {(() => {
                const enrolled = students.filter((s) =>
                  (s.enrollments || []).some(
                    (e) =>
                      e.classId === activeModalClass.id &&
                      ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status)
                  )
                );

                if (enrolled.length === 0) {
                  return (
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Nenhum aluno matriculado nesta turma até o momento.
                    </p>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {enrolled.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{st.name}</span>
                        <span style={{ color: '#64748b' }}>{st.phone}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link
                to={`/enrollments/new?modalityId=${activeModalClass.modalityId}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                + Matricular Aluno
              </Link>

              <button
                type="button"
                onClick={() => setActiveModalClass(null)}
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
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
