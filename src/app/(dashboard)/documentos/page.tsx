'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Document {
  id: string;
  name: string;
  category: string;
  validUntil?: string;
  uploadedAt: string;
  fileSize: string;
  status: 'valid' | 'expiring' | 'expired';
}

const mockDocs: Document[] = [
  {
    id: '1',
    name: 'CND Federal (RFB)',
    category: 'fiscal',
    validUntil: '2026-06-15',
    uploadedAt: '2026-01-10',
    fileSize: '245 KB',
    status: 'valid',
  },
  {
    id: '2',
    name: 'CRF FGTS',
    category: 'fiscal',
    validUntil: '2026-03-01',
    uploadedAt: '2026-01-05',
    fileSize: '189 KB',
    status: 'expiring',
  },
];

export default function DocumentosPage() {
  const [documents] = useState<Document[]>(mockDocs);

  const statusColors = {
    valid: 'bg-green-100 text-green-800',
    expiring: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    valid: 'Válido',
    expiring: 'Vence em breve',
    expired: 'Vencido',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Documentos</h1>
          <p className="text-gray-600 mt-1">Organize documentos de habilitação e certidões</p>
        </div>
        <Button>+ Upload Documento</Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="font-medium text-yellow-800">🚧 Sistema em desenvolvimento</p>
        <p className="text-yellow-700 text-sm mt-1">
          Upload para Supabase Storage será ativado após configuração do backend.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Documentos Válidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {documents.filter(d => d.status === 'valid').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Vencendo em breve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {documents.filter(d => d.status === 'expiring').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {documents.filter(d => d.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-600">
                    Categoria: {doc.category} | Tamanho: {doc.fileSize}
                  </p>
                  {doc.validUntil && (
                    <p className="text-sm text-gray-600">
                      Validade: {new Date(doc.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[doc.status]}`}>
                    {statusLabels[doc.status]}
                  </span>
                  <Button size="sm" variant="outline">Download</Button>
                  <Button size="sm" variant="outline">Renovar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
