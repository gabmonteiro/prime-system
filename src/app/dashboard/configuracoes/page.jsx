"use client";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheckIcon,
  CalendarIcon,
  SwatchIcon,
  PhotoIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import { useBranding, BrandLogo } from "../../../context/brandingContext";
import PageHeader from "../../../components/ui/PageHeader";
import Badge from "../../../components/ui/Badge";
import { LoadingState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import { api } from "../../../libs/fetcher";
import {
  formatDate,
  formatMonthKey,
  getFiscalMonthKey,
  getFiscalMonthRange,
} from "../../../libs/dates";
import {
  DEFAULT_TEMA,
  LOGO_REGRAS,
  PRESETS,
  SHADES,
  isHex,
  paletteFromTema,
} from "../../../libs/theme";

/** Aplica uma paleta nas variáveis CSS da página (pré-visualização ao vivo). */
function aplicarPaleta(palette) {
  const root = document.documentElement;
  SHADES.forEach((s, i) => {
    const n = parseInt(palette[i].slice(1), 16);
    root.style.setProperty(
      `--brand-${s}`,
      `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`,
    );
  });
}
function limparPreview() {
  SHADES.forEach((s) =>
    document.documentElement.style.removeProperty(`--brand-${s}`),
  );
}

export default function ConfiguracoesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("configuracoes", "update");

  return (
    <DashboardLayout permission="configuracoes:read">
      <PageHeader
        icon={ShieldCheckIcon}
        color="gray"
        title="Configurações"
        subtitle="Aparência e ajustes gerais do sistema"
      />
      {!canEdit && (
        <div className="mb-4 sm:mb-6 p-4 rounded-lg bg-gray-100 text-sm text-gray-700 flex gap-2">
          <InformationCircleIcon className="h-5 w-5 shrink-0" />
          Somente administradores podem alterar as configurações.
        </div>
      )}
      <div className="space-y-4 sm:space-y-6">
        <SecaoCor canEdit={canEdit} />
        <SecaoLogo canEdit={canEdit} />
        <SecaoMesFiscal canEdit={canEdit} />
      </div>
    </DashboardLayout>
  );
}

function Secao({ icon: Icon, titulo, descricao, children }) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex gap-3 mb-5">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 h-fit">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          <p className="text-sm text-gray-600">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cor de destaque
// ---------------------------------------------------------------------------
function SecaoCor({ canEdit }) {
  const toast = useToast();
  const [salvo, setSalvo] = useState(null);
  const [escolha, setEscolha] = useState(null);
  const [saving, setSaving] = useState(false);
  const salvoRef = useRef(null);

  useEffect(() => {
    api("/api/branding")
      .then((b) => {
        const t = b.tema || DEFAULT_TEMA;
        setSalvo(t);
        setEscolha(t);
        salvoRef.current = t;
      })
      .catch(() => setSalvo(DEFAULT_TEMA));
    // Saiu da página sem salvar: volta para a cor salva
    return () => limparPreview();
  }, []);

  function escolher(t) {
    setEscolha(t);
    aplicarPaleta(paletteFromTema(t));
  }

  async function salvar() {
    setSaving(true);
    try {
      const body = escolha.preset
        ? { preset: escolha.preset }
        : { cor: escolha.cor };
      const { tema } = await api("/api/branding", { method: "PUT", body });
      setSalvo(tema);
      salvoRef.current = tema;
      // Recarrega o CSS do tema para as outras páginas e remove a pré-visualização
      const link = document.querySelector(
        'link[href^="/api/branding/tema.css"]',
      );
      if (link) link.href = `/api/branding/tema.css?v=${Date.now()}`;
      toast("Cor de destaque salva!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function descartar() {
    setEscolha(salvo);
    limparPreview();
  }

  if (!escolha) return <LoadingState />;
  const mudou = JSON.stringify(escolha) !== JSON.stringify(salvo);
  const personalizada = !escolha.preset;

  return (
    <Secao
      icon={SwatchIcon}
      titulo="Cor de destaque"
      descricao="Usada em botões, menus, gráficos e destaques de todo o sistema."
    >
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
        {Object.entries(PRESETS).map(([key, p]) => {
          const ativo = escolha.preset === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!canEdit}
              onClick={() => escolher({ preset: key, cor: p.palette[6] })}
              className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              title={p.nome}
            >
              <span
                className={`h-10 w-10 rounded-full flex items-center justify-center ring-offset-2 transition ${ativo ? "ring-2 ring-gray-900" : "hover:scale-110"}`}
                style={{ background: p.palette[6] }}
              >
                {ativo && <CheckIcon className="h-5 w-5 text-white" />}
              </span>
              <span className="text-xs text-gray-600">{p.nome}</span>
            </button>
          );
        })}
        <label
          className={`flex flex-col items-center gap-1.5 ${canEdit ? "cursor-pointer" : "cursor-not-allowed"}`}
          title="Escolher qualquer cor"
        >
          <span
            className={`relative h-10 w-10 rounded-full flex items-center justify-center ring-offset-2 overflow-hidden ${personalizada ? "ring-2 ring-gray-900" : ""}`}
            style={{
              background: personalizada
                ? escolha.cor
                : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
            }}
          >
            {personalizada && <CheckIcon className="h-5 w-5 text-white" />}
            <input
              type="color"
              disabled={!canEdit}
              value={isHex(escolha.cor) ? escolha.cor : "#2563eb"}
              onChange={(e) => escolher({ preset: null, cor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </span>
          <span className="text-xs text-gray-600">Outra</span>
        </label>
      </div>

      {/* Pré-visualização */}
      <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Pré-visualização
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
          >
            Botão principal
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg"
          >
            Secundário
          </button>
          <Badge color="blue">Etiqueta</Badge>
          <span className="text-sm text-blue-600 underline">Link</span>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/70 text-blue-800 rounded-xl text-sm font-medium">
            <span className="w-1 h-5 bg-blue-600 rounded" /> Item do menu ativo
          </div>
          <div className="flex gap-1">
            {SHADES.map((s) => (
              <span
                key={s}
                className="h-6 w-6 rounded"
                style={{ background: `rgb(var(--brand-${s}))` }}
                title={String(s)}
              />
            ))}
          </div>
        </div>
        {personalizada && (
          <p className="text-xs text-gray-500 mt-3">
            Cor personalizada {escolha.cor}: os tons mais claros e escuros são
            gerados automaticamente. Prefira cores médias/fortes para manter o
            texto legível.
          </p>
        )}
      </div>

      {canEdit && (
        <div className="mt-4 flex justify-end gap-3">
          {mudou && (
            <button
              onClick={descartar}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Descartar
            </button>
          )}
          <button
            onClick={salvar}
            disabled={!mudou || saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar cor"}
          </button>
        </div>
      )}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
function lerImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () =>
        resolve({
          dataUrl: reader.result,
          largura: img.naturalWidth,
          altura: img.naturalHeight,
        });
      img.onerror = () => reject(new Error("Arquivo de imagem inválido"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function SecaoLogo({ canEdit }) {
  const toast = useToast();
  const { logoUrl, reload } = useBranding();
  const [arquivo, setArquivo] = useState(null); // { dataUrl, largura, altura, tamanho, nome }
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const R = LOGO_REGRAS;

  async function selecionar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setErro("");
    setArquivo(null);
    if (!file) return;
    if (!R.tipos.includes(file.type)) {
      setErro(
        `Formato não aceito (${file.type || "desconhecido"}). Envie ${R.extensoes}.`,
      );
      return;
    }
    if (file.size > R.maxBytes) {
      setErro(
        `O arquivo tem ${Math.round(file.size / 1024)} KB. O máximo é ${R.maxBytes / 1024} KB.`,
      );
      return;
    }
    try {
      const img = await lerImagem(file);
      if (Math.min(img.largura, img.altura) < R.minLado) {
        setErro(
          `Imagem muito pequena (${img.largura}×${img.altura} px). Mínimo ${R.minLado} px no menor lado.`,
        );
        return;
      }
      if (Math.max(img.largura, img.altura) > R.maxLado) {
        setErro(
          `Imagem muito grande (${img.largura}×${img.altura} px). Máximo ${R.maxLado} px.`,
        );
        return;
      }
      setArquivo({ ...img, tamanho: file.size, nome: file.name });
    } catch (err) {
      setErro(err.message);
    }
  }

  async function enviar() {
    setSaving(true);
    try {
      await api("/api/branding/logo", {
        method: "PUT",
        body: { dataUrl: arquivo.dataUrl },
      });
      setArquivo(null);
      await reload();
      toast("Logo atualizada!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remover() {
    if (!window.confirm("Remover a logo e voltar para o ícone padrão?")) return;
    try {
      await api("/api/branding/logo", { method: "DELETE" });
      await reload();
      toast("Logo removida");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  const proporcao = arquivo ? arquivo.largura / arquivo.altura : 1;

  return (
    <Secao
      icon={PhotoIcon}
      titulo="Logo da empresa"
      descricao="Aparece no menu, na barra do celular, na tela de login e na página inicial."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
          <p className="font-medium mb-2">Como deve ser a imagem</p>
          <ul className="space-y-1 list-disc list-inside text-blue-800">
            <li>
              Formato: <b>{R.extensoes}</b>
            </li>
            <li>
              Tamanho do arquivo: até <b>{R.maxBytes / 1024} KB</b>
            </li>
            <li>
              Dimensões: recomendado <b>{R.recomendado}</b>; mínimo {R.minLado}{" "}
              px e máximo {R.maxLado} px
            </li>
            <li>
              Prefira <b>PNG com fundo transparente</b>; a logo é exibida em um
              quadrado, então imagens muito largas ficam pequenas
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              {arquivo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={arquivo.dataUrl}
                  alt="Pré-visualização"
                  className="w-16 h-16 rounded-2xl object-contain bg-white border"
                />
              ) : (
                <BrandLogo size="lg" />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {arquivo ? "Nova" : logoUrl ? "Atual" : "Padrão"}
              </p>
            </div>
            {arquivo && (
              <div className="text-sm text-gray-700 min-w-0">
                <p className="font-medium truncate">{arquivo.nome}</p>
                <p className="text-gray-500">
                  {arquivo.largura}×{arquivo.altura} px ·{" "}
                  {Math.round(arquivo.tamanho / 1024)} KB
                </p>
                {(proporcao > 1.6 || proporcao < 0.6) && (
                  <p className="text-xs text-yellow-700 mt-1">
                    A imagem não é quadrada e vai aparecer pequena. Se possível,
                    use uma versão quadrada.
                  </p>
                )}
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={R.tipos.join(",")}
                onChange={selecionar}
                className="hidden"
              />
              {arquivo ? (
                <>
                  <button
                    onClick={() => setArquivo(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviar}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Enviando..." : "Salvar logo"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    {logoUrl ? "Trocar logo" : "Enviar logo"}
                  </button>
                  {logoUrl && (
                    <button
                      onClick={remover}
                      className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" /> Remover
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Mês fiscal
// ---------------------------------------------------------------------------
function SecaoMesFiscal({ canEdit }) {
  const toast = useToast();
  const [fiscal, setFiscal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/system-config")
      .then((c) => setFiscal(c.fiscalMonthStart || 17))
      .catch((err) => toast(err.message, "error"));
  }, [toast]);

  async function save() {
    setSaving(true);
    try {
      await api("/api/system-config", {
        method: "PUT",
        body: { key: "fiscalMonthStart", value: fiscal },
      });
      toast("Configuração salva!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (fiscal === null) return <LoadingState />;
  const valid = Number(fiscal) >= 1 && Number(fiscal) <= 31;
  const exemplo = valid ? getFiscalMonthKey(new Date(), Number(fiscal)) : null;
  const range = exemplo ? getFiscalMonthRange(exemplo, Number(fiscal)) : null;

  return (
    <Secao
      icon={CalendarIcon}
      titulo="Mês fiscal"
      descricao="Define o período de cada mês no dashboard, nos filtros e na divisão entre sócios."
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">
            Dia de início do mês fiscal
          </h4>
          {range && (
            <p className="text-sm text-gray-600 mt-1">
              Mês atual ({formatMonthKey(exemplo)}): {formatDate(range.start)} a{" "}
              {formatDate(new Date(range.end.getTime() - 864e5))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="31"
            value={fiscal}
            disabled={!canEdit}
            onChange={(e) => setFiscal(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center disabled:bg-gray-100"
          />
          {canEdit && (
            <button
              onClick={save}
              disabled={saving || !valid}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
        </div>
      </div>
    </Secao>
  );
}
