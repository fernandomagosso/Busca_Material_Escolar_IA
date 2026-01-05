
import React, { useState, useRef, useMemo } from 'react';
import Header from './components/Header';
import LoadingState from './components/LoadingState';
import ResultsTabs from './components/ResultsTabs';
import { searchSupplies } from './services/geminiService';
import { AppStatus, SearchResult } from './types';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Configuração do worker do PDF.js via CDN compatível com ESM
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const EXAMPLES = [
  "5 Cadernos Tilibra 10 matérias, Lápis de cor 24 cores Faber-Castell, 3 Borrachas brancas",
  "Mochila escolar reforçada com compartimento para notebook, Estojo grande, Agenda 2025",
  "Livro: O Menino Maluquinho (Ziraldo), Minidicionário Aurélio, Caderno de caligrafia"
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cálculo preciso do total no frontend (evita erros de matemática da IA)
  const totalCalculado = useMemo(() => {
    if (!results) return 0;
    return results.itens.reduce((acc, item) => {
      const best = item.opcoes.find(o => o.melhor_custo_beneficio) || item.opcoes[0];
      return acc + (best?.preco || 0);
    }, 0);
  }, [results]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleDownloadExcel = () => {
    if (!results) return;

    // Organizando dados com layout melhorado
    const rows = results.itens.map(item => {
      const bestOption = item.opcoes.find(op => op.melhor_custo_beneficio) || item.opcoes[0];
      return {
        "Categoria": item.categoria || "Geral",
        "Matéria": item.materia || "-",
        "Item Solicitado": item.item,
        "Produto Encontrado": bestOption.descricao,
        "ISBN": bestOption.isbn || "-",
        "Loja": bestOption.loja,
        "Preço (R$)": bestOption.preco,
        "Link de Compra": bestOption.link
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista Escolar 2025");

    // Definição de largura de colunas (Layout)
    const wscols = [
      {wch: 20}, // Categoria
      {wch: 15}, // Materia
      {wch: 30}, // Item
      {wch: 40}, // Produto
      {wch: 15}, // ISBN
      {wch: 15}, // Loja
      {wch: 12}, // Preço
      {wch: 50}  // Link
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Lista_Material_BuscaEscolarAI.xlsx");
  };

  const handleOpenCart = () => {
    if (!results) return;
    
    const storeLink = results.consolidacao.link_loja;
    const storeName = results.consolidacao.loja_sugerida;
    
    if (storeLink && storeLink.startsWith('http')) {
        window.open(storeLink, '_blank');
    } else {
        const query = encodeURIComponent(`site:${storeName}.com.br material escolar`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  const handleReset = () => {
    setResults(null);
    setInputText('');
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  const handleSearch = async (textToSearch?: string) => {
    const finalInput = textToSearch || inputText;
    if (!finalInput.trim()) return;
    
    setStatus(AppStatus.LOADING);
    setError(null);
    if (textToSearch) setInputText(textToSearch);
    
    try {
      const data = await searchSupplies(finalInput);
      setResults(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar sua busca.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setError(null);

    try {
      let content = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        content = await extractTextFromPDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')
      ) {
        content = await extractTextFromWord(file);
      } else {
        content = await file.text();
      }

      if (!content.trim()) {
        throw new Error("Não foi possível extrair texto deste arquivo. Tente copiar e colar o conteúdo.");
      }

      setInputText(content);
    } catch (err: any) {
      console.error("File processing error:", err);
      setError("Erro ao ler o arquivo: " + (err.message || "formato não suportado ou arquivo corrompido."));
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-10">
        
        {/* Mostra o formulário apenas se NÃO tiver resultados */}
        {status !== AppStatus.SUCCESS && (
          <>
            <section className="mb-12 text-center max-w-3xl mx-auto">
              <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Volta às Aulas 2025
              </span>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
                Busca Inteligente de Material Escolar
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Nossa IA analisa sua lista (Word, PDF ou Texto), compara preços em <b>Marketplaces e Editoras</b>, e organiza tudo para você.
              </p>
            </section>

            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 p-2 md:p-3 mb-12 border border-slate-100 ring-1 ring-slate-200/50">
              <div className="p-4 md:p-6">
                <div className="relative">
                  <textarea
                    className="w-full min-h-[180px] p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 text-lg placeholder:text-slate-300 resize-none"
                    placeholder="Cole aqui sua lista ou carregue um arquivo PDF/Word..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  {isReadingFile && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-700 font-bold text-sm">Lendo documento...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase self-center mr-2">Exemplos:</span>
                  {EXAMPLES.map((ex, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSearch(ex)}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                    >
                      {ex.split(',')[0]}...
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isReadingFile}
                      className="flex items-center justify-center gap-2 px-5 py-3 w-full sm:w-auto text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200 hover:border-blue-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Carregar Arquivo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                      onChange={handleFileUpload} 
                    />
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    disabled={!inputText || status === AppStatus.LOADING || isReadingFile}
                    className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${
                      !inputText || status === AppStatus.LOADING || isReadingFile
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.98] shadow-blue-600/30'
                    }`}
                  >
                    {status === AppStatus.LOADING ? 'Processando Lista...' : 'Buscar Melhores Ofertas'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {status === AppStatus.LOADING && <LoadingState />}
        
        {status === AppStatus.ERROR && (
          <div className="bg-red-50 border-2 border-red-100 text-red-700 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in zoom-in">
             <div className="bg-red-100 p-3 rounded-full">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="flex-1">
               <p className="font-bold">Erro ao buscar</p>
               <p className="text-sm opacity-90">{error}</p>
             </div>
             <button onClick={() => setStatus(AppStatus.IDLE)} className="text-red-800 font-bold text-sm underline">Tentar de novo</button>
          </div>
        )}

        {status === AppStatus.SUCCESS && results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header com Voltar */}
            <div className="flex justify-between items-center">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Nova Busca
              </button>
            </div>

            {/* Strategy Banner */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-2">Resumo da Economia</h3>
                    <p className="text-slate-400 max-w-xl text-lg leading-snug">
                      Loja Recomendada: <span className="text-blue-400 font-bold">{results.consolidacao.loja_sugerida}</span><br/>
                      Total Encontrado: <span className="text-green-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculado)}</span>
                    </p>
                    <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 text-sm italic text-slate-300">
                      "{results.consolidacao.observacao}"
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <button 
                    onClick={handleDownloadExcel}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar Excel
                  </button>
                  <button 
                    onClick={handleOpenCart}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-4 rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Abrir Carrinho
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Results in Tabs View */}
            <ResultsTabs itens={results.itens} />

            {/* Footer Sources */}
            {results.fontes && results.fontes.length > 0 && (
              <div className="pt-12 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Fontes Verificadas</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {results.fontes.map((fonte, idx) => (
                    <a 
                      key={idx} 
                      href={fonte.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-500 font-medium px-3 py-1.5 rounded-lg transition-colors truncate max-w-[200px]"
                    >
                      {fonte.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="text-center py-20 px-4">
        <div className="max-w-xs mx-auto mb-6 h-px bg-slate-200"></div>
        <p className="text-slate-400 font-medium text-sm">
          BuscaEscolar AI utiliza tecnologias avançadas de busca e IA Generativa.
        </p>
      </footer>
    </div>
  );
};

export default App;
