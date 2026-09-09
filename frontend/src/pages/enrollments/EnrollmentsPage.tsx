import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  XCircle,
  ChevronRight,
  Filter,
  FileText,
  UserCheck,
  RefreshCw,
  X,
} from '../../components/common/Icons';
import {
  enrollmentsService,
  type Enrollment,
  type EnrollmentStatus,
} from '../../services/enrollments.service';
import { modalitiesService, type Modality } from '../../services/modalities.service';

function getModalityBadgeStyle(name: string = ''): string {
  const lower = name.toLowerCase();
  if (lower.includes('pilates')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (lower.includes('hidro')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (lower.includes('natação') || lower.includes('natacao')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (lower.includes('fisio')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lower.includes('academia')) return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-teal-50 text-teal-800 border-teal-200';
}

export function EnrollmentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentList, modalityList] = await Promise.all([
        enrollmentsService.findAll(),
        modalitiesService.findAll(),
      ]);
      setEnrollments(enrollmentList);
      setModalities(modalityList);
    } catch (err) {
      console.error('Erro ao carregar matrículas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestApproval = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await enrollmentsService.requestApproval(id);
      setActionMessage({ type: 'success', text: 'Matrícula enviada para homologação com sucesso!' });
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erro ao enviar para homologação.';
      setActionMessage({ type: 'error', text: msg || 'Erro ao enviar para homologação.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await enrollmentsService.approve(id);
      setActionMessage({ type: 'success', text: 'Matrícula HOMOLOGADA e ativada com sucesso!' });
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erro ao homologar matrícula.';
      setActionMessage({ type: 'error', text: msg || 'Erro ao homologar matrícula.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSuspend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Deseja suspender temporariamente esta matrícula?')) return;
    try {
      setActionLoadingId(id);
      await enrollmentsService.suspend(id);
      setActionMessage({ type: 'success', text: 'Matrícula suspensa com sucesso.' });
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erro ao suspender matrícula.';
      setActionMessage({ type: 'error', text: msg || 'Erro ao suspender matrícula.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleReactivate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await enrollmentsService.reactivate(id);
      setActionMessage({ type: 'success', text: 'Matrícula reativada com sucesso!' });
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erro ao reativar matrícula.';
      setActionMessage({ type: 'error', text: msg || 'Erro ao reativar matrícula.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Filtragem
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const studentName = e.student?.name?.toLowerCase() || '';
      const modalityName = e.modality?.name?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();
      const matchesSearch = studentName.includes(query) || modalityName.includes(query);

      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchesModality = modalityFilter === 'ALL' || e.modalityId === modalityFilter;

      return matchesSearch && matchesStatus && matchesModality;
    });
  }, [enrollments, searchTerm, statusFilter, modalityFilter]);

  // Estatísticas e Métricas
  const stats = useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === 'ACTIVE').length;
    const awaitingApproval = enrollments.filter((e) => e.status === 'AWAITING_APPROVAL').length;
    const pendingDocs = enrollments.filter((e) => e.status === 'PENDING_DOCUMENTATION').length;
    const suspended = enrollments.filter((e) => e.status === 'SUSPENDED').length;
    const activeTotalMonthly = enrollments
      .filter((e) => e.status === 'ACTIVE')
      .reduce((acc, curr) => acc + Number(curr.finalPrice || 0), 0);

    return { total, active, awaitingApproval, pendingDocs, suspended, activeTotalMonthly };
  }, [enrollments]);

  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" aria-hidden="true" />
            Ativa
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" aria-hidden="true" />
            Aguardando Homologação
          </span>
        );
      case 'PENDING_DOCUMENTATION':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" aria-hidden="true" />
            Pendente Documentação
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <PauseCircle className="w-3.5 h-3.5 mr-1 text-purple-600" aria-hidden="true" />
            Suspensa
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" aria-hidden="true" />
            Cancelada
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            Concluída
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="enrollments-page">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileCheck className="w-6 h-6 mr-2 text-teal-600" aria-hidden="true" />
            Gestão de Matrículas
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administração completa de inscrições em modalidades, ciclos de homologação e contratos.
          </p>
        </div>

        <Link
          to="/enrollments/new"
          id="btn-new-enrollment"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600"
          aria-label="Iniciar nova matrícula"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nova Matrícula</span>
        </Link>
      </div>

      {/* Mensagem de Feedback Acessível */}
      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:opacity-75 font-semibold ml-2"
            aria-label="Fechar mensagem"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Métricas Interativos (clique para filtrar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Matrículas */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left p-4 rounded-xl border transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-600 ${
            statusFilter === 'ALL'
              ? 'bg-white border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          aria-label={`Filtrar todas as ${stats.total} matrículas`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Total Matrículas
            </span>
            <span className="p-2 rounded-lg bg-slate-100 text-slate-700" aria-hidden="true">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Registros totais no sistema</div>
        </button>

        {/* Ativas */}
        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          className={`text-left p-4 rounded-xl border transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
            statusFilter === 'ACTIVE'
              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          aria-label={`Filtrar ${stats.active} matrículas ativas`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Ativas
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700" aria-hidden="true">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.active}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            R$ {stats.activeTotalMonthly.toFixed(2)}/mês ativo
          </div>
        </button>

        {/* Aguardando Homologação (Destaque para Aline) */}
        <button
          type="button"
          onClick={() => setStatusFilter('AWAITING_APPROVAL')}
          className={`text-left p-4 rounded-xl border transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            statusFilter === 'AWAITING_APPROVAL'
              ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/30'
              : 'bg-white border-blue-200/80 hover:border-blue-300'
          }`}
          aria-label={`Filtrar ${stats.awaitingApproval} matrículas aguardando homologação`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Homologação Pendente
            </span>
            <span className="p-2 rounded-lg bg-blue-100 text-blue-800" aria-hidden="true">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{stats.awaitingApproval}</div>
          <div className="text-xs text-blue-700 mt-1 font-semibold">
            {stats.awaitingApproval > 0 ? 'Requer aprovação de Aline' : 'Nenhuma pendência'}
          </div>
        </button>

        {/* Pendente Docs */}
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING_DOCUMENTATION')}
          className={`text-left p-4 rounded-xl border transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-600 ${
            statusFilter === 'PENDING_DOCUMENTATION'
              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          aria-label={`Filtrar ${stats.pendingDocs} matrículas com documentos pendentes`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pendentes Docs
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-800" aria-hidden="true">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">{stats.pendingDocs}</div>
          <div className="text-xs text-slate-500 mt-1">Atestado médico ou recibo</div>
        </button>
      </div>

      {/* Barra de Filtros, Abas de Status e Busca */}
      <div
        role="search"
        aria-label="Filtros da lista de matrículas"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
      >
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <label htmlFor="enrollment-search-input" className="sr-only">
              Buscar matrícula por nome do aluno ou modalidade
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="enrollment-search-input"
              type="text"
              placeholder="Buscar por nome do aluno ou modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Limpar pesquisa"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filtro por Modalidade */}
          <div className="flex items-center space-x-2">
            <label htmlFor="modality-select-filter" className="sr-only">
              Filtrar por Modalidade
            </label>
            <select
              id="modality-select-filter"
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Todas as Modalidades</option>
              {modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadData}
              title="Atualizar lista de matrículas"
              aria-label="Recarregar dados"
              className="p-2.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Abas Rápidas de Status */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-600 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" aria-hidden="true" />
            Status:
          </span>

          {[
            { id: 'ALL', label: 'Todas', count: stats.total },
            { id: 'ACTIVE', label: 'Ativas', count: stats.active },
            { id: 'AWAITING_APPROVAL', label: 'Aguardando Homologação', count: stats.awaitingApproval },
            { id: 'PENDING_DOCUMENTATION', label: 'Pendente Docs', count: stats.pendingDocs },
            { id: 'SUSPENDED', label: 'Suspensas', count: stats.suspended },
            { id: 'CANCELLED', label: 'Canceladas', count: enrollments.filter((e) => e.status === 'CANCELLED').length },
          ].map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                aria-pressed={isSelected}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}

          <span className="ml-auto text-slate-500 font-medium" aria-live="polite">
            Exibindo {filteredEnrollments.length} de {enrollments.length} matrículas
          </span>
        </div>
      </div>

      {/* Visualização de Matrículas (Tabela Responsiva no Desktop, Cards no Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
            <p className="text-sm font-medium">Carregando matrículas...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-slate-800 text-base">Nenhuma matrícula encontrada</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não foram encontradas matrículas com os filtros atuais. Você pode ajustar a busca ou clicar em "Nova Matrícula".
            </p>
            <Link
              to="/enrollments/new"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 mt-2 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Realizar Nova Matrícula</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800" aria-label="Tabela de Matrículas">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">Aluno</th>
                  <th scope="col" className="px-5 py-4 font-bold">Modalidade & Turma</th>
                  <th scope="col" className="px-5 py-4 font-bold">Valor & Desconto</th>
                  <th scope="col" className="px-5 py-4 font-bold">Status</th>
                  <th scope="col" className="px-5 py-4 font-bold">Início</th>
                  <th scope="col" className="px-5 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((e) => {
                  const badgeStyle = getModalityBadgeStyle(e.modality?.name);

                  return (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/enrollments/${e.id}`)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      tabIndex={0}
                      onKeyDown={(evt) => {
                        if (evt.key === 'Enter' || evt.key === ' ') {
                          navigate(`/enrollments/${e.id}`);
                        }
                      }}
                      aria-label={`Ver detalhes da matrícula de ${e.student?.name} em ${e.modality?.name}`}
                    >
                      {/* Aluno */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {e.student?.name || 'Aluno não identificado'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                          <span>{e.student?.phone || 'Sem telefone'}</span>
                          <span>•</span>
                          <span>{e.student?.type === 'CHILD' ? 'Criança' : 'Adulto'}</span>
                        </div>
                      </td>

                      {/* Modalidade & Turma */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badgeStyle}`}
                        >
                          {e.modality?.name || 'Modalidade'}
                        </span>
                        <div className="text-xs text-slate-600 mt-1">
                          {e.class?.name ? (
                            <span className="font-semibold text-slate-700">Turma: {e.class.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem turma vinculada</span>
                          )}
                        </div>
                      </td>

                      {/* Valor & Desconto */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          R$ {Number(e.finalPrice || 0).toFixed(2)}
                          <span className="text-xs font-normal text-slate-500">/mês</span>
                        </div>
                        {e.discountPercentage > 0 ? (
                          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                            {e.discountPercentage}% desc. (-R$ {Number(e.discountAmount || 0).toFixed(2)})
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 mt-0.5">Valor integral</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">{getStatusBadge(e.status)}</td>

                      {/* Início */}
                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {e.startDate ? new Date(e.startDate).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Ações de Homologação e Ciclo de Vida */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(evt) => evt.stopPropagation()}>
                          {/* Se Pendente de Documentação */}
                          {e.status === 'PENDING_DOCUMENTATION' && (
                            <button
                              type="button"
                              onClick={(event) => handleRequestApproval(e.id, event)}
                              disabled={actionLoadingId === e.id}
                              title="Avançar para homologação após conferir documentos"
                              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                              aria-label={`Enviar matrícula de ${e.student?.name} para homologação`}
                            >
                              <FileCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Enviar p/ Homologar</span>
                            </button>
                          )}

                          {/* Se Aguardando Homologação (Aline pode Homologar com 1 clique) */}
                          {e.status === 'AWAITING_APPROVAL' && (
                            <button
                              type="button"
                              onClick={(event) => handleApprove(e.id, event)}
                              disabled={actionLoadingId === e.id}
                              title="Homologar Matrícula (Ativar Imediatamente)"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-600"
                              aria-label={`Homologar matrícula de ${e.student?.name}`}
                            >
                              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Homologar</span>
                            </button>
                          )}

                          {/* Se Ativa */}
                          {e.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={(event) => handleSuspend(e.id, event)}
                              disabled={actionLoadingId === e.id}
                              title="Suspender Matrícula Temporariamente"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                              aria-label={`Suspender matrícula de ${e.student?.name}`}
                            >
                              <PauseCircle className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                              <span>Suspender</span>
                            </button>
                          )}

                          {/* Se Suspensa */}
                          {e.status === 'SUSPENDED' && (
                            <button
                              type="button"
                              onClick={(event) => handleReactivate(e.id, event)}
                              disabled={actionLoadingId === e.id}
                              title="Reativar Matrícula"
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              aria-label={`Reativar matrícula de ${e.student?.name}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                              <span>Reativar</span>
                            </button>
                          )}

                          {/* Link de Navegação / Detalhes */}
                          <Link
                            to={`/enrollments/${e.id}`}
                            className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver detalhes da matrícula"
                            aria-label={`Ver detalhes da matrícula de ${e.student?.name}`}
                          >
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
