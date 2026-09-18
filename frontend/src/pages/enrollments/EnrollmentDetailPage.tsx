import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Edit3,
  FileBadge,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
  Layers,
  Sparkles,
  FileCheck,
  Eye,
  MapPin,
} from '../../components/common/Icons';
import {
  enrollmentsService,
  type Enrollment,
  type EnrollmentStatus,
} from '../../services/enrollments.service';
import { documentsService, type AppDocument } from '../../services/documents.service';
import { classesService, type Class } from '../../services/classes.service';
import {
  certificatesService,
  type CertificateMetadataResponse,
} from '../../services/certificates.service';
import { CertificateViewer } from '../../components/certificates/CertificateViewer';

export function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [certificateMeta, setCertificateMeta] = useState<CertificateMetadataResponse | null>(null);
  const [isCertificateViewerModalOpen, setIsCertificateViewerModalOpen] = useState(false);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'RECEIPT' | 'CERTIFICATES'>('DETAILS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editClassId, setEditClassId] = useState('');
  const [editDiscountPercentage, setEditDiscountPercentage] = useState(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editObservation, setEditObservation] = useState('');

  // Modal de novo atestado
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certTitle, setCertTitle] = useState('Atestado Médico de Aptidão Física');
  const [certContent, setCertContent] = useState('');
  const [certIssueDate, setCertIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [certExpirationDate, setCertExpirationDate] = useState('');
  const [certObservation, setCertObservation] = useState('');

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const enr = await enrollmentsService.findOne(id);
      setEnrollment(enr);

      // Carregar documentos associados
      const docs = await documentsService.findAll({ enrollmentId: id });
      setDocuments(docs);

      // Carregar metadados do documento oficial Certificate (Recibo de Serviço)
      try {
        const certData = await certificatesService.getMetadata(id);
        setCertificateMeta(certData);
      } catch (certErr) {
        console.warn('Documento Certificate ainda não inicializado para esta matrícula:', certErr);
        setCertificateMeta(null);
      }

      // Carregar turmas da modalidade para edição
      if (enr.modalityId) {
        const clsList = await classesService.findAll(enr.modalityId);
        setClasses(clsList);
      }

      // Preencher campos de edição
      setEditClassId(enr.classId || '');
      setEditDiscountPercentage(enr.discountPercentage || 0);
      setEditStartDate(enr.startDate ? enr.startDate.split('T')[0] : '');
      setEditObservation(enr.observation || '');
    } catch (err: any) {
      console.error('Erro ao carregar dados da matrícula:', err);
      setFeedback({ type: 'error', text: 'Não foi possível carregar os dados da matrícula.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Transições de status
  const handleApprove = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await enrollmentsService.approve(id);
      setFeedback({ type: 'success', text: 'Matrícula ATIVADA com sucesso! O aluno está ativo nesta modalidade.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao ativar matrícula.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSignedDocument = async (signed: boolean) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await certificatesService.markAsSigned(id, signed);
      setFeedback({
        type: 'success',
        text: signed
          ? 'Contrato formal marcado como ASSINADO pelo aluno/responsável!'
          : 'Status do contrato alterado para PENDENTE de assinatura física.',
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Erro ao atualizar situação de assinatura do contrato.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!id) return;
    if (!window.confirm('Tem certeza que deseja suspender esta matrícula?')) return;
    try {
      setActionLoading(true);
      await enrollmentsService.suspend(id);
      setFeedback({ type: 'success', text: 'Matrícula suspensa com sucesso.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao suspender matrícula.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await enrollmentsService.reactivate(id);
      setFeedback({ type: 'success', text: 'Matrícula reativada com sucesso!' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao reativar matrícula.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !enrollment) return;

    // Regra FitFisio: Em nenhum momento um aluno deve ficar sem estar matriculado em nenhuma modalidade
    const otherActiveEnrollments = (enrollment.student?.enrollments || []).filter(
      (e) => e.id !== enrollment.id && e.status !== 'CANCELLED'
    );

    if (otherActiveEnrollments.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Regra FitFisio: Em nenhum momento um aluno ativo pode ficar sem estar matriculado em nenhuma modalidade. Para cancelar esta modalidade, matricule o aluno em uma nova modalidade antes ou desative o cadastro do aluno na Gestão de Alunos.',
      });
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja CANCELAR esta matrícula em ${enrollment.modality?.name}? O aluno continuará matriculado em suas outras modalidades ativas.`
      )
    )
      return;
    try {
      setActionLoading(true);
      await enrollmentsService.cancel(id);
      setFeedback({ type: 'success', text: 'Matrícula cancelada com sucesso.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao cancelar matrícula.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Imprimir documento oficial homologado diretamente
  const handlePrintHomologatedDocument = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const blob = await certificatesService.getPdfBlob(id);
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback usando iframe oculto para impressão
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        printIframe.src = blobUrl;
        document.body.appendChild(printIframe);
        printIframe.onload = () => {
          setTimeout(() => {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          }, 300);
        };
      }
      setFeedback({ type: 'success', text: 'Documento homologado carregado para impressão!' });
    } catch (err: any) {
      console.error('Erro ao imprimir documento:', err);
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Erro ao carregar documento para impressão. Verifique se o documento foi gerado.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Salvar edição de dados da matrícula
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      await enrollmentsService.update(id, {
        classId: editClassId || null,
        discountPercentage: Number(editDiscountPercentage) || 0,
        startDate: editStartDate,
        observation: editObservation || null,
      });
      setIsEditModalOpen(false);
      setFeedback({ type: 'success', text: 'Dados da matrícula atualizados com sucesso!' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao atualizar matrícula.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Salvar Novo Atestado
  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    try {
      setActionLoading(true);
      const formattedContent =
        certContent ||
        `<h3>ATESTADO MÉDICO DE APTIDÃO FÍSICA</h3><p>Atesto para os devidos fins que o(a) paciente <strong>${enrollment.student?.name}</strong> foi submetido(a) a avaliação clínica e encontra-se apto(a) para a realização de atividades físicas na modalidade de <strong>${enrollment.modality?.name}</strong>.</p><p>Data de emissão: ${new Date(certIssueDate).toLocaleDateString('pt-BR')}</p><br/><br/><p>_____________________________________<br/>Médico(a) Responsável / CRM</p>`;

      await documentsService.create({
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        type: 'CERTIFICATE',
        title: certTitle,
        content: formattedContent,
        issueDate: certIssueDate,
        expirationDate: certExpirationDate || undefined,
        observation: certObservation || undefined,
      });

      setIsCertificateModalOpen(false);
      setFeedback({ type: 'success', text: 'Atestado médico anexado com sucesso!' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Erro ao anexar atestado.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            Matrícula Ativa (Homologada)
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-4 h-4 mr-1.5 text-blue-700" aria-hidden="true" />
            Aguardando Homologação de Aline
          </span>
        );
      case 'PENDING_DOCUMENTATION':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
            Pendente de Documentação
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <PauseCircle className="w-4 h-4 mr-1.5 text-purple-600" />
            Matrícula Suspensa
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
        Carregando detalhes da matrícula...
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="p-12 text-center text-slate-600 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Matrícula não encontrada</h2>
        <Link
          to="/enrollments"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Matrículas</span>
        </Link>
      </div>
    );
  }

  // Obter atestados existentes
  const certificates = documents.filter((d) => d.type === 'CERTIFICATE');

  return (
    <div className="space-y-6" id="enrollment-detail-page">
      {/* Topo / Voltar e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/enrollments"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Matrícula: {enrollment.student?.name}
              </h1>
              {getStatusBadge(enrollment.status)}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Modalidade: <strong className="text-teal-700">{enrollment.modality?.name}</strong> •
              Código: <span className="font-mono text-xs">{enrollment.id}</span>
            </p>
          </div>
        </div>

        {/* Ações do Topo: Documento Homologado e Edição */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Mostrar Documento da Homologação */}
          <button
            type="button"
            onClick={() => setIsCertificateViewerModalOpen(true)}
            id="btn-header-show-certificate"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100/80 shadow-xs transition-colors"
            title="Exibir o documento oficial de homologação"
          >
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>Documento de Homologação</span>
          </button>

          {/* Botão Imprimir Documento Homologado */}
          <button
            type="button"
            onClick={handlePrintHomologatedDocument}
            disabled={actionLoading}
            id="btn-header-print-certificate"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
            title="Imprimir documento oficial homologado da matrícula"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Documento Homologado</span>
          </button>

          {/* Botão de Edição de Dados */}
          {enrollment.status !== 'CANCELLED' && enrollment.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              id="btn-edit-enrollment"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
              <span>Editar Parâmetros</span>
            </button>
          )}
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-75"
          >
            Fechar
          </button>
        </div>
      )}

      {/* SEÇÃO PRINCIPAL DE HOMOLOGAÇÃO / FLUXO DE STATUS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800">
              Formalização e Situação da Matrícula
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(enrollment.status)}
            {certificateMeta?.receipt?.status === 'APPROVED' ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Contrato Assinado
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
                Contrato Pendente de Assinatura
              </span>
            )}
          </div>
        </div>

        {/* Painel de Formalização do Contrato Físico */}
        <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="p-2.5 bg-white text-teal-700 rounded-lg border border-teal-200 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-bold text-slate-900 text-sm">
                  Contrato de Prestação de Serviços (RECIBO SERVICO.pdf)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {certificateMeta?.receipt?.status === 'APPROVED' ? (
                  <span className="text-emerald-800 font-medium">
                    ✓ Via física impressa e assinada pelo aluno/responsável. Matrícula formalizada.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    • Documento emitido. Imprima para assinatura física no balcão e registre aqui após assinado.
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mensalidade: R$ {Number(enrollment.finalPrice).toFixed(2)}/mês • Modalidade: {enrollment.modality?.name} • Início: {new Date(enrollment.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
            {/* Botão para marcar como assinado / pendente */}
            {certificateMeta?.receipt?.status !== 'APPROVED' ? (
              <button
                type="button"
                onClick={() => handleToggleSignedDocument(true)}
                disabled={actionLoading}
                id="btn-mark-signed-quick"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                title="Registrar que o aluno assinou a via física do contrato"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar como assinado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleSignedDocument(false)}
                disabled={actionLoading}
                id="btn-mark-pending-quick"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors disabled:opacity-50"
                title="Voltar contrato para pendente de assinatura"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Marcar como pendente</span>
              </button>
            )}

            {/* Imprimir para assinatura */}
            <button
              type="button"
              onClick={handlePrintHomologatedDocument}
              disabled={actionLoading}
              id="btn-banner-print-certificate"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50"
              title="Imprimir contrato para coleta da assinatura física"
            >
              <Printer className="w-4 h-4 text-teal-600" />
              <span>Imprimir Contrato</span>
            </button>

            {/* Ver Documento na aba */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('RECEIPT');
                const el = document.getElementById('tab-receipt');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              id="btn-goto-certificate-tab"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Visualizar</span>
            </button>
          </div>
        </div>

        {/* Barra de Gestão da Matrícula */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            {enrollment.approvedAt ? (
              <span className="text-slate-600">
                Registrada no sistema em: {new Date(enrollment.approvedAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(enrollment.approvedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span>Cadastrada em: {new Date(enrollment.createdAt).toLocaleDateString('pt-BR')}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Se porventura a matrícula for legada e estiver pendente, botão direto para ativar */}
            {(enrollment.status === 'PENDING_DOCUMENTATION' || enrollment.status === 'AWAITING_APPROVAL') && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                id="btn-approve-enrollment"
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ativar Matrícula</span>
              </button>
            )}

            {/* Se Ativa: Suspender */}
            {enrollment.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={handleSuspend}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Suspender Matrícula</span>
              </button>
            )}

            {/* Se Suspensa: Reativar */}
            {enrollment.status === 'SUSPENDED' && (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reativar Matrícula</span>
              </button>
            )}

            {/* Botão Cancelar Matrícula */}
            {enrollment.status !== 'CANCELLED' && enrollment.status !== 'COMPLETED' && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancelar Matrícula</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ABAS: DETALHES | RECIBO DE PRESTAÇÃO DE SERVIÇO | ATESTADOS */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('DETAILS')}
          id="tab-details"
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'DETAILS'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ficha da Matrícula</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECEIPT')}
          id="tab-receipt"
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'RECEIPT'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Contrato / Recibo de Serviços</span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              certificateMeta?.receipt?.status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            {certificateMeta?.receipt?.status === 'APPROVED' ? 'Assinado' : 'Pendente'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CERTIFICATES')}
          id="tab-certificates"
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'CERTIFICATES'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>Atestados & Declarações</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
            {certificates.length}
          </span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      {activeTab === 'DETAILS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Aluno e Modalidade */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-base border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-teal-600" />
              <span>Dados do Aluno e Modalidade</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Nome do Aluno:</span>
                <span className="font-semibold text-slate-800">{enrollment.student?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Telefone:</span>
                <span className="text-slate-700">{enrollment.student?.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Endereço:</span>
                </span>
                <span className="text-slate-700 text-right max-w-xs">{enrollment.student?.address || 'Não informado'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Modalidade:</span>
                <span className="font-semibold text-teal-700">{enrollment.modality?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Turma:</span>
                <span className="text-slate-800 font-medium">
                  {enrollment.class?.name || (
                    <span className="text-slate-400 italic">Sem turma vinculada</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Data de Início:</span>
                <span className="text-slate-800">
                  {new Date(enrollment.startDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {enrollment.endDate && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Data de Término/Cancelamento:</span>
                  <span className="text-rose-700">
                    {new Date(enrollment.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {enrollment.observation && (
                <div className="pt-2">
                  <span className="text-slate-500 block text-xs mb-1">Observações:</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {enrollment.observation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card Financeiro e Descontos */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-base border-b border-slate-100 pb-3">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>Detalhamento Financeiro e Descontos</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Preço de Tabela:</span>
                <span className="font-semibold text-slate-800">
                  R$ {Number(enrollment.contractedPrice).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center">
                  <Percent className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Desconto Aplicado:
                </span>
                <span className="font-medium text-emerald-600">
                  {enrollment.discountPercentage}% (- R${' '}
                  {Number(enrollment.discountAmount).toFixed(2)})
                </span>
              </div>

              <div className="flex justify-between py-3 bg-teal-50/60 p-3 rounded-lg border border-teal-100 mt-3">
                <span className="font-bold text-teal-900">Mensalidade Final:</span>
                <span className="text-lg font-extrabold text-teal-800">
                  R$ {Number(enrollment.finalPrice).toFixed(2)}
                  <span className="text-xs font-normal text-teal-600">/mês</span>
                </span>
              </div>

              <div className="text-xs text-slate-400 pt-2 leading-relaxed">
                Este valor é sincronizado com o Recibo de Prestação de Serviços timbrado do centro e constará nos relatórios financeiros mensais de Aline.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA DOCUMENTO OFICIAL DE HOMOLOGAÇÃO (CERTIFICATE) */}
      {activeTab === 'RECEIPT' && (
        <div className="space-y-4">
          <CertificateViewer
            enrollmentId={enrollment.id}
            studentName={enrollment.student?.name}
            modalityName={enrollment.modality?.name}
            finalPrice={Number(enrollment.finalPrice)}
            onStatusChange={async () => {
              await loadData();
            }}
          />
        </div>
      )}

      {/* ABA ATESTADOS MÉDICOS E DECLARAÇÕES */}
      {activeTab === 'CERTIFICATES' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Atestados Médicos e Declarações
              </h3>
              <p className="text-xs text-slate-500">
                Documentos comprobatórios de aptidão física para atividades aquáticas ou reabilitação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCertificateModalOpen(true)}
              id="btn-add-certificate"
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Anexar Novo Atestado</span>
            </button>
          </div>

          {certificates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-3">
              <FileBadge className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhum atestado anexado</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Para modalidades aquáticas ou reabilitação, anexe o atestado médico ou declaração de aptidão física.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{cert.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Emitido em:{' '}
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('pt-BR') : '-'}
                        {cert.expirationDate &&
                          ` • Validade: ${new Date(cert.expirationDate).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Válido
                    </span>
                  </div>

                  <div
                    className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: cert.content }}
                  />

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Excluir este atestado?')) {
                          await documentsService.remove(cert.id);
                          await loadData();
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PARÂMETROS DA MATRÍCULA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-teal-600" />
                Editar Parâmetros da Matrícula
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Turma Vinculada
                </label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Sem turma específica --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Vagas: {cls.enrolledCount || 0}/{cls.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={editDiscountPercentage}
                    onChange={(e) => setEditDiscountPercentage(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editObservation}
                  onChange={(e) => setEditObservation(e.target.value)}
                  placeholder="Ex: desconto negociado, observações médicas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO ATESTADO */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <FileBadge className="w-4 h-4 mr-2 text-teal-600" />
                Anexar Atestado / Declaração
              </h3>
              <button
                type="button"
                onClick={() => setIsCertificateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de Emissão *
                  </label>
                  <input
                    type="date"
                    required
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de Validade (Opcional)
                  </label>
                  <input
                    type="date"
                    value={certExpirationDate}
                    onChange={(e) => setCertExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Conteúdo / Parecer Médico
                </label>
                <textarea
                  rows={4}
                  value={certContent}
                  onChange={(e) => setCertContent(e.target.value)}
                  placeholder="Deixe em branco para utilizar o modelo padrão timbrado de aptidão física..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações Internas
                </label>
                <input
                  type="text"
                  value={certObservation}
                  onChange={(e) => setCertObservation(e.target.value)}
                  placeholder="Ex: entregue presencialmente por familiar..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCertificateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DIRETA DO DOCUMENTO OFICIAL (CERTIFICATE PDF) */}
      {isCertificateViewerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                  <FileCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Visualizador Oficial do Documento de Homologação (Certificate)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aluno(a): {enrollment.student?.name} • {enrollment.modality?.name} • Mensalidade: R${' '}
                    {Number(enrollment.finalPrice).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCertificateViewerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                aria-label="Fechar visualizador"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
              <CertificateViewer
                enrollmentId={enrollment.id}
                studentName={enrollment.student?.name}
                modalityName={enrollment.modality?.name}
                finalPrice={Number(enrollment.finalPrice)}
                onStatusChange={async () => {
                  await loadData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
