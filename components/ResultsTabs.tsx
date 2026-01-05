
import React, { useState, useMemo } from 'react';
import { SupplyItem } from '../types';
import ResultCard from './ResultCard';

interface Props {
  itens: SupplyItem[];
}

const ResultsTabs: React.FC<Props> = ({ itens }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Group items by Category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: SupplyItem[] } = {};
    itens.forEach(item => {
      // Normaliza categoria para evitar duplicidade por erro de digitação da IA
      const cat = item.categoria || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [itens]);

  const categories = Object.keys(groupedItems);
  
  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-full md:min-h-[600px]">
      {/* Sidebar / Tabs List */}
      {/* Mobile: Horizontal Scroll (max height limited) | Desktop: Vertical Full Height */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
           <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
             Itens da Lista ({itens.length})
           </h3>
        </div>
        
        {/* Container que scrolla: Horizontal no mobile, Vertical no desktop */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto custom-scrollbar md:h-full">
          {categories.map((cat) => (
            <div key={cat} className="flex-shrink-0 md:flex-shrink md:w-full flex md:block">
              {/* Header Categoria: Hidden on Mobile inside the row to save space, or styled differently */}
              <div className="hidden md:block sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm px-4 py-2 text-xs font-black text-slate-500 uppercase tracking-widest border-y border-slate-200">
                {cat}
              </div>
              
              <div className="flex md:block">
              {groupedItems[cat].map((item, idxInGroup) => {
                // Encontrar o índice global deste item
                const globalIndex = itens.indexOf(item);
                const isActive = activeIndex === globalIndex;
                const bestOption = item.opcoes[0];

                return (
                  <button
                    key={item.item + idxInGroup}
                    onClick={() => setActiveIndex(globalIndex)}
                    className={`
                      w-48 md:w-full text-left p-4 border-r md:border-r-0 md:border-b border-slate-100 transition-all group relative flex-shrink-0
                      ${isActive ? 'bg-blue-50/50 md:bg-blue-50/50 border-b-blue-500 md:border-b-slate-100' : 'hover:bg-slate-50'}
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 bottom-0 right-0 h-1 md:h-auto md:top-0 md:bottom-0 md:right-auto md:w-1 bg-blue-600"></div>
                    )}
                    
                    {/* Badge Mobile para categoria */}
                    <span className="md:hidden text-[9px] uppercase font-bold text-slate-400 mb-1 block">{cat}</span>

                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                        {item.item}
                      </span>
                    </div>
                    {item.materia && (
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mr-2 inline-block mb-1">
                         {item.materia}
                       </span>
                    )}
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[11px] text-slate-400 truncate max-w-[80px] md:max-w-[120px]">
                           {bestOption?.loja}
                        </span>
                        <span className="text-xs font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bestOption?.preco || 0)}
                        </span>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          ))}
        </div>
        <div className="md:hidden text-center p-2 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
          Deslize para ver mais →
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-2/3 h-full md:min-h-[600px]">
        <ResultCard item={itens[activeIndex]} />
      </div>
    </div>
  );
};

export default ResultsTabs;
