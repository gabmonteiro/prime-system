"use client";
import { useEffect, useRef, useState } from "react";
import { UserIcon, PlusIcon } from "@heroicons/react/24/outline";
import { api, qs } from "../../libs/fetcher";
import Field, { inputClass } from "../ui/Field";
import Badge from "../ui/Badge";
import Select from "../ui/Select";

/**
 * Seleção de cliente (autocomplete com cadastro) e veículo.
 * value: { clienteId, clienteNome, carroId, carroModelo, carroPlaca, carros }
 */
export default function ClienteCarroPicker({ value, onChange }) {
  const [query, setQuery] = useState(value.clienteNome || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => setQuery(value.clienteNome || ""), [value.clienteNome]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      try {
        setResults(
          await api(`/api/clientes${qs({ search: "true", q: query })}`),
        );
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pickCliente(c) {
    const carros = c.carros || [];
    onChange({
      clienteId: c._id,
      clienteNome: c.nome,
      carros,
      carroId: carros.length === 1 ? carros[0]._id : "",
      carroModelo: "",
      carroPlaca: "",
    });
    setOpen(false);
  }

  function typeCliente(text) {
    setQuery(text);
    setOpen(true);
    onChange({
      clienteId: "",
      clienteNome: text,
      carros: [],
      carroId: "",
      carroModelo: value.carroModelo,
      carroPlaca: value.carroPlaca,
    });
  }

  const carros = value.carros || [];
  const novoCarro = !value.carroId;
  const exato = results.find(
    (r) => r.nome.toLowerCase().trim() === query.toLowerCase().trim(),
  );

  return (
    <>
      <Field
        label={
          <span className="flex items-center gap-2">
            Cliente
            {value.clienteNome &&
              !value.clienteId &&
              !(value.legado && !value.clienteAlterado) && (
                <Badge color="blue">novo cadastro</Badge>
              )}
          </span>
        }
        htmlFor="cliente"
      >
        <div className="relative" ref={boxRef}>
          <input
            id="cliente"
            autoComplete="off"
            value={query}
            onChange={(e) => typeCliente(e.target.value)}
            onFocus={() => setOpen(true)}
            className={inputClass}
            placeholder="Buscar ou cadastrar cliente"
            required
          />
          {open && (results.length > 0 || query) && (
            <ul className="absolute z-[10010] mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {results.map((c) => (
                <li
                  key={c._id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickCliente(c);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    {c.nome}
                  </div>
                  {c.carros?.length > 0 && (
                    <div className="text-xs text-gray-500 ml-6 truncate">
                      {c.carros.map((car) => car.modelo).join(", ")}
                    </div>
                  )}
                </li>
              ))}
              {query.trim() && !exato && (
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm text-blue-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Cadastrar &quot;{query.trim()}&quot; como novo cliente
                </li>
              )}
            </ul>
          )}
        </div>
      </Field>

      <Field label="Veículo" htmlFor="carro">
        {carros.length > 0 && (
          <Select
            id="carro"
            value={value.carroId || "__novo"}
            onChange={(v) =>
              onChange({ ...value, carroId: v === "__novo" ? "" : v })
            }
            options={[
              ...carros.map((c) => ({
                value: c._id,
                label: `${c.modelo}${c.placa ? ` · ${c.placa}` : ""}`,
              })),
              { value: "__novo", label: "+ Outro veículo" },
            ]}
          />
        )}
        {novoCarro && (
          <div
            className={`grid grid-cols-3 gap-2 ${carros.length ? "mt-2" : ""}`}
          >
            <input
              value={value.carroModelo || ""}
              onChange={(e) =>
                onChange({ ...value, carroModelo: e.target.value })
              }
              className={`${inputClass} col-span-2`}
              placeholder="Modelo (ex: Gol)"
              required
            />
            <input
              value={value.carroPlaca || ""}
              onChange={(e) =>
                onChange({ ...value, carroPlaca: e.target.value.toUpperCase() })
              }
              className={inputClass}
              placeholder="Placa"
              maxLength={8}
            />
          </div>
        )}
      </Field>
    </>
  );
}
