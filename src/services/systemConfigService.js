import SystemConfig from "../models/systemConfig.js";

// Configurações padrão do sistema
const DEFAULT_CONFIGS = {
  fiscalMonthStart: {
    key: "fiscalMonthStart",
    value: 17, // Dia 17 (padrão atual)
    description: "Dia de início do mês fiscal (1-31)"
  }
};

// Inicializar configurações padrão se não existirem
export async function initializeDefaultConfigs() {
  try {
    for (const [key, config] of Object.entries(DEFAULT_CONFIGS)) {
      const existing = await SystemConfig.findOne({ key: config.key });
      if (!existing) {
        await SystemConfig.create(config);
        console.log(`✅ Configuração padrão criada: ${config.key}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar configurações padrão:", error);
  }
}

// Obter configuração por chave
export async function getConfig(key) {
  try {
    const config = await SystemConfig.findOne({ key });
    return config ? config.value : DEFAULT_CONFIGS[key]?.value;
  } catch (error) {
    console.error(`❌ Erro ao obter configuração ${key}:`, error);
    return DEFAULT_CONFIGS[key]?.value;
  }
}

// Definir configuração
export async function setConfig(key, value, description = null) {
  try {
    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { 
        value,
        description: description || DEFAULT_CONFIGS[key]?.description,
        updatedAt: Date.now()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return config;
  } catch (error) {
    console.error(`❌ Erro ao definir configuração ${key}:`, error);
    throw error;
  }
}

// Obter todas as configurações
export async function getAllConfigs() {
  try {
    const configs = await SystemConfig.find({});
    const result = {};
    
    // Adicionar configurações existentes
    configs.forEach(config => {
      result[config.key] = config.value;
    });
    
    // Adicionar configurações padrão que não existem
    for (const [key, config] of Object.entries(DEFAULT_CONFIGS)) {
      if (!result.hasOwnProperty(key)) {
        result[key] = config.value;
      }
    }
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao obter todas as configurações:", error);
    return DEFAULT_CONFIGS;
  }
}

// Obter configuração específica do mês fiscal
export async function getFiscalMonthStart() {
  return await getConfig("fiscalMonthStart");
}
