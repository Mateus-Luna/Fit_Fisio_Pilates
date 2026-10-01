import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';
import {
  studentsService,
  type Student,
} from '../../services/students.service';
import {
  notificationsService,
  type AppNotification,
} from '../../services/notifications.service';
import {
  paymentsService,
  type Payment,
} from '../../services/payments.service';
import { ModalityEditModal } from '../../components/modalities/ModalityEditModal';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface ModalityCardConfig {
  key: string;
  name: string;
  slug: string;
  route: string;
  icon: string;
  badge: string;
  defaultDescription: string;
  accentClass: string;
  highlightLimit: string;
  fallbackPrice: number;
}

const MODALITY_CONFIGS: ModalityCardConfig[] = [
  {
    key: 'academia',
    name: 'Academia',
    slug: 'academia',
    route: '/modalities/academia',
    icon: '🏋️',
    badge: 'Musculação Livre',
    defaultDescription:
      'Musculação e treino funcional assistido. Acesso livre sem restrição de turmas.',
    accentClass: 'mod-card-academia',
    highlightLimit: 'Sem limite de vagas',
    fallbackPrice: 140,
  },
  {
    key: 'hidroginastica',
    name: 'Hidroginástica',
    slug: 'hidroginastica',
    route: '/modalities/hidroginastica',
    icon: '🏊',
    badge: 'Piscina • Turma',
    defaultDescription:
      'Exercícios aeróbicos aquáticos em grupo de baixo impacto articular.',
    accentClass: 'mod-card-hidroginastica',
    highlightLimit: 'Máx. 8 alunos/turma',
    fallbackPrice: 170,
  },
  {
    key: 'hidroterapia',
    name: 'Hidroterapia',
    slug: 'hidroterapia',
    route: '/modalities/hidroterapia',
    icon: '💧',
    badge: 'Piscina • Terapêutica',
    defaultDescription:
      'Fisioterapia aquática assistida para reabilitação motora e alívio articular.',
    accentClass: 'mod-card-hidroterapia',
    highlightLimit: 'Máx. 5 alunos/turma',
    fallbackPrice: 240,
  },
  {
    key: 'natacao-adulto',
    name: 'Natação Adulto',
    slug: 'natacao-adulto',
    route: '/modalities/natacao-adulto',
    icon: '🏊‍♂️',
    badge: 'Piscina • Adulto',
    defaultDescription:
      'Aperfeiçoamento dos quatro estilos de nado e condicionamento cardiorrespiratório.',
    accentClass: 'mod-card-natacao-adulto',
    highlightLimit: 'Máx. 8 alunos/turma',
    fallbackPrice: 190,
  },
  {
    key: 'natacao-crianca',
    name: 'Natação Criança',
    slug: 'natacao-crianca',
    route: '/modalities/natacao-crianca',
    icon: '🧒',
    badge: 'Piscina • Infantil',
    defaultDescription:
      'Adaptação ao meio líquido, segurança aquática e nado lúdico para crianças.',
    accentClass: 'mod-card-natacao-crianca',
    highlightLimit: 'Máx. 8 alunos/turma',
    fallbackPrice: 190,
  },
  {
    key: 'pilates',
    name: 'Pilates',
    slug: 'pilates',
    route: '/modalities/pilates',
    icon: '🧘',
    badge: 'Aparelhos & Solo',
    defaultDescription:
      'Aulas de pilates em aparelhos especializados (Cadillac, Reformer) e solo.',
    accentClass: 'mod-card-pilates',
    highlightLimit: 'Atendimento exclusivo',
    fallbackPrice: 220,
  },
  {
    key: 'fisioterapia',
    name: 'Fisioterapia',
    slug: 'fisioterapia',
    route: '/modalities/fisioterapia',
    icon: '🩺',
    badge: 'Clínica & Postural',
    defaultDescription:
      'Avaliação clínica individualizada, ortopedia e reabilitação postural completa.',
    accentClass: 'mod-card-fisioterapia',
    highlightLimit: 'Atendimento individual',
    fallbackPrice: 180,
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição direta de modalidades no Dashboard
  const [editingModality, setEditingModality] = useState<Modality | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [studentsData, modalitiesData, notificationsData, paymentsData] = await Promise.all([
          studentsService.findAll(),
          modalitiesService.findAll(),
          notificationsService.findAll(user?.id),
          paymentsService.findAll(),
        ]);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setModalities(Array.isArray(modalitiesData) ? modalitiesData : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  async function handleMarkAsRead(id: string) {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) : [],
      );
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  }

  async function handleMarkAllAsRead() {
    if (!user?.id) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => ({ ...n, readAt: new Date().toISOString() })) : [],
      );
    } catch (err) {
      console.error('Erro ao marcar todas:', err);
    }
  }

  // Cálculos dinâmicos com dados reais
  const safeStudents = Array.isArray(students) ? students : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const totalStudents = safeStudents.length;
  const activeStudentsCount = safeStudents.filter((s) => s.active).length;
  const unreadNotificationsCount = safeNotifications.filter((n) => !n.readAt).length;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Recebido este mês com base em pagamentos reais liquidados (ou fallback de matrículas ativas se não geradas ainda)
  const paidThisMonthFromPayments = safePayments
    .filter((p) => p.status === 'PAID' && p.referenceMonth === currentMonth && p.referenceYear === currentYear)
    .reduce((sum, p) => sum + Number(p.finalAmount || 0), 0);

  const fallbackActiveEnrollmentTotal = safeStudents.reduce((sum: number, s: Student) => {
    if (!s.enrollments || !s.active) return sum;
    const studentTotal = s.enrollments
      .filter((e) => e.status === 'ACTIVE')
      .reduce((sub: number, e) => sub + (Number(e.finalPrice) || 0), 0);
    return sum + studentTotal;
  }, 0);

  const receivedThisMonth = paidThisMonthFromPayments > 0 ? paidThisMonthFromPayments : fallbackActiveEnrollmentTotal;

  const activeEnrollmentsCount = safeStudents.reduce((count: number, s: Student) => {
    if (!s.enrollments || !s.active) return count;
    return count + s.enrollments.filter((e) => e.status === 'ACTIVE').length;
  }, 0);

  // Inadimplentes: verificados via pagamentos OVERDUE reais e pendências cadastrais
  const overduePayments = safePayments.filter((p) => p.status === 'OVERDUE');
  const overdueStudentIds = new Set(overduePayments.map((p) => p.studentId));

  const inadimplentesList = safeStudents.filter((s: Student) => {
    if (!s.active) return false;
    if (overdueStudentIds.has(s.id)) return true;
    if (!s.enrollments || s.enrollments.length === 0) return true;
    return s.enrollments.some(
      (e) =>
        e.status === 'OVERDUE' || e.status === 'PENDING_DOCUMENTATION',
    );
  });

  const inadimplentesCount = Math.max(inadimplentesList.length, overduePayments.length);

  // Modalidades ativas com turmas presenciais / piscina
  const turmasPiscinaCount = modalities.filter(
    (m) => m.active && m.requiresClass,
  ).length;

  function handleQuickEdit(realMod?: Modality, config?: ModalityCardConfig) {
    if (realMod) {
      setEditingModality(realMod);
      setIsEditModalOpen(true);
    } else if (config) {
      const found = modalities.find(
        (m) =>
          normalizeSlug(m.name) === config.slug ||
          m.name.toLowerCase() === config.name.toLowerCase(),
      );
      if (found) {
        setEditingModality(found);
        setIsEditModalOpen(true);
      }
    }
  }

  function handleModalitySaved(updated: Modality) {
    setModalities((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Olá, {user?.name || 'Aline'}! 👋</h1>
          <p>
            Painel de administração e resumo operacional do FitFisio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to="/notifications"
            className="btn-secondary"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              position: 'relative',
            }}
            title="Ver notificações do sistema"
          >
            <span>🔔</span>
            <span>Notificações</span>
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '9999px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </Link>
          <Link
            to="/finance"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>💰</span>
            <span>Financeiro</span>
          </Link>
          <Link
            to="/enrollments"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>📋</span>
            <span>Matrículas</span>
          </Link>
          <Link
            to="/enrollments/new"
            className="btn-edit-main"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>➕</span>
            <span>Nova Matrícula</span>
          </Link>
        </div>
      </div>

      {/* 4 CARDS DE MÉTRICAS PRINCIPAIS COM DADOS CALCULADOS */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-bg-blue">
            <span>👥</span>
          </div>
          <div className="dashboard-card-content">
            <p>Alunos Cadastrados</p>
            <strong>{loading ? '...' : totalStudents}</strong>
            <span className="card-helper success-text">
              {loading ? 'Carregando' : `${activeStudentsCount} alunos ativos`}
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-bg-green">
            <span>💰</span>
          </div>
          <div className="dashboard-card-content">
            <p>Recebido este mês</p>
            <strong>
              {loading ? '...' : formatCurrency(receivedThisMonth)}
            </strong>
            <span className="card-helper">
              {loading
                ? 'Calculando'
                : `${activeEnrollmentsCount} matrículas ativas faturadas`}
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-bg-amber">
            <span>⚠️</span>
          </div>
          <div className="dashboard-card-content">
            <p>Inadimplentes / Pendentes</p>
            <strong>{loading ? '...' : inadimplentesCount}</strong>
            <span
              className={`card-helper ${
                inadimplentesCount > 0 ? 'warning-text' : 'success-text'
              }`}
            >
              {loading
                ? 'Verificando'
                : inadimplentesCount > 0
                  ? `${inadimplentesCount} com pendência de matrícula`
                  : 'Em dia com os pagamentos'}
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-bg-purple">
            <span>🏊</span>
          </div>
          <div className="dashboard-card-content">
            <p>Turmas & Piscina</p>
            <strong>
              {loading
                ? '...'
                : `${turmasPiscinaCount || 4} modalidades`}
            </strong>
            <span className="card-helper">
              Turmas com controle de vagas
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE CARDS DE MODALIDADES VISUALMENTE DISTINTOS */}
      <div className="modalities-section-wrapper">
        <div className="section-top-bar">
          <div>
            <h2>Modalidades Oferecidas</h2>
            <p>
              Acesse diretamente os alunos, turmas e configurações de cada
              modalidade.
            </p>
          </div>

          <Link to="/modalities" className="section-action-link">
            Gerenciar modalidades <span>→</span>
          </Link>
        </div>

        <div className="modalities-cards-grid">
          {MODALITY_CONFIGS.map((config) => {
            // Localiza os dados reais da modalidade se carregados
            const realMod = modalities.find(
              (m) =>
                normalizeSlug(m.name) === config.slug ||
                m.name.toLowerCase() === config.name.toLowerCase(),
            );

            const price = realMod?.monthlyPrice ?? config.fallbackPrice;
            const description =
              realMod?.description || config.defaultDescription;

            // Conta alunos matriculados nessa modalidade específica
            const enrolledStudentsCount = students.filter((s) => {
              if (!s.active || !s.enrollments) return false;
              return s.enrollments.some((e) => {
                if (e.status !== 'ACTIVE') return false;
                if (realMod && e.modalityId === realMod.id) return true;
                return (
                  normalizeSlug(e.modality?.name || '') === config.slug
                );
              });
            }).length;

            return (
              <Link
                key={config.key}
                to={config.route}
                className="modality-card-link"
                title={`Acessar ${config.name}`}
              >
                <div className={`modality-card ${config.accentClass}`}>
                  <div className="modality-card-top">
                    <div className="modality-icon-bubble">
                      <span>{config.icon}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="modality-badge">{config.badge}</span>
                      <button
                        type="button"
                        className="btn-quick-edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickEdit(realMod, config);
                        }}
                        title={`Editar informações de ${config.name}`}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>

                  <div className="modality-card-body">
                    <h3>{config.name}</h3>
                    <p className="modality-card-desc">{description}</p>

                    <div className="modality-info-row">
                      <div>
                        <div className="modality-price-label">Mensalidade</div>
                        <div className="modality-price-value">
                          {formatCurrency(price)}
                          <small>/mês</small>
                        </div>
                      </div>

                      <span className="modality-students-pill">
                        {enrolledStudentsCount === 1
                          ? '1 matriculado'
                          : `${enrolledStudentsCount} matriculados`}
                      </span>
                    </div>
                  </div>

                  <div className="modality-card-footer">
                    <span className="modality-limit-tag">
                      {realMod?.capacity
                        ? `Máx. ${realMod.capacity} alunos${realMod.requiresClass ? '/turma' : ''}`
                        : 'Sem limite fixo de turma'}
                    </span>

                    <span className="modality-cta">
                      Acessar modalidade <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* NOTIFICAÇÕES E ALERTAS DE INADIMPLÊNCIA / OPERAÇÃO */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2>Notificações do Sistema</h2>
            <p className="dashboard-section-desc">
              Avisos automáticos de vencimento de mensalidades, inadimplência e controle do estúdio.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Marcar todas como lidas
              </button>
            )}
            <Link
              to="/notifications"
              className="section-action-link"
              style={{ fontSize: '13px', fontWeight: 'bold' }}
            >
              Ver todas ({safeNotifications.length}) →
            </Link>
          </div>
        </div>

        {safeNotifications.length > 0 || inadimplentesList.length > 0 ? (
          <div className="notifications-list">
            {/* Notificações Reais do Backend */}
            {safeNotifications.slice(0, 5).map((notif) => {
              const isUnread = !notif.readAt;
              const isOverdue = notif.type === 'PAYMENT_OVERDUE';

              return (
                <div
                  key={notif.id}
                  className={`notification-item ${
                    isOverdue ? 'notification-warning' : 'notification-info'
                  }`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: isUnread ? (isOverdue ? '#fff1f2' : '#f0fdfa') : '#ffffff',
                    border: isUnread ? (isOverdue ? '1px solid #fecdd3' : '1px solid #ccfbf1') : '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="notif-icon-bubble">
                      <span>{isOverdue ? '⚠️' : '🔔'}</span>
                    </div>
                    <div className="notif-content">
                      <div className="notif-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{notif.title}</span>
                        {isUnread && (
                          <span
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              borderRadius: '9999px',
                              padding: '1px 6px',
                            }}
                          >
                            Nova
                          </span>
                        )}
                      </div>
                      <div className="notif-desc">{notif.message}</div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                        {isOverdue && (
                          <Link to="/finance?status=OVERDUE" className="notif-link" style={{ fontWeight: 'bold' }}>
                            Ver no Financeiro →
                          </Link>
                        )}
                        {notif.studentId && (
                          <Link to={`/students/${notif.studentId}`} className="notif-link">
                            Ver aluno →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="btn-quick-edit"
                      style={{ flexShrink: 0, marginLeft: '12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      ✓ Marcar lida
                    </button>
                  )}
                </div>
              );
            })}

            {/* Aviso Operacional de Vagas Aquáticas */}
            <div className="notification-item notification-info">
              <div className="notif-icon-bubble">
                <span>ℹ️</span>
              </div>
              <div className="notif-content">
                <div className="notif-title">
                  Lembrete de Vagas em Modalidades Aquáticas
                </div>
                <div className="notif-desc">
                  Lembre-se de respeitar o limite de 8 alunos por turma em
                  Hidroginástica e Natação, e limite de 5 alunos por turma em
                  Hidroterapia para garantir o padrão terapêutico.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <span>🔔</span>
            <p>Nenhuma pendência ou notificação urgente no momento.</p>
          </div>
        )}
      </div>

      <ModalityEditModal
        isOpen={isEditModalOpen}
        modality={editingModality}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingModality(null);
        }}
        onSuccess={handleModalitySaved}
      />
    </div>
  );
}