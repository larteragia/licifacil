/**
 * Serviço de envio de emails via Resend
 * Task 2.5 - Etapa 02
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import AlertEmail from '@/emails/alert-template';

const resend = new Resend(process.env.RESEND_API_KEY || 'demo-key');

export interface AlertEmailData {
  to: string;
  alertName: string;
  bids: {
    numero?: string;
    objeto: string;
    orgao: string;
    valor?: number;
    dataAbertura?: string;
    url?: string;
  }[];
}

export async function sendAlertEmail(data: AlertEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY não configurado. Email não será enviado.');
      return {
        success: false,
        error: 'RESEND_API_KEY não configurado',
      };
    }

    const bidCount = data.bids.length;
    const subject = `🔔 ${bidCount} nova${bidCount > 1 ? 's' : ''} licitaç${
      bidCount > 1 ? 'ões' : 'ão'
    } - ${data.alertName}`;

    const emailHtml = await render(
      AlertEmail({
        alertName: data.alertName,
        bids: data.bids,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://licifacil.vercel.app/dashboard',
      })
    );

    const result = await resend.emails.send({
      from: 'Licifácil Alertas <alertas@licifacil.com.br>',
      to: data.to,
      subject,
      html: emailHtml,
    });

    console.log(`[Email] Alerta enviado para ${data.to}:`, result);

    return {
      success: true,
      messageId: result.data?.id || 'unknown',
    };
  } catch (error: any) {
    console.error('[Email] Erro ao enviar alerta:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY não configurado.');
      return { success: false };
    }

    const result = await resend.emails.send({
      from: 'Licifácil <contato@licifacil.com.br>',
      to,
      subject: 'Bem-vindo ao Licifácil! 🚀',
      html: `
        <h1>Olá, ${name}!</h1>
        <p>Seja bem-vindo(a) ao <strong>Licifácil</strong>, sua plataforma de intermediação de licitações públicas.</p>
        <p>Agora você pode:</p>
        <ul>
          <li>Buscar editais de licitações federais</li>
          <li>Configurar alertas personalizados</li>
          <li>Monitorar lances em tempo real</li>
          <li>Gerenciar documentos de habilitação</li>
        </ul>
        <p>Acesse o dashboard: <a href="${
          process.env.NEXT_PUBLIC_APP_URL || 'https://licifacil.vercel.app'
        }/dashboard">Ir para o Dashboard</a></p>
        <p>Equipe Licifácil</p>
      `,
    });

    return {
      success: true,
      messageId: result.data?.id || 'unknown',
    };
  } catch (error: any) {
    console.error('[Email] Erro ao enviar email de boas-vindas:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
