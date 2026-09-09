import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  User,
  Plus,
  RefreshCw,
  Eye,
} from '../../components/common/Icons';
import { documentsService, type AppDocument } from '../../services/documents.service';
import { DocumentEditor } from '../../components/documents/DocumentEditor';

export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<AppDocument | null>(null);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const docs = await documentsService.findAll({ type: 'RECEIPT' });
      setReceipts(docs);
      if (docs.length > 0 && !selectedReceipt) {
        setSelectedReceipt(docs[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar recibos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const filteredReceipts = receipts.filter((r) => {
    const studentName = r.student?.name?.toLowerCase() || '';
    const title = r.title?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return studentName.includes(query) || title.includes(query);
  });

  const handleSaveReceiptContent = async (content: string) => {
    if (!selectedReceipt) return;
    await documentsService.update(selectedReceipt.id, { content });
    setSelectedReceipt((prev) => (prev ? { ...prev, content } : null));
    await loadReceipts();
  };

  return (
    <div className="space-y-6" id="receipts-page">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <FileText className="w-7 h-7 mr-2.5 text-teal-600" />
            Recibos de Prestação de Serviço
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão e emissão de recibos oficiais timbrados de mensalidades e serviços do centro.
          </p>
        </div>
        <Link
          to="/enrollments/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Novo Recibo (Via Matrícula)</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Lista de Recibos */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aluno ou recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{filteredReceipts.length} recibo(s) encontrado(s)</span>
            <button
              type="button"
              onClick={loadReceipts}
              className="hover:text-teal-600 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Carregando recibos...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Nenhum recibo emitido até o momento.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredReceipts.map((r) => {
                const isSelected = selectedReceipt?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReceipt(r)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{r.title}</h4>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                          <User className="w-3 h-3 text-teal-600" />
                          <span>{r.student?.name || 'Aluno'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Emitido
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Data: {new Date(r.issueDate || r.createdAt).toLocaleDateString('pt-BR')}</span>
                      {r.enrollmentId && (
                        <Link
                          to={`/enrollments/${r.enrollmentId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-teal-600 hover:underline font-medium flex items-center space-x-0.5"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Matrícula</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Editor e Visualizador A4 do Recibo Selecionado */}
        <div className="lg:col-span-7">
          {selectedReceipt ? (
            <DocumentEditor
              key={selectedReceipt.id}
              initialContent={selectedReceipt.content}
              title={selectedReceipt.title}
              subtitle={`Aluno: ${selectedReceipt.student?.name || 'Não identificado'}`}
              documentType="RECEIPT"
              studentName={selectedReceipt.student?.name}
              onSave={handleSaveReceiptContent}
            />
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Selecione um recibo</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Escolha um recibo da lista ao lado para visualizar o documento timbrado, editar o conteúdo ou imprimir em formato A4.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
