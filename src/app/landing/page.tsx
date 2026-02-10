import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Vença mais licitações com <span className="text-blue-600">inteligência</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Sistema completo de monitoramento, alertas e automação para empresas que participam de licitações públicas.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/registro">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">
              Começar Grátis
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="border-2 border-gray-300 px-8 py-3 rounded-lg font-medium hover:border-gray-400">
              Ver Demo
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Busca Inteligente', desc: 'Filtros avançados e alertas personalizados' },
            { icon: '📊', title: 'Monitor de Lances', desc: 'Acompanhe pregões em tempo real' },
            { icon: '🤖', title: 'Robô de Lance', desc: 'Automação com múltiplas estratégias' },
            { icon: '💬', title: 'Chat do Pregoeiro', desc: 'Alertas críticos em 2 horas' },
            { icon: '🧠', title: 'IA Jurídica', desc: 'Assistente baseado na Lei 14.133/2021' },
            { icon: '📁', title: 'Gestão Documental', desc: 'Organize certidões e documentos' },
          ].map((feature, idx) => (
            <div key={idx} className="text-center p-6 border rounded-lg hover:shadow-lg transition">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Planos e Preços</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { name: 'Free', price: 'Grátis', features: ['Busca básica', '3 alertas', '1 empresa'] },
            { name: 'Starter', price: 'R$ 97/mês', features: ['Busca ilimitada', '10 alertas', 'Monitor de lances', '10 análises IA/mês'] },
            { name: 'Pro', price: 'R$ 197/mês', features: ['Tudo do Starter', 'Robô de lance', '50 análises IA/mês', 'RAG jurídico', '3 empresas'] },
            { name: 'Enterprise', price: 'Consultar', features: ['Tudo ilimitado', 'API access', 'Suporte prioritário', 'Customização'] },
          ].map((plan, idx) => (
            <div key={idx} className="border-2 rounded-lg p-6 hover:border-blue-600 transition">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600">✓ {f}</li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                {plan.name === 'Enterprise' ? 'Contatar' : 'Assinar'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl mb-8">Teste grátis por 14 dias. Sem cartão de crédito.</p>
          <Link href="/registro">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100">
              Criar Conta Grátis
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Licifácil - Sistema de intermediação de licitações públicas</p>
          <p className="text-xs text-gray-400 mt-2">Lei 14.133/2021 | CNPJ: 00.000.000/0001-00</p>
        </div>
      </footer>
    </div>
  );
}
