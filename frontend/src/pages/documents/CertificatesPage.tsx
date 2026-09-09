import { useState, useEffect } from 'react';
import {
  FileBadge,
  Search,
  Plus,
  RefreshCw,
  User,
} from '../../components/common/Icons';
import { documentsService, type AppDocument } from '../../services/documents.service';
import { studentsService, type Student } from '../../services/students.service';
import { DocumentEditor } from '../../components/documents/DocumentEditor';

export function CertificatesPage() {
  const [certificates, setCertificates] = useState<AppDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState<AppDocument | null>(null);

  // Modal Novo Atestado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newTitle, setNewTitle] = useState('Atestado de Aptidão Física - Natação / Atividades Aquáticas');
  const [newIssueDate, setNewIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [newContent, setNewContent] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, stds] = await Promise.all([
        documentsService.findAll({ type: 'CERTIFICATE' }),
        studentsService.findAll(),
      ]);
      setCertificates(docs);
      setStudents(stds);
      if (docs.length > 0 && !selectedCert) {
        setSelectedCert(docs[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar atestados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCertificates = certificates.filter((c) => {
    const studentName = c.student?.name?.toLowerCase() || '';
    const title = c.title?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return studentName.includes(query) || title.includes(query);
  });

  const handleSaveCertContent = async (content: string) => {
    if (!selectedCert) return;
    await documentsService.update(selectedCert.id, { content });
    setSelectedCert((prev) => (prev ? { ...prev, content } : null));
    await loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) {
      alert('Selecione um aluno.');
      return;
    }
    const std = students.find((s) => s.id === newStudentId);
    const contentToUse =
      newContent ||
      `<h3>ATESTADO MÉDICO / DECLARAÇÃO DE APTIDÃO FÍSICA</h3><p>Declaramos para os devidos fins que o(a) aluno(a) <strong>${std?.name || 'ALUNO'}</strong> realizou avaliação e está apto(a) para participar das práticas e treinamentos do centro <strong>FitFisio Pilates & Saúde</strong>.</p><p>Data da emissão: ${new Date(newIssueDate).toLocaleDateString('pt-BR')}</p><br/><br/><p>_____________________________________<br/>Médico / Profissional Responsável</p>`;

    await documentsService.create({
      studentId: newStudentId,
      type: 'CERTIFICATE',
      title: newTitle,
      content: contentToUse,
      issueDate: newIssueDate,
      expirationDate: newExpirationDate || undefined,
    });

    setIsModalOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-6" id="certificates-page">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <FileBadge className="w-7 h-7 mr-2.5 text-teal-600" />
            Atestados Médicos & Declarações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de autorizações médicas, laudos de fisioterapia e aptidão para atividades aquáticas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          id="btn-new-certificate"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Anexar Novo Atestado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Lista de Atestados */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por aluno ou atestado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{filteredCertificates.length} atestado(s) cadastrado(s)</span>
            <button
              type="button"
              onClick={loadData}
              className="hover:text-teal-600 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Carregando atestados...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <FileBadge className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Nenhum atestado médico registrado.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCertificates.map((c) => {
                const isSelected = selectedCert?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCert(c)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{c.title}</h4>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                          <User className="w-3 h-3 text-teal-600" />
                          <span>{c.student?.name || 'Aluno'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ativo
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Emissão: {new Date(c.issueDate || c.createdAt).toLocaleDateString('pt-BR')}</span>
                      {c.expirationDate && (
                        <span>Val: {new Date(c.expirationDate).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Visualizador e Editor A4 */}
        <div className="lg:col-span-7">
          {selectedCert ? (
            <DocumentEditor
              key={selectedCert.id}
              initialContent={selectedCert.content}
              title={selectedCert.title}
              subtitle={`Aluno: ${selectedCert.student?.name || 'Não identificado'}`}
              documentType="CERTIFICATE"
              studentName={selectedCert.student?.name}
              onSave={handleSaveCertContent}
            />
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 space-y-3">
              <FileBadge className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Selecione um atestado</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Escolha um atestado da lista para visualizar a declaração médica, editar o parecer ou imprimir com o carimbo do estúdio.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVO ATESTADO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <FileBadge className="w-4 h-4 mr-2 text-teal-600" />
                Cadastrar Atestado Médico / Declaração
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Aluno *
                </label>
                <select
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Selecione o aluno --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type === 'CHILD' ? 'Criança' : 'Adulto'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
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
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Validade (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newExpirationDate}
                    onChange={(e) => setNewExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Texto do Parecer Médico (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Deixe em branco para usar o modelo padrão timbrado de aptidão física..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
