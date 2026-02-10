import Image from 'next/image';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src="/assets/logopng.png"
                alt="Licifácil"
                width={40}
                height={40}
                className="rounded"
              />
              <span className="font-bold text-xl text-gray-900">Licifácil</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/editais"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Editais
              </Link>
              <Link
                href="/alertas"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Alertas
              </Link>
              <Link
                href="/documentos"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Documentos
              </Link>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Usuário Demo</span>
              <Link
                href="/login"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Sair
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2026 Licifácil - Sistema de intermediação de licitações públicas
          </p>
        </div>
      </footer>
    </div>
  );
}
