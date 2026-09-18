import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileCheck,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  AlertCircle,
  Sparkles,
  DollarSign,
  FileText,
} from '../common/Icons';
import {
  certificatesService,
  type CertificateMetadataResponse,
  type CertificateStatus,
} from '../../services/certificates.service';

interface CertificateViewerProps {
  enrollmentId: string;
  studentName?: string;
  modalityName?: string;
  finalPrice?: number;
  onStatusChange?: (newStatus: CertificateStatus) => void;
  className?: string;
}

export function CertificateViewer({
  enrollmentId,
  studentName,
  modalityName,
  finalPrice,
  onStatusChange,
  className = '',
}: CertificateViewerProps) {
  const [metadata, setMetadata] = useState<CertificateMetadataResponse | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de geração com opções
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO'>('PIX');
  const [generateObservation, setGenerateObservation] = useState('');

  // Modo tela cheia / expandido
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadDocument = useCallback(async () => {
    if (!enrollmentId) return;
    try {
      setLoading(true);
      setError(null);

      // Carrega metadados e blob do PDF
      const meta = await certificatesService.getMetadata(enrollmentId);
      setMetadata(meta);

      const blob = await certificatesService.getPdfBlob(enrollmentId);
      const url = URL.createObjectURL(blob);

      setPdfBlobUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
    } catch (err: unknown) {
      console.error('Erro ao carregar documento Certificate:', err);
      const errMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errMessage || 'Não foi possível carregar o documento oficial de homologação.');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    loadDocument();

    return () => {
      setPdfBlobUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
    };
  }, [loadDocument]);

  const handleGenerateDocument = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setGenerating(true);
      setError(null);
      const meta = await certificatesService.generate(enrollmentId, {
        paymentMethod,
        observation: generateObservation || undefined,
      });
      setMetadata(meta);

      // Recarrega o PDF atualizado
      const blob = await certificatesService.getPdfBlob(enrollmentId);
      const url = URL.createObjectURL(blob);

      setPdfBlobUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });

      setIsGenerateModalOpen(false);
      setFeedback({ type: 'success', text: 'Documento oficial gerado e atualizado com sucesso!' });
      if (meta.receipt?.status && onStatusChange) {
        onStatusChange(meta.receipt.status);
      }
    } catch (err: unknown) {
      const errMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFeedback({
        type: 'error',
        text: errMessage || 'Erro ao gerar documento de homologação.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSigned = async (signed: boolean) => {
    try {
      setStatusLoading(true);
      const updated = await certificatesService.markAsSigned(enrollmentId, signed);
      setMetadata((prev) => (prev ? { ...prev, receipt: updated } : null));
      setFeedback({
        type: 'success',
        text: signed
          ? 'Contrato formal marcado como ASSINADO pelo aluno/responsável!'
          : 'Status do documento revertido para PENDENTE de assinatura.',
      });
      if (onStatusChange) {
        onStatusChange(signed ? 'APPROVED' : 'PENDING');
      }
    } catch (err: unknown) {
      const errMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFeedback({
        type: 'error',
        text: errMessage || 'Erro ao atualizar situação de assinatura do documento.',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = metadata?.fileName || `recibo-servico-${enrollmentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch {
        // Fallback para abrir e imprimir
      }
    }
    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    }
  };

  const currentStatus: CertificateStatus = metadata?.receipt?.status || 'PENDING';
  const isSigned = currentStatus === 'APPROVED' || currentStatus === 'SIGNED';

  const getStatusBadge = (status: CertificateStatus) => {
    if (status === 'APPROVED' || status === 'SIGNED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
          Documento Assinado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <Clock className="w-4 h-4 mr-1.5 text-amber-700" />
        Pendente de Assinatura
      </span>
    );
  };

  return (
    <div
      className={`space-y-4 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs p-4 sm:p-6 flex flex-col justify-center'
          : className
      }`}
      id="certificate-viewer-section"
    >
      <div
        className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col ${
          isFullscreen ? 'w-full h-full max-w-7xl mx-auto overflow-hidden' : ''
        }`}
      >
        {/* CABEÇALHO DO DOCUMENTO OFICIAL */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/50 rounded-t-2xl">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                <FileCheck className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Contrato e Recibo de Prestação de Serviços
              </h3>
              {getStatusBadge(currentStatus)}
            </div>
            <p className="text-xs text-slate-500">
              Documento oficial emitido a partir do modelo timbrado do estúdio (
              <strong className="text-slate-700 font-medium">RECIBO SERVICO.pdf</strong>). Imprima para coleta da assinatura
              física de <span className="font-semibold text-slate-800">{studentName || 'Aluno'}</span> em{' '}
              <span className="font-semibold text-teal-700">{modalityName || 'Modalidade'}</span>.
            </p>
          </div>

          {/* BARRA DE AÇÕES DO DOCUMENTO */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Ação de Formalização: Marcar como Assinado / Pendente */}
            {!isSigned ? (
              <button
                type="button"
                onClick={() => handleToggleSigned(true)}
                disabled={statusLoading || generating || !metadata?.receipt}
                id="btn-mark-as-signed"
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
                title="Registrar que o aluno ou responsável assinou a via física impressa"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{statusLoading ? 'Salvando...' : 'Marcar como assinado'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleSigned(false)}
                disabled={statusLoading || generating || !metadata?.receipt}
                id="btn-mark-as-pending"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all disabled:opacity-50"
                title="Voltar status do documento para pendente de assinatura física"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{statusLoading ? 'Atualizando...' : 'Marcar como pendente'}</span>
              </button>
            )}

            {/* Botão Imprimir para Assinatura Física */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfBlobUrl || loading}
              id="btn-print-certificate"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 shadow-xs transition-colors disabled:opacity-50"
              title="Imprimir documento oficial para assinatura física"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>Imprimir p/ Assinatura</span>
            </button>

            {/* Botão Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!pdfBlobUrl || loading}
              id="btn-download-certificate"
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
              title="Baixar PDF do documento oficial"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Baixar PDF</span>
            </button>

            {/* Botão Gerar / Atualizar Documento */}
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={generating || statusLoading}
              id="btn-generate-certificate"
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-all disabled:opacity-50"
              title="Regerar ou ajustar observação/pagamento do documento oficial"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${generating ? 'animate-spin' : ''}`} />
              <span>{metadata?.receipt ? 'Ajustar Dados' : 'Gerar Documento'}</span>
            </button>

            {/* Alternar Tela Cheia */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title={isFullscreen ? 'Reduzir visualização' : 'Expandir para tela cheia'}
              aria-label="Expandir ou reduzir visualizador"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* FEEDBACK DE MENSAGENS */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline hover:opacity-75 font-semibold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* METADADOS E INFORMAÇÕES DE HOMOLOGAÇÃO */}
        {metadata && (
          <div className="mx-5 my-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Valor no Documento:</span>
              <span className="font-bold text-teal-800 text-sm flex items-center mt-0.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-600 mr-0.5" />
                R$ {Number(metadata.finalPrice || finalPrice || 0).toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Modalidade Impressa:</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {metadata.documentServiceName || modalityName || 'Pilates'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Emissão / Preenchimento:</span>
              <span className="text-slate-700 mt-0.5 block font-medium">
                {metadata.receipt?.filledAt
                  ? new Date(metadata.receipt.filledAt).toLocaleDateString('pt-BR')
                  : 'Gerado na homologação'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Homologado em:</span>
              <span className="text-slate-700 mt-0.5 block font-medium">
                {metadata.receipt?.approvedAt
                  ? new Date(metadata.receipt.approvedAt).toLocaleDateString('pt-BR')
                  : 'Aguardando validação'}
              </span>
            </div>

            {metadata.receipt?.observation && (
              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200/60 mt-1">
                <span className="text-slate-500 font-semibold text-[11px]">Observações do Documento: </span>
                <span className="text-slate-700">{metadata.receipt.observation}</span>
              </div>
            )}
          </div>
        )}

        {/* VISUALIZADOR DO PDF REAL EM IFRAME */}
        <div className={`p-4 bg-slate-100/70 flex-1 flex flex-col justify-center relative ${isFullscreen ? 'min-h-0' : ''}`}>
          {loading || generating ? (
            <div className="py-24 text-center text-slate-500 space-y-3">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-teal-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {generating ? 'Gerando documento oficial de homologação...' : 'Carregando documento PDF...'}
              </p>
              <p className="text-xs text-slate-400">Processando preenchimento no template oficial RECIBO SERVICO.pdf</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-slate-600 max-w-md mx-auto space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Falha ao carregar documento oficial</h4>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadDocument}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : pdfBlobUrl ? (
            <div className={`w-full flex-1 rounded-xl overflow-hidden shadow-xs border border-slate-300 bg-white ${isFullscreen ? 'h-full' : 'h-[620px]'}`}>
              <iframe
                ref={iframeRef}
                src={pdfBlobUrl}
                title="Visualização do Documento Oficial de Homologação"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-4 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-base">Documento Oficial Ainda Não Emitido</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Para homologar a matrícula, gere o documento oficial baseado no template padrão{' '}
                  <strong>RECIBO SERVICO.pdf</strong> com os dados do aluno e valor contratado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateDocument()}
                disabled={generating}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Documento Oficial Agora</span>
              </button>
            </div>
          )}
        </div>

        {/* NOTA DE CONFORMIDADE DA REGRA DE NEGÓCIO */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between rounded-b-2xl">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            <span>Documento oficial de homologação da matrícula emitido pelo estúdio. O valor é sincronizado com Enrollment.finalPrice.</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">ID: {enrollmentId}</span>
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÃO / ATUALIZAÇÃO DO DOCUMENTO */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-teal-600" />
                <span>Gerar / Atualizar Documento de Homologação</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDocument} className="space-y-3.5">
              <p className="text-xs text-slate-500 leading-relaxed">
                O documento será gerado no template oficial timbrado com o nome do aluno(a){' '}
                <strong>{studentName || 'Aluno'}</strong>, a modalidade{' '}
                <strong>{modalityName || 'Modalidade'}</strong> e o valor final contratado de{' '}
                <strong>R$ {Number(finalPrice || 0).toFixed(2)}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forma de Pagamento Prevista
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="PIX">PIX (Padrão)</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação Adicional no Documento (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={generateObservation}
                  onChange={(e) => setGenerateObservation(e.target.value)}
                  placeholder="Ex: Pagamento da primeira mensalidade no ato da homologação..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {generating ? 'Gerando...' : 'Confirmar e Gerar PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
