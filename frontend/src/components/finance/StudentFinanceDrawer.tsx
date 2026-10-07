import { useState, useEffect } from 'react';
import type { Student } from '../../services/students.service';
import type { Payment } from '../../services/payments.service';
import { paymentsService } from '../../services/payments.service';
import { PaymentStatusBadge, PaymentMethodBadge } from './PaymentStatusBadge';
import { PaymentModal } from './PaymentModal';
import { GenerateMonthlyModal } from './GenerateMonthlyModal';
import {
  X,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Activity,
  Trash2,
  Sparkles,
} from '../common/Icons';

interface StudentFinanceDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated?: () => void;
}

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

const MONTH_NAMES = [
  '',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function StudentFinanceDrawer({
  student,
  isOpen,
  onClose,
  onStudentUpdated,
}: StudentFinanceDrawerProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtros de período
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Modais de ação
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadStudentFinancialData();
    }
  }, [isOpen, student, selectedMonth, selectedYear]);

  async function loadStudentFinancialData() {
    if (!student) return;

    try {
      setLoading(true);
      setError('');

      const filters: any = {
        studentId: student.id,
        referenceYear: selectedYear,
      };

      if (selectedMonth !== 'ALL') {
        filters.referenceMonth = selectedMonth;
      }

      const paymentsData = await paymentsService.findAll(filters);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err: any) {
      console.error('Erro ao carregar financeiro do aluno:', err);
      setError('Não foi possível carregar o histórico financeiro.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelPayment(id: string) {
    if (!confirm('Deseja realmente cancelar esta mensalidade?')) return;

    try {
      setLoading(true);
      await paymentsService.cancel(id);
      setSuccessMessage('Mensalidade cancelada com sucesso.');
      await loadStudentFinancialData();
      if (onStudentUpdated) onStudentUpdated();
    } catch (err: any) {
      console.error('Erro ao cancelar mensalidade:', err);
      setError('Erro ao cancelar mensalidade.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !student) return null;

  const activeEnrollments = student.enrollments?.filter((e) => e.status === 'ACTIVE') || [];
  const hasMultipleEnrollments = activeEnrollments.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-finance-title"
    >
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header do Drawer */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-teal-100 text-teal-800">
              <DollarSign className="w-6 h-6 text-teal-700" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="student-finance-title" className="text-xl font-bold text-slate-900 tracking-tight">
                  Financeiro • {student.name}
                </h2>
                {hasMultipleEnrollments && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {activeEnrollments.length} modalidades simultâneas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle individualizado de mensalidades, pagamentos e situação financeira
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Mensalidades</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Fechar painel financeiro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-700 hover:underline text-[11px]"
            >
              Fechar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-700 hover:underline text-[11px]"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Modalidades Ativas do Aluno */}
        <div className="px-6 py-3.5 bg-teal-50/40 border-b border-teal-100 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Activity className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-800">Matrículas Ativas:</span>
              {activeEnrollments.length > 0 ? (
                activeEnrollments.map((enr) => (
                  <span
                    key={enr.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-medium text-xs shadow-2xs"
                  >
                    <span>{enr.modality?.name}</span>
                    <span className="ml-1.5 text-teal-700 font-bold">
                      {formatCurrency(enr.finalPrice || 0)}
                    </span>
                    {enr.discountPercentage && Number(enr.discountPercentage) > 0 ? (
                      <span className="ml-1 text-[10px] text-amber-700 font-semibold">
                        (-{enr.discountPercentage}%)
                      </span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-amber-800 italic">Nenhuma matrícula ativa no momento.</span>
              )}
            </div>

            {hasMultipleEnrollments && (
              <span className="text-xs text-teal-800 font-semibold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" />
                Mensalidade consolidada pelo backend
              </span>
            )}
          </div>
        </div>

        {/* Cards de Métricas Resumo */}
        <div className="p-6 pb-2 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Faturado
              </span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {formatCurrency(
                  payments.reduce((acc, p) => acc + Number(p.finalAmount || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {payments.length} mensalidade(s)
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Recebido
              </span>
              <span className="text-lg font-extrabold text-emerald-700 mt-1 block">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === 'PAID')
                    .reduce((acc, p) => acc + Number(p.finalAmount || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {payments.filter((p) => p.status === 'PAID').length} paga(s)
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Pendente
              </span>
              <span className="text-lg font-extrabold text-amber-700 mt-1 block">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === 'PENDING')
                    .reduce((acc, p) => acc + Number(p.finalAmount || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">
                {payments.filter((p) => p.status === 'PENDING').length} a receber
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Em Atraso
              </span>
              <span className="text-lg font-extrabold text-rose-700 mt-1 block">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === 'OVERDUE')
                    .reduce((acc, p) => acc + Number(p.finalAmount || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">
                {payments.filter((p) => p.status === 'OVERDUE').length} vencida(s)
              </span>
            </div>
          </div>
        </div>

        {/* Filtros de Mês e Ano */}
        <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Filtrar período:</span>
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Todos os meses</option>
              {MONTH_NAMES.slice(1).map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadStudentFinancialData}
            disabled={loading}
            className="inline-flex items-center space-x-1 text-xs text-teal-700 hover:text-teal-900 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Tabela de Mensalidades do Aluno */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
              <p className="text-xs font-medium">Carregando mensalidades...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma mensalidade encontrada</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Ainda não foram geradas mensalidades para {student.name} no período selecionado.
              </p>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gerar Mensalidades Agora</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5">Modalidade / Matrícula</th>
                      <th className="py-3 px-3">Mês Ref.</th>
                      <th className="py-3 px-3">Valor Orig.</th>
                      <th className="py-3 px-3">Desconto</th>
                      <th className="py-3 px-3">Valor Final</th>
                      <th className="py-3 px-3">Vencimento</th>
                      <th className="py-3 px-3">Forma Pagto.</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Data Pagto.</th>
                      <th className="py-3 px-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments.map((p) => {
                      const modalityName = p.enrollment?.modality?.name || 'Matrícula';
                      const monthStr = MONTH_NAMES[p.referenceMonth] || String(p.referenceMonth);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-semibold text-slate-900">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-600" />
                              <span>{modalityName}</span>
                            </div>
                            {p.observation && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {p.observation}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{monthStr}/{p.referenceYear}</div>
                            {p.period === 'FIRST_FORTNIGHT' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
                                1ª quinzena
                              </span>
                            ) : p.period === 'SECOND_FORTNIGHT' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-0.5">
                                2ª quinzena
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 mt-0.5">
                                Mensalidade
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-3 px-3 text-emerald-700 font-medium">
                            {Number(p.discountAmount) > 0
                              ? `- ${formatCurrency(p.discountAmount)}`
                              : '—'}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                            {formatCurrency(p.finalAmount)}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {formatDate(p.dueDate)}
                          </td>
                          <td className="py-3 px-3">
                            <PaymentMethodBadge method={p.method} />
                          </td>
                          <td className="py-3 px-3">
                            <PaymentStatusBadge status={p.status} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {formatDate(p.paidAt)}
                          </td>
                          <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {p.status !== 'PAID' && p.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => setPayingPayment(p)}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-2xs transition-all"
                                title="Registrar recebimento desta mensalidade"
                              >
                                Receber
                              </button>
                            )}

                            {p.status !== 'CANCELLED' && p.status !== 'PAID' && (
                              <button
                                type="button"
                                onClick={() => handleCancelPayment(p.id)}
                                className="inline-flex items-center p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Cancelar cobrança"
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Valores apurados diretamente pelo motor financeiro do FitFisio.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PaymentModal
        payment={payingPayment}
        isOpen={!!payingPayment}
        onClose={() => setPayingPayment(null)}
        onSuccess={() => {
          setSuccessMessage('Pagamento registrado com sucesso!');
          loadStudentFinancialData();
          if (onStudentUpdated) onStudentUpdated();
        }}
      />

      {/* Modal de Gerar Mensalidades */}
      <GenerateMonthlyModal
        isOpen={isGenerateModalOpen}
        initialStudentId={student.id}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={(res) => {
          setSuccessMessage(`Mensalidades de ${res.studentName} geradas com sucesso!`);
          loadStudentFinancialData();
          if (onStudentUpdated) onStudentUpdated();
        }}
      />
    </div>
  );
}
