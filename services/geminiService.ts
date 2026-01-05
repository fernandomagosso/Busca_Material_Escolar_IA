
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from "../types";

export const searchSupplies = async (input: string): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Você é um Agente Especialista em Compras de Material Escolar e Livros.
    
    DIRETRIZES:
    1.  **CATEGORIZAÇÃO**: Classifique cada item em categorias lógicas: "Livros Didáticos", "Livros Paradidáticos", "Cadernos e Papéis", "Escrita e Correção", "Artes", "Mochilas e Estojos", "Uso Geral".
    2.  **LIVROS**: Para livros, TENTE encontrar o ISBN (10 ou 13 dígitos) e a matéria associada (ex: Matemática).
    3.  **IMAGENS**: Tente encontrar uma URL pública de imagem representativa do produto (capa do livro ou foto do material). Se não achar, deixe em branco.
    4.  **MARKETPLACES**: Busque em Amazon, Mercado Livre, Kalunga, Magalu e Editoras.
    5.  **LOJA SUGERIDA**: Indique a loja com maior mix de produtos encontrados. Inclua um link genérico para essa loja.

    FORMATO JSON OBRIGATÓRIO:
    {
      "itens": [
        {
          "item": "Nome solicitado",
          "categoria": "Categoria do item",
          "materia": "Matéria (se for livro, senão null)",
          "opcoes": [
            {
              "descricao": "Título/Nome Produto",
              "preco": 0.00,
              "loja": "Amazon",
              "avaliacao": 4.5,
              "link": "URL_PRODUTO",
              "imagem": "URL_IMAGEM_JPG_PNG",
              "isbn": "978...",
              "melhor_custo_beneficio": true,
              "entrega_estimada": "2 dias",
              "oficial": true
            }
          ]
        }
      ],
      "consolidacao": {
        "loja_sugerida": "Amazon",
        "link_loja": "https://www.amazon.com.br",
        "itens_contemplados": 10,
        "total_estimado": 200.00,
        "observacao": "Texto explicativo"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `Processe esta lista de material escolar, encontre links de compra, imagens e categorize: ${input}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr) as SearchResult;

    // Grounding
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      data.fontes = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || "Fonte",
          uri: chunk.web?.uri || "#"
        }));
    }

    return data;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Não foi possível processar a lista no momento. Tente novamente.");
  }
};
