// Script para importar dados da planilha CSV

import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import connectDB from './src/libs/db.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Mapeamento dos tipos de serviço
const TIPOS_SERVICO = {
  'Tradicional': { nome: 'Tradicional', valor: 50.00, desc: 'Lavagem tradicional de veículos' },
  'Detalhada': { nome: 'Detalhada', valor: 72.00, desc: 'Lavagem detalhada com acabamento especial' },
  'Tecnica': { nome: 'Técnica', valor: 100.00, desc: 'Lavagem técnica especializada' },
  'Técnica': { nome: 'Técnica', valor: 100.00, desc: 'Lavagem técnica especializada' },
  'Completa': { nome: 'Completa', valor: 300.00, desc: 'Lavagem completa com todos os serviços' },
  'Tradicional Moto': { nome: 'Tradicional Moto', valor: 40.00, desc: 'Lavagem tradicional para motocicletas' }
};

// Mapeamento dos meses
const MESES_MAP = {
  '04 mes': { ano: 2025, mes: 4 },  // Abril 2025
  '05 mes': { ano: 2025, mes: 5 },  // Maio 2025
  '06 mes': { ano: 2025, mes: 6 },  // Junho 2025
  '07 mes': { ano: 2025, mes: 7 }   // Julho 2025
};

// Função para calcular a chave do mês seguindo a mesma lógica do dashboard
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  // Virada do mês no dia 17
  if (day < 17) {
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }
  }
  return `${year}-${month.toString().padStart(2, "0")}`;
}

function parseValor(valorStr) {
  if (!valorStr || valorStr === 'Luz e Água' || valorStr.trim() === '') return 0;
  
  // Remove R$, espaços e substitui vírgula por ponto
  const cleanValue = valorStr
    .replace(/R\$\s*/g, '')
    .replace(/\s+/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

function parseData(dataStr, mesRef) {
  if (!dataStr || !dataStr.trim()) {
    // Se não tem data, usar um dia aleatório respeitando a regra do dia 17
    const mesInfo = MESES_MAP[mesRef];
    if (mesInfo) {
      // Gerar dia entre 17 do mês atual e 16 do próximo mês
      // Para mês X: dias 17-31 do mês X ou dias 1-16 do mês X+1
      const usarMesAtual = Math.random() > 0.5;
      
      if (usarMesAtual) {
        // Dias 17-31 do mês atual
        const ultimoDia = new Date(mesInfo.ano, mesInfo.mes, 0).getDate(); // Último dia do mês
        const dia = Math.floor(Math.random() * (ultimoDia - 16)) + 17; // Entre 17 e último dia
        return new Date(mesInfo.ano, mesInfo.mes - 1, dia);
      } else {
        // Dias 1-16 do próximo mês
        const dia = Math.floor(Math.random() * 16) + 1; // Entre 1 e 16
        const proximoMes = mesInfo.mes === 12 ? 1 : mesInfo.mes + 1;
        const proximoAno = mesInfo.mes === 12 ? mesInfo.ano + 1 : mesInfo.ano;
        return new Date(proximoAno, proximoMes - 1, dia);
      }
    }
    return new Date(); // Fallback para hoje
  }

  try {
    // Parse da data no formato DD/MM/YYYY
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    if (!dia || !mes || !ano) throw new Error('Data inválida');
    return new Date(ano, mes - 1, dia);
  } catch (error) {
    // Se falhar, usar data aleatória respeitando a regra do dia 17
    const mesInfo = MESES_MAP[mesRef];
    if (mesInfo) {
      const usarMesAtual = Math.random() > 0.5;
      
      if (usarMesAtual) {
        const ultimoDia = new Date(mesInfo.ano, mesInfo.mes, 0).getDate();
        const dia = Math.floor(Math.random() * (ultimoDia - 16)) + 17;
        return new Date(mesInfo.ano, mesInfo.mes - 1, dia);
      } else {
        const dia = Math.floor(Math.random() * 16) + 1;
        const proximoMes = mesInfo.mes === 12 ? 1 : mesInfo.mes + 1;
        const proximoAno = mesInfo.mes === 12 ? mesInfo.ano + 1 : mesInfo.ano;
        return new Date(proximoAno, proximoMes - 1, dia);
      }
    }
    return new Date();
  }
}

function parseCSVLine(line) {
  // Parser simples de CSV que lida com campos entre aspas
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseParticipantes(observacao) {
  // Mapeamento das letras para os nomes
  const mapeamento = {
    'D': 'Davi',
    'G': 'Gabriel', 
    'S': 'Samuel'
  };
  
  if (!observacao || !observacao.trim()) {
    // Se não tem observação, retorna todos os participantes
    return ['Gabriel', 'Davi', 'Samuel'];
  }
  
  const participantes = [];
  const observacaoUpper = observacao.toUpperCase();
  
  // Procurar pelas letras D, G, S na observação
  if (observacaoUpper.includes('D')) {
    participantes.push('Davi');
  }
  if (observacaoUpper.includes('G')) {
    participantes.push('Gabriel');
  }
  if (observacaoUpper.includes('S')) {
    participantes.push('Samuel');
  }
  
  // Se não encontrou nenhum participante específico, retorna todos
  if (participantes.length === 0) {
    return ['Gabriel', 'Davi', 'Samuel'];
  }
  
  // Ordenar os participantes na ordem padrão: Gabriel, Davi, Samuel
  const ordemPadrao = ['Gabriel', 'Davi', 'Samuel'];
  return ordemPadrao.filter(nome => participantes.includes(nome));
}

async function importarDados() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await connectDB();

    // Importar modelos
    const TipoServico = (await import('./src/models/tipoServico.js')).default;
    const Servico = (await import('./src/models/servico.js')).default;

    console.log('📋 Lendo arquivo CSV...');
    const csvContent = fs.readFileSync('./dados.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Pular as duas primeiras linhas (cabeçalho)
    const dataLines = lines.slice(2);

    console.log(`📊 Encontradas ${dataLines.length} linhas de dados`);

    // 1. Criar ou verificar tipos de serviço
    console.log('\n🔧 Criando tipos de serviço...');
    const tiposMap = {};

    for (const [nome, config] of Object.entries(TIPOS_SERVICO)) {
      let tipo = await TipoServico.findOne({ nome: config.nome });
      
      if (!tipo) {
        tipo = await TipoServico.create(config);
        console.log(`✅ Tipo criado: ${config.nome} - R$ ${config.valor}`);
      } else {
        console.log(`⚠️  Tipo já existe: ${config.nome}`);
      }
      
      tiposMap[nome] = tipo._id;
    }

    // 2. Limpar serviços existentes (para reimportar corretamente)
    console.log('\n🗑️  Removendo serviços existentes...');
    const servicosRemovidos = await Servico.deleteMany({});
    console.log(`✅ ${servicosRemovidos.deletedCount} serviços removidos`);

    // 3. Processar serviços
    console.log('\n🚗 Processando serviços...');
    let servicosCriados = 0;
    let servicosIgnorados = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const columns = parseCSVLine(line);
      
      // Extrair dados das colunas (formato do CSV)
      const veiculo = columns[0]?.replace(/"/g, '').trim();
      const valorStr = columns[1]?.replace(/"/g, '').trim();
      const participantesStr = columns[2]?.replace(/"/g, '').trim(); // AQUI estão as letras D, G, S
      const dataStr = columns[3]?.replace(/"/g, '').trim();
      const observacao = columns[4]?.replace(/"/g, '').trim(); // Observações gerais
      const tipoStr = columns[5]?.replace(/"/g, '').trim();
      const mesRef = columns[6]?.replace(/"/g, '').trim();

      console.log(`🔍 Linha ${i + 3}: ${veiculo} | ${valorStr} | ${participantesStr} | ${dataStr} | ${tipoStr} | ${mesRef}`);

      // Validar dados mínimos
      if (!veiculo || !valorStr || !tipoStr || !mesRef) {
        console.log(`⚠️  Linha ${i + 3} ignorada: dados insuficientes (veiculo: ${!!veiculo}, valor: ${!!valorStr}, tipo: ${!!tipoStr}, mes: ${!!mesRef})`);
        servicosIgnorados++;
        continue;
      }

      // Processar valores
      const valor = parseValor(valorStr);
      if (valor <= 0) {
        console.log(`⚠️  Linha ${i + 3} ignorada: valor inválido (${valorStr}) = ${valor}`);
        servicosIgnorados++;
        continue;
      }

      // Buscar tipo de serviço
      const tipoId = tiposMap[tipoStr];
      if (!tipoId) {
        console.log(`⚠️  Linha ${i + 3} ignorada: tipo de serviço não encontrado (${tipoStr})`);
        servicosIgnorados++;
        continue;
      }

      // Processar data (agora na coluna 4)
      const data = parseData(dataStr, mesRef);
      if (isNaN(data.getTime())) {
        console.log(`⚠️  Linha ${i + 3} ignorada: data inválida (${dataStr})`);
        servicosIgnorados++;
        continue;
      }

      // Verificar se a data está no período correto do mês
      const expectedMonthKey = `2025-${mesRef.split(' ')[0].padStart(2, '0')}`;
      const actualMonthKey = getMonthKey(data);
      
      if (actualMonthKey !== expectedMonthKey) {
        console.log(`⚠️  AVISO: Data ${data.toLocaleDateString('pt-BR')} não está no período esperado do ${mesRef} (calculado como ${actualMonthKey} vs esperado ${expectedMonthKey})`);
      }

      // Extrair participantes das observações (coluna 3 - onde estão as letras D, G, S)
      const participantes = parseParticipantes(participantesStr);

      // Verificar se precisa usar valor personalizado
      const tipoConfig = Object.values(TIPOS_SERVICO).find(t => t.nome === tipoStr.replace('Tecnica', 'Técnica'));
      const valorPersonalizado = (valor !== tipoConfig?.valor) ? valor : null;

      // Criar serviço
      const servicoData = {
        cliente: 'Cliente', // Como especificado
        nomeCarro: veiculo,
        tipoServico: tipoId,
        valorPersonalizado: valorPersonalizado,
        data: data,
        participantes: participantes
      };

      try {
        await Servico.create(servicoData);
        servicosCriados++;
        
        const valorFinal = valorPersonalizado || tipoConfig?.valor || valor;
        console.log(`✅ Serviço ${servicosCriados}: ${veiculo} - ${tipoStr} - R$ ${valorFinal.toFixed(2)} - ${data.toLocaleDateString('pt-BR')} - [${participantes.join(', ')}]${participantesStr ? ` - Participantes: "${participantesStr}"` : ''}${observacao ? ` - Obs: "${observacao}"` : ''}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar serviço linha ${i + 3}:`, error.message);
        servicosIgnorados++;
      }
    }

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Serviços criados: ${servicosCriados}`);
    console.log(`⚠️  Linhas ignoradas: ${servicosIgnorados}`);
    console.log(`📋 Total processado: ${servicosCriados + servicosIgnorados}`);

    // Mostrar estatísticas por tipo
    console.log('\n📈 ESTATÍSTICAS POR TIPO:');
    for (const [nome, config] of Object.entries(TIPOS_SERVICO)) {
      const count = await Servico.countDocuments({ tipoServico: tiposMap[nome] });
      console.log(`${config.nome}: ${count} serviços`);
    }

    // Mostrar estatísticas por mês
    console.log('\n📅 ESTATÍSTICAS POR MÊS:');
    const totalServicos = await Servico.find().populate('tipoServico');
    const estatisticasMes = {};
    
    totalServicos.forEach(servico => {
      const mes = servico.data.getMonth() + 1;
      const ano = servico.data.getFullYear();
      const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
      
      if (!estatisticasMes[chave]) {
        estatisticasMes[chave] = { count: 0, valor: 0 };
      }
      
      estatisticasMes[chave].count++;
      const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
      estatisticasMes[chave].valor += valor;
    });

    Object.entries(estatisticasMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([mes, stats]) => {
        const [ano, mesNum] = mes.split('-');
        const nomeMes = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        console.log(`${nomeMes}: ${stats.count} serviços - R$ ${stats.valor.toFixed(2)}`);
      });

    // Mostrar estatísticas por participante
    console.log('\n👥 ESTATÍSTICAS POR PARTICIPANTE:');
    const estatisticasParticipantes = {};
    
    const todosServicos = await Servico.find().populate('tipoServico');
    todosServicos.forEach(servico => {
      servico.participantes.forEach(participante => {
        if (!estatisticasParticipantes[participante]) {
          estatisticasParticipantes[participante] = { count: 0, valor: 0 };
        }
        estatisticasParticipantes[participante].count++;
        
        const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
        // Divide o valor pelo número de participantes do serviço
        const valorPorParticipante = valor / servico.participantes.length;
        estatisticasParticipantes[participante].valor += valorPorParticipante;
      });
    });

    Object.entries(estatisticasParticipantes)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([participante, stats]) => {
        console.log(`${participante}: ${stats.count} serviços - R$ ${stats.valor.toFixed(2)}`);
      });

    console.log('\n🎉 Importação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

// Função para confirmar antes de executar
function confirmarImportacao() {
  console.log('🚨 ATENÇÃO: Este script irá importar dados do arquivo dados.csv');
  console.log('📋 Tipos de serviço que serão criados/verificados:');
  
  Object.entries(TIPOS_SERVICO).forEach(([key, config]) => {
    console.log(`   • ${config.nome}: R$ ${config.valor.toFixed(2)} - ${config.desc}`);
  });

  console.log('\n⚠️  Certifique-se de que:');
  console.log('   • O arquivo dados.csv está na raiz do projeto');
  console.log('   • Você tem backup do banco de dados');
  console.log('   • Os tipos de serviço estão corretos');

  rl.question('\n❓ Deseja continuar com a importação? (s/N): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
      importarDados();
    } else {
      console.log('❌ Importação cancelada pelo usuário');
      rl.close();
    }
  });
}

// Verificar se o arquivo CSV existe
if (!fs.existsSync('./dados.csv')) {
  console.error('❌ Arquivo dados.csv não encontrado na raiz do projeto!');
  process.exit(1);
}

console.log('📋 SCRIPT DE IMPORTAÇÃO DE DADOS CSV');
console.log('=====================================');
confirmarImportacao();
