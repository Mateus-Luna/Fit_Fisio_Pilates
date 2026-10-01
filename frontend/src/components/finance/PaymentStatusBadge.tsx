import type { PaymentStatus, PaymentMethod } from '../../services/payments.service';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Banknote,
  CreditCard,
  QrCode,
} from '../common/Icons';

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'PAID':
      return 'Pago';
    case 'PENDING':
      return 'Pendente';
    case 'OVERDUE':
      return 'Em atraso';
    case 'CANCELLED':
      return 'Cancelado';
    case 'REFUNDED':
      return 'Estornado';
    default:
      return status;
  }
}

export function getPaymentMethodLabel(method?: PaymentMethod | null): string {
  if (!method) return 'Não informado';
  switch (method) {
    case 'PIX':
      return 'PIX';
    case 'CARD':
      return 'Cartão';
    case 'CASH':
      return 'Dinheiro';
    default:
      return method;
  }
}

export function PaymentStatusBadge({
  status,
  size = 'md',
}: {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}) {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'PAID':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${padding}`}
        >
          <CheckCircle2 className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1 text-emerald-600`} />
          <span>Pago</span>
        </span>
      );
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${padding}`}
        >
          <Clock className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1 text-amber-600`} />
          <span>Pendente</span>
        </span>
      );
    case 'OVERDUE':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-300 ${padding}`}
        >
          <AlertTriangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1 text-rose-600`} />
          <span>Em atraso</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${padding}`}
        >
          <XCircle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1 text-slate-500`} />
          <span>Cancelado</span>
        </span>
      );
    case 'REFUNDED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${padding}`}
        >
          <RotateCcw className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1 text-purple-600`} />
          <span>Estornado</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${padding}`}>
          {status}
        </span>
      );
  }
}

export function PaymentMethodBadge({
  method,
}: {
  method?: PaymentMethod | null;
}) {
  if (!method) {
    return <span className="text-xs text-slate-400 font-normal">—</span>;
  }

  switch (method) {
    case 'PIX':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <QrCode className="w-3 h-3 mr-1 text-teal-600" />
          PIX
        </span>
      );
    case 'CARD':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <CreditCard className="w-3 h-3 mr-1 text-blue-600" />
          Cartão
        </span>
      );
    case 'CASH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Banknote className="w-3 h-3 mr-1 text-emerald-600" />
          Dinheiro
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{method}</span>;
  }
}
