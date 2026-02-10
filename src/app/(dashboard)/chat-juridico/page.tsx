'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { lei: string; artigo: string }[];
}

const mockResponses: Record<string, string> = {
  default: 'Não encontrei informações específicas sobre isso na Lei 14.133/2021. Pode reformular a pergunta?',
  prazo: 'De acordo com o Art. 165 da Lei 14.133/2021, o prazo para interposição de recurso é de 3 (três) dias úteis, contado da intimação do ato.',
  habilitação: 'Segundo o Art. 63 da Lei 14.133/2021, a habilitação será verificada por meio de documentação que comprove: I - habilitação jurídica; II - qualificação técnica; III - qualificação econômico-financeira; IV - regularidade fiscal e trabalhista.',
};

export default function ChatJuridicoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente jurídico especializado em licitações. Posso responder dúvidas sobre a Lei 14.133/2021, LC 123/2006 e outras normas. Como posso ajudar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Resposta mock baseada em keywords
    let response = mockResponses.default;
    let sources: { lei: string; artigo: string }[] = [];

    if (input.toLowerCase().includes('prazo') || input.toLowerCase().includes('recurso')) {
      response = mockResponses.prazo;
      sources = [{ lei: '14.133/2021', artigo: '165' }];
    } else if (input.toLowerCase().includes('habilita')) {
      response = mockResponses.habilitação;
      sources = [{ lei: '14.133/2021', artigo: '63' }];
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      sources,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Jurídico com IA</h1>
        <p className="text-gray-600 mt-1">Tire dúvidas sobre legislação de licitações</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="font-medium text-yellow-800">🚧 RAG em desenvolvimento</p>
        <p className="text-yellow-700 text-sm mt-1">
          Sistema responde com dados mock. RAG com Lei 14.133/2021 será ativado após configuração do ChromaDB + Claude API.
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Conversa</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs font-medium mb-1">Fontes:</p>
                      {msg.sources.map((source, idx) => (
                        <p key={idx} className="text-xs">
                          📖 Lei {source.lei}, Art. {source.artigo}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Buscando na legislação...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Ex: Qual o prazo para recurso em pregão eletrônico?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading}>
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
