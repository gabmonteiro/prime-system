'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../DashboardLayout';

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

export default function ServicosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipoOpen, setModalTipoOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] });
  const [tipos, setTipos] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch('/api/servico')
      .then(res => res.json())
      .then(data => setServicos(data));
    fetch('/api/tipoServico')
      .then(res => res.json())
      .then(data => setTipos(data));
  }, [modalOpen, modalTipoOpen]);

  function handleFormChange(e) {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm({ ...form, [name]: values });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      participantes: form.participantes,
      data: form.data ? new Date(form.data) : undefined,
    };
    if (editId) {
      await fetch('/api/servico', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload })
      });
    } else {
      await fetch('/api/servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setModalOpen(false);
    setForm({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] });
    setEditId(null);
  }
  function handleEdit(servico) {
    setForm({
      cliente: servico.cliente || '',
      nomeCarro: servico.nomeCarro || '',
      tipoServico: servico.tipoServico?._id || servico.tipoServico || '',
      data: servico.data ? new Date(servico.data).toISOString().slice(0, 10) : '',
      participantes: Array.isArray(servico.participantes) ? servico.participantes : [],
    });
    setEditId(servico._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      await fetch('/api/servico', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setServicos(servicos.filter(s => s._id !== id));
    }
  }

  async function handleTipoSubmit(e) {
    e.preventDefault();
    const nome = e.target.nome.value;
    const valor = Number(e.target.valor.value);
    const desc = e.target.desc.value;
    await fetch('/api/tipoServico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, valor, desc })
    });
    setModalTipoOpen(false);
  }

  if (!user) {
    return <div className="text-center mt-20 text-lg text-blue-700">Carregando ou não autenticado...</div>;
  }
  return (
    <DashboardLayout>
      <div className="p-8" style={{ padding: 32 }}>
        <h2 className="text-2xl font-bold mb-4">Serviços</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Novo Serviço</button>
          <button onClick={() => setModalTipoOpen(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">Novo Tipo de Serviço</button>
        </div>
        {/* Total de todos os serviços */}
        <div className="mb-4 text-lg font-semibold text-blue-700">
          Total de Serviços: R$ {servicos.reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <ul className="bg-gray-100 rounded-lg p-4">
          {servicos.length === 0 && <li className="text-gray-500">Nenhum serviço cadastrado.</li>}
          {servicos.map(s => (
            <li key={s._id} className="mb-3 p-3 border-b border-gray-300">
              <div className="flex flex-row justify-between items-center">
                <div>
                  <span className="font-semibold">{s.cliente}</span> - {s.nomeCarro} | Tipo: {s.tipoServico?.nome || s.tipoServico}
                  {s.tipoServico?.valor !== undefined && (
                    <> | Valor: R$ {Number(s.tipoServico.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                  )}
                  | Data: {s.data ? new Date(s.data).toISOString().slice(0, 10) : ''}
                  <br />Participantes: {Array.isArray(s.participantes) ? s.participantes.join(', ') : ''}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(s)} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">Editar</button>
                  <button onClick={() => handleDelete(s._id)} className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Excluir</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] }); }}>
          <h3 className="mb-3 text-lg font-semibold">Novo Serviço</h3>
          <form onSubmit={handleSubmit}>
            <input name="cliente" value={form.cliente} onChange={handleFormChange} placeholder="Cliente" required className="w-full mb-2 px-3 py-2 border rounded" />
            <input name="nomeCarro" value={form.nomeCarro} onChange={handleFormChange} placeholder="Nome do Carro" required className="w-full mb-2 px-3 py-2 border rounded" />
            <select name="tipoServico" value={form.tipoServico} onChange={handleFormChange} required className="w-full mb-2 px-3 py-2 border rounded">
              <option value="">Selecione o tipo</option>
              {tipos.map(t => <option key={t._id} value={t._id}>{t.nome}</option>)}
            </select>
            <input name="data" type="date" value={form.data} onChange={handleFormChange} required className="w-full mb-2 px-3 py-2 border rounded" />
            <label className="block mb-1">Participantes</label>
            <div className="mb-2 flex gap-4">
              {['Gabriel', 'Davi', 'Samuel'].map(p => (
                <label key={p} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="participantes"
                    value={p}
                    checked={form.participantes.includes(p)}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, participantes: [...f.participantes, p] }));
                      } else {
                        setForm(f => ({ ...f, participantes: f.participantes.filter(x => x !== p) }));
                      }
                    }}
                    className="accent-blue-600"
                  /> {p}
                </label>
              ))}
            </div>
            <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Salvar</button>
          </form>
        </Modal>
        <Modal open={modalTipoOpen} onClose={() => setModalTipoOpen(false)}>
          <h3 className="mb-3 text-lg font-semibold">Novo Tipo de Serviço</h3>
          <form onSubmit={handleTipoSubmit}>
            <input name="nome" placeholder="Nome" required className="w-full mb-2 px-3 py-2 border rounded" />
            <input name="valor" type="number" placeholder="Valor" required className="w-full mb-2 px-3 py-2 border rounded" />
            <input name="desc" placeholder="Descrição" className="w-full mb-2 px-3 py-2 border rounded" />
            <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Salvar</button>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
