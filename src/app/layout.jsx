import "./globals.css";
import { AuthProvider } from "../context/authContext";
import { BrandingProvider } from "../context/brandingContext";
import { ToastProvider } from "../components/ui/Toast";

export const metadata = {
  title: "Prime System",
  description: "Gestão da Prime Auto Care",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Cor de destaque escolhida em Configurações (carrega antes de pintar a página) */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/api/branding/tema.css" />
      </head>
      <body className="bg-gray-50">
        <BrandingProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
