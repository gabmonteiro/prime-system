import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Prime System</h1>
      <p className="mb-8 text-lg text-gray-700">Sistema de exemplo com autenticação</p>
      <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        Ir para Login
      </Link>
    </main>
  );
}
