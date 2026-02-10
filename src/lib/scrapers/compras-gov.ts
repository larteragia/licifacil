/**
 * Scraper para Compras.gov.br
 * API oficial: https://compras.dados.gov.br/docs/home.html
 */

interface ComprasGovLicitacao {
  id: string;
  numero?: string;
  objeto: string;
  orgao: string;
  valorEstimado?: number;
  modalidade?: string;
  dataAbertura?: string;
  dataPublicacao?: string;
  uf?: string;
  municipio?: string;
  status?: string;
  url?: string;
}

interface ComprasGovResponse {
  _embedded?: {
    licitacoes: any[];
  };
  _links?: {
    next?: {
      href: string;
    };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export async function scrapeComprasGov(
  page: number = 0,
  size: number = 100
): Promise<ComprasGovLicitacao[]> {
  try {
    const baseUrl = 'https://compras.dados.gov.br/licitacoes/v1/licitacoes';
    const url = `${baseUrl}?page=${page}&size=${size}`;

    console.log(`[Compras.gov.br] Iniciando scraping - página ${page}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Licifacil/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Compras.gov.br API error: ${response.status} ${response.statusText}`);
    }

    const data: ComprasGovResponse = await response.json();

    const licitacoes = data._embedded?.licitacoes || [];

    console.log(`[Compras.gov.br] ${licitacoes.length} licitações encontradas`);

    // Mapear dados da API para formato interno
    const licitacoesFormatadas: ComprasGovLicitacao[] = licitacoes.map((item: any) => ({
      id: item.identificador || item.id,
      numero: item.numeroLicitacao || item.numero,
      objeto: item.objeto || item.objetoLicitacao || '',
      orgao: item.unidadeGestora?.nome || item.orgao || '',
      valorEstimado: item.valorEstimado || item.valorTotalEstimado,
      modalidade: item.modalidade?.descricao || item.modalidade,
      dataAbertura: item.dataAberturaPropostas || item.dataAbertura,
      dataPublicacao: item.dataPublicacao || item.dataPublicacaoEdital,
      uf: item.uf || item.unidadeGestora?.uf,
      municipio: item.municipio || item.unidadeGestora?.municipio,
      status: item.situacao || 'aberto',
      url: item._links?.self?.href,
    }));

    return licitacoesFormatadas;
  } catch (error) {
    console.error('[Compras.gov.br] Erro ao fazer scraping:', error);
    throw error;
  }
}

export async function scrapeComprasGovAll(maxPages: number = 10): Promise<ComprasGovLicitacao[]> {
  const allLicitacoes: ComprasGovLicitacao[] = [];
  let currentPage = 0;

  for (let i = 0; i < maxPages; i++) {
    try {
      const licitacoes = await scrapeComprasGov(currentPage);

      if (licitacoes.length === 0) {
        console.log(`[Compras.gov.br] Nenhuma licitação encontrada na página ${currentPage}. Encerrando.`);
        break;
      }

      allLicitacoes.push(...licitacoes);

      currentPage++;

      // Rate limiting: aguardar 600ms entre requisições (respeita limite de 100 req/min)
      if (i < maxPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    } catch (error) {
      console.error(`[Compras.gov.br] Erro na página ${currentPage}:`, error);
      break;
    }
  }

  console.log(`[Compras.gov.br] Total coletado: ${allLicitacoes.length} licitações`);

  return allLicitacoes;
}
