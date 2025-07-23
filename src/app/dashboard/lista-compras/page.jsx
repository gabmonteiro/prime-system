'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import DashboardLayout from '../DashboardLayout';
import { useRouter } from 'next/navigation';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400 }}>
        {children}
        <button onClick={onClose} style={{ marginTop: 16 }}>Fechar</button>
      </div>
    </div>
  );
}

export default function ListaComprasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const [compras, setCompras] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', desc: '', urgencia: 'medio' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch('/api/futuraCompra')
      .then(res => res.json())
      .then(data => setCompras(data));
  }, [modalOpen]);

  const soma = compras.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      valor: form.valor ? Number(form.valor) : undefined,
    };
    if (editId) {
      await fetch('/api/futuraCompra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload })
      });
    } else {
      await fetch('/api/futuraCompra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setModalOpen(false);
    setForm({ nome: '', valor: '', desc: '', urgencia: 'medio' });
    setEditId(null);
  }

  function handleEdit(compra) {
    setForm({
      nome: compra.nome || '',
      valor: compra.valor || '',
      desc: compra.desc || '',
      urgencia: compra.urgencia || 'medio',
    });
    setEditId(compra._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      await fetch('/api/futuraCompra', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setCompras(compras.filter(c => c._id !== id));
    }
  }

  if (!user) {
    return <div className="text-center mt-20 text-lg text-blue-700">Carregando ou não autenticado...</div>;
  }
  return (
    <DashboardLayout>
      <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Lista de Compras</h2>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setModalOpen(true)} style={{ marginRight: 16 }}>Nova Compra</button>
        <span style={{ fontWeight: 500 }}>Soma: R$ {soma.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <ul style={{ background: '#f5f7fa', borderRadius: 8, padding: 16 }}>
        {compras.length === 0 && <li>Nenhum item cadastrado.</li>}
        {compras.map(c => (
          <li key={c._id} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
            <strong>{c.nome}</strong>
            {c.valor !== undefined && c.valor !== '' && (
              <> | Valor: R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
            )}
            {c.urgencia && <> | Urgência: {c.urgencia}</>}
            {c.desc && <> | {c.desc}</>}
            <div style={{ position: 'absolute', right: 8, top: 8 }}>
              <button onClick={() => handleEdit(c)} style={{ marginRight: 8 }}>Editar</button>
              <button onClick={() => handleDelete(c._id)} style={{ color: 'red' }}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm({ nome: '', valor: '', desc: '', urgencia: 'medio' }); }}>
        <h3 style={{ marginBottom: 12 }}>{editId ? 'Editar Compra' : 'Nova Compra'}</h3>
        <form onSubmit={handleSubmit}>
          <input name="nome" value={form.nome} onChange={handleFormChange} placeholder="Nome" required style={{ width: '100%', marginBottom: 8 }} />
          <input name="valor" type="number" value={form.valor} onChange={handleFormChange} placeholder="Valor" style={{ width: '100%', marginBottom: 8 }} />
          <input name="desc" value={form.desc} onChange={handleFormChange} placeholder="Descrição" style={{ width: '100%', marginBottom: 8 }} />
          <label style={{ display: 'block', marginBottom: 4 }}>Urgência</label>
          <select name="urgencia" value={form.urgencia} onChange={handleFormChange} required style={{ width: '100%', marginBottom: 8 }}>
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
          </select>
          <button type="submit" style={{ width: '100%', marginTop: 8 }}>Salvar</button>
        </form>
      </Modal>
      </div>
    </DashboardLayout>
  );
}
