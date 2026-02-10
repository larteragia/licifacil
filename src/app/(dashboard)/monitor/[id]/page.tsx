'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { detectContemplation, classifyMessagePriority, formatAlertMessage } from '@/lib/contemplation-detector';
import { useAudioAlerts } from '@/lib/audio-alerts';

interface Lance {
  id: string;
  timestamp: string;
  empresa: string;
  valor: number;
  posicao: number;
}

interface ChatMessage {
  id: string;
  timestamp: string;
  sender: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Mock data
const mockLances: Lance[] = [
  { id: '1', timestamp: '2026-02-10 14:30:15', empresa: 'Empresa A', valor: 145000, posicao: 1 },
  { id: '2', timestamp: '2026-02-10 14:30:45', empresa: 'Sua Empresa', valor: 148000, posicao: 2 },
  { id: '3', timestamp: '2026-02-10 14:31:20', empresa: 'Empresa C', valor: 152000, posicao: 3 },
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    timestamp: '2026-02-10 14:25:00',
    sender: 'Pregoeiro',
    content: 'Pregão iniciado. Aguardando propostas iniciais.',
    priority: 'low',
  },
  {
    id: '2',
    timestamp: '2026-02-10 14:32:00',
    sender: 'Pregoeiro',
    content: 'Atenção! Empresa A está na liderança. Demais empresas têm 5 minutos para novos lances.',
    priority: 'medium',
  },
];

export default function MonitorPregaoPage({ params }: { params: { id: string } }) {
  const [lances, setLances] = useState<Lance[]>(mockLances);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioAlerts = useAudioAlerts();

  const myCompanyName = 'Sua Empresa';
  const pregaoNumber = `PE ${params.id}/2026`;

  // Simular novos lances e mensagens
  useEffect(() => {
    const interval = setInterval(() => {
      // Chance de 20% de novo lance
      if (Math.random() < 0.2) {
        const novoLance: Lance = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('pt-BR'),
          empresa: Math.random() > 0.5 ? 'Empresa A' : 'Empresa C',
          valor: 145000 - Math.random() * 5000,
          posicao: Math.floor(Math.random() * 3) + 1,
        };
        setLances(prev => [novoLance, ...prev].slice(0, 10));

        if (audioEnabled) {
          audioAlerts.playNewMessage();
        }
      }

      // Chance de 10% de nova mensagem
      if (Math.random() < 0.1) {
        const novaMensagem: ChatMessage = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('pt-BR'),
          sender: 'Pregoeiro',
          content: 'Atualização do pregão em andamento.',
          priority: 'low',
        };
        setMessages(prev => [...prev, novaMensagem]);

        // Detectar contemplação
        const detection = detectContemplation(novaMensagem.content, myCompanyName);
        if (detection.isContemplated && audioEnabled) {
          audioAlerts.playContemplation();
          alert(formatAlertMessage(detection, pregaoNumber));
        }
      }
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [audioEnabled]);

  const enableAudio = async () => {
    const permitted = await audioAlerts.requestPermission();
    if (permitted) {
      setAudioEnabled(true);
      audioAlerts.playNewMessage(); // Teste
    }
  };

  const melhorLance = lances[0];
  const meuMelhorLance = lances.find(l => l.empresa === myCompanyName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitor de Pregão</h1>
          <p className="text-gray-600 mt-1">{pregaoNumber} - Em andamento</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={audioEnabled ? 'default' : 'outline'}
            onClick={enableAudio}
          >
            {audioEnabled ? '🔊 Som Ativo' : '🔇 Ativar Som'}
          </Button>
          <Button variant="outline">📊 Relatório</Button>
        </div>
      </div>

      {/* Aviso de desenvolvimento */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-800">🚧 Demonstração com dados simulados</p>
        <p className="text-blue-700 text-sm mt-1">
          Lances e mensagens são gerados aleatoriamente. Sistema real será conectado via WebSocket ao Compras.gov.br.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sua Posição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {meuMelhorLance ? `${meuMelhorLance.posicao}º` : '-'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {meuMelhorLance
                ? `Lance: ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(meuMelhorLance.valor)}`
                : 'Sem lances'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Melhor Lance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {melhorLance
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(melhorLance.valor)
                : '-'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {melhorLance ? melhorLance.empresa : 'Nenhum lance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tempo Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">04:32</div>
            <p className="text-sm text-gray-600 mt-2">Fase de lances</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico de Lances */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Lances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lances.map((lance) => (
                <div
                  key={lance.id}
                  className={`p-3 rounded-lg border ${
                    lance.empresa === myCompanyName
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{lance.empresa}</p>
                      <p className="text-sm text-gray-600">{lance.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(lance.valor)}
                      </p>
                      <p className="text-sm text-gray-600">{lance.posicao}º lugar</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat do Pregoeiro */}
        <Card>
          <CardHeader>
            <CardTitle>Chat do Pregoeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.priority === 'critical'
                      ? 'bg-red-50 border-2 border-red-500'
                      : msg.priority === 'high'
                      ? 'bg-yellow-50 border-2 border-yellow-400'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{msg.sender}</p>
                    <p className="text-xs text-gray-500">{msg.timestamp}</p>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
