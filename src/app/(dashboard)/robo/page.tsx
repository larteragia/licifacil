'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type RoboConfig } from '@/lib/robo-lance';

export default function RoboPage() {
  const [config, setConfig] = useState<RoboConfig>({
    enabled: false,
    strategy: 'incremental',
    valorMinimo: 100000,
    valorMaximo: 150000,
    decrementoPercentual: 0.5,
    decrementoFixo: 100,
    tempoRestanteMin: 300,
  });

  const [isActive, setIsActive] = useState(false);

  const handleToggleRobo = () => {
    if (!isActive) {
      if (confirm('⚠️ ATENÇÃO: Ao ativar o robô, lances serão dados automaticamente. Confirmar?')) {
        setIsActive(true);
        setConfig(prev => ({ ...prev, enabled: true }));
      }
    } else {
      setIsActive(false);
      setConfig(prev => ({ ...prev, enabled: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Robô de Lance Automatizado</h1>
          <p className="text-gray-600 mt-1">Configure estratégias de lances automáticos</p>
        </div>
        <Button
          size="lg"
          variant={isActive ? 'destructive' : 'default'}
          onClick={handleToggleRobo}
        >
          {isActive ? '⏸️ Pausar Robô' : '▶️ Ativar Robô'}
        </Button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
        <h3 className="font-bold text-red-800 mb-2">⚠️ AVISO LEGAL IMPORTANTE</h3>
        <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
          <li>O robô opera com base nas regras configuradas PELO USUÁRIO</li>
          <li>A responsabilidade pelos lances é EXCLUSIVA da empresa</li>
          <li>Certifique-se de que os limites estão corretos ANTES de ativar</li>
          <li>O Licifácil não se responsabiliza por lances indevidos</li>
        </ul>
      </div>

      {/* Status */}
      {isActive && (
        <Card className="border-green-500 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-bold text-lg">Robô ATIVO</p>
                <p className="text-sm text-gray-600">Monitorando pregões e dando lances automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estratégia de Lance</CardTitle>
            <CardDescription>Como o robô deve se comportar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Estratégia</label>
              <select
                className="w-full border rounded-md p-2"
                value={config.strategy}
                onChange={(e) => setConfig({ ...config, strategy: e.target.value as any })}
                disabled={isActive}
              >
                <option value="agressiva">Agressiva (dar lance imediatamente)</option>
                <option value="conservadora">Conservadora (aguardar fim do tempo)</option>
                <option value="incremental">Incremental (reduzir progressivamente)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Mínimo (Limite Inferior)</label>
              <Input
                type="number"
                value={config.valorMinimo}
                onChange={(e) => setConfig({ ...config, valorMinimo: parseFloat(e.target.value) })}
                disabled={isActive}
              />
              <p className="text-xs text-gray-500 mt-1">Nunca dar lance abaixo deste valor</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Máximo (Limite Superior)</label>
              <Input
                type="number"
                value={config.valorMaximo}
                onChange={(e) => setConfig({ ...config, valorMaximo: parseFloat(e.target.value) })}
                disabled={isActive}
              />
              <p className="text-xs text-gray-500 mt-1">Nunca dar lance acima deste valor</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Decremento Percentual (%)</label>
              <Input
                type="number"
                step="0.1"
                value={config.decrementoPercentual}
                onChange={(e) => setConfig({ ...config, decrementoPercentual: parseFloat(e.target.value) })}
                disabled={isActive}
              />
              <p className="text-xs text-gray-500 mt-1">Ex: 0.5 = reduzir 0.5% do lance atual</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Decremento Fixo (R$) - Opcional</label>
              <Input
                type="number"
                value={config.decrementoFixo || ''}
                onChange={(e) => setConfig({ ...config, decrementoFixo: parseFloat(e.target.value) || undefined })}
                disabled={isActive}
              />
              <p className="text-xs text-gray-500 mt-1">Valor fixo a reduzir (ex: R$ 100)</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tempo Mínimo Restante (segundos)</label>
              <Input
                type="number"
                value={config.tempoRestanteMin}
                onChange={(e) => setConfig({ ...config, tempoRestanteMin: parseInt(e.target.value) })}
                disabled={isActive}
              />
              <p className="text-xs text-gray-500 mt-1">Só dar lance se tempo restante for maior que X segundos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulação</CardTitle>
            <CardDescription>Teste a estratégia antes de ativar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Cenário Exemplo:</p>
                <p className="text-sm">Melhor lance atual: <strong>R$ 145.000,00</strong></p>
                <p className="text-sm">Seu lance: <strong>R$ 148.000,00</strong> (2º lugar)</p>
                <p className="text-sm">Tempo restante: <strong>4min 30s</strong></p>
              </div>

              <Button className="w-full" onClick={() => alert('Simulação: Robô daria lance de R$ 144.275,00')}>
                Simular Decisão
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Decisão do Robô:</p>
                <p>✅ DAR LANCE de <strong>R$ 144.275,00</strong></p>
                <p className="text-xs text-gray-600 mt-2">
                  Razão: Estratégia incremental - redução de {config.decrementoPercentual}% + fator tempo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico (mock) */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lances Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between">
                <span className="text-sm font-medium">PE 001/2026</span>
                <span className="text-xs text-gray-600">2026-02-10 14:25:30</span>
              </div>
              <p className="text-sm mt-1">Lance: R$ 144.275,00 - <span className="text-green-600 font-medium">Sucesso</span></p>
            </div>
            <div className="text-center text-sm text-gray-500 py-4">
              Nenhum lance automático registrado ainda
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
