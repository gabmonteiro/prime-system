"use client";
import Select from "../ui/Select";

export default function ContaSelect({
  id,
  contas,
  value,
  onChange,
  placeholder = "Selecione a conta",
}) {
  const ativas = contas.filter((c) => c.ativa !== false);
  return (
    <Select
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={ativas.map((c) => ({
        value: c._id,
        label: c.nome + (c.sistema ? " (dados antigos)" : ""),
      }))}
    />
  );
}
