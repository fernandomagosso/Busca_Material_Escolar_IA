
export interface ProductOption {
  descricao: string;
  preco: number;
  loja: string;
  avaliacao: number;
  link: string;
  imagem?: string;
  isbn?: string; // Novo campo para livros
  melhor_custo_beneficio: boolean;
  entrega_estimada?: string;
  oficial: boolean;
}

export interface SupplyItem {
  item: string;
  categoria: string; // Ex: Livros Didáticos, Papelaria, Artes
  materia?: string; // Ex: Matemática, História (para livros)
  opcoes: ProductOption[];
}

export interface Consolidation {
  loja_sugerida: string;
  link_loja?: string; // Link geral da loja para o botão carrinho
  itens_contemplados: number;
  observacao: string;
  total_estimado: number;
}

export interface SearchResult {
  itens: SupplyItem[];
  consolidacao: Consolidation;
  fontes?: { title: string; uri: string }[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
