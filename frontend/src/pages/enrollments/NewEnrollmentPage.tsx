import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Percent,
  Sparkles,
  Activity,
  AlertTriangle,
  User,
} from '../../components/common/Icons';
import { studentsService, type Student } from '../../services/students.service';
import { modalitiesService, type Modality } from '../../services/modalities.service';
import { classesService, type Class } from '../../services/classes.service';
import { enrollmentsService } from '../../services/enrollments.service';
import { discountsService } from '../../services/discounts.service';
import { familiesService, type Family } from '../../services/families.service';

interface ModalityItemDraft {
  tempId: string;
  modalityId: string;
  classId: string;
  startDate: string;
  discountPercentage: number;
  observation: string;
}

export function NewEnrollmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId');
  const preselectedModalityId = searchParams.get('modalityId');

  const [students, setStudents] = useState<Student[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aluno
  const [studentMode, setStudentMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');

  // Novo Aluno (se escolher cadastrar no fluxo)
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    birthDate: '',
    phone: '',
    address: '',
    observation: '',
    type: 'ADULT' as 'ADULT' | 'CHILD',
    rg: '',
    cpf: '',
    familyId: '',
  });

  // Múltiplas modalidades a matricular (Obrigatório ao menos 1)
  const [modalitiesDraft, setModalitiesDraft] = useState<ModalityItemDraft[]>([
    {
      tempId: 'draft-1',
      modalityId: preselectedModalityId || '',
      classId: '',
      startDate: new Date().toISOString().split('T')[0],
      discountPercentage: 0,
      observation: '',
    },
  ]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [stdList, modList, clsList, famList] = await Promise.all([
          studentsService.findAll(),
          modalitiesService.findAll(),
          classesService.findAll(),
          familiesService.findAll(),
        ]);
        setStudents(stdList);
        setModalities(modList.filter((m) => m.active));
        setClasses(clsList);
        setFamilies(famList);

        if (preselectedStudentId) {
          setSelectedStudentId(preselectedStudentId);
          // Pré-seleciona a primeira modalidade que o aluno ainda não faz
          const currentStd = stdList.find((s) => s.id === preselectedStudentId);
          if (currentStd && !preselectedModalityId) {
            const currentModIds = (currentStd.enrollments || [])
              .filter((e) => e.status !== 'CANCELLED')
              .map((e) => e.modalityId);
            const firstAvailable = modList.find((m) => m.active && !currentModIds.includes(m.id));
            if (firstAvailable) {
              setModalitiesDraft([
                {
                  tempId: 'draft-1',
                  modalityId: firstAvailable.id,
                  classId: '',
                  startDate: new Date().toISOString().split('T')[0],
                  discountPercentage: (currentStd.familyId || currentStd.family?.id) ? 10 : 0,
                  observation: '',
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErrorMessage('Erro ao carregar lista de alunos e modalidades.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [preselectedStudentId, preselectedModalityId]);

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId);

  // Modalidades que o aluno já cursa ativamente
  const existingActiveModalityIds = (selectedStudentObj?.enrollments || [])
    .filter((e) => e.status !== 'CANCELLED')
    .map((e) => e.modalityId);

  // Ao mudar de aluno, ajusta desconto de família e sugere modalidade disponível
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const std = students.find((s) => s.id === studentId);
    if (std) {
      const activeMods = (std.enrollments || [])
        .filter((e) => e.status !== 'CANCELLED')
        .map((e) => e.modalityId);
      const nextAvailable = modalities.find((m) => !activeMods.includes(m.id));

      const studentHasFamily = Boolean(std.familyId || std.family?.id);

      if (nextAvailable) {
        setModalitiesDraft([
          {
            tempId: 'draft-1',
            modalityId: nextAvailable.id,
            classId: '',
            startDate: new Date().toISOString().split('T')[0],
            discountPercentage: studentHasFamily ? 10 : 0,
            observation: '',
          },
        ]);
      } else {
        // Se já faz todas as modalidades, mantém a primeira
        setModalitiesDraft([
          {
            tempId: 'draft-1',
            modalityId: modalities[0]?.id || '',
            classId: '',
            startDate: new Date().toISOString().split('T')[0],
            discountPercentage: studentHasFamily ? 10 : 0,
            observation: '',
          },
        ]);
      }
    }
  };

  const addModalityItem = () => {
    // Busca a próxima modalidade disponível que ainda não esteja no rascunho
    const usedInDraft = modalitiesDraft.map((d) => d.modalityId).filter(Boolean);
    const availableMod = modalities.find(
      (m) => !usedInDraft.includes(m.id) && !existingActiveModalityIds.includes(m.id)
    ) || modalities.find((m) => !usedInDraft.includes(m.id)) || modalities[0];

    setModalitiesDraft((prev) => [
      ...prev,
      {
        tempId: `draft-${Date.now()}-${Math.random()}`,
        modalityId: availableMod ? availableMod.id : '',
        classId: '',
        startDate: new Date().toISOString().split('T')[0],
        discountPercentage: (selectedStudentObj?.familyId || selectedStudentObj?.family?.id || newStudentData.familyId) ? 10 : 0,
        observation: '',
      },
    ]);
  };

  const removeModalityItem = (tempId: string) => {
    if (modalitiesDraft.length <= 1) {
      setErrorMessage('Regra FitFisio: Todo aluno deve estar matriculado em pelo menos uma modalidade.');
      return;
    }
    setModalitiesDraft((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const updateDraftItem = (tempId: string, field: keyof ModalityItemDraft, value: any) => {
    setModalitiesDraft((prev) =>
      prev.map((d) => {
        if (d.tempId !== tempId) return d;
        if (field === 'modalityId') {
          return { ...d, modalityId: value, classId: '' };
        }
        return { ...d, [field]: value };
      })
    );
  };

  // Cálculos consolidados
  const calculations = modalitiesDraft.map((draft) => {
    const mod = modalities.find((m) => m.id === draft.modalityId);
    const contracted = Number(mod?.monthlyPrice || 0);
    return discountsService.calculateLocal(contracted, draft.discountPercentage);
  });

  const totalContracted = calculations.reduce((acc, c) => acc + c.contractedPrice, 0);
  const totalDiscount = calculations.reduce((acc, c) => acc + c.discountAmount, 0);
  const totalFinal = calculations.reduce((acc, c) => acc + c.finalPrice, 0);

  // Validação e Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Valida aluno
    let studentIdToUse = selectedStudentId;
    if (studentMode === 'NEW') {
      if (!newStudentData.name.trim() || !newStudentData.birthDate || !newStudentData.phone.trim()) {
        setErrorMessage('Por favor, preencha os campos obrigatórios: Nome, Data de Nascimento e Telefone.');
        return;
      }
      try {
        setSubmitting(true);
        const createdStudent = await studentsService.create({
          name: newStudentData.name.trim(),
          birthDate: newStudentData.birthDate,
          phone: newStudentData.phone.trim(),
          address: newStudentData.address.trim() || undefined,
          observation: newStudentData.observation.trim() || undefined,
          type: newStudentData.type,
          rg: newStudentData.type === 'ADULT' ? newStudentData.rg : undefined,
          cpf: newStudentData.type === 'ADULT' ? newStudentData.cpf : undefined,
          familyId: newStudentData.familyId && newStudentData.familyId.trim() ? newStudentData.familyId.trim() : null,
        });
        studentIdToUse = createdStudent.id;
      } catch (err: any) {
        setSubmitting(false);
        setErrorMessage(err?.response?.data?.message || 'Erro ao cadastrar novo aluno.');
        return;
      }
    } else {
      if (!studentIdToUse) {
        setErrorMessage('Por favor, selecione um aluno para a matrícula.');
        return;
      }
    }

    // Valida modalidades
    if (modalitiesDraft.length === 0) {
      setErrorMessage('Regra FitFisio: Adicione pelo menos uma modalidade.');
      setSubmitting(false);
      return;
    }

    for (const draft of modalitiesDraft) {
      if (!draft.modalityId) {
        setErrorMessage('Selecione a modalidade em todos os itens de matrícula.');
        setSubmitting(false);
        return;
      }
    }

    // Checar duplicidades na lista
    const modalityIdsList = modalitiesDraft.map((d) => d.modalityId);
    const hasDuplicate = new Set(modalityIdsList).size !== modalityIdsList.length;
    if (hasDuplicate) {
      setErrorMessage('Você selecionou a mesma modalidade mais de uma vez nesta matrícula.');
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);
      // Criar cada matrícula
      for (const draft of modalitiesDraft) {
        await enrollmentsService.create({
          studentId: studentIdToUse,
          modalityId: draft.modalityId,
          classId: draft.classId || null,
          startDate: draft.startDate,
          discountPercentage: Number(draft.discountPercentage) || 0,
          observation: draft.observation || null,
        });
      }

      navigate('/enrollments');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Erro ao registrar as matrículas.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
        Carregando formulário de matrícula...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="new-enrollment-page">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <Link
          to="/enrollments"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Voltar para matrículas"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <FileCheck className="w-6 h-6 mr-2 text-teal-600" />
            Nova Matrícula no FitFisio
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Matricule um novo aluno ou adicione novas modalidades para um aluno já cadastrado.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Atenção</p>
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 font-bold underline"
          >
            Fechar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: IDENTIFICAÇÃO DO ALUNO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-base">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Identificação do Aluno</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStudentMode('EXISTING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  studentMode === 'EXISTING'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Aluno Já Cadastrado
              </button>
              <button
                type="button"
                onClick={() => setStudentMode('NEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  studentMode === 'NEW'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Cadastrar Novo Aluno
              </button>
            </div>
          </div>

          {studentMode === 'EXISTING' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Selecione o Aluno <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  required={studentMode === 'EXISTING'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                >
                  <option value="">-- Escolha um aluno da lista --</option>
                  {students.map((s) => {
                    const activeCount = (s.enrollments || []).filter(
                      (e) => e.status !== 'CANCELLED'
                    ).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type === 'CHILD' ? 'Criança' : 'Adulto'}) - Tel: {s.phone}
                        {s.family?.name ? ` • Família: ${s.family.name}` : ''}
                        {activeCount > 0 ? ` [${activeCount} modalidade(s)]` : ' [Sem modalidade ativa]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedStudentObj && (
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-teal-900 text-sm flex items-center">
                      <User className="w-4 h-4 mr-1 text-teal-700" />
                      {selectedStudentObj.name}
                    </div>
                    {selectedStudentObj.family && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px] border border-amber-200">
                        Família {selectedStudentObj.family.name} (-10% desconto)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                    <span>Telefone: {selectedStudentObj.phone}</span>
                    {selectedStudentObj.cpf && <span>CPF: {selectedStudentObj.cpf}</span>}
                    <span>Faixa: {selectedStudentObj.type === 'ADULT' ? 'Adulto' : 'Criança'}</span>
                  </div>

                  {/* Modalidades que o aluno já cursa */}
                  <div className="pt-2 border-t border-teal-100">
                    <span className="font-semibold text-slate-800 block mb-1">
                      Modalidades atuais deste aluno:
                    </span>
                    {selectedStudentObj.enrollments && selectedStudentObj.enrollments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudentObj.enrollments.map((enr) => (
                          <span
                            key={enr.id}
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${
                              enr.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Activity className="w-3 h-3 mr-1 text-teal-600" />
                            {enr.modality?.name || 'Modalidade'} ({enr.status})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-800 font-medium flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Este aluno não possui nenhuma modalidade ativa vinculada. Escolha uma modalidade abaixo para regularizá-lo.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Formulário integrado de Novo Aluno */
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-teal-900 font-medium">
                Ao salvar, o sistema criará o cadastro do novo aluno e já registrará a matrícula na(s) modalidade(s) selecionada(s) abaixo.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Clara Santos"
                    value={newStudentData.name}
                    onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStudentData.birthDate}
                    onChange={(e) => {
                      const bDate = e.target.value;
                      const birthYear = new Date(bDate).getFullYear();
                      const curYear = new Date().getFullYear();
                      const age = curYear - birthYear;
                      setNewStudentData({
                        ...newStudentData,
                        birthDate: bDate,
                        type: age >= 18 ? 'ADULT' : 'CHILD',
                      });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(83) 99999-9999"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo / Faixa Etária
                  </label>
                  <select
                    value={newStudentData.type}
                    onChange={(e) =>
                      setNewStudentData({
                        ...newStudentData,
                        type: e.target.value as 'ADULT' | 'CHILD',
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  >
                    <option value="ADULT">Adulto</option>
                    <option value="CHILD">Criança (Infantil)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vínculo Familiar (10% de desconto)
                  </label>
                  <select
                    value={newStudentData.familyId}
                    onChange={(e) => {
                      const fId = e.target.value;
                      setNewStudentData({ ...newStudentData, familyId: fId });
                      if (fId) {
                        setModalitiesDraft((prev) =>
                          prev.map((d) => (d.discountPercentage === 0 ? { ...d, discountPercentage: 10 } : d))
                        );
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  >
                    <option value="">Nenhuma família</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        Família {f.name} (-10%)
                      </option>
                    ))}
                  </select>
                </div>

                {newStudentData.type === 'ADULT' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CPF (Opcional)</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={newStudentData.cpf}
                        onChange={(e) =>
                          setNewStudentData({ ...newStudentData, cpf: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">RG (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: 12.345.678-9"
                        value={newStudentData.rg}
                        onChange={(e) =>
                          setNewStudentData({ ...newStudentData, rg: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: MODALIDADES, TURMAS E DESCONTOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-base">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Modalidades e Turmas Contratadas (Obrigatório)</span>
            </div>

            <button
              type="button"
              onClick={addModalityItem}
              id="btn-add-modality-item"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Outra Modalidade</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Associe uma ou mais modalidades (Pilates, Fisioterapia, Hidroginástica, Natação, etc.) com turmas, horários e descontos aplicados.
          </p>

          <div className="space-y-4">
            {modalitiesDraft.map((draft, index) => {
              const selectedMod = modalities.find((m) => m.id === draft.modalityId);
              const availableClasses = classes.filter((c) => c.modalityId === draft.modalityId);
              const isAlreadyEnrolled =
                studentMode === 'EXISTING' && existingActiveModalityIds.includes(draft.modalityId);

              const calc = calculations[index] || {
                contractedPrice: 0,
                discountPercentage: 0,
                discountAmount: 0,
                finalPrice: 0,
              };

              return (
                <div
                  key={draft.tempId}
                  className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                      Modalidade #{index + 1}
                      {isAlreadyEnrolled && (
                        <span className="ml-2 text-[11px] text-amber-700 font-medium normal-case bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Aluno já cursa esta modalidade
                        </span>
                      )}
                    </span>

                    {modalitiesDraft.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModalityItem(draft.tempId)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remover esta modalidade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Selecionar Modalidade */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Modalidade <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={draft.modalityId}
                        onChange={(e) => updateDraftItem(draft.tempId, 'modalityId', e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">-- Selecione a modalidade --</option>
                        {modalities.map((m) => {
                          const alreadyIn =
                            studentMode === 'EXISTING' && existingActiveModalityIds.includes(m.id);
                          return (
                            <option key={m.id} value={m.id}>
                              {alreadyIn ? `[Já cursa] ` : `+ `}
                              {m.name} (R$ {Number(m.monthlyPrice).toFixed(2)}/mês)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Selecionar Turma se aplicável */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Turma / Horário {selectedMod?.requiresClass ? '*' : '(Opcional)'}
                      </label>
                      <select
                        value={draft.classId}
                        onChange={(e) => updateDraftItem(draft.tempId, 'classId', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">
                          {availableClasses.length === 0
                            ? '-- Nenhuma turma específica --'
                            : '-- Selecione a turma --'}
                        </option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} (Vagas: {cls.enrolledCount || 0}/{cls.capacity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Data de Início */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Data de Início <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={draft.startDate}
                        onChange={(e) => updateDraftItem(draft.tempId, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Detalhes de Desconto e Preço */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 items-end">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Preço Tabela
                      </label>
                      <div className="text-sm font-semibold text-slate-700 py-1.5 px-3 bg-slate-100 rounded-lg">
                        R$ {calc.contractedPrice.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                        <Percent className="w-3 h-3 mr-1 text-teal-600" />
                        Desconto (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={draft.discountPercentage}
                        onChange={(e) =>
                          updateDraftItem(
                            draft.tempId,
                            'discountPercentage',
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Desconto R$
                      </label>
                      <div className="text-sm font-medium text-emerald-600 py-1.5 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        - R$ {calc.discountAmount.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Valor Final Mensal
                      </label>
                      <div className="text-sm font-bold text-teal-700 py-1.5 px-3 bg-teal-50 rounded-lg border border-teal-200">
                        R$ {calc.finalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Observação da matrícula (opcional, ex: plano familiar, atestado entregue na recepção)"
                      value={draft.observation}
                      onChange={(e) => updateDraftItem(draft.tempId, 'observation', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-600 placeholder-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo Financeiro Consolidado */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div>
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-teal-600" />
                Resumo Consolidado da Matrícula
              </div>
              <p className="text-xs text-teal-700 mt-0.5">
                Total de {modalitiesDraft.length} modalidade(s) selecionada(s)
              </p>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[11px] text-slate-500 block">Total de Tabela</span>
                <span className="text-sm font-semibold text-slate-700">
                  R$ {totalContracted.toFixed(2)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div>
                  <span className="text-[11px] text-emerald-600 block">Total Descontos</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    - R$ {totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pl-4 border-l border-teal-200">
                <span className="text-[11px] text-teal-800 font-bold block uppercase">
                  Mensalidade Total
                </span>
                <span className="text-xl font-extrabold text-teal-800">
                  R$ {totalFinal.toFixed(2)}
                  <span className="text-xs font-normal text-teal-600">/mês</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: DOCUMENTOS E HOMOLOGAÇÃO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-base border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold">
              3
            </span>
            <span>Documentos e Homologação</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-800 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" />
              Geração Automática do Recibo de Prestação de Serviço
            </p>
            <p>
              Ao salvar, o sistema criará as matrículas com status inicial de{' '}
              <strong className="text-amber-700">Pendente de Documentação</strong> e gerará automaticamente o{' '}
              <strong>Recibo de Prestação de Serviço</strong> timbrado para cada modalidade contratada.
            </p>
            <p>
              Você poderá revisar o recibo, editar as cláusulas e enviar a matrícula para{' '}
              <strong>Homologação de Aline</strong> na próxima tela.
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Link
            to="/enrollments"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            id="btn-submit-enrollment"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>{submitting ? 'Registrando...' : 'Concluir e Gerar Matrícula'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
