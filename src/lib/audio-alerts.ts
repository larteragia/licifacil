/**
 * Sistema de Alertas Sonoros
 * Task 3.6 - Etapa 03
 */

class AudioAlertSystem {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Toca um beep simples
   */
  playBeep(frequency: number = 800, duration: number = 200) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * Alerta de nova mensagem (beep único)
   */
  newMessageAlert() {
    this.playBeep(600, 150);
  }

  /**
   * Alerta de contemplação (sequência de 3 beeps)
   */
  async contemplationAlert() {
    for (let i = 0; i < 3; i++) {
      this.playBeep(1000, 300);
      await this.sleep(400);
    }
  }

  /**
   * Alerta crítico (loop contínuo até ser cancelado)
   */
  async criticalAlert() {
    this.isPlaying = true;
    while (this.isPlaying) {
      this.playBeep(1200, 200);
      await this.sleep(500);
      this.playBeep(800, 200);
      await this.sleep(800);
    }
  }

  /**
   * Para alertas em loop
   */
  stopAlert() {
    this.isPlaying = false;
  }

  /**
   * Toca notificação usando Audio HTML5 (fallback)
   */
  playNotificationSound(soundType: 'message' | 'contemplation' | 'critical' = 'message') {
    if (typeof window === 'undefined') return;

    // Criar elemento de áudio
    const audio = new Audio();
    
    // Em produção, usar arquivos de som reais
    // Por enquanto, usar data URI com beep sintético
    const audioData = this.generateAudioDataURI(soundType);
    audio.src = audioData;
    audio.volume = 0.5;
    
    audio.play().catch(err => {
      console.warn('[Audio] Erro ao reproduzir som:', err);
    });
  }

  /**
   * Gera data URI de áudio para diferentes tipos de alerta
   */
  private generateAudioDataURI(soundType: string): string {
    // Placeholder - em produção usar arquivos de som reais
    // Retorna string vazia - Web Audio API será usada no lugar
    return '';
  }

  /**
   * Helper para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Solicita permissão do usuário (necessário para autoplay)
   */
  async requestPermission(): Promise<boolean> {
    if (!this.audioContext) return false;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext.state === 'running';
  }
}

// Singleton
let audioAlertInstance: AudioAlertSystem | null = null;

export function getAudioAlertSystem(): AudioAlertSystem {
  if (!audioAlertInstance) {
    audioAlertInstance = new AudioAlertSystem();
  }
  return audioAlertInstance;
}

/**
 * Hook para uso em componentes React
 */
export function useAudioAlerts() {
  const alerts = getAudioAlertSystem();

  return {
    playNewMessage: () => alerts.newMessageAlert(),
    playContemplation: () => alerts.contemplationAlert(),
    playCritical: () => alerts.criticalAlert(),
    stopCritical: () => alerts.stopAlert(),
    requestPermission: () => alerts.requestPermission(),
  };
}
