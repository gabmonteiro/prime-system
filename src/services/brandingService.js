import SystemConfig from "../models/systemConfig.js";
import { badRequest } from "../libs/api.js";
import { DEFAULT_TEMA, LOGO_REGRAS, PRESETS, isHex } from "../libs/theme.js";

// Cache em memória (o tema é lido a cada página; muda raramente)
const cache = { tema: null, logoMeta: undefined, at: 0 };
const TTL = 30 * 1000;

function cacheValido() {
  return Date.now() - cache.at < TTL;
}
function limparCache() {
  cache.tema = null;
  cache.logoMeta = undefined;
  cache.at = 0;
}

export async function getTema() {
  if (cache.tema && cacheValido()) return cache.tema;
  const doc = await SystemConfig.findOne({ key: "tema" }).lean();
  cache.tema = doc?.value || DEFAULT_TEMA;
  cache.at = Date.now();
  return cache.tema;
}

export async function setTema({ preset, cor }) {
  let value;
  if (preset && PRESETS[preset]) {
    value = { preset, cor: PRESETS[preset].palette[6] };
  } else if (isHex(cor)) {
    value = { preset: null, cor: cor.toLowerCase() };
  } else {
    throw badRequest("Cor inválida");
  }
  const previous = await getTema();
  const config = await SystemConfig.findOneAndUpdate(
    { key: "tema" },
    { value, description: "Cor de destaque do sistema", updatedAt: Date.now() },
    { upsert: true, new: true },
  );
  limparCache();
  return { previous, tema: value, config };
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

/** Detecta o formato pelos bytes do arquivo (não confia na extensão/MIME enviados). */
function detectarFormato(buf) {
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Lê largura/altura de PNG, JPEG ou WebP. */
function dimensoes(buf, mime) {
  if (mime === "image/png") {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
  }
  if (mime === "image/jpeg") {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      // SOF0..SOF15, exceto DHT(C4), JPG(C8), DAC(CC)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        return {
          altura: buf.readUInt16BE(i + 5),
          largura: buf.readUInt16BE(i + 7),
        };
      }
      i += 2 + len;
    }
    return null;
  }
  if (mime === "image/webp") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      return {
        largura: buf.readUInt16LE(26) & 0x3fff,
        altura: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") {
      return {
        largura: 1 + buf.readUIntLE(24, 3),
        altura: 1 + buf.readUIntLE(27, 3),
      };
    }
  }
  return null;
}

/** Valida e salva a logo enviada como data URL (base64). */
export async function setLogo(dataUrl) {
  const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(
    String(dataUrl || ""),
  );
  if (!m) throw badRequest("Arquivo inválido");
  const buf = Buffer.from(m[2], "base64");
  const R = LOGO_REGRAS;

  if (buf.length > R.maxBytes) {
    throw badRequest(
      `A imagem tem ${Math.round(buf.length / 1024)} KB. O máximo é ${R.maxBytes / 1024} KB.`,
    );
  }
  const mime = detectarFormato(buf);
  if (!mime || !R.tipos.includes(mime)) {
    throw badRequest(`Formato não aceito. Envie ${R.extensoes}.`);
  }
  const dim = dimensoes(buf, mime);
  if (!dim || !dim.largura || !dim.altura)
    throw badRequest("Não foi possível ler a imagem");
  if (Math.min(dim.largura, dim.altura) < R.minLado) {
    throw badRequest(
      `A imagem é muito pequena (${dim.largura}×${dim.altura}). Mínimo ${R.minLado} px no menor lado.`,
    );
  }
  if (Math.max(dim.largura, dim.altura) > R.maxLado) {
    throw badRequest(
      `A imagem é muito grande (${dim.largura}×${dim.altura}). Máximo ${R.maxLado} px.`,
    );
  }

  const value = {
    mime,
    data: buf.toString("base64"),
    largura: dim.largura,
    altura: dim.altura,
    tamanho: buf.length,
    versao: Date.now(),
  };
  await SystemConfig.findOneAndUpdate(
    { key: "logo" },
    { value, description: "Logo da empresa", updatedAt: Date.now() },
    { upsert: true, new: true },
  );
  limparCache();
  const { data: _omit, ...meta } = value;
  return meta;
}

export async function removeLogo() {
  await SystemConfig.deleteOne({ key: "logo" });
  limparCache();
}

/** Metadados da logo (sem os bytes) ou null. */
export async function getLogoMeta() {
  if (cache.logoMeta !== undefined && cacheValido()) return cache.logoMeta;
  const doc = await SystemConfig.findOne(
    { key: "logo" },
    { "value.data": 0 },
  ).lean();
  cache.logoMeta = doc?.value || null;
  cache.at = Date.now();
  return cache.logoMeta;
}

export async function getLogo() {
  const doc = await SystemConfig.findOne({ key: "logo" }).lean();
  return doc?.value?.data ? doc.value : null;
}

export async function getBranding() {
  const [tema, logo] = await Promise.all([getTema(), getLogoMeta()]);
  return {
    tema,
    logo: logo
      ? { versao: logo.versao, largura: logo.largura, altura: logo.altura }
      : null,
  };
}
