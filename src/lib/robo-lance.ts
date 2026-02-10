/**
 * Robô de Lance Automatizado
 * Etapa 04 - Task 4.4
 * 
 * Algoritmo de lances automáticos com estratégias configuráveis
 */

export type LanceStrategy = 
  | 'agressiva'      // Dar lance sempre que for ultrapassado
  | 'conservadora'   // Dar lance só perto do fim do tempo
  | 'incremental';   // Diminuir valor progressivamente

export interface RoboConfig {
  enabled: boolean;
  strategy: LanceStrategy;
  valorMinimo: number;      // Não dar lance abaixo deste valor
  valorMaximo: number;      // Não dar lance acima deste valor
  decrementoPercentual: number; // Ex: 0.5 = reduzir 0.5% do lance atual
  decrementoFixo?: number;  // Ou valor fixo (ex: R$ 100)
  tempoRestanteMin: number; // Só lance se tempo > X segundos
}

export interface LanceContext {
  melhorLance: number;
  meuLance?: number;
  minhaPosicao?: number;
  tempoRestante: number; // segundos
  totalParticipantes: number;
}

export interface LanceDecision {
  shouldBid: boolean;
  suggestedValue?: number;
  reason: string;
}

/**
 * Motor de decisão do robô
 */
export class RoboLanceEngine {
  private config: RoboConfig;

  constructor(config: RoboConfig) {
    this.config = config;
  }

  /**
   * Decide se deve dar lance e qual valor
   */
  decideLance(context: LanceContext): LanceDecision {
    // Se desabilitado, não fazer nada
    if (!this.config.enabled) {
      return { shouldBid: false, reason: 'Robô desabilitado' };
    }

    // Se não há lance meu ou estou perdendo
    const estouPerdendo = !context.meuLance || context.meuLance > context.melhorLance;

    if (!estouPerdendo) {
      return { shouldBid: false, reason: 'Já estou vencendo' };
    }

    // Calcular novo valor baseado na estratégia
    let novoValor: number;

    switch (this.config.strategy) {
      case 'agressiva':
        novoValor = this.calcularLanceAgressivo(context);
        break;

      case 'conservadora':
        if (context.tempoRestante > this.config.tempoRestanteMin) {
          return { shouldBid: false, reason: 'Aguardando fim do tempo (estratégia conservadora)' };
        }
        novoValor = this.calcularLanceConservador(context);
        break;

      case 'incremental':
        novoValor = this.calcularLanceIncremental(context);
        break;
    }

    // Validar limites
    if (novoValor < this.config.valorMinimo) {
      return {
        shouldBid: false,
        reason: `Valor ${this.formatMoney(novoValor)} abaixo do mínimo (${this.formatMoney(this.config.valorMinimo)})`,
      };
    }

    if (novoValor > this.config.valorMaximo) {
      return {
        shouldBid: false,
        reason: `Valor ${this.formatMoney(novoValor)} acima do máximo (${this.formatMoney(this.config.valorMaximo)})`,
      };
    }

    // Validar se o lance é válido (menor que o melhor)
    if (novoValor >= context.melhorLance) {
      return {
        shouldBid: false,
        reason: 'Novo valor não vence o melhor lance atual',
      };
    }

    return {
      shouldBid: true,
      suggestedValue: novoValor,
      reason: `Estratégia ${this.config.strategy}: ${this.formatMoney(novoValor)}`,
    };
  }

  /**
   * Estratégia agressiva: reduzir o mínimo possível do melhor lance
   */
  private calcularLanceAgressivo(context: LanceContext): number {
    const reducao = this.config.decrementoFixo || 
      (context.melhorLance * this.config.decrementoPercentual / 100);

    return context.melhorLance - reducao;
  }

  /**
   * Estratégia conservadora: dar lance próximo do valor mínimo
   */
  private calcularLanceConservador(context: LanceContext): number {
    // Usar valor mínimo + pequena margem
    return this.config.valorMinimo * 1.02;
  }

  /**
   * Estratégia incremental: reduzir progressivamente
   */
  private calcularLanceIncremental(context: LanceContext): number {
    const reducaoBase = this.config.decrementoFixo || 
      (context.melhorLance * this.config.decrementoPercentual / 100);

    // Aumentar redução com o tempo (mais agressivo no final)
    const fatorTempo = Math.max(0.5, 1 - (context.tempoRestante / 300)); // 5 min = 300s
    const reducaoAjustada = reducaoBase * (1 + fatorTempo);

    return context.melhorLance - reducaoAjustada;
  }

  /**
   * Atualiza configuração do robô
   */
  updateConfig(newConfig: Partial<RoboConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Helper: formatar moeda
   */
  private formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

/**
 * Simular execução do robô (mock para testes)
 */
export async function simulateRoboExecution(
  config: RoboConfig,
  context: LanceContext
): Promise<{ success: boolean; newValue?: number; message: string }> {
  const robo = new RoboLanceEngine(config);
  const decision = robo.decideLance(context);

  if (!decision.shouldBid) {
    return {
      success: false,
      message: decision.reason,
    };
  }

  // Simular envio do lance (delay de 1-2 segundos)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Simular sucesso (95% de chance)
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      newValue: decision.suggestedValue,
      message: `Lance de ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(decision.suggestedValue!)} enviado com sucesso!`,
    };
  } else {
    return {
      success: false,
      message: 'Erro ao enviar lance: timeout da API',
    };
  }
}
