import Header from "./Header";
import Sidebar from "./ui/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[calc(100vh-120px)] p-6 lg:p-8 animate-fadeIn">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
