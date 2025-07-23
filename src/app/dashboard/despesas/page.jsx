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

export default function DespesasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const [despesas, setDespesas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', desc: '', tipo: 'gasto', data: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch('/api/despesa')
      .then(res => res.json())
      .then(data => setDespesas(data));
  }, [modalOpen]);

  const soma = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      valor: form.valor ? Number(form.valor) : undefined,
      data: form.data ? new Date(form.data) : undefined,
    };
    if (editId) {
      await fetch('/api/despesa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload })
      });
    } else {
      await fetch('/api/despesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setModalOpen(false);
    setForm({ nome: '', valor: '', desc: '', tipo: 'gasto', data: '' });
    setEditId(null);
  }

  function handleEdit(despesa) {
    setForm({
      nome: despesa.nome || '',
      valor: despesa.valor || '',
      desc: despesa.desc || '',
      tipo: despesa.tipo || 'gasto',
      data: despesa.data ? new Date(despesa.data).toISOString().slice(0, 10) : '',
    });
    setEditId(despesa._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      await fetch('/api/despesa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setDespesas(despesas.filter(d => d._id !== id));
    }
  }

  if (!user) {
    return <div className="text-center mt-20 text-lg text-blue-700">Carregando ou não autenticado...</div>;
  }
  return (
    <DashboardLayout>
      <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Despesas</h2>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setModalOpen(true)} style={{ marginRight: 16 }}>Nova Despesa</button>
        <span style={{ fontWeight: 500 }}>Soma: R$ -{Math.abs(soma).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <ul style={{ background: '#f5f7fa', borderRadius: 8, padding: 16 }}>
        {despesas.length === 0 && <li>Nenhuma despesa cadastrada.</li>}
        {despesas.map(d => (
          <li key={d._id} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
            <strong>{d.nome}</strong>
            {d.valor !== undefined && d.valor !== '' && (
              <> | Valor: R$ -{Math.abs(Number(d.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
            )}
            {d.tipo && <> | Tipo: {d.tipo}</>}
            {d.desc && <> | {d.desc}</>}
            {d.data && <> | Data: {new Date(d.data).toLocaleDateString()}</>}
            <div style={{ position: 'absolute', right: 8, top: 8 }}>
              <button onClick={() => handleEdit(d)} style={{ marginRight: 8 }}>Editar</button>
              <button onClick={() => handleDelete(d._id)} style={{ color: 'red' }}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm({ nome: '', valor: '', desc: '', tipo: 'gasto', data: '' }); }}>
        <h3 style={{ marginBottom: 12 }}>{editId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
        <form onSubmit={handleSubmit}>
          <input name="nome" value={form.nome} onChange={handleFormChange} placeholder="Nome" required style={{ width: '100%', marginBottom: 8 }} />
          <input name="valor" type="number" value={form.valor} onChange={handleFormChange} placeholder="Valor" style={{ width: '100%', marginBottom: 8 }} />
          <input name="desc" value={form.desc} onChange={handleFormChange} placeholder="Descrição" style={{ width: '100%', marginBottom: 8 }} />
          <input name="data" type="date" value={form.data} onChange={handleFormChange} required style={{ width: '100%', marginBottom: 8 }} />
          <label style={{ display: 'block', marginBottom: 4 }}>Tipo</label>
          <select name="tipo" value={form.tipo} onChange={handleFormChange} required style={{ width: '100%', marginBottom: 8 }}>
            <option value="compra">Compra</option>
            <option value="gasto">Gasto</option>
          </select>
          <button type="submit" style={{ width: '100%', marginTop: 8 }}>Salvar</button>
        </form>
      </Modal>
      </div>
    </DashboardLayout>
  );
}
