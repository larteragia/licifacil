'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // TODO: Implementar autenticação com Supabase
    setTimeout(() => {
      setError('Supabase não configurado ainda. Funcionalidade em desenvolvimento.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/logopng.png"
              alt="Licifácil"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo ao Licifácil</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/recuperar-senha" className="text-blue-600 hover:underline">
                Esqueceu sua senha?
              </Link>
              <Link href="/registro" className="text-blue-600 hover:underline">
                Criar conta
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>🚧 Sistema em desenvolvimento</p>
            <p className="mt-2">
              Autenticação será ativada após configuração do Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
