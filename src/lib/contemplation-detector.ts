/**
 * Detector de Contemplação
 * Task 3.9 - Etapa 03
 * 
 * Identifica quando uma empresa foi contemplada/vencedora em mensagens do pregoeiro
 */

const CONTEMPLATION_KEYWORDS = [
  'contemplad',
  'vencedor',
  'vencedora',
  'melhor classificad',
  'primeiro lugar',
  'primeira colocad',
  'convocad para habilitação',
  'habilitad',
  'adjudicad',
  'arrematant',
  'declarad vencedor',
];

const URGENCY_KEYWORDS = [
  'prazo',
  'urgente',
  'imediato',
  'agora',
  'atenção',
  'comparecer',
  'apresentar documentação',
  '2 horas',
  'duas horas',
];

export interface DetectionResult {
  isContemplated: boolean;
  isUrgent: boolean;
  confidence: number;
  matchedKeywords: string[];
  extractedInfo?: {
    deadline?: string;
    action?: string;
  };
}

/**
 * Detecta se uma mensagem indica contemplação da empresa
 */
export function detectContemplation(
  message: string,
  companyName: string
): DetectionResult {
  const lower = message.toLowerCase();
  const companyLower = companyName.toLowerCase();

  // Normalizar nome da empresa (remover "LTDA", "ME", etc)
  const normalizedCompany = companyLower
    .replace(/\s+(ltda|me|epp|eireli|s\.a\.|sa)/g, '')
    .trim();

  // Verificar se a empresa é mencionada
  const mentionsCompany = lower.includes(normalizedCompany) || 
    lower.includes(companyLower);

  // Buscar keywords de contemplação
  const matchedContemplationKeywords = CONTEMPLATION_KEYWORDS.filter(keyword =>
    lower.includes(keyword)
  );

  // Buscar keywords de urgência
  const matchedUrgencyKeywords = URGENCY_KEYWORDS.filter(keyword =>
    lower.includes(keyword)
  );

  const isContemplated = mentionsCompany && matchedContemplationKeywords.length > 0;
  const isUrgent = matchedUrgencyKeywords.length > 0;

  // Calcular confiança (0-100)
  let confidence = 0;
  if (mentionsCompany) confidence += 30;
  confidence += matchedContemplationKeywords.length * 20;
  confidence += matchedUrgencyKeywords.length * 10;
  confidence = Math.min(confidence, 100);

  // Extrair informações (prazo, ação requerida)
  const extractedInfo = extractActionInfo(message);

  return {
    isContemplated,
    isUrgent,
    confidence,
    matchedKeywords: [
      ...matchedContemplationKeywords,
      ...matchedUrgencyKeywords,
    ],
    extractedInfo: extractedInfo.deadline || extractedInfo.action ? extractedInfo : undefined,
  };
}

/**
 * Extrai informações de prazo e ação da mensagem
 */
function extractActionInfo(message: string): {
  deadline?: string;
  action?: string;
} {
  const info: { deadline?: string; action?: string } = {};

  // Padrões de prazo
  const deadlinePatterns = [
    /prazo de (\d+)\s*(hora|minuto|dia)/i,
    /em até (\d+)\s*(hora|minuto|dia)/i,
    /até às (\d{2}:\d{2})/i,
    /até (\d{2}\/\d{2}\/\d{4})/i,
  ];

  for (const pattern of deadlinePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.deadline = match[0];
      break;
    }
  }

  // Padrões de ação
  const actionPatterns = [
    /apresentar (documento|documentação|habilitação)/i,
    /comparecer (ao|na|no)/i,
    /enviar (documento|proposta|documentação)/i,
    /entregar (documento|documentação)/i,
  ];

  for (const pattern of actionPatterns) {
    const match = message.match(pattern);
    if (match) {
      info.action = match[0];
      break;
    }
  }

  return info;
}

/**
 * Classifica prioridade da mensagem
 */
export function classifyMessagePriority(
  detection: DetectionResult
): 'critical' | 'high' | 'medium' | 'low' {
  if (detection.isContemplated && detection.isUrgent) {
    return 'critical';
  }

  if (detection.isContemplated) {
    return 'high';
  }

  if (detection.isUrgent) {
    return 'medium';
  }

  return 'low';
}

/**
 * Formata mensagem de alerta para o usuário
 */
export function formatAlertMessage(
  detection: DetectionResult,
  pregaoNumber: string
): string {
  let message = `🎉 SUA EMPRESA FOI CONTEMPLADA no Pregão ${pregaoNumber}!`;

  if (detection.extractedInfo?.action) {
    message += `\n\n⚠️ AÇÃO REQUERIDA: ${detection.extractedInfo.action}`;
  }

  if (detection.extractedInfo?.deadline) {
    message += `\n⏰ PRAZO: ${detection.extractedInfo.deadline}`;
  }

  message += '\n\n🚨 Acesse o sistema URGENTEMENTE para verificar detalhes!';

  return message;
}
