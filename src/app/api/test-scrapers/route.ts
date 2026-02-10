import { NextResponse } from 'next/server';
import { scrapePNCP } from '@/lib/scrapers/pncp';
import { scrapeComprasGov } from '@/lib/scrapers/compras-gov';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[API] Testando scrapers...');

    // Testar PNCP (primeira página)
    const pncpData = await scrapePNCP(1, 10);
    console.log(`[API] PNCP retornou ${pncpData.length} contratações`);

    // Testar Compras.gov.br (primeira página)
    const comprasGovData = await scrapeComprasGov(0, 10);
    console.log(`[API] Compras.gov.br retornou ${comprasGovData.length} licitações`);

    return NextResponse.json({
      success: true,
      data: {
        pncp: {
          count: pncpData.length,
          sample: pncpData.slice(0, 3),
        },
        comprasGov: {
          count: comprasGovData.length,
          sample: comprasGovData.slice(0, 3),
        },
      },
      message: 'Scrapers testados com sucesso! Persistência aguardando configuração do Supabase.',
    });
  } catch (error: any) {
    console.error('[API] Erro ao testar scrapers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
