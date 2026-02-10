'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MonitoredAuction {
  id: string;
  numero: string;
  objeto: string;
  orgao: string;
  status: 'aguardando' | 'em_andamento' | 'finalizado';
  myPosition?: number;
  totalParticipants: number;
  lastUpdate: string;
  notifications: number;
}

const mockPregoes: MonitoredAuction[] = [
  {
    id: '001',
    numero: 'PE 001/2026',
    objeto: 'Aquisição de equipamentos de informática',
    orgao: 'Prefeitura Municipal de São Paulo',
    status: 'em_andamento',
    myPosition: 2,
    totalParticipants: 5,
    lastUpdate: '2026-02-10 14:35:22',
    notifications: 3,
  },
  {
    id: '045',
    numero: 'CC 045/2026',
    objeto: 'Serviços de manutenção predial',
    orgao: 'Governo do Estado do RJ',
    status: 'aguardando',
    totalParticipants: 8,
    lastUpdate: '2026-02-10 10:00:00',
    notifications: 0,
  },
  {
    id: '112',
    numero: 'PE 112/2026',
    objeto: 'Fornecimento de material escolar',
    orgao: 'Ministério da Educação',
    status: 'aguardando',
    totalParticipants: 12,
    lastUpdate: '2026-02-09 16:30:00',
    notifications: 1,
  },
];

export default function PregoesPage() {
  const [pregoes] = useState<MonitoredAuction[]>(mockPregoes);

  const statusColors = {
    aguardando: 'bg-gray-100 text-gray-800',
    em_andamento: 'bg-green-100 text-green-800',
    finalizado: 'bg-blue-100 text-blue-800',
  };

  const statusLabels = {
    aguardando: 'Aguardando',
    em_andamento: 'Em Andamento',
    finalizado: 'Finalizado',
  };

  const emAndamento = pregoes.filter(p => p.status === 'em_andamento').length;
  const aguardando = pregoes.filter(p => p.status === 'aguardando').length;
  const totalNotifications = pregoes.reduce((sum, p) => sum + p.notifications, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pregões Monitorados</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe todos os pregões em que sua empresa está participando
          </p>
        </div>
        <Button>+ Adicionar Pregão</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{emAndamento}</div>
            <p className="text-xs text-gray-500 mt-2">Pregões ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aguardando}</div>
            <p className="text-xs text-gray-500 mt-2">Ainda não iniciados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalNotifications}</div>
            <p className="text-xs text-gray-500 mt-2">Não lidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posição</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pregoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500">Nenhum pregão monitorado</p>
                    <Button className="mt-4">Adicionar Primeiro Pregão</Button>
                  </TableCell>
                </TableRow>
              ) : (
                pregoes.map((pregao) => (
                  <TableRow key={pregao.id}>
                    <TableCell className="font-medium">
                      {pregao.numero}
                      {pregao.notifications > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {pregao.notifications}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{pregao.objeto}</TableCell>
                    <TableCell className="max-w-xs truncate">{pregao.orgao}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[pregao.status]
                        }`}
                      >
                        {statusLabels[pregao.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {pregao.myPosition ? (
                        <span className="font-bold text-lg">{pregao.myPosition}º</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{pregao.totalParticipants}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(pregao.lastUpdate).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {pregao.status === 'em_andamento' ? (
                          <Link href={`/monitor/${pregao.id}`}>
                            <Button size="sm" variant="default">
                              Monitorar
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="outline">
                            Ver Detalhes
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Nota de desenvolvimento */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-yellow-800">🚧 Sistema em desenvolvimento</p>
        <p className="text-yellow-700 mt-1">
          Dados simulados. Conexão com Compras.gov.br via WebSocket será implementada após configuração do backend.
        </p>
      </div>
    </div>
  );
}
