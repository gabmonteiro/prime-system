import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ flex: '0 0 256px', height: '100vh', position: 'sticky', top: 0, zIndex: 10 }}>
        <Sidebar />
      </div>
      <main style={{ flex: 1, padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
