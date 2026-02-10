/**
 * Endpoint de Cron para verificar alertas
 * Vercel Cron: 4x/dia (6h, 10h, 14h, 18h)
 * Task 2.6 - Etapa 02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlertEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

interface Alert {
  id: string;
  user_id: string;
  name: string;
  filters: any;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  last_check: string | null;
  user_email: string;
  user_name: string;
}

interface Bid {
  id: string;
  portal: string;
  numero_edital: string;
  orgao: string;
  objeto: string;
  valor_estimado: number;
  data_abertura: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (Vercel Cron envia header Authorization)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      console.error('[CRON] Unauthorized:', authHeader);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Iniciando verificação de alertas...');

    const startTime = Date.now();

    // 1. Buscar todos os alertas ativos com email habilitado
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts_with_user')
      .select('*')
      .eq('active', true)
      .eq('email_enabled', true);

    if (alertsError) {
      console.error('[CRON] Erro ao buscar alertas:', alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log('[CRON] Nenhum alerta ativo encontrado');
      return NextResponse.json({
        success: true,
        alertsChecked: 0,
        notificationsSent: 0,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[CRON] ${alerts.length} alertas ativos encontrados`);

    let totalNotifications = 0;
    let alertsProcessed = 0;
    const results: any[] = [];

    // 2. Processar cada alerta
    for (const alert of alerts as Alert[]) {
      try {
        // Determinar timestamp de última verificação (6h atrás se nunca verificado)
        const sinceTimestamp = alert.last_check
          ? new Date(alert.last_check).toISOString()
          : new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

        // 3. Buscar editais que correspondem ao alerta usando função SQL
        const { data: matchingBids, error: bidsError } = await supabase.rpc(
          'find_bids_for_alert',
          {
            alert_id_param: alert.id,
            since_timestamp: sinceTimestamp,
          }
        );

        if (bidsError) {
          console.error(`[CRON] Erro ao buscar editais para alerta ${alert.id}:`, bidsError);
          results.push({
            alertId: alert.id,
            alertName: alert.name,
            status: 'error',
            error: bidsError.message,
          });
          continue;
        }

        if (!matchingBids || matchingBids.length === 0) {
          console.log(`[CRON] Nenhum edital novo para alerta "${alert.name}"`);
          results.push({
            alertId: alert.id,
            alertName: alert.name,
            status: 'no_matches',
            matchCount: 0,
          });
          continue;
        }

        console.log(`[CRON] ${matchingBids.length} editais encontrados para alerta "${alert.name}"`);

        // 4. Enviar email de notificação
        try {
          await sendAlertEmail({
            to: alert.user_email,
            alertName: alert.name,
            bids: matchingBids as Bid[],
          });

          // 5. Registrar notificações enviadas
          const notifications = matchingBids.map((bid: any) => ({
            alert_id: alert.id,
            bid_id: bid.bid_id || bid.id,
            user_id: alert.user_id,
            channel: 'email',
            status: 'sent',
            sent_at: new Date().toISOString(),
          }));

          const { error: logError } = await supabase
            .from('alert_logs')
            .insert(notifications);

          if (logError) {
            console.error('[CRON] Erro ao registrar notificações:', logError);
          }

          // 6. Atualizar last_check do alerta
          await supabase
            .from('alerts')
            .update({ 
              last_check: new Date().toISOString(),
              match_count: matchingBids.length,
            })
            .eq('id', alert.id);

          totalNotifications += matchingBids.length;
          alertsProcessed++;

          results.push({
            alertId: alert.id,
            alertName: alert.name,
            status: 'success',
            matchCount: matchingBids.length,
            userEmail: alert.user_email,
          });

          console.log(`[CRON] ✅ Email enviado para ${alert.user_email} (${matchingBids.length} editais)`);
        } catch (emailError: any) {
          console.error(`[CRON] Erro ao enviar email para ${alert.user_email}:`, emailError);
          results.push({
            alertId: alert.id,
            alertName: alert.name,
            status: 'email_error',
            error: emailError.message,
          });
        }
      } catch (alertError: any) {
        console.error(`[CRON] Erro ao processar alerta ${alert.id}:`, alertError);
        results.push({
          alertId: alert.id,
          alertName: alert.name,
          status: 'error',
          error: alertError.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      alertsChecked: alerts.length,
      alertsProcessed,
      notificationsSent: totalNotifications,
      results,
    };

    console.log('[CRON] Verificação de alertas concluída:', summary);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[CRON] Erro fatal ao verificar alertas:', error);

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
