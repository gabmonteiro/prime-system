"use client";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  BanknotesIcon,
  TagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  const features = [
    {
      icon: WrenchScrewdriverIcon,
      title: "Gerenciar Serviços",
      description: "Controle completo de serviços prestados, clientes, veículos e valores. Sistema de participantes e cálculo automático de comissões.",
      color: "from-blue-500 to-indigo-500 text-white border-blue-200",
      stats: "Gestão completa de serviços"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Controle de Despesas",
      description: "Monitore gastos e compras da empresa com categorização automática. Relatórios detalhados de custos operacionais.",
      color: "from-green-500 to-emerald-500 text-white border-green-200",
      stats: "Controle financeiro total"
    },
    {
      icon: ShoppingCartIcon,
      title: "Lista de Compras",
      description: "Planeje futuras aquisições com sistema de prioridades (urgente, média, baixa) e estimativas de valores.",
      color: "from-purple-500 to-pink-500 text-white border-purple-200",
      stats: "Planejamento inteligente"
    },
    {
      icon: UserGroupIcon,
      title: "Gerenciar Usuários",
      description: "Administre usuários do sistema com controles de acesso e permissões diferenciadas para admins.",
      color: "from-gray-700 to-gray-400 text-white border-gray-300",
      stats: "Segurança e controle"
    }
  ];

  const stats = [
    {
      icon: ChartBarIcon,
      title: "Dashboard Analítico",
      description: "Visão completa do negócio com gráficos e métricas em tempo real",
      value: "100%",
      label: "Visibilidade"
    },
    {
      icon: BanknotesIcon,
      title: "Controle Financeiro",
      description: "Receitas, despesas e saldo mensal automatizados",
      value: "R$",
      label: "Precisão"
    },
    {
      icon: TagIcon,
      title: "Categorização",
      description: "Organize gastos por tipo e categorias personalizadas",
      value: "Auto",
      label: "Organização"
    },
    {
      icon: CalendarIcon,
      title: "Histórico Completo",
      description: "Acompanhe a evolução do negócio ao longo do tempo",
      value: "365",
      label: "Dias/ano"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-slow"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Prime System
                </h1>
              </div>
              <button
                onClick={handleLoginRedirect}
                className="btn-primary"
              >
                <span>Acessar Sistema</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="animate-fadeInScale">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                Gerencie seu
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Negócio Automotivo
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Sistema completo para controle de serviços, despesas, usuários e planejamento financeiro. 
                <span className="font-semibold text-indigo-600"> Tudo em um só lugar.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={handleLoginRedirect}
                  className="btn-primary-large"
                >
                  <span>Começar Agora</span>
                  <ArrowRightIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Gratuito para começar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Funcionalidades Principais
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Todas as ferramentas que você precisa para gerenciar seu negócio automotivo de forma eficiente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="feature-card animation-delay-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`feature-icon bg-gradient-to-r ${feature.color} shadow-lg border-2 flex items-center justify-center`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {feature.stats}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Controle Total do Negócio
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Métricas e análises que ajudam você a tomar decisões estratégicas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 animate-slideInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-indigo-600 mb-3">
                      {stat.label}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {stat.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="cta-section text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Pronto para começar?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Transforme a gestão do seu negócio automotivo hoje mesmo. 
                Sistema completo, fácil de usar e resultados imediatos.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={handleLoginRedirect}
                  className="btn-white-large"
                >
                  <span>Acessar Sistema</span>
                  <ArrowRightIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-2 text-white/90">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Setup em 5 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Prime System</h3>
            </div>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Sistema de gestão completo para empresas automotivas. 
              Controle de serviços, despesas, usuários e muito mais.
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500">
                © 2025 Prime System. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
