import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Student } from '../../services/students.service';
import { studentsService } from '../../services/students.service';
import type { Payment } from '../../services/payments.service';
import { paymentsService } from '../../services/payments.service';
import { PaymentStatusBadge, PaymentMethodBadge } from '../../components/finance/PaymentStatusBadge';
import { PaymentModal } from '../../components/finance/PaymentModal';
import { GenerateMonthlyModal } from '../../components/finance/GenerateMonthlyModal';
import {
  ArrowLeft,
  Activity,
  DollarSign,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
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

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Modais
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id, selectedMonth, selectedYear]);

  async function loadStudentData() {
    if (!id) return;
    try {
      setLoading(true);
      setError('');

      const [studentData, paymentsData] = await Promise.all([
        studentsService.findOne(id),
        paymentsService.findAll({
          studentId: id,
          referenceYear: selectedYear,
          referenceMonth: selectedMonth === 'ALL' ? undefined : selectedMonth,
        }),
      ]);

      setStudent(studentData);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do aluno:', err);
      setError('Aluno não encontrado ou erro ao carregar informações.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelPayment(paymentId: string) {
    if (!confirm('Deseja realmente cancelar esta mensalidade?')) return;
    try {
      setLoading(true);
      await paymentsService.cancel(paymentId);
      setSuccessMessage('Mensalidade cancelada.');
      await loadStudentData();
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      setError('Erro ao cancelar mensalidade.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !student) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
        <p className="text-xs font-semibold">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-base font-bold text-slate-800">Aluno não encontrado</p>
        <Link
          to="/students"
          className="inline-flex items-center space-x-1 text-xs text-teal-700 font-bold mt-3 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para lista de alunos</span>
        </Link>
      </div>
    );
  }

  const activeEnrollments = student.enrollments?.filter((e) => e.status === 'ACTIVE') || [];
  const hasMultipleEnrollments = activeEnrollments.length > 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Botão Voltar & Cabeçalho */}
      <div>
        <Link
          to="/students"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Alunos</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xl shadow-xs">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    student.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.active ? 'Ativo' : 'Inativo'}
                </span>
                {hasMultipleEnrollments && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {activeEnrollments.length} modalidades
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.type === 'ADULT' ? 'Adulto' : 'Criança'} • {calculateAge(student.birthDate)} anos ({formatDate(student.birthDate)})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
      </div>

      {/* Alertas */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="underline text-xs">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="underline text-xs">
            Fechar
          </button>
        </div>
      )}

      {/* Card de Informações Cadastrais */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Dados do Aluno & Matrículas
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-700">
          <div>
            <span className="text-slate-400 block font-medium">Telefone / WhatsApp</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{student.phone}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">CPF</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{student.cpf || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Família Vinculada</span>
            <span className="font-semibold text-amber-800 mt-0.5 block">
              {student.family ? `${student.family.name} (-10% desconto)` : 'Nenhuma'}
            </span>
          </div>
        </div>

        {/* Modalidades */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1 text-teal-600" />
            Modalidades Contratadas:
          </span>
          {activeEnrollments.length > 0 ? (
            activeEnrollments.map((enr) => (
              <span
                key={enr.id}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-xs"
              >
                <span>{enr.modality?.name}</span>
                <span className="ml-2 text-teal-700 font-bold">{formatCurrency(enr.finalPrice || 0)}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-amber-800">Sem modalidades ativas</span>
          )}
        </div>
      </div>

      {/* ========================================================
          SEÇÃO SOLICITADA: "Financeiro"
          Deve mostrar:
          * modalidade/matrícula;
          * mês de referência;
          * valor original;
          * desconto;
          * valor final;
          * vencimento;
          * forma de pagamento;
          * status;
          * data de pagamento.
      ======================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header da Seção Financeiro */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <DollarSign className="w-5 h-5 text-teal-700" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Financeiro
              </h2>
              <p className="text-xs text-slate-500">
                Histórico completo de mensalidades e pagamentos realizados
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Todos os meses</option>
              {MONTH_NAMES.slice(1).map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>
        </div>

        {/* Tabela Financeira com os campos estritos solicitados */}
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Nenhum pagamento registrado no período.</p>
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Mensalidades</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Modalidade / Matrícula</th>
                  <th className="py-3 px-3">Mês Ref.</th>
                  <th className="py-3 px-3">Valor Original</th>
                  <th className="py-3 px-3">Desconto</th>
                  <th className="py-3 px-3">Valor Final</th>
                  <th className="py-3 px-3">Vencimento</th>
                  <th className="py-3 px-3">Forma de Pagamento</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Data de Pagamento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payments.map((p) => {
                  const modalityName = p.enrollment?.modality?.name || 'Matrícula';
                  const monthStr = MONTH_NAMES[p.referenceMonth] || String(p.referenceMonth);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 font-bold text-xs">
                          {modalityName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {monthStr} / {p.referenceYear}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">
                        {Number(p.discountAmount) > 0 ? (
                          <span>- {formatCurrency(p.discountAmount)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                        {formatCurrency(p.finalAmount)}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {formatDate(p.dueDate)}
                      </td>
                      <td className="py-3 px-3">
                        <PaymentMethodBadge method={p.method} />
                      </td>
                      <td className="py-3 px-3">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(p.paidAt)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {p.status !== 'PAID' && p.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setPayingPayment(p)}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-2xs transition-all"
                            title="Registrar recebimento"
                          >
                            Receber
                          </button>
                        )}
                        {p.status !== 'CANCELLED' && p.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleCancelPayment(p.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        )}
      </section>

      {/* Modal de Pagamento */}
      <PaymentModal
        payment={payingPayment}
        isOpen={!!payingPayment}
        onClose={() => setPayingPayment(null)}
        onSuccess={() => {
          setSuccessMessage('Recebimento confirmado com sucesso!');
          loadStudentData();
        }}
      />

      {/* Modal de Gerar Mensalidade */}
      <GenerateMonthlyModal
        isOpen={isGenerateModalOpen}
        initialStudentId={student.id}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={(res) => {
          setSuccessMessage(`Mensalidades de ${res.studentName} geradas com sucesso!`);
          loadStudentData();
        }}
      />
    </div>
  );
}
