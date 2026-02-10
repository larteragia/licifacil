import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// Dados de exemplo (mock)
const mockEditais = [
  {
    id: '1',
    numero: 'PE 001/2026',
    orgao: 'Prefeitura Municipal de São Paulo',
    objeto: 'Aquisição de equipamentos de informática',
    valor: 150000,
    dataAbertura: '2026-02-15',
    status: 'Aberto',
  },
  {
    id: '2',
    numero: 'CC 045/2026',
    orgao: 'Governo do Estado do Rio de Janeiro',
    objeto: 'Contratação de serviços de manutenção predial',
    valor: 350000,
    dataAbertura: '2026-02-18',
    status: 'Aberto',
  },
  {
    id: '3',
    numero: 'PE 112/2026',
    orgao: 'Ministério da Educação',
    objeto: 'Fornecimento de material escolar',
    valor: 2500000,
    dataAbertura: '2026-02-20',
    status: 'Aberto',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Banner de desenvolvimento */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Sistema em desenvolvimento</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Os dados abaixo são fictícios. Os scrapers estão implementados, mas a persistência aguarda configuração do Supabase.
              </p>
              <p className="mt-1">
                Teste os scrapers em: <a href="/api/test-scrapers" className="font-medium underline">/ /test-scrapers</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total de Editais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockEditais.length}</div>
            <p className="text-xs text-gray-500 mt-2">+12 nos últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-gray-500 mt-2">2 com novos editais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 3,0M</div>
            <p className="text-xs text-gray-500 mt-2">Editais monitorados</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Editais */}
      <Card>
        <CardHeader>
          <CardTitle>Editais Recentes</CardTitle>
          <CardDescription>
            Últimos editais coletados pelos scrapers PNCP e Compras.gov.br
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEditais.map((edital) => (
                <TableRow key={edital.id}>
                  <TableCell className="font-medium">{edital.numero}</TableCell>
                  <TableCell className="max-w-xs truncate">{edital.orgao}</TableCell>
                  <TableCell className="max-w-md truncate">{edital.objeto}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(edital.valor)}
                  </TableCell>
                  <TableCell>
                    {new Date(edital.dataAbertura).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {edital.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
