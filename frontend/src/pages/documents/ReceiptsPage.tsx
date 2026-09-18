import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
} from '../../components/common/Icons';

export function ReceiptsPage() {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Endpoint do template original em branco servido pelo backend
  const pdfEndpoint = '/documents/receipt-template';
  const fallbackStaticPdf = '/documents/RECIBO%20SERVICO.pdf';

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tenta buscar o arquivo via endpoint oficial de documentos
      const response = await fetch(pdfEndpoint);
      if (!response.ok) {
        // Fallback para arquivo estático
        const fallbackRes = await fetch(fallbackStaticPdf);
        if (!fallbackRes.ok) {
          throw new Error('Não foi possível carregar o arquivo original RECIBO SERVICO.pdf');
        }
        const blob = await fallbackRes.blob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPdfBlobUrl(url);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch (err: unknown) {
      console.error('Erro ao carregar modelo original do PDF:', err);
      setError('Não foi possível carregar o PDF original. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPdf();

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handlePrint = () => {
    // Tenta disparar impressão nativa do iframe
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (e) {
        console.warn('Tentando fallback para impressão do PDF:', e);
      }
    }

    // Fallback: abre nova janela/aba diretamente com o PDF para impressão do navegador
    const targetUrl = pdfBlobUrl || pdfEndpoint;
    const printWindow = window.open(targetUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 300);
      };
    }
  };

  const handleDownload = () => {
    const targetUrl = pdfBlobUrl || pdfEndpoint;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = 'RECIBO SERVICO.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    const targetUrl = pdfBlobUrl || pdfEndpoint;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="space-y-6" id="receipts-page">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-7 h-7 mr-2.5 text-teal-600" aria-hidden="true" />
            Recibos / Documento
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Modelo original em branco para visualização e impressão física (preenchimento manual).
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-print-document"
            onClick={handlePrint}
            disabled={loading || !!error}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Imprimir documento original em branco"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Imprimir documento</span>
          </button>

          <button
            type="button"
            id="btn-download-pdf"
            onClick={handleDownload}
            disabled={loading || !!error}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-medium border border-slate-300 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Baixar arquivo PDF original"
          >
            <Download className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span>Baixar PDF</span>
          </button>

          <button
            type="button"
            id="btn-open-new-tab"
            onClick={handleOpenInNewTab}
            disabled={loading || !!error}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            title="Abrir PDF em nova aba"
            aria-label="Abrir PDF original em nova aba"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Área de Visualização do PDF Original */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-800">Carregando documento original...</p>
            <p className="text-xs text-slate-500 mt-1">
              Preparando visualização do arquivo RECIBO SERVICO.pdf
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-800">Erro ao carregar o modelo</p>
              <p className="text-xs text-slate-500 max-w-md">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadPdf}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Barra informativa do modelo */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium flex items-center text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0" aria-hidden="true" />
                Arquivo original: <strong className="ml-1 text-slate-900">RECIBO SERVICO.pdf</strong> (sem preenchimento automático)
              </span>
              <span className="text-slate-500 text-[11px]">
                Utilize o botão &ldquo;Imprimir documento&rdquo; ou os controles nativos do visualizador para imprimir em A4.
              </span>
            </div>

            {/* Container responsivo para o PDF */}
            <div className="w-full bg-slate-100 p-2 sm:p-4 overflow-auto flex justify-center">
              <div className="w-full max-w-5xl bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                <iframe
                  ref={iframeRef}
                  id="receipt-pdf-frame"
                  src={pdfBlobUrl ? `${pdfBlobUrl}#view=FitH` : `${pdfEndpoint}#view=FitH`}
                  title="Visualização do PDF original RECIBO SERVICO.pdf"
                  className="w-full h-[78vh] min-h-[640px] border-0 block"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
