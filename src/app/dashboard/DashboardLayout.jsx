import Sidebar from "../../components/ui/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="min-h-screen bg-gray-50 px-2 py-4 transition-all flex-1">
        {children}
      </main>
    </div>
  );
}
