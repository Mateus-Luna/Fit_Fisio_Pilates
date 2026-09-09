import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  RefreshCw,
  Activity,
  AlertCircle,
  AlertTriangle,
} from '../../components/common/Icons';

import {
  studentsService,
  type Student,
  type StudentType,
} from '../../services/students.service';

import {
  familiesService,
  type Family,
} from '../../services/families.service';

import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';

import {
  classesService,
  type Class,
} from '../../services/classes.service';

import {
  enrollmentsService,
} from '../../services/enrollments.service';

interface DraftEnrollment {
  tempId: string;
  modalityId: string;
  classId: string;
  startDate: string;
  discountPercentage: number;
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

function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-sky-100', text: 'text-sky-800' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getModalityBadgeStyle(name: string = ''): string {
  const lower = name.toLowerCase();
  if (lower.includes('pilates')) return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  if (lower.includes('hidro')) return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100';
  if (lower.includes('natação') || lower.includes('natacao')) return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  if (lower.includes('fisio')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  if (lower.includes('academia')) return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
  return 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ADULT' | 'CHILD'>('ALL');
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'ALL' | 'WITH_ENROLLMENT' | 'WITHOUT_ENROLLMENT'>('ALL');

  // Modal de formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [type, setType] = useState<StudentType>('ADULT');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [observation, setObservation] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [familyId, setFamilyId] = useState('');

  // Rascunho de modalidades e turmas para matrícula inicial (Obrigatório ao menos 1)
  const [draftEnrollments, setDraftEnrollments] = useState<DraftEnrollment[]>([]);

  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [studentsData, familiesData, modalitiesData, classesData] = await Promise.all([
        studentsService.findAll(),
        familiesService.findAll(),
        modalitiesService.findAll(),
        classesService.findAll(),
      ]);

      setStudents(studentsData);
      setFamilies(familiesData);
      setModalities(modalitiesData.filter((m) => m.active));
      setClasses(classesData.filter((c) => c.active));
    } catch {
      setError('Não foi possível carregar os dados de estudantes e modalidades.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName('');
    setBirthDate('');
    setType('ADULT');
    setPhone('');
    setAddress('');
    setObservation('');
    setRg('');
    setCpf('');
    setFamilyId('');
    setEditingStudent(null);
    setDraftEnrollments([]);
    setError('');
  }

  function openCreateForm() {
    resetForm();
    // Inicia com a primeira modalidade ativa para cumprir a regra de estar sempre matriculado
    const activeMods = modalities.filter((m) => m.active);
    const defaultMod = activeMods[0];

    setDraftEnrollments([
      {
        tempId: `draft-${Date.now()}`,
        modalityId: defaultMod ? defaultMod.id : '',
        classId: '',
        startDate: new Date().toISOString().split('T')[0],
        discountPercentage: 0,
      },
    ]);
    setIsFormOpen(true);
  }

  function openEditForm(student: Student) {
    setEditingStudent(student);
    setName(student.name);
    setBirthDate(student.birthDate ? student.birthDate.slice(0, 10) : '');
    setType(student.type);
    setPhone(student.phone);
    setAddress(student.address ?? '');
    setObservation(student.observation ?? '');
    setRg(student.rg ?? '');
    setCpf(student.cpf ?? '');
    setFamilyId(student.familyId || student.family?.id || '');
    setDraftEnrollments([]);
    setIsFormOpen(true);
  }

  // Manipulação de turmas/modalidades no formulário de novo aluno
  const addDraftEnrollment = () => {
    const usedIds = draftEnrollments.map((d) => d.modalityId);
    const nextAvailable = modalities.find((m) => !usedIds.includes(m.id));

    setDraftEnrollments((prev) => [
      ...prev,
      {
        tempId: `draft-${Date.now()}-${Math.random()}`,
        modalityId: nextAvailable ? nextAvailable.id : '',
        classId: '',
        startDate: new Date().toISOString().split('T')[0],
        discountPercentage: familyId ? 10 : 0,
      },
    ]);
  };

  const removeDraftEnrollment = (tempId: string) => {
    if (draftEnrollments.length <= 1) {
      setError('Regra FitFisio: Todo aluno deve estar matriculado em pelo menos uma modalidade ao ser cadastrado.');
      return;
    }
    setDraftEnrollments((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const updateDraftEnrollment = (tempId: string, field: keyof DraftEnrollment, value: any) => {
    setDraftEnrollments((prev) =>
      prev.map((d) => {
        if (d.tempId !== tempId) return d;
        if (field === 'modalityId') {
          return { ...d, modalityId: value, classId: '' };
        }
        return { ...d, [field]: value };
      })
    );
  };

  // Ao alterar a família no formulário, sugere o desconto de 10%
  const handleFamilyChange = (newFamId: string) => {
    setFamilyId(newFamId);
    if (newFamId) {
      setDraftEnrollments((prev) =>
        prev.map((d) => (d.discountPercentage === 0 ? { ...d, discountPercentage: 10 } : d))
      );
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !birthDate || !phone.trim()) {
      setError('Por favor, preencha os campos obrigatórios: Nome, Data de Nascimento e Telefone.');
      return;
    }

    // Regra: se for novo aluno, deve ter pelo menos 1 modalidade válida selecionada!
    if (!editingStudent) {
      if (draftEnrollments.length === 0) {
        setError('Regra FitFisio: O aluno novo deve ser matriculado em pelo menos uma modalidade.');
        return;
      }

      for (const draft of draftEnrollments) {
        if (!draft.modalityId) {
          setError('Selecione a modalidade em todos os itens de matrícula.');
          return;
        }
      }

      const modIds = draftEnrollments.map((d) => d.modalityId);
      if (new Set(modIds).size !== modIds.length) {
        setError('Você selecionou a mesma modalidade mais de uma vez. Selecione modalidades distintas.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      const familyPayload = familyId && familyId.trim() ? familyId.trim() : null;

      if (editingStudent) {
        await studentsService.update(editingStudent.id, {
          name: name.trim(),
          birthDate,
          type,
          phone: phone.trim(),
          address: address.trim() || undefined,
          observation: observation.trim() || undefined,
          rg: type === 'ADULT' ? rg.trim() || undefined : undefined,
          cpf: type === 'ADULT' ? cpf.trim() || undefined : undefined,
          familyId: familyPayload,
        });
        setSuccessMessage(`Dados de ${name} atualizados com sucesso!`);
      } else {
        // 1. Cadastra o aluno
        const newStudent = await studentsService.create({
          name: name.trim(),
          birthDate,
          type,
          phone: phone.trim(),
          address: address.trim() || undefined,
          observation: observation.trim() || undefined,
          rg: type === 'ADULT' ? rg.trim() || undefined : undefined,
          cpf: type === 'ADULT' ? cpf.trim() || undefined : undefined,
          familyId: familyPayload,
        });

        // 2. Matricula imediatamente em cada modalidade/turma selecionada
        for (const draft of draftEnrollments) {
          await enrollmentsService.create({
            studentId: newStudent.id,
            modalityId: draft.modalityId,
            classId: draft.classId || null,
            startDate: draft.startDate,
            discountPercentage: Number(draft.discountPercentage) || 0,
          });
        }

        setSuccessMessage(
          `Aluno ${name} cadastrado com sucesso e matriculado em ${draftEnrollments.length} modalidade(s)!`
        );
      }

      resetForm();
      setIsFormOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        msg ||
          (editingStudent
            ? 'Não foi possível atualizar o estudante.'
            : 'Não foi possível cadastrar o estudante e suas matrículas.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(student: Student) {
    try {
      setError('');
      await studentsService.deactivate(student.id);
      setSuccessMessage(`Aluno ${student.name} desativado.`);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Não foi possível desativar o estudante.');
    }
  }

  async function handleActivate(student: Student) {
    try {
      setError('');
      await studentsService.activate(student.id);
      setSuccessMessage(`Aluno ${student.name} ativado com sucesso!`);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Não foi possível ativar o estudante.');
    }
  }

  async function handleDelete(student: Student) {
    const activeEnrollments = (student.enrollments || []).filter(
      (e) => e.status !== 'CANCELLED' && e.status !== 'COMPLETED'
    );

    if (activeEnrollments.length > 0) {
      const ok = window.confirm(
        `Atenção: ${student.name} possui ${activeEnrollments.length} matrícula(s) ativa(s). Se confirmar a exclusão, todos os registros relacionados serão apagados. Deseja realmente excluir permanentemente?`
      );
      if (!ok) return;
    } else {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir permanentemente o cadastro de ${student.name}?`
      );
      if (!confirmed) return;
    }

    try {
      setError('');
      await studentsService.remove(student.id);
      setSuccessMessage(`Cadastro de ${student.name} excluído.`);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Não foi possível excluir o estudante. Verifique se ele possui dados fiscais protegidos.');
    }
  }

  // Filtragem
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query) ||
        (s.cpf && s.cpf.toLowerCase().includes(query)) ||
        (s.family?.name && s.family.name.toLowerCase().includes(query));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.active) ||
        (statusFilter === 'INACTIVE' && !s.active);

      const matchType = typeFilter === 'ALL' || s.type === typeFilter;
      const matchFamily = familyFilter === 'ALL' || s.familyId === familyFilter || s.family?.id === familyFilter;

      const activeEnrollmentsCount = (s.enrollments || []).filter(
        (e) => e.status !== 'CANCELLED'
      ).length;

      const matchEnrollment =
        enrollmentFilter === 'ALL' ||
        (enrollmentFilter === 'WITH_ENROLLMENT' && activeEnrollmentsCount > 0) ||
        (enrollmentFilter === 'WITHOUT_ENROLLMENT' && activeEnrollmentsCount === 0);

      return matchSearch && matchStatus && matchType && matchFamily && matchEnrollment;
    });
  }, [students, searchTerm, statusFilter, typeFilter, familyFilter, enrollmentFilter]);

  // Métricas
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const withEnrollments = students.filter(
      (s) => (s.enrollments || []).filter((e) => e.status !== 'CANCELLED').length > 0
    ).length;
    const adults = students.filter((s) => s.type === 'ADULT').length;
    const children = students.filter((s) => s.type === 'CHILD').length;
    return { total, active, withEnrollments, adults, children };
  }, [students]);

  return (
    <div className="space-y-6" id="students-page">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-teal-600" aria-hidden="true" />
            Gestão de Alunos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cadastre novos alunos com matrícula imediata em turmas e acompanhe a regularidade de modalidades.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          id="btn-new-student"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600"
          aria-label="Cadastrar novo aluno e já matricular em modalidades"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {/* Mensagens de Feedback Acessíveis */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold underline ml-2"
            aria-label="Fechar mensagem de erro"
          >
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline ml-2"
            aria-label="Fechar mensagem de sucesso"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Métricas e Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Total de Alunos
            </span>
            <span className="p-2 rounded-lg bg-teal-50 text-teal-700" aria-hidden="true">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.adults} adultos • {stats.children} crianças
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Alunos Ativos
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700" aria-hidden="true">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.active}</div>
          <div className="text-xs text-slate-500 mt-1">Cadastros ativos no sistema</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Com Matrícula
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{stats.withEnrollments}</div>
          <div className="text-xs text-slate-500 mt-1">Matriculados em turmas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Famílias Vinculadas
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700" aria-hidden="true">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{families.length}</div>
          <div className="text-xs text-slate-500 mt-1">Com desconto de 10% aplicado</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Campo de Busca Textual */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="student-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone, CPF ou família..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
              aria-label="Buscar estudantes"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Limpar campo de busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ativos ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inativos ({stats.total - stats.active})
            </button>
          </div>
        </div>

        {/* Linha secundária de filtros */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Filtrar:</span>

          {/* Faixa Etária */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
            aria-label="Filtrar por faixa etária"
          >
            <option value="ALL">Todas as faixas etárias</option>
            <option value="ADULT">Apenas Adultos</option>
            <option value="CHILD">Apenas Crianças</option>
          </select>

          {/* Situação da Matrícula */}
          <select
            value={enrollmentFilter}
            onChange={(e) => setEnrollmentFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
            aria-label="Filtrar por situação de matrícula"
          >
            <option value="ALL">Todas as matrículas</option>
            <option value="WITH_ENROLLMENT">Com Matrícula Ativa</option>
            <option value="WITHOUT_ENROLLMENT">Sem Matrícula Ativa (Atenção)</option>
          </select>

          {/* Família */}
          {families.length > 0 && (
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
              aria-label="Filtrar por grupo familiar"
            >
              <option value="ALL">Todas as famílias</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  Família: {f.name}
                </option>
              ))}
            </select>
          )}

          {/* Indicador de resultados */}
          <span className="ml-auto text-slate-500 font-medium" aria-live="polite">
            Exibindo {filteredStudents.length} de {students.length} alunos
          </span>
        </div>
      </div>

      {/* Modal / Diálogo de Criação ou Edição de Aluno */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-teal-100 text-teal-800" aria-hidden="true">
                  {editingStudent ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </span>
                <div>
                  <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                    {editingStudent ? 'Editar Cadastro do Aluno' : 'Novo Aluno e Matrícula Obrigatória'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingStudent
                      ? 'Atualize os dados cadastrais e confira as modalidades do aluno.'
                      : 'Cadastre o aluno e já o matricule em uma ou mais turmas (obrigatório).'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
                aria-label="Fechar formulário"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Seção 1: Dados Pessoais */}
              <div>
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">
                  1. Dados Pessoais do Aluno
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="student-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="student-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Sousa"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="student-birth-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Data de Nascimento <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="student-birth-input"
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="student-type-select" className="block text-xs font-semibold text-slate-700 mb-1">
                      Faixa Etária / Tipo <span className="text-rose-600">*</span>
                    </label>
                    <select
                      id="student-type-select"
                      value={type}
                      onChange={(e) => setType(e.target.value as StudentType)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    >
                      <option value="ADULT">Adulto</option>
                      <option value="CHILD">Criança (Até 12 anos)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Documentação (Se Adulto) */}
              {type === 'ADULT' && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">
                    2. Documentos Pessoais
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="student-cpf-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        CPF (Opcional)
                      </label>
                      <input
                        id="student-cpf-input"
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="student-rg-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        RG (Opcional)
                      </label>
                      <input
                        id="student-rg-input"
                        type="text"
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                        placeholder="Ex: 12.345.678-9"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Seção 3: Contato & Família */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">
                  {type === 'ADULT' ? '3.' : '2.'} Contato e Vínculo Familiar
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="student-phone-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone / WhatsApp <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="student-phone-input"
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(83) 99999-9999"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="student-family-select" className="block text-xs font-semibold text-slate-700 mb-1">
                      Vínculo Familiar (Gera 10% de desconto)
                    </label>
                    <select
                      id="student-family-select"
                      value={familyId}
                      onChange={(e) => handleFamilyChange(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    >
                      <option value="">Nenhuma família vinculada</option>
                      {families.map((f) => (
                        <option key={f.id} value={f.id}>
                          Família {f.name} (Desconto 10%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="student-address-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço Residencial (Opcional)
                    </label>
                    <input
                      id="student-address-input"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, bairro e cidade"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="student-obs-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Observações Médicas ou Gerais (Opcional)
                    </label>
                    <textarea
                      id="student-obs-input"
                      rows={2}
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Ex: Restrições articulares, indicação médica, objetivos terapêuticos..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Matrícula Obrigatória em Modalidades (Para Novo Aluno) */}
              {!editingStudent ? (
                <div className="pt-4 border-t border-slate-100 bg-teal-50/40 p-4 rounded-xl border border-teal-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center">
                        <Activity className="w-4 h-4 mr-1 text-teal-700" aria-hidden="true" />
                        4. Matrícula Obrigatória em Turmas <span className="text-rose-600 ml-1">*</span>
                      </h3>
                      <p className="text-[11px] text-teal-800 font-medium">
                        Regra FitFisio: Em nenhum momento o aluno pode ficar sem matrícula. Selecione ao menos uma modalidade e turma inicial.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addDraftEnrollment}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-colors"
                      aria-label="Adicionar mais uma modalidade para este aluno"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>+ Modalidade</span>
                    </button>
                  </div>

                  {/* Lista de Modalidades Selecionadas */}
                  <div className="space-y-3 mt-3">
                    {draftEnrollments.map((draft, idx) => {
                      const selectedMod = modalities.find((m) => m.id === draft.modalityId);
                      const modClasses = classes.filter((c) => c.modalityId === draft.modalityId);

                      return (
                        <div
                          key={draft.tempId}
                          className="bg-white p-3.5 rounded-xl border border-teal-200/80 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800">
                              Modalidade #{idx + 1}
                              {selectedMod && (
                                <span className="ml-2 font-normal text-slate-500">
                                  (Mensalidade base: R$ {Number(selectedMod.monthlyPrice).toFixed(2)})
                                </span>
                              )}
                            </span>

                            {draftEnrollments.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDraftEnrollment(draft.tempId)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold p-1"
                                title="Remover esta modalidade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid gap-2.5 sm:grid-cols-3">
                            {/* Modalidade */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                Modalidade <span className="text-rose-600">*</span>
                              </label>
                              <select
                                required
                                value={draft.modalityId}
                                onChange={(e) => updateDraftEnrollment(draft.tempId, 'modalityId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                              >
                                <option value="">Selecione uma modalidade</option>
                                {modalities.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} - R$ {Number(m.monthlyPrice).toFixed(2)}/mês
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Turma */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                Turma / Horário
                              </label>
                              <select
                                value={draft.classId}
                                onChange={(e) => updateDraftEnrollment(draft.tempId, 'classId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                              >
                                <option value="">Sem turma fixa (Livre)</option>
                                {modClasses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.enrolledCount || 0}/{c.capacity} vagas)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Data de Início e Desconto */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  Início
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={draft.startDate}
                                  onChange={(e) => updateDraftEnrollment(draft.tempId, 'startDate', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  Desc. (%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={draft.discountPercentage}
                                  onChange={(e) =>
                                    updateDraftEnrollment(draft.tempId, 'discountPercentage', Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Para aluno já existente em edição, mostra as modalidades que ele já possui */
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Modalidades Atuais do Aluno</span>
                    <Link
                      to={`/enrollments/new?studentId=${editingStudent.id}`}
                      className="text-teal-700 hover:text-teal-900 font-bold normal-case text-xs flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Matricular em nova modalidade
                    </Link>
                  </h3>
                  {editingStudent.enrollments && editingStudent.enrollments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {editingStudent.enrollments.map((enr) => (
                        <div
                          key={enr.id}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-center space-x-1.5"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-semibold">{enr.modality?.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({enr.status})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
                      <span>Este aluno está sem modalidades ativas.</span>
                      <Link
                        to={`/enrollments/new?studentId=${editingStudent.id}`}
                        className="font-bold underline text-amber-950 ml-2"
                      >
                        Matricular agora
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Ações do Formulário */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{editingStudent ? 'Salvar Alterações' : 'Cadastrar e Matricular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Estudantes */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
            <p className="text-sm font-medium">Carregando lista de estudantes...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs space-y-3">
            <Users className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-slate-800 text-base">Nenhum estudante encontrado</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || familyFilter !== 'ALL' || enrollmentFilter !== 'ALL'
                ? 'Nenhum resultado corresponde aos filtros aplicados. Tente limpar os filtros de busca.'
                : 'Cadastre o primeiro estudante com matrícula para começar a gerenciar o FitFisio.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                  setFamilyFilter('ALL');
                  setEnrollmentFilter('ALL');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Limpar todos os filtros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const avatar = getAvatarColor(student.name);
              const initials = student.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              const activeEnrollments = (student.enrollments || []).filter(
                (e) => e.status !== 'CANCELLED'
              );

              const hasNoActiveEnrollment = activeEnrollments.length === 0;

              return (
                <article
                  key={student.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                    hasNoActiveEnrollment
                      ? 'border-amber-300 bg-amber-50/20'
                      : student.active
                      ? 'border-slate-200/80 hover:border-teal-200'
                      : 'border-slate-200 opacity-75 bg-slate-50/50'
                  }`}
                  aria-label={`Aluno: ${student.name}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informações Principais do Aluno */}
                    <div className="flex items-start space-x-4">
                      {/* Avatar com Iniciais */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${avatar.bg} ${avatar.text}`}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            {student.name}
                          </h2>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              student.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {student.active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" aria-hidden="true" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1 text-slate-500" aria-hidden="true" />
                                Inativo
                              </>
                            )}
                          </span>

                          {/* Tipo Badge */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {student.type === 'ADULT' ? 'Adulto' : 'Criança'}
                          </span>

                          {/* Família Badge */}
                          {(() => {
                            const fam = student.family || (student.familyId ? families.find((f) => f.id === student.familyId) : null);
                            if (!fam) return null;
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Família: {fam.name} (-10%)
                              </span>
                            );
                          })()}

                          {/* Alerta de regra: Aluno sem modalidade ativa */}
                          {hasNoActiveEnrollment && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                              Sem Modalidade Ativa
                            </span>
                          )}
                        </div>

                        {/* Metadados: Idade, Nascimento, Telefone, Endereço */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                          <span className="inline-flex items-center" title="Data de Nascimento">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" aria-hidden="true" />
                            {calculateAge(student.birthDate)} anos ({formatDate(student.birthDate)})
                          </span>

                          <span className="inline-flex items-center" title="Telefone para contato">
                            <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" aria-hidden="true" />
                            <a
                              href={`tel:${student.phone}`}
                              className="hover:text-teal-700 hover:underline font-medium text-slate-700"
                            >
                              {student.phone}
                            </a>
                          </span>

                          {student.cpf && (
                            <span className="inline-flex items-center" title="CPF">
                              <Shield className="w-3.5 h-3.5 mr-1 text-slate-400" aria-hidden="true" />
                              CPF: {student.cpf}
                            </span>
                          )}

                          {student.address && (
                            <span className="inline-flex items-center max-w-xs truncate" title={student.address}>
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" aria-hidden="true" />
                              <span className="truncate">{student.address}</span>
                            </span>
                          )}
                        </div>

                        {/* Observações */}
                        {student.observation && (
                          <div className="text-xs text-slate-500 italic pt-1">
                            Obs: {student.observation}
                          </div>
                        )}

                        {/* Modalidades Matriculadas */}
                        {student.enrollments && student.enrollments.length > 0 ? (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center">
                              <Activity className="w-3.5 h-3.5 mr-1 text-teal-600" aria-hidden="true" />
                              Matrículas:
                            </span>
                            {student.enrollments.map((enr) => {
                              const badgeStyle = getModalityBadgeStyle(enr.modality?.name);
                              const statusLabel =
                                enr.status === 'ACTIVE'
                                  ? 'Ativa'
                                  : enr.status === 'AWAITING_APPROVAL'
                                  ? 'Aguardando Homologação'
                                  : enr.status === 'PENDING_DOCUMENTATION'
                                  ? 'Pendente Docs'
                                  : enr.status === 'SUSPENDED'
                                  ? 'Suspensa'
                                  : 'Cancelada';

                              return (
                                <Link
                                  key={enr.id}
                                  to={`/enrollments/${enr.id}`}
                                  title={`Ver detalhes da matrícula de ${enr.modality?.name || 'Modalidade'}`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shadow-2xs ${badgeStyle}`}
                                >
                                  <span>{enr.modality?.name || 'Modalidade'}</span>
                                  <span className="text-[10px] opacity-75 font-normal">
                                    • {statusLabel}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pt-2">
                            <p className="text-xs text-amber-800 font-medium">
                              ⚠️ Aluno sem modalidade vinculada. O FitFisio exige matrícula em ao menos uma modalidade.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de Ações Rápidas */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Matricular Aluno em Nova Modalidade */}
                      <Link
                        to={`/enrollments/new?studentId=${student.id}`}
                        className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          hasNoActiveEnrollment
                            ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-600'
                            : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-600'
                        }`}
                        title={
                          hasNoActiveEnrollment
                            ? `Regularizar: Matricular ${student.name} em uma modalidade`
                            : `Matricular ${student.name} em uma nova modalidade`
                        }
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{hasNoActiveEnrollment ? 'Matricular Agora' : '+ Nova Matrícula'}</span>
                      </Link>

                      {/* Editar Aluno */}
                      <button
                        type="button"
                        onClick={() => openEditForm(student)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                        title="Editar cadastro do aluno"
                        aria-label={`Editar ${student.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        <span>Editar</span>
                      </button>

                      {/* Ativar ou Desativar */}
                      {student.active ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(student)}
                          className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                          title="Desativar cadastro temporariamente"
                          aria-label={`Desativar ${student.name}`}
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(student)}
                          className="inline-flex items-center px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          title="Reativar cadastro do aluno"
                          aria-label={`Reativar ${student.name}`}
                        >
                          Ativar
                        </button>
                      )}

                      {/* Excluir Aluno */}
                      <button
                        type="button"
                        onClick={() => handleDelete(student)}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                        title="Excluir cadastro"
                        aria-label={`Excluir ${student.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
