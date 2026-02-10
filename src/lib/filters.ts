/**
 * Sistema de filtros para busca de licitações
 * Task 2.2 - Etapa 02
 */

export interface BidFilters {
  keywords?: string;
  cnae?: string[];
  estados?: string[];
  municipios?: string[];
  modalidades?: string[];
  valorMin?: number;
  valorMax?: number;
  dataAberturaInicio?: Date;
  dataAberturaFim?: Date;
}

export interface Bid {
  id: string;
  portal: string;
  external_id: string;
  numero?: string;
  objeto: string;
  orgao: string;
  modalidade?: string;
  valor_estimado?: number;
  data_abertura?: string;
  data_publicacao?: string;
  uf?: string;
  municipio?: string;
  status?: string;
  raw_data?: any;
}

/**
 * Aplica filtros a uma lista de licitações
 * Nota: Esta é uma implementação client-side. Em produção, usar SQL com índices.
 */
export function applyFilters(bids: Bid[], filters: BidFilters): Bid[] {
  let filtered = [...bids];

  // Filtro de palavras-chave (busca no objeto e órgão)
  if (filters.keywords) {
    const keywords = filters.keywords.toLowerCase().split(' ').filter(k => k.length > 0);
    filtered = filtered.filter(bid => {
      const searchText = `${bid.objeto} ${bid.orgao}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }

  // Filtro de estados (UF)
  if (filters.estados && filters.estados.length > 0) {
    filtered = filtered.filter(bid =>
      bid.uf && filters.estados!.includes(bid.uf)
    );
  }

  // Filtro de municípios
  if (filters.municipios && filters.municipios.length > 0) {
    filtered = filtered.filter(bid =>
      bid.municipio &&
      filters.municipios!.some(m =>
        bid.municipio!.toLowerCase().includes(m.toLowerCase())
      )
    );
  }

  // Filtro de modalidades
  if (filters.modalidades && filters.modalidades.length > 0) {
    filtered = filtered.filter(bid =>
      bid.modalidade &&
      filters.modalidades!.some(mod =>
        bid.modalidade!.toLowerCase().includes(mod.toLowerCase())
      )
    );
  }

  // Filtro de valor mínimo
  if (filters.valorMin !== undefined) {
    filtered = filtered.filter(bid =>
      bid.valor_estimado !== undefined && bid.valor_estimado >= filters.valorMin!
    );
  }

  // Filtro de valor máximo
  if (filters.valorMax !== undefined) {
    filtered = filtered.filter(bid =>
      bid.valor_estimado !== undefined && bid.valor_estimado <= filters.valorMax!
    );
  }

  // Filtro de data de abertura (início)
  if (filters.dataAberturaInicio) {
    filtered = filtered.filter(bid => {
      if (!bid.data_abertura) return false;
      const bidDate = new Date(bid.data_abertura);
      return bidDate >= filters.dataAberturaInicio!;
    });
  }

  // Filtro de data de abertura (fim)
  if (filters.dataAberturaFim) {
    filtered = filtered.filter(bid => {
      if (!bid.data_abertura) return false;
      const bidDate = new Date(bid.data_abertura);
      return bidDate <= filters.dataAberturaFim!;
    });
  }

  return filtered;
}

/**
 * Valida se os filtros são válidos
 */
export function validateFilters(filters: BidFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar valores numéricos
  if (filters.valorMin !== undefined && filters.valorMin < 0) {
    errors.push('Valor mínimo não pode ser negativo');
  }

  if (filters.valorMax !== undefined && filters.valorMax < 0) {
    errors.push('Valor máximo não pode ser negativo');
  }

  if (
    filters.valorMin !== undefined &&
    filters.valorMax !== undefined &&
    filters.valorMin > filters.valorMax
  ) {
    errors.push('Valor mínimo não pode ser maior que valor máximo');
  }

  // Validar datas
  if (
    filters.dataAberturaInicio &&
    filters.dataAberturaFim &&
    filters.dataAberturaInicio > filters.dataAberturaFim
  ) {
    errors.push('Data de início não pode ser maior que data de fim');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Converte filtros para query string (para URLs)
 */
export function filtersToQueryString(filters: BidFilters): string {
  const params = new URLSearchParams();

  if (filters.keywords) params.set('q', filters.keywords);
  if (filters.estados) params.set('uf', filters.estados.join(','));
  if (filters.municipios) params.set('municipios', filters.municipios.join(','));
  if (filters.modalidades) params.set('modalidades', filters.modalidades.join(','));
  if (filters.valorMin) params.set('valor_min', filters.valorMin.toString());
  if (filters.valorMax) params.set('valor_max', filters.valorMax.toString());
  if (filters.dataAberturaInicio)
    params.set('data_inicio', filters.dataAberturaInicio.toISOString().split('T')[0]);
  if (filters.dataAberturaFim)
    params.set('data_fim', filters.dataAberturaFim.toISOString().split('T')[0]);

  return params.toString();
}

/**
 * Converte query string para filtros
 */
export function queryStringToFilters(query: string): BidFilters {
  const params = new URLSearchParams(query);
  const filters: BidFilters = {};

  const q = params.get('q');
  if (q) filters.keywords = q;

  const uf = params.get('uf');
  if (uf) filters.estados = uf.split(',');

  const municipios = params.get('municipios');
  if (municipios) filters.municipios = municipios.split(',');

  const modalidades = params.get('modalidades');
  if (modalidades) filters.modalidades = modalidades.split(',');

  const valorMin = params.get('valor_min');
  if (valorMin) filters.valorMin = parseFloat(valorMin);

  const valorMax = params.get('valor_max');
  if (valorMax) filters.valorMax = parseFloat(valorMax);

  const dataInicio = params.get('data_inicio');
  if (dataInicio) filters.dataAberturaInicio = new Date(dataInicio);

  const dataFim = params.get('data_fim');
  if (dataFim) filters.dataAberturaFim = new Date(dataFim);

  return filters;
}
