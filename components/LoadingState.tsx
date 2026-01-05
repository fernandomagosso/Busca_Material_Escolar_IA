
import React, { useState, useEffect } from 'react';

const messages = [
  "Analisando sua lista de materiais...",
  "Buscando as melhores ofertas em lojas confiáveis...",
  "Comparando preços e avaliações...",
  "Filtrando apenas itens novos e de qualidade...",
  "Calculando a melhor opção de frete consolidado...",
  "Quase lá! Organizando os resultados..."
];

const LoadingState: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 animate-pulse">
        {messages[index]}
      </h3>
      <p className="text-slate-500 mt-2 text-sm">Isso pode levar alguns segundos.</p>
    </div>
  );
};

export default LoadingState;
