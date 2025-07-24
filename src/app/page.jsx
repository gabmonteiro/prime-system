"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FaArrowRight,
  FaShieldAlt,
  FaChartBar,
  FaCog,
  FaUsers,
  FaClock,
  FaBars,
  FaTimes,
  FaPlay,
  FaCheck,
  FaStar,
  FaCar,
  FaCalendarAlt,
  FaBoxes,
} from "react-icons/fa";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Redirect logic here
    }, 2000);
  };

  const features = [
    {
      icon: FaCar,
      title: "Gestão de Serviços",
      description:
        "Controle completo dos serviços de estética automotiva, desde lavagem até enceramento e proteção cerâmica.",
      color: "blue",
    },
    {
      icon: FaUsers,
      title: "Cadastro de Clientes",
      description:
        "Gerencie informações dos clientes, histórico de veículos e preferências de serviços personalizados.",
      color: "indigo",
    },
    {
      icon: FaCalendarAlt,
      title: "Agendamento Online",
      description:
        "Sistema completo de agendamentos com controle de horários, profissionais e disponibilidade.",
      color: "green",
    },
    {
      icon: FaChartBar,
      title: "Relatórios Financeiros",
      description:
        "Acompanhe faturamento, despesas operacionais e controle financeiro da Prime Auto Care.",
      color: "purple",
    },
    {
      icon: FaBoxes,
      title: "Controle de Estoque",
      description:
        "Gerencie produtos, ceras, produtos químicos e equipamentos utilizados nos serviços.",
      color: "orange",
    },
    {
      icon: FaCog,
      title: "Configurações do Sistema",
      description:
        "Personalize o sistema conforme as necessidades específicas da Prime Auto Care.",
      color: "emerald",
    },
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Proprietário BMW 320i",
      content:
        "A Prime Auto Care transformou meu carro! O resultado dos serviços é excepcional e o atendimento impecável.",
      rating: 5,
    },
    {
      name: "Marina Santos",
      role: "Cliente Audi A4",
      content:
        "Profissionais altamente qualificados! Meu carro ficou como novo após o tratamento cerâmico.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 lg:w-96 lg:h-96 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float-slow"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/80 backdrop-blur-lg shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/prime auto care.png"
                alt="Prime Auto Care Logo"
                className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
              />
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Prime Auto Care
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="nav-link">
                Serviços
              </a>
              <a href="#testimonials" className="nav-link">
                Clientes
              </a>
              <a href="#about" className="nav-link">
                Sobre
              </a>
              <a href="#contact" className="nav-link">
                Contato
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/login" className="btn-secondary">
                Sistema
              </Link>
              <Link href="/dashboard" className="btn-primary">
                <span>Agendar Serviço</span>
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FaTimes className="w-6 h-6 text-gray-600" />
              ) : (
                <FaBars className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden bg-white/95 backdrop-blur-lg border-t border-gray-200`}
        >
          <div className="px-4 py-6 space-y-4">
            <a href="#features" className="block nav-link-mobile">
              Serviços
            </a>
            <a href="#testimonials" className="block nav-link-mobile">
              Clientes
            </a>
            <a href="#about" className="block nav-link-mobile">
              Sobre
            </a>
            <a href="#contact" className="block nav-link-mobile">
              Contato
            </a>
            <div className="pt-4 space-y-3">
              <Link
                href="/login"
                className="block btn-secondary w-full text-center"
              >
                Sistema
              </Link>
              <Link href="/dashboard" className="block btn-primary w-full">
                <span>Agendar Serviço</span>
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <main className="relative z-10 pt-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-8 flex justify-center animate-fadeInScale">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow">
                <FaCar className="w-4 h-4" />
                <span>Especialistas em Estética Automotiva</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 animate-slideInUp leading-tight">
              Cuide do seu veículo com{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Prime Auto Care
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed animate-slideInUp animation-delay-200">
              Estética automotiva premium com tecnologia de ponta. Proteja e
              valorize seu veículo com nossos serviços especializados e sistema
              de gestão avançado.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16 animate-slideInUp animation-delay-400">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="btn-primary-large group"
                aria-label="Começar agora"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <span>Agendar Serviço</span>
                    <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button className="btn-secondary-large group">
                <FaPlay className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Ver Serviços</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="animate-fadeInScale animation-delay-600">
              <p className="text-sm text-gray-500 mb-4">
                Confiado por mais de 500+ clientes satisfeitos
              </p>
              <div className="flex items-center justify-center space-x-8 opacity-60">
                {/* Company logos would go here */}
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <section id="features" className="mt-32 lg:mt-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 lg:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Serviços Especializados
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Conheça nossos serviços premium de estética automotiva e sistema
                de gestão para sua oficina.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`feature-icon bg-${feature.color}-100 group-hover:bg-${feature.color}-200`}
                  >
                    <feature.icon
                      className={`w-7 h-7 lg:w-8 lg:h-8 text-${feature.color}-600`}
                    />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-600 font-medium text-sm flex items-center">
                      Saiba mais
                      <FaArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="mt-32 lg:mt-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                O que nossos clientes dizem
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="mt-32 lg:mt-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cta-section">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
                  Pronto para cuidar do seu veículo?
                </h2>
                <p className="text-lg sm:text-xl lg:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Agende seu serviço na Prime Auto Care e descubra a diferença
                  de um trabalho profissional.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                  <Link href="/dashboard" className="btn-white-large group">
                    <span>Agendar Serviço</span>
                    <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="btn-outline-white-large">
                    Ver Localização
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-6 text-white/80 text-sm">
                  <div className="flex items-center">
                    <FaCheck className="w-4 h-4 mr-2" />
                    <span>Orçamento gratuito</span>
                  </div>
                  <div className="flex items-center">
                    <FaCheck className="w-4 h-4 mr-2" />
                    <span>Garantia de qualidade</span>
                  </div>
                  <div className="flex items-center">
                    <FaCheck className="w-4 h-4 mr-2" />
                    <span>Suporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-gray-900 text-white mt-32 lg:mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src="/prime auto care.png"
                  alt="Prime Auto Care Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold">Prime Auto Care</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Especialistas em estética automotiva com tecnologia avançada e
                atendimento personalizado para cuidar do seu veículo.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Icons */}
                <a href="#" className="social-icon" aria-label="Facebook">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                    f
                  </div>
                </a>
                <a href="#" className="social-icon" aria-label="Twitter">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors">
                    t
                  </div>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                    in
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Serviços</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="footer-link">
                    Lavagem Premium
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Enceramento
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Proteção Cerâmica
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Detalhamento
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="footer-link">
                    Agendar Serviço
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Localização
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="#" className="footer-link">
                    Orçamento
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Prime Auto Care. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="footer-link text-sm">
                Termos de Uso
              </a>
              <a href="#" className="footer-link text-sm">
                Política de Privacidade
              </a>
              <a href="#" className="footer-link text-sm">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
