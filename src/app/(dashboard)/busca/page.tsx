'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BidFilters, type Bid, applyFilters } from '@/lib/filters';

// Mock data para demonstração
const mockBids: Bid[] = [
  {
    id: '1',
    portal: 'pncp',
    external_id: 'pncp001',
    numero: 'PE 001/2026',
    objeto: 'Aquisição de equipamentos de informática para laboratório',
    orgao: 'Prefeitura Municipal de São Paulo',
    modalidade: 'Pregão Eletrônico',
    valor_estimado: 150000,
    data_abertura: '2026-02-15',
    uf: 'SP',
    municipio: 'São Paulo',
    status: 'Aberto',
  },
  {
    id: '2',
    portal: 'compras.gov.br',
    external_id: 'comp002',
    numero: 'CC 045/2026',
    objeto: 'Contratação de serviços de manutenção predial',
    orgao: 'Governo do Estado do Rio de Janeiro',
    modalidade: 'Concorrência',
    valor_estimado: 350000,
    data_abertura: '2026-02-18',
    uf: 'RJ',
    municipio: 'Rio de Janeiro',
    status: 'Aberto',
  },
  {
    id: '3',
    portal: 'pncp',
    external_id: 'pncp003',
    numero: 'PE 112/2026',
    objeto: 'Fornecimento de material escolar',
    orgao: 'Ministério da Educação',
    modalidade: 'Pregão Eletrônico',
    valor_estimado: 2500000,
    data_abertura: '2026-02-20',
    uf: 'DF',
    municipio: 'Brasília',
    status: 'Aberto',
  },
];

export default function BuscaPage() {
  const [filters, setFilters] = useState<BidFilters>({});
  const [showFilters, setShowFilters] = useState(true);

  const filteredBids = applyFilters(mockBids, filters);

  const handleFilterChange = (key: keyof BidFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.values(filters).filter(v =>
    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Busca de Editais</h1>
          <p className="text-gray-600 mt-1">
            {filteredBids.length} editais encontrados
          </p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de filtros */}
        {showFilters && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Palavras-chave */}
              <div>
                <label className="text-sm font-medium mb-2 block">Palavras-chave</label>
                <Input
                  placeholder="Ex: equipamento, mobiliário..."
                  value={filters.keywords || ''}
                  onChange={(e) => handleFilterChange('keywords', e.target.value)}
                />
              </div>

              {/* Estados */}
              <div>
                <label className="text-sm font-medium mb-2 block">Estados</label>
                <select
                  multiple
                  className="w-full border rounded-md p-2 text-sm"
                  value={filters.estados || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    handleFilterChange('estados', selected);
                  }}
                >
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="PR">Paraná</option>
                  <option value="RS">Rio Grande do Sul</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd + clique para múltiplas seleções</p>
              </div>

              {/* Modalidade */}
              <div>
                <label className="text-sm font-medium mb-2 block">Modalidade</label>
                <select
                  multiple
                  className="w-full border rounded-md p-2 text-sm"
                  value={filters.modalidades || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    handleFilterChange('modalidades', selected);
                  }}
                >
                  <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                  <option value="Concorrência">Concorrência</option>
                  <option value="Tomada de Preços">Tomada de Preços</option>
                  <option value="Dispensa">Dispensa</option>
                  <option value="Inexigibilidade">Inexigibilidade</option>
                </select>
              </div>

              {/* Valor estimado */}
              <div>
                <label className="text-sm font-medium mb-2 block">Valor Estimado</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.valorMin || ''}
                    onChange={(e) => handleFilterChange('valorMin', parseFloat(e.target.value) || undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.valorMax || ''}
                    onChange={(e) => handleFilterChange('valorMax', parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={() => alert('Funcionalidade de salvar alerta em desenvolvimento')}
                >
                  Salvar como Alerta
                </Button>
                <Button className="w-full" variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Objeto</TableHead>
                    <TableHead>Órgão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBids.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum edital encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">{bid.numero}</TableCell>
                        <TableCell className="max-w-md truncate">{bid.objeto}</TableCell>
                        <TableCell className="max-w-xs truncate">{bid.orgao}</TableCell>
                        <TableCell>
                          {bid.valor_estimado
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(bid.valor_estimado)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {bid.data_abertura
                            ? new Date(bid.data_abertura).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell>{bid.uf || '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Nota de desenvolvimento */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-yellow-800">🚧 Sistema em desenvolvimento</p>
            <p className="text-yellow-700 mt-1">
              Os dados são fictícios. A busca real será implementada após configuração do Supabase com full-text search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
