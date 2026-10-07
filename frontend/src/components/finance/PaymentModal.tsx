import { useState } from 'react';
import type { Payment, PaymentMethod } from '../../services/payments.service';
import { paymentsService } from '../../services/payments.service';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  RefreshCw,
  User,
} from '../common/Icons';

interface PaymentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPayment: Payment) => void;
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

export function PaymentModal({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !payment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payment) return;

    try {
      setLoading(true);
      setError('');

      const cleanTransactionId = method === 'CASH' ? undefined : (transactionId.trim() || undefined);
      const updated = await paymentsService.markAsPaid(payment.id, method, cleanTransactionId);

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar pagamento:', err);
      const msg = err.response?.data?.message || err.message || 'Erro ao registrar pagamento.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  const studentName = payment.student?.name || 'Aluno';
  const modalityName = payment.enrollment?.modality?.name || 'Matrícula';
  const monthName = MONTH_NAMES[payment.referenceMonth] || `Mês ${payment.referenceMonth}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Banknote className="w-5 h-5 text-teal-700" />
            </span>
            <div>
              <h2 id="payment-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
                Registrar Recebimento
              </h2>
              <p className="text-xs text-slate-500">
                Confirmação de pagamento da mensalidade
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fechar modal de pagamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados da Mensalidade */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                <User className="w-4 h-4 text-teal-600" />
                <span>{studentName}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {modalityName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400">Referência:</span>{' '}
                <strong className="text-slate-800">
                  {monthName} / {payment.referenceYear}
                </strong>
                {payment.period === 'FIRST_FORTNIGHT' ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    1ª quinzena
                  </span>
                ) : payment.period === 'SECOND_FORTNIGHT' ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    2ª quinzena
                  </span>
                ) : (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100">
                    Mensalidade
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400">Vencimento:</span>{' '}
                <strong className="text-slate-800">
                  {formatDate(payment.dueDate)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Valor Original:</span>{' '}
                <span className="text-slate-700 line-through">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Desconto:</span>{' '}
                <span className="text-emerald-700 font-semibold">
                  - {formatCurrency(payment.discountAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Valor a Receber
              </span>
              <span className="text-xl font-extrabold text-teal-700">
                {formatCurrency(payment.finalAmount)}
              </span>
            </div>
          </div>

          {/* Seleção da Forma de Pagamento */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Forma de Pagamento Recebida <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('PIX')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                  method === 'PIX'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-600/30 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-teal-600" />
                <span className="text-xs font-semibold">PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CARD')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                  method === 'CARD'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/30 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Cartão</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                  method === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/30 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-semibold">Dinheiro</span>
              </button>
            </div>
          </div>

          {/* Campo opcional de identificador / comprovante (para PIX ou Cartão) */}
          {method !== 'CASH' && (
            <div>
              <label
                htmlFor="transaction-id-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Código / Comprovante da Transação{' '}
                <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="transaction-id-input"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={
                  method === 'PIX'
                    ? 'Ex: E2E123456789 ou ID de transferência'
                    : 'Ex: NSU 987654 ou autorização máquina'
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Confirmar Recebimento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
