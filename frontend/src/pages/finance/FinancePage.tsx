import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Payment, PaymentStatus, PaymentMethod } from '../../services/payments.service';
import { paymentsService } from '../../services/payments.service';
import { PaymentStatusBadge, PaymentMethodBadge } from '../../components/finance/PaymentStatusBadge';
import { PaymentModal } from '../../components/finance/PaymentModal';
import { GenerateMonthlyModal } from '../../components/finance/GenerateMonthlyModal';
import { StudentFinanceDrawer } from '../../components/finance/StudentFinanceDrawer';
import { studentsService, type Student } from '../../services/students.service';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Trash2,
  AlertCircle,
} from '../../components/common/Icons';

function formatCurrency(value: number | string): string {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

const MONTHS = [
  { value: 'ALL', label: 'Todos os meses' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function FinancePage({ defaultFilter }: { defaultFilter?: 'OVERDUE' | 'ALL' }) {
  const [searchParams] = useSearchParams();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>(() => {
    const m = searchParams.get('month');
    return m ? (m === 'ALL' ? 'ALL' : Number(m)) : currentMonth;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const y = searchParams.get('year');
    return y ? Number(y) : currentYear;
  });
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'ALL'>(() => {
    if (defaultFilter === 'OVERDUE') return 'OVERDUE';
    const s = searchParams.get('status');
    return (s as PaymentStatus) || 'ALL';
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'ALL'>('ALL');

  // Dados
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingOverdue, setVerifyingOverdue] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modais
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [financeDrawerStudent, setFinanceDrawerStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, selectedStatus]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const filters: any = {
        referenceYear: selectedYear,
      };

      if (selectedMonth !== 'ALL') {
        filters.referenceMonth = selectedMonth;
      }

      if (selectedStatus !== 'ALL') {
        filters.status = selectedStatus;
      }

      const [paymentsData, studentsData] = await Promise.all([
        paymentsService.findAll(filters),
        studentsService.findAll(),
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err: any) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError('Erro ao carregar pagamentos e mensalidades.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOverdue() {
    try {
      setVerifyingOverdue(true);
      setError('');
      const res = await paymentsService.checkOverdue();
      setSuccessMessage(
        `Verificação concluída: ${res.updatedPayments} pagamento(s) em atraso atualizado(s) e ${res.notificationsCreated} notificação(ões) gerada(s).`,
      );
      await loadData();
    } catch (err: any) {
      console.error('Erro ao verificar inadimplência:', err);
      setError('Não foi possível verificar a inadimplência no momento.');
    } finally {
      setVerifyingOverdue(false);
    }
  }

  async function handleCancelPayment(id: string) {
    if (!confirm('Deseja realmente cancelar esta mensalidade?')) return;

    try {
      setLoading(true);
      await paymentsService.cancel(id);
      setSuccessMessage('Mensalidade cancelada com sucesso.');
      await loadData();
    } catch (err: any) {
      console.error('Erro ao cancelar mensalidade:', err);
      setError('Erro ao cancelar mensalidade.');
    } finally {
      setLoading(false);
    }
  }

  // Filtragem no cliente para busca textual e forma de pagamento
  const filteredPayments = useMemo(() => {
    const list = Array.isArray(payments) ? payments : [];
    return list.filter((p) => {
      // Busca pelo nome do aluno ou CPF
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const studentName = p.student?.name?.toLowerCase() || '';
        const studentCpf = p.student?.cpf?.toLowerCase() || '';
        const modalityName = p.enrollment?.modality?.name?.toLowerCase() || '';
        const matches =
          studentName.includes(term) ||
          studentCpf.includes(term) ||
          modalityName.includes(term);
        if (!matches) return false;
      }

      // Filtro de método de pagamento
      if (selectedMethod !== 'ALL') {
        if (p.method !== selectedMethod) return false;
      }

      return true;
    });
  }, [payments, searchTerm, selectedMethod]);

  // Cálculos financeiros consolidados diretamente dos registros da API
  const metrics = useMemo(() => {
    const totalAmount = filteredPayments.reduce(
      (sum, p) => sum + (p.status !== 'CANCELLED' ? Number(p.finalAmount || 0) : 0),
      0,
    );

    const paidPayments = filteredPayments.filter((p) => p.status === 'PAID');
    const paidAmount = paidPayments.reduce(
      (sum, p) => sum + Number(p.finalAmount || 0),
      0,
    );

    const pendingPayments = filteredPayments.filter((p) => p.status === 'PENDING');
    const pendingAmount = pendingPayments.reduce(
      (sum, p) => sum + Number(p.finalAmount || 0),
      0,
    );

    const overduePayments = filteredPayments.filter((p) => p.status === 'OVERDUE');
    const overdueAmount = overduePayments.reduce(
      (sum, p) => sum + Number(p.finalAmount || 0),
      0,
    );

    // Contagem de alunos únicos inadimplentes
    const uniqueOverdueStudents = new Set(overduePayments.map((p) => p.studentId)).size;

    return {
      totalAmount,
      paidAmount,
      paidCount: paidPayments.length,
      pendingAmount,
      pendingCount: pendingPayments.length,
      overdueAmount,
      overdueCount: overduePayments.length,
      uniqueOverdueStudents,
    };
  }, [filteredPayments]);

  function handleOpenStudentFinance(studentId: string) {
    const found = students.find((s) => s.id === studentId);
    if (found) {
      setFinanceDrawerStudent(found);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <DollarSign className="w-7 h-7 mr-2 text-teal-600" />
            Gestão Financeira & Mensalidades
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Controle de cobranças, recebimentos em PIX, Cartão e Dinheiro, e monitoramento de inadimplência.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCheckOverdue}
            disabled={verifyingOverdue}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-50"
            title="Atualiza status de mensalidades vencidas e gera alertas automáticos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${verifyingOverdue ? 'animate-spin' : ''}`} />
            <span>Verificar Inadimplência</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Mensalidades</span>
          </button>
        </div>
      </div>

      {/* Alertas e Mensagens */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-700 underline text-xs ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 underline text-xs ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 4 Cards de Métricas Financeiras */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Faturado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Faturado
            </span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(metrics.totalAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {filteredPayments.length} cobranças no período
          </div>
        </div>

        {/* Total Recebido (Pago) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Recebido (Pago)
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatCurrency(metrics.paidAmount)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {metrics.paidCount} mensalidade(s) liquidada(s)
          </div>
        </div>

        {/* Total Pendente */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-b from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              A Receber (Pendente)
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {formatCurrency(metrics.pendingAmount)}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            {metrics.pendingCount} a vencer / aguardando
          </div>
        </div>

        {/* Inadimplentes (Em atraso) */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs bg-gradient-to-b from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Em Atraso (Inadimplente)
            </span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">
            {formatCurrency(metrics.overdueAmount)}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            {metrics.uniqueOverdueStudents} aluno(s) • {metrics.overdueCount} mensalidade(s)
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Busca por Aluno */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome do aluno, CPF ou modalidade..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Mês */}
          <div className="w-full md:w-44">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Ano */}
          <div className="w-full md:w-32">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="w-full md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
            >
              <option value="ALL">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="OVERDUE">Em atraso</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="REFUNDED">Estornado</option>
            </select>
          </div>

          {/* Filtro por Forma de Pagamento */}
          <div className="w-full md:w-40">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
            >
              <option value="ALL">Todas as formas</option>
              <option value="PIX">PIX</option>
              <option value="CARD">Cartão</option>
              <option value="CASH">Dinheiro</option>
            </select>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium mr-1">Visão rápida:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('ALL');
              setSelectedMethod('ALL');
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('PENDING')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('PAID')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedStatus === 'PAID'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Pagas
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('OVERDUE')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedStatus === 'OVERDUE'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-800 hover:bg-rose-50'
            }`}
          >
            Inadimplentes (Em atraso)
          </button>
        </div>
      </div>

      {/* Tabela de Mensalidades */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
            <p className="text-xs font-semibold">Carregando dados financeiros...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center p-8 space-y-3">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-800">Nenhuma mensalidade encontrada</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nenhum lançamento corresponde aos filtros selecionados. Altere os filtros ou gere novas
              mensalidades para os alunos.
            </p>
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Mensalidades Agora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-3">Modalidade</th>
                  <th className="py-3.5 px-3">Mês Ref.</th>
                  <th className="py-3.5 px-3">Valor Orig.</th>
                  <th className="py-3.5 px-3">Desconto</th>
                  <th className="py-3.5 px-3">Valor Final</th>
                  <th className="py-3.5 px-3">Vencimento</th>
                  <th className="py-3.5 px-3">Forma Pagto.</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Data Pagto.</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPayments.map((p) => {
                  const studentName = p.student?.name || 'Aluno';
                  const modalityName = p.enrollment?.modality?.name || 'Matrícula';
                  const monthName =
                    MONTHS.find((m) => m.value === p.referenceMonth)?.label ||
                    `Mês ${p.referenceMonth}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Aluno com link rápido para abrir o drawer financeiro */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentFinance(p.studentId)}
                          className="text-left hover:text-teal-700 hover:underline flex items-center space-x-2"
                          title="Ver histórico financeiro completo deste aluno"
                        >
                          <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {studentName.charAt(0).toUpperCase()}
                          </span>
                          <span>{studentName}</span>
                        </button>
                      </td>

                      {/* Modalidade */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                          {modalityName}
                        </span>
                      </td>

                      {/* Mês de Referência e Período */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {monthName}/{p.referenceYear}
                        </div>
                        {p.period === 'FIRST_FORTNIGHT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
                            1ª quinzena
                          </span>
                        ) : p.period === 'SECOND_FORTNIGHT' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-0.5">
                            2ª quinzena
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100 mt-0.5">
                            Mensalidade
                          </span>
                        )}
                      </td>

                      {/* Valor Original */}
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Desconto */}
                      <td className="py-3.5 px-3 text-emerald-700 font-medium whitespace-nowrap">
                        {Number(p.discountAmount) > 0 ? (
                          <span>- {formatCurrency(p.discountAmount)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Valor Final */}
                      <td className="py-3.5 px-3 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(p.finalAmount)}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        {formatDate(p.dueDate)}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <PaymentMethodBadge method={p.method} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <PaymentStatusBadge status={p.status} />
                      </td>

                      {/* Data de Pagamento */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(p.paidAt)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {/* Se Pendente ou Em atraso: Botão Receber */}
                        {p.status !== 'PAID' && p.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setPayingPayment(p)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-2xs transition-all"
                            title="Registrar recebimento em PIX, Cartão ou Dinheiro"
                          >
                            Receber
                          </button>
                        )}

                        {/* Botão Ver Aluno */}
                        <button
                          type="button"
                          onClick={() => handleOpenStudentFinance(p.studentId)}
                          className="inline-flex items-center px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                          title="Abrir painel financeiro do aluno"
                        >
                          Histórico
                        </button>

                        {/* Cancelar cobrança */}
                        {p.status !== 'CANCELLED' && p.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleCancelPayment(p.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Cancelar mensalidade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer com contagem */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <strong>{filteredPayments.length}</strong> de{' '}
            <strong>{payments.length}</strong> lançamentos financeiros.
          </span>
          <span className="text-[11px] text-slate-400">
            FitFisio Gestão Financeira Integrada
          </span>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PaymentModal
        payment={payingPayment}
        isOpen={!!payingPayment}
        onClose={() => setPayingPayment(null)}
        onSuccess={() => {
          setSuccessMessage('Recebimento confirmado com sucesso!');
          loadData();
        }}
      />

      {/* Modal de Gerar Mensalidade */}
      <GenerateMonthlyModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={(res) => {
          setSuccessMessage(
            `Mensalidades de ${res.studentName} geradas com sucesso (Total: ${formatCurrency(res.totalAmount)})!`,
          );
          loadData();
        }}
      />

      {/* Drawer Financeiro do Aluno */}
      <StudentFinanceDrawer
        student={financeDrawerStudent}
        isOpen={!!financeDrawerStudent}
        onClose={() => setFinanceDrawerStudent(null)}
        onStudentUpdated={loadData}
      />
    </div>
  );
}
