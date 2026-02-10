/**
 * Template de email para alertas de novas licitações
 * Task 2.7 - Etapa 02
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface AlertEmailProps {
  alertName: string;
  bids: {
    numero?: string;
    objeto: string;
    orgao: string;
    valor?: number;
    dataAbertura?: string;
    url?: string;
  }[];
  dashboardUrl?: string;
}

export default function AlertEmail({
  alertName = 'Meu Alerta',
  bids = [],
  dashboardUrl = 'https://licifacil.vercel.app/dashboard',
}: AlertEmailProps) {
  const bidCount = bids.length;
  const previewText = `${bidCount} nova${bidCount > 1 ? 's' : ''} licitaç${bidCount > 1 ? 'ões' : 'ão'} encontrada${bidCount > 1 ? 's' : ''} para "${alertName}"`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>🔔 Novos Editais Encontrados!</Heading>
            <Text style={subtitle}>
              {bidCount} nova{bidCount > 1 ? 's' : ''} licitaç{bidCount > 1 ? 'ões' : 'ão'} correspond
              {bidCount > 1 ? 'em' : 'e'} ao seu alerta "<strong>{alertName}</strong>".
            </Text>
          </Section>

          {/* Bids List */}
          <Section>
            {bids.map((bid, index) => (
              <Section key={index} style={bidCard}>
                <Text style={bidNumber}>
                  {bid.numero || `Licitação #${index + 1}`}
                </Text>
                <Text style={bidObjeto}>
                  {bid.objeto.length > 200
                    ? `${bid.objeto.substring(0, 200)}...`
                    : bid.objeto}
                </Text>
                <Text style={bidOrgao}>
                  <strong>Órgão:</strong> {bid.orgao}
                </Text>
                {bid.valor && (
                  <Text style={bidValor}>
                    <strong>Valor Estimado:</strong>{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(bid.valor)}
                  </Text>
                )}
                {bid.dataAbertura && (
                  <Text style={bidData}>
                    <strong>Data de Abertura:</strong>{' '}
                    {new Date(bid.dataAbertura).toLocaleDateString('pt-BR')}
                  </Text>
                )}
                {bid.url && (
                  <Button style={button} href={bid.url}>
                    Ver Edital Completo
                  </Button>
                )}
              </Section>
            ))}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={dashboardUrl}>
              Ver Todos no Dashboard
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Você está recebendo este email porque configurou um alerta no Licifácil.
            </Text>
            <Text style={footerLinks}>
              <a href={`${dashboardUrl}/alertas`} style={link}>
                Gerenciar Alertas
              </a>
              {' | '}
              <a href={`${dashboardUrl}/configuracoes`} style={link}>
                Cancelar Inscrição
              </a>
            </Text>
            <Text style={footerCopyright}>
              © 2026 Licifácil - Sistema de intermediação de licitações públicas
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#f0f9ff',
  borderRadius: '8px 8px 0 0',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1e40af',
  margin: '0 0 12px',
};

const subtitle = {
  fontSize: '16px',
  color: '#374151',
  margin: '0',
  lineHeight: '1.5',
};

const bidCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 24px',
};

const bidNumber = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 8px',
};

const bidObjeto = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#111827',
  margin: '0 0 12px',
  lineHeight: '1.5',
};

const bidOrgao = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
};

const bidValor = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
};

const bidData = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  marginTop: '12px',
};

const ctaSection = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px',
};

const footerLinks = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const footerCopyright = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '12px 0 0',
};
