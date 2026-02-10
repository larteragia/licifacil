/**
 * Endpoint de Cron para executar scrapers
 * Vercel Cron: 4x/dia (6h, 10h, 14h, 18h)
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapePNCPAll } from '@/lib/scrapers/pncp';
import { scrapeComprasGovAll } from '@/lib/scrapers/compras-gov';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos (Vercel Pro)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (Vercel Cron envia header Authorization)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('[CRON] Unauthorized:', authHeader);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Iniciando scraping de licitações...');

    const startTime = Date.now();

    // Executar scrapers em paralelo
    const [pncpResults, comprasGovResults] = await Promise.allSettled([
      scrapePNCPAll(5), // 5 páginas do PNCP
      scrapeComprasGovAll(5), // 5 páginas do Compras.gov.br
    ]);

    const duration = Date.now() - startTime;

    // Processar resultados
    const pncpCount = pncpResults.status === 'fulfilled' ? pncpResults.value.length : 0;
    const comprasGovCount = comprasGovResults.status === 'fulfilled' ? comprasGovResults.value.length : 0;

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      scrapers: {
        pncp: {
          status: pncpResults.status,
          count: pncpCount,
          error: pncpResults.status === 'rejected' ? pncpResults.reason?.message : null,
        },
        comprasGov: {
          status: comprasGovResults.status,
          count: comprasGovCount,
          error: comprasGovResults.status === 'rejected' ? comprasGovResults.reason?.message : null,
        },
      },
      totalCollected: pncpCount + comprasGovCount,
    };

    console.log('[CRON] Scraping concluído:', results);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[CRON] Erro fatal:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Permitir teste manual via POST (desenvolvimento)
export async function POST(request: NextRequest) {
  // No desenvolvimento, permitir executar sem autenticação
  if (process.env.NODE_ENV === 'development') {
    return GET(request);
  }

  return NextResponse.json(
    { error: 'Method not allowed in production' },
    { status: 405 }
  );
}
