import { useState, useEffect } from 'react';
import type { Student } from '../../services/students.service';
import { studentsService } from '../../services/students.service';
import { paymentsService } from '../../services/payments.service';
import {
  X,
  Calendar,
  AlertCircle,
  RefreshCw,
  Plus,
  Sparkles,
} from '../common/Icons';

interface GenerateMonthlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  initialStudentId?: string;
}

const MONTHS = [
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

export function GenerateMonthlyModal({
  isOpen,
  onClose,
  onSuccess,
  initialStudentId,
}: GenerateMonthlyModalProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
  const [referenceMonth, setReferenceMonth] = useState<number>(currentMonth);
  const [referenceYear, setReferenceYear] = useState<number>(currentYear);
  const [dueDate, setDueDate] = useState<string>(() => {
    // Default due date: 10th of the current month
    const d = new Date(currentYear, currentMonth - 1, 10);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [error, setError] = useState('');

  async function loadStudents() {
    try {
      setFetchingStudents(true);
      const data = await studentsService.findAll();
      // Filter students with at least 1 active enrollment
      setStudents(data.filter((s) => s.active));
      if (!selectedStudentId && data.length > 0) {
        setSelectedStudentId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
    } finally {
      setFetchingStudents(false);
    }
  }

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  // When referenceMonth or referenceYear changes, update due date to the 10th
  useEffect(() => {
    const day = 10;
    const formattedMonth = String(referenceMonth).padStart(2, '0');
    setDueDate(`${referenceYear}-${formattedMonth}-${String(day).padStart(2, '0')}`);
  }, [referenceMonth, referenceYear]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Selecione um aluno para gerar as mensalidades.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await paymentsService.createMonthlyPaymentsForStudent(
        selectedStudentId,
        {
          referenceMonth,
          referenceYear,
          dueDate: new Date(dueDate).toISOString(),
        },
      );

      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Erro ao gerar mensalidades:', err);
      const msg = err.response?.data?.message || err.message || 'Erro ao gerar mensalidades.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-monthly-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Calendar className="w-5 h-5 text-teal-700" />
            </span>
            <div>
              <h2 id="generate-monthly-title" className="text-lg font-bold text-slate-900 tracking-tight">
                Gerar Mensalidades
              </h2>
              <p className="text-xs text-slate-500">
                Geração automática para todas as modalidades ativas do aluno
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Destaque da regra principal do sistema */}
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-teal-950">Geração Integrada Multi-Modalidades</p>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Se o aluno faz Pilates e Hidroginástica simultaneamente, o backend criará a cobrança
                individualizada para cada matrícula com seus descontos oficiais já aplicados.
              </p>
            </div>
          </div>

          {/* Aluno */}
          <div>
            <label htmlFor="student-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Aluno <span className="text-rose-600">*</span>
            </label>
            {fetchingStudents ? (
              <div className="p-2.5 text-xs text-slate-400">Carregando alunos...</div>
            ) : (
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="">Selecione um aluno ativo</option>
                {students.map((s) => {
                  const enrollmentsCount = s.enrollments?.filter((e) => e.status === 'ACTIVE').length || 0;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({enrollmentsCount} modalidade(s) ativa(s))
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Modalidades ativas do aluno selecionado */}
          {selectedStudent && selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                Modalidades que serão faturadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.enrollments
                  .filter((e) => e.status === 'ACTIVE')
                  .map((e) => (
                    <span
                      key={e.id}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-800 flex items-center space-x-1"
                    >
                      <span>{e.modality?.name || 'Modalidade'}</span>
                      <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1 rounded">
                        {e.billingFrequency === 'BIWEEKLY' ? 'Quinzenal (2x)' : 'Mensal (1x)'}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Mês e Ano de Referência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reference-month-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Referência <span className="text-rose-600">*</span>
              </label>
              <select
                id="reference-month-select"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.value})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reference-year-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Ano de Referência <span className="text-rose-600">*</span>
              </label>
              <select
                id="reference-year-select"
                value={referenceYear}
                onChange={(e) => setReferenceYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear + 1}>{currentYear + 1}</option>
              </select>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div>
            <label htmlFor="due-date-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Vencimento <span className="text-rose-600">*</span>
            </label>
            <input
              id="due-date-input"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
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
              disabled={loading || !selectedStudentId}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Gerar Mensalidades</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
