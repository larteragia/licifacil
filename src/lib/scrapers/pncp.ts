/**
 * Scraper para PNCP (Portal Nacional de Contratações Públicas)
 * API oficial: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 */

interface PNCPContratacao {
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
}

interface PNCPResponse {
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export async function scrapePNCP(
  page: number = 1,
  pageSize: number = 100
): Promise<PNCPContratacao[]> {
  try {
    const baseUrl = 'https://pncp.gov.br/api/consulta/v1/contratacoes';
    const url = `${baseUrl}?pagina=${page}&tamanhoPagina=${pageSize}`;

    console.log(`[PNCP] Iniciando scraping - página ${page}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Licifacil/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`PNCP API error: ${response.status} ${response.statusText}`);
    }

    const data: PNCPResponse = await response.json();

    console.log(`[PNCP] ${data.items?.length || 0} contratações encontradas`);

    // Mapear dados da API para formato interno
    const contratacoes: PNCPContratacao[] = (data.items || []).map((item: any) => ({
      id: item.sequencialContratacao || item.id,
      numero: item.numeroControlePNCP || item.numero,
      objeto: item.objetoContratacao || '',
      orgao: item.orgaoEntidade?.razaoSocial || item.orgao || '',
      valorEstimado: item.valorTotalEstimado || item.valorEstimado,
      modalidade: item.modalidadeContratacao || item.modalidade,
      dataAbertura: item.dataAberturaProposta || item.dataAbertura,
      dataPublicacao: item.dataPublicacaoPncp || item.dataPublicacao,
      uf: item.ufSigla || item.uf,
      municipio: item.municipio?.nome || item.municipio,
      status: item.situacaoContratacao || 'aberto',
    }));

    return contratacoes;
  } catch (error) {
    console.error('[PNCP] Erro ao fazer scraping:', error);
    throw error;
  }
}

export async function scrapePNCPAll(maxPages: number = 10): Promise<PNCPContratacao[]> {
  const allContratacoes: PNCPContratacao[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const contratacoes = await scrapePNCP(page);

      if (contratacoes.length === 0) {
        console.log(`[PNCP] Nenhuma contratação encontrada na página ${page}. Encerrando.`);
        break;
      }

      allContratacoes.push(...contratacoes);

      // Rate limiting: aguardar 1 segundo entre requisições
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[PNCP] Erro na página ${page}:`, error);
      break;
    }
  }

  console.log(`[PNCP] Total coletado: ${allContratacoes.length} contratações`);

  return allContratacoes;
}
