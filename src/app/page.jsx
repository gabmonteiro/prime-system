"use client";
import Link from "next/link";
import {
  ArrowRightIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SwatchIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { BrandLogo } from "../context/brandingContext";

const FEATURES = [
  {
    icon: WrenchScrewdriverIcon,
    title: "Serviços e parcelamento",
    description:
      "Lance serviços à vista ou parcelados. Cada parcela é recebida separadamente, escolhendo em qual conta o dinheiro entrou, e o sistema mostra o que está atrasado.",
    tags: ["Parcelas mensais", "Pago / parcial / atrasado"],
  },
  {
    icon: IdentificationIcon,
    title: "Clientes e veículos",
    description:
      "Cadastro de clientes com seus veículos e o histórico completo de serviços de cada um, inclusive por carro. Busca rápida por nome, telefone, modelo ou placa.",
    tags: ["Histórico por carro", "Mesclar duplicados"],
  },
  {
    icon: BuildingLibraryIcon,
    title: "Contas e saldos",
    description:
      "Dinheiro físico, banco ou outras contas, cada uma com seu saldo, extrato e transferências entre elas. Toda entrada e saída diz de qual conta é.",
    tags: ["Extrato", "Transferências"],
  },
  {
    icon: UsersIcon,
    title: "Divisão entre sócios",
    description:
      "Calcula automaticamente quanto cada sócio gerou no mês, a partir do que realmente entrou, e registra a retirada já dividida.",
    tags: ["Pelo que entrou no mês", "Retirada com 1 clique"],
  },
  {
    icon: CurrencyDollarIcon,
    title: "Despesas",
    description:
      "Compras, gastos e retiradas separados. O lucro do mês considera só as despesas operacionais, e cada despesa sai de uma conta.",
    tags: ["Compras e gastos", "Retiradas à parte"],
  },
  {
    icon: ShoppingCartIcon,
    title: "Lista de compras",
    description:
      "Planeje o que precisa ser comprado por urgência. Quando comprar, um clique lança a despesa e tira o item da lista.",
    tags: ["Urgência", "Vira despesa"],
  },
];

const DASHBOARD = [
  {
    icon: ChartBarIcon,
    title: "Lucro do mês",
    text: "Receita recebida menos despesas, comparada ao mês anterior",
  },
  {
    icon: CreditCardIcon,
    title: "Ticket médio",
    text: "Quanto rende, em média, cada serviço",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Mais realizados",
    text: "Os serviços que mais saem, no mês e em 12 meses",
  },
  {
    icon: IdentificationIcon,
    title: "Melhores clientes",
    text: "Quem mais gasta nos últimos 12 meses",
  },
  {
    icon: BanknotesIcon,
    title: "A receber",
    text: "Próximas parcelas e o que está atrasado",
  },
  {
    icon: BuildingLibraryIcon,
    title: "Saldo por conta",
    text: "Onde está o dinheiro agora",
  },
];

const EXTRAS = [
  {
    icon: ShieldCheckIcon,
    title: "Perfis e permissões",
    text: "Administrador, gerente, funcionário e visualizador: cada um vê e faz só o que pode.",
  },
  {
    icon: DocumentTextIcon,
    title: "Auditoria",
    text: "Registro de quem criou, alterou ou excluiu cada informação, e quando.",
  },
  {
    icon: FunnelIcon,
    title: "Filtros em tudo",
    text: "Pago, não pago, mês, tipo, participante, conta... e os totais acompanham o filtro.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Funciona no celular",
    text: "Telas pensadas para usar no dia a dia, direto do celular.",
  },
  {
    icon: SwatchIcon,
    title: "Com a sua marca",
    text: "Logo da empresa e cor de destaque configuráveis.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo size="md" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent truncate">
                Prime System
              </span>
            </div>
            <Link
              href="/login"
              className="btn-primary !px-4 !py-2 sm:!px-6 sm:!py-3 shrink-0"
            >
              <span>Entrar</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-16 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center animate-fadeInScale">
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <CheckCircleIcon className="h-4 w-4" /> Versão 2.0
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              A gestão da sua
              <span className="block bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 bg-clip-text text-transparent">
                estética automotiva
              </span>
            </h1>
            <p className="text-lg sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Serviços, parcelas, clientes, contas, despesas e a divisão entre
              sócios.
              <span className="font-semibold text-blue-700">
                {" "}
                Tudo em um só lugar.
              </span>
            </p>
            <Link href="/login" className="btn-primary-large">
              <span>Acessar o sistema</span>
              <ArrowRightIcon className="h-6 w-6" />
            </Link>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
                Funcionalidades
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Do lançamento do serviço até o dinheiro no bolso de cada sócio
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 animate-slideInUp"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-5 shadow-md">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {f.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-5">
                      {f.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {f.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
                Um dashboard que responde
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Os números que importam para decidir, mês a mês
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {DASHBOARD.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.title}
                    className="flex gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-md border border-white/40"
                  >
                    <div className="p-3 h-fit rounded-xl bg-blue-100 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{d.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{d.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Extras */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {EXTRAS.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white shadow-md flex items-center justify-center">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{e.title}</h3>
                  <p className="text-sm text-gray-600">{e.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="cta-section text-center !p-8 sm:!p-12">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                Pronto para começar o dia?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Entre com seu usuário para lançar serviços e acompanhar o mês.
              </p>
              <Link href="/login" className="btn-white-large">
                <span>Acessar o sistema</span>
                <ArrowRightIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <span className="text-lg font-bold">Prime System</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Prime System. Todos os direitos
              reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
