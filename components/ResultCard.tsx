import React from 'react';
import { SupplyItem } from '../types';

interface Props {
  item: SupplyItem;
}

const ResultCard: React.FC<Props> = ({ item }) => {
  const bestOption = item.opcoes.find(o => o.melhor_custo_beneficio) || item.opcoes[0];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all h-full">
        
        {/* Header do Card */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 block">
              {item.categoria} {item.materia ? `• ${item.materia}` : ''}
            </span>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.item}</h3>
          </div>
          {bestOption?.isbn && (
             <div className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">
               ISBN: {bestOption.isbn}
             </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {item.opcoes.map((opcao, idx) => (
            <div 
              key={idx} 
              className={`relative rounded-xl border transition-all flex flex-col sm:flex-row overflow-hidden ${
                opcao.melhor_custo_beneficio 
                  ? 'border-blue-200 bg-blue-50/20 ring-1 ring-blue-100' 
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Imagem do Produto */}
              <div className="w-full sm:w-32 h-32 sm:h-auto bg-white flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 p-2">
                {opcao.imagem ? (
                  <img 
                    src={opcao.imagem} 
                    alt={opcao.descricao} 
                    className="max-w-full max-h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {/* Fallback Icon */}
                <div className={`text-slate-200 ${opcao.imagem ? 'hidden' : ''}`}>
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Detalhes */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      {opcao.loja}
                      {opcao.oficial && (
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <title>Loja Oficial</title>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {opcao.melhor_custo_beneficio && (
                      <span className="shrink-0 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        RECOMENDADO
                      </span>
                    )}
                  </div>
                  
                  <a href={opcao.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    <p className="text-sm text-slate-800 font-medium mb-2 line-clamp-2 leading-snug">
                      {opcao.descricao}
                    </p>
                  </a>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opcao.preco)}
                    </div>
                    {opcao.entrega_estimada && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Chega em: {opcao.entrega_estimada}
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href={opcao.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 group shadow-lg shadow-slate-200"
                  >
                    Comprar
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;