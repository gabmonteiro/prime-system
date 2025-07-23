import Link from "next/link";
import { 
  ArrowRightIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  CogIcon,
  UsersIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="heroicon-md text-white" />
          </div>
          <span className="text-xl font-bold text-gradient-primary">Prime System</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Recursos</a>
          <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Sobre</a>
          <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contato</a>
        </div>
        
          <Link href="/login" className="btn-primary flex items-center space-x-2">
            <span>Entrar</span>
            <ArrowRightIcon className="heroicon-sm text-white" />
          </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center space-x-2 animate-fadeInScale">
              <ShieldCheckIcon className="heroicon-sm text-blue-700" />
              <span>Sistema Seguro e Confiável</span>
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 animate-slideInUp">
            Gerencie seu negócio com{" "}
            <span className="text-gradient-primary">Prime System</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            Uma plataforma completa e intuitiva para gestão empresarial. 
            Controle serviços, despesas e muito mais em um só lugar, 
            com segurança e eficiência.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <Link href="/login" className="btn-primary text-lg px-8 py-4 flex items-center space-x-3">
              <span>Começar Agora</span>
              <ArrowRightIcon className="heroicon-md text-white" />
            </Link>
            
            <button className="btn-secondary text-lg px-8 py-4 flex items-center space-x-3">
              <span>Ver Demo</span>
              <ClockIcon className="heroicon-md text-gray-600" />
            </button>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Recursos Poderosos</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra todas as funcionalidades que tornam o Prime System 
              a escolha ideal para sua empresa.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ChartBarIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualize todos os dados importantes do seu negócio em 
                gráficos e relatórios interativos e fáceis de entender.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <CogIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Serviços</h3>
              <p className="text-gray-600 leading-relaxed">
                Controle completo de serviços prestados, clientes atendidos 
                e histórico detalhado de todas as atividades.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.3s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ShieldCheckIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Segurança Avançada</h3>
              <p className="text-gray-600 leading-relaxed">
                Seus dados protegidos com criptografia de ponta e 
                autenticação segura para total tranquilidade.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.4s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <UsersIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Equipe</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize participantes, distribua tarefas e acompanhe 
                o desempenho da sua equipe em tempo real.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.5s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ClockIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relatórios em Tempo Real</h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe métricas importantes e tome decisões baseadas 
                em dados atualizados constantemente.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="card p-8 text-center group animate-slideInUp" style={{ animationDelay: '0.6s' }}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ChartBarIcon className="heroicon-lg text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Controle Financeiro</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitore receitas, despesas e fluxo de caixa com 
                ferramentas intuitivas e relatórios detalhados.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 lg:p-16 text-white animate-fadeInScale">
            <h2 className="text-4xl font-bold mb-6">
              Pronto para revolucionar sua gestão?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de empresas que já transformaram 
              seus resultados com o Prime System.
            </p>
            <Link href="/login" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center space-x-3 transition-all hover:transform hover:scale-105">
              <span>Começar Gratuitamente</span>
              <ArrowRightIcon className="heroicon-md text-blue-600" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 border-t border-gray-200 mt-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="heroicon-sm text-white" />
              </div>
              <span className="text-lg font-bold text-gradient-primary">Prime System</span>
            </div>
            <p className="text-gray-600 mb-6">
              © 2024 Prime System. Todos os direitos reservados.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Termos</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Privacidade</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
