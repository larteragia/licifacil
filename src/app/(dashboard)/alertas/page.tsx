'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Alert {
  id: string;
  name: string;
  keywords: string;
  estados: string[];
  modalidades: string[];
  valorMin?: number;
  valorMax?: number;
  active: boolean;
  lastTriggered?: string;
  matchCount?: number;
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    name: 'Equipamentos de TI em SP',
    keywords: 'equipamento informática computador',
    estados: ['SP'],
    modalidades: ['Pregão Eletrônico'],
    valorMin: 50000,
    valorMax: 500000,
    active: true,
    lastTriggered: '2026-02-09',
    matchCount: 3,
  },
  {
    id: '2',
    name: 'Serviços de Limpeza RJ/MG',
    keywords: 'limpeza conservação',
    estados: ['RJ', 'MG'],
    modalidades: ['Pregão Eletrônico', 'Concorrência'],
    active: true,
    lastTriggered: '2026-02-08',
    matchCount: 5,
  },
];

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    keywords: '',
    estados: [] as string[],
    modalidades: [] as string[],
  });

  const toggleAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, active: !alert.active } : alert
      )
    );
  };

  const deleteAlert = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este alerta?')) {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }
  };

  const handleCreateAlert = () => {
    if (!newAlert.name || !newAlert.keywords) {
      window.alert('Preencha o nome e as palavras-chave do alerta');
      return;
    }

    // TODO: Salvar no Supabase
    const newAlertObj: Alert = {
      id: Date.now().toString(),
      name: newAlert.name,
      keywords: newAlert.keywords,
      estados: newAlert.estados,
      modalidades: newAlert.modalidades,
      active: true,
      matchCount: 0,
    };

    setAlerts(prev => [newAlertObj, ...prev]);
    setNewAlert({ name: '', keywords: '', estados: [], modalidades: [] });
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meus Alertas</h1>
          <p className="text-gray-600 mt-1">
            Configure alertas para receber notificações de novos editais
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          + Criar Novo Alerta
        </Button>
      </div>

      {/* Aviso de desenvolvimento */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="font-medium text-yellow-800">🚧 Sistema em desenvolvimento</p>
        <p className="text-yellow-700 text-sm mt-1">
          A funcionalidade de persistência e envio de emails está implementada, mas aguarda configuração do Supabase e Resend.
        </p>
      </div>

      {/* Modal de criação */}
      {isCreating && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Criar Novo Alerta</CardTitle>
            <CardDescription>
              Configure os critérios do seu alerta personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Alerta</label>
              <Input
                placeholder="Ex: Equipamentos de TI em SP"
                value={newAlert.name}
                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Palavras-chave</label>
              <Input
                placeholder="Ex: equipamento informática computador"
                value={newAlert.keywords}
                onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Separe por espaços</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estados (opcional)</label>
              <select
                multiple
                className="w-full border rounded-md p-2 text-sm"
                value={newAlert.estados}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setNewAlert({ ...newAlert, estados: selected });
                }}
              >
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="DF">Distrito Federal</option>
                <option value="PR">Paraná</option>
                <option value="RS">Rio Grande do Sul</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Modalidades (opcional)</label>
              <select
                multiple
                className="w-full border rounded-md p-2 text-sm"
                value={newAlert.modalidades}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setNewAlert({ ...newAlert, modalidades: selected });
                }}
              >
                <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                <option value="Concorrência">Concorrência</option>
                <option value="Tomada de Preços">Tomada de Preços</option>
                <option value="Dispensa">Dispensa</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateAlert}>Salvar Alerta</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewAlert({ name: '', keywords: '', estados: [], modalidades: [] });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de alertas */}
      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Nenhum alerta configurado</p>
              <Button className="mt-4" onClick={() => setIsCreating(true)}>
                Criar Primeiro Alerta
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{alert.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alert.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Palavras-chave:</strong> {alert.keywords}
                      </p>
                      {alert.estados.length > 0 && (
                        <p>
                          <strong>Estados:</strong> {alert.estados.join(', ')}
                        </p>
                      )}
                      {alert.modalidades.length > 0 && (
                        <p>
                          <strong>Modalidades:</strong> {alert.modalidades.join(', ')}
                        </p>
                      )}
                      {(alert.valorMin || alert.valorMax) && (
                        <p>
                          <strong>Valor:</strong>{' '}
                          {alert.valorMin
                            ? `De ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(alert.valorMin)}`
                            : ''}{' '}
                          {alert.valorMax
                            ? `até ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(alert.valorMax)}`
                            : ''}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      {alert.lastTriggered && (
                        <span>
                          Último disparo: {new Date(alert.lastTriggered).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {alert.matchCount !== undefined && (
                        <span>{alert.matchCount} editais encontrados nos últimos 7 dias</span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      {alert.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.alert('Funcionalidade de edição em desenvolvimento')}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
