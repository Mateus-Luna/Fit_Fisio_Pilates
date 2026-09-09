import { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Save,
  Undo,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertCircle,
} from '../common/Icons';

interface DocumentEditorProps {
  initialContent: string;
  title: string;
  subtitle?: string;
  documentType: 'RECEIPT' | 'CERTIFICATE';
  studentName?: string;
  onSave?: (content: string) => Promise<void> | void;
  readOnly?: boolean;
}

export function DocumentEditor({
  initialContent,
  title,
  subtitle,
  documentType,
  studentName,
  onSave,
  readOnly = false,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      setSavedSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erro ao salvar o documento.';
      setError(msg || 'Erro ao salvar o documento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar o conteúdo original do documento?')) {
      setContent(initialContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4" id="document-editor-container">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
              Salvo com sucesso!
            </span>
          )}

          {error && (
            <span className="flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-4 h-4 mr-1 text-rose-500" />
              {error}
            </span>
          )}

          <button
            type="button"
            onClick={handlePrint}
            id="btn-print-document"
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>

          {!readOnly && onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              id="btn-save-document"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar do editor de texto rico (oculta na impressão) */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 print:hidden text-slate-700">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="px-2 py-1 font-bold rounded hover:bg-slate-200 text-xs"
            title="Negrito"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="px-2 py-1 italic rounded hover:bg-slate-200 text-xs font-serif"
            title="Itálico"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="px-2 py-1 underline rounded hover:bg-slate-200 text-xs"
            title="Sublinhado"
          >
            U
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="px-2 py-1 font-bold rounded hover:bg-slate-200 text-xs"
            title="Título 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="px-2 py-1 font-semibold rounded hover:bg-slate-200 text-xs"
            title="Título 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Parágrafo normal"
          >
            P
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Lista com marcadores"
          >
            • Lista
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Lista numerada"
          >
            1. Lista
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('justifyLeft')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Alinhar à Esquerda"
          >
            Esq
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyCenter')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Centralizar"
          >
            Centro
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyRight')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Alinhar à Direita"
          >
            Dir
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyFull')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-xs"
            title="Justificar"
          >
            Justificado
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-1 rounded hover:bg-slate-200 text-xs"
            title="Desfazer"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded hover:bg-slate-200 text-xs text-rose-600"
            title="Restaurar padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Folha de Documento estilo A4 Impressão */}
      <div className="flex justify-center bg-slate-100 p-4 sm:p-6 rounded-xl border border-slate-200 overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0">
        <div
          id="printable-document-sheet"
          className="w-full max-w-[800px] min-h-[960px] bg-white shadow-md print:shadow-none p-8 sm:p-12 text-slate-800 flex flex-col justify-between rounded-sm border border-slate-200 print:border-none"
        >
          {/* Cabeçalho Oficial do Centro */}
          <div>
            <div className="border-b-2 border-teal-600 pb-4 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-teal-800 tracking-tight">
                  FitFisio Pilates & Saúde
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Centro Especializado em Pilates, Reabilitação, Atividades Aquáticas e Fisioterapia
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  CNPJ: 12.345.678/0001-90 • Resp. Técnica: Aline Guimarães • Tel: (11) 98765-4321
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {documentType === 'RECEIPT' ? 'Recibo de Prestação de Serviço' : 'Atestado / Declaração'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Emitido em: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Conteúdo Editável */}
            <div
              ref={editorRef}
              id="document-editable-content"
              contentEditable={!readOnly}
              onInput={handleInput}
              dangerouslySetInnerHTML={{ __html: content }}
              className="outline-none min-h-[400px] prose max-w-none text-slate-700 leading-relaxed text-sm focus:ring-1 focus:ring-teal-400 focus:bg-teal-50/20 p-2 rounded transition-colors"
            />
          </div>

          {/* Rodapé e Linhas de Assinatura */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-600 mt-8">
              <div>
                <div className="border-b border-slate-400 mb-2 w-48 mx-auto" />
                <p className="font-semibold text-slate-800">FitFisio Pilates & Saúde</p>
                <p className="text-[11px] text-slate-400">Aline Guimarães - Direção</p>
              </div>
              <div>
                <div className="border-b border-slate-400 mb-2 w-48 mx-auto" />
                <p className="font-semibold text-slate-800">
                  {studentName || 'Assinatura do(a) Aluno(a) / Responsável'}
                </p>
                <p className="text-[11px] text-slate-400">Aluno(a) ou Responsável Legal</p>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-8 print:mt-12">
              FitFisio Pilates & Saúde • Documento gerado eletronicamente através do sistema de gestão integrada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
