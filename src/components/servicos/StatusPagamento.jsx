import Badge from "../ui/Badge";
import { toDateOnly } from "../../libs/dates";

export function statusServico(servico) {
  const parcelas = servico.parcelas || [];
  const pagas = parcelas.filter((p) => p.pago).length;
  const hoje = toDateOnly(new Date());
  const atrasada = parcelas.some(
    (p) => !p.pago && new Date(p.vencimento) < hoje,
  );
  if (servico.pago)
    return {
      key: "pago",
      label: "Pago",
      color: "green",
      pagas,
      total: parcelas.length,
    };
  if (atrasada)
    return {
      key: "atrasado",
      label: "Atrasado",
      color: "red",
      pagas,
      total: parcelas.length,
    };
  if (pagas > 0)
    return {
      key: "parcial",
      label: "Parcial",
      color: "yellow",
      pagas,
      total: parcelas.length,
    };
  return {
    key: "pendente",
    label: "Não pago",
    color: "orange",
    pagas,
    total: parcelas.length,
  };
}

export default function StatusPagamento({ servico, showParcelas = true }) {
  const st = statusServico(servico);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge color={st.color}>{st.label}</Badge>
      {showParcelas && servico.formaPagamento === "parcelado" && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {st.pagas}/{st.total}x
        </span>
      )}
    </span>
  );
}
