/**
 * Dorks Security Scanner - Script Principal
 * 
 * Este script implementa um scanner de dorks modular e robusto para
 * automatizar a descoberta de vulnerabilidades e exposições de informação.
 * 
 * Uso:
 * 1. Configure o domínio alvo em domain-config.js
 * 2. Execute: node dork-scanner.js
 * 
 * Características:
 * - Sistema modular com arquivos separados para dorks, interação humana e utilitários
 * - Múltiplos motores de busca para contornar limitações de captcha
 * - Detecção automática e interação manual para captchas
 * - Geração de relatórios detalhados
 * - Sistema de checkpoint para retomar varreduras
 */

import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import readline from 'readline';

// Importar módulos personalizados
import { 
  SEARCH_ENGINES, 
  USER_AGENTS, 
  generateGenericDorks,
  generateAEMDorks,
  generateCMSDorks,
  generateEcommerceDorks
} from './dorks-config.js';

import {
  waitForUserConfirmation,
  waitForCaptchaResolution,
  detectCaptchaOrBlock,
  removeVisualAlerts,
  closeInterface,
  waitForCondition,
  waitForPageStability
} from './human-interaction.js';

import {
  randomDelay,
  loadCheckpoint,
  saveCheckpoint,
  formatDorkForFilename,
  generateReport,
  saveExecutionStats,
  displayBanner,
  takeScreenshot,
  performRandomBrowsing,
  extractPageMetadata
} from './utils.js';

// Importar configuração de domínio
import { TARGET_DOMAIN, ALTERNATIVE_DOMAINS, DOMAIN_SETTINGS } from './domain-config.js';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Configurações =====
const RESULTS_DIR = path.join(__dirname, 'dorks-results');
const DELAY_BETWEEN_SEARCHES = 5000; // Delay entre pesquisas para evitar bloqueio (em ms)
const RANDOM_DELAY_MAX = 5000; // Máximo delay adicional aleatório (em ms)
const CAPTCHA_MANUAL_MODE = true; // Se true, sempre vai pedir intervenção humana em captchas
const SAVE_CHECKPOINT = true; // Salvar progresso para continuar depois
const CHECKPOINT_FILE = path.join(__dirname, 'dork_checkpoint.json');
const ONLY_SHOW_RESULTS = true; // Mostrar apenas dorks com resultados
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');
const REPORTS_DIR = path.join(RESULTS_DIR, 'reports');
const ONLY_DISPLAY_DORKS = true; // APENAS MOSTRAR DORKS SEM ACESSAR SITES
const MANUAL_VALIDATION_MODE = true; // Permite validação manual das URLs antes de abrir

// Criar interface para readline com configuração personalizada
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

// Função para escolher aleatoriamente um motor de busca
function getRandomSearchEngine() {
  const index = Math.floor(Math.random() * SEARCH_ENGINES.length);
  return SEARCH_ENGINES[index];
}

// Função para escolher aleatoriamente um User Agent
function getRandomUserAgent() {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

// Perguntar ao usuário quais tipos de dorks incluir
async function promptDorkTypes() {
  return new Promise((resolve) => {
    console.log(chalk.cyan('\n=== Tipos de Dorks Disponíveis ==='));
    console.log(chalk.white('1. Genéricos (Vulnerabilidades comuns)'));
    console.log(chalk.white('2. AEM (Adobe Experience Manager)'));
    console.log(chalk.white('3. CMS (WordPress, Joomla, Drupal, etc)'));
    console.log(chalk.white('4. E-commerce e páginas de pagamento'));
    console.log(chalk.white('5. Todos'));
    
    rl.question(chalk.yellow('\nEscolha os tipos de dorks (ex: 1,3 ou 5 para todos): '), (answer) => {
      const selected = new Set();
      
      if (answer.includes('5')) {
        selected.add(1);
        selected.add(2);
        selected.add(3);
        selected.add(4);
      } else {
        answer.split(',').forEach(num => {
          const n = parseInt(num.trim());
          if (n >= 1 && n <= 4) selected.add(n);
        });
      }
      
      // Se nenhuma seleção válida, usar genéricos por padrão
      if (selected.size === 0) selected.add(1);
      
      resolve(Array.from(selected));
    });
  });
}

// Função para gerar a lista de dorks com base na seleção do usuário
function generateDorksList(types, domain) {
  let dorks = [];
  
  types.forEach(type => {
    switch(type) {
      case 1:
        dorks = [...dorks, ...generateGenericDorks(domain)];
        break;
      case 2:
        dorks = [...dorks, ...generateAEMDorks(domain)];
        break;
      case 3:
        dorks = [...dorks, ...generateCMSDorks(domain)];
        break;
      case 4:
        dorks = [...dorks, ...generateEcommerceDorks(domain)];
        break;
    }
  });
  
  // Adicionar dorks para domínios alternativos se configurado
  if (DOMAIN_SETTINGS.includeVariations && ALTERNATIVE_DOMAINS.length > 0) {
    ALTERNATIVE_DOMAINS.forEach(altDomain => {
      // Adicionar alguns dorks básicos para cada domínio alternativo
      dorks.push(`site:${altDomain}`);
      dorks.push(`site:${altDomain} inurl:admin`);
      dorks.push(`site:${altDomain} filetype:log`);
    });
  }
  
  // Adicionar dorks específicos para caminhos se configurado
  if (DOMAIN_SETTINGS.limitPaths && DOMAIN_SETTINGS.paths.length > 0) {
    DOMAIN_SETTINGS.paths.forEach(path => {
      dorks.push(`site:${domain} inurl:${path}`);
    });
  }
  
  // Remover duplicatas
  return [...new Set(dorks)];
}

// Modo apenas exibição de dorks (sem acesso)
function displayOnlyDorkInfo(dork, index, totalDorks, searchEngine) {
  console.log(chalk.blue(`\n[${index+1}/${totalDorks}] Dork:`));
  console.log(chalk.green(`🔍 ${dork}`)); 
  
  // Construir URL de pesquisa, mas não acessar
  const searchUrl = `${searchEngine.url}${encodeURIComponent(dork)}`;
  console.log(chalk.yellow(`🔗 URL: ${searchUrl}`));
  console.log(chalk.blue(`🌐 Motor: ${searchEngine.name}`));
  
  // Registrar em arquivo para referência
  const dorkInfo = {
    dork: dork,
    searchEngine: searchEngine.name,
    searchUrl: searchUrl,
    timestamp: new Date().toISOString()
  };
  
  return dorkInfo;
}

// Pedir ao usuário para verificar manualmente uma URL
async function askUserToCheckUrl(dork, url) {
  console.log(chalk.green(`\n📋 Dork: ${dork}`));
  console.log(chalk.yellow(`🔗 URL: ${url}`));
  
  const answer = await askQuestion(chalk.blue('👉 Deseja verificar esta URL no navegador? (s/N): '));
  return answer.toLowerCase() === 's';
}

// Abrir navegador para verificar manualmente uma URL
async function openBrowserForUrl(url, userAgent) {
  try {
    console.log(chalk.blue(`🌐 Abrindo navegador para verificação manual...`));
    
    // Configurações para iniciação do navegador
    const launchOptions = {
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ]
    };
    
    // Abrir navegador e navegar para a URL
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }
    
    // Esconder sinais de automação
    await page.evaluateOnNewDocument(() => {
      // Remover sinais comuns de automação
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    // Navegar para a URL do dork
    console.log(chalk.yellow(`🌐 Navegando para ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Manter navegador aberto e aguardar interação do usuário
    console.log(chalk.green(`✅ Navegador aberto para inspeção manual. Pressione ENTER quando terminar...`));
    await waitForUserConfirmation();
    
    // Fechar navegador após confirmação
    await browser.close();
    
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao abrir navegador: ${error.message}`));
  }
}

// Processar um dork individual no modo de exibição
async function processDorkDisplayMode(dork, index, totalDorks) {
  const searchEngine = getRandomSearchEngine();
  const result = displayOnlyDorkInfo(dork, index, totalDorks, searchEngine);
  
  // Se estiver no modo de validação manual, perguntar se deseja verificar
  if (MANUAL_VALIDATION_MODE) {
    const shouldCheck = await askUserToCheckUrl(dork, result.searchUrl);
    
    if (shouldCheck) {
      const userAgent = getRandomUserAgent();
      await openBrowserForUrl(result.searchUrl, userAgent);
    }
  }
  
  return result;
}

// Função principal com múltiplos motores de busca
async function runMultiEngineDorkScan() {
  try {
    // Exibir informações do domínio alvo da configuração
    console.log(chalk.cyan(`\n=== Configuração de Domínio ===`));
    console.log(chalk.green(`🎯 Domínio principal: ${TARGET_DOMAIN}`));
    
    if (ALTERNATIVE_DOMAINS.length > 0) {
      console.log(chalk.green(`🎯 Domínios alternativos: ${ALTERNATIVE_DOMAINS.join(', ')}`));
    }
    
    console.log(chalk.cyan(`\n=== Modo de Operação ===`));
    console.log(chalk.white(`- Modo de exibição apenas: ${ONLY_DISPLAY_DORKS ? 'Sim' : 'Não'}`));
    console.log(chalk.white(`- Validação manual: ${MANUAL_VALIDATION_MODE ? 'Sim' : 'Não'}`));
    
    // Confirmar o domínio alvo
    await waitForUserConfirmation(chalk.yellow(`\n✅ Confirma o uso deste domínio (${TARGET_DOMAIN})? Pressione ENTER para confirmar ou CTRL+C para cancelar.`));
    
    // Perguntar ao usuário quais tipos de dorks incluir
    const selectedTypes = await promptDorkTypes();
    
    // Gerar lista de dorks com base na seleção
    const dorks = generateDorksList(selectedTypes, TARGET_DOMAIN);
    
    // Exibir banner e informações
    displayBanner(TARGET_DOMAIN, dorks.length);
    
    // Criar diretórios para resultados
    await fs.ensureDir(RESULTS_DIR);
    await fs.ensureDir(SCREENSHOTS_DIR);
    await fs.ensureDir(REPORTS_DIR);
    
    // Confirmar execução
    await waitForUserConfirmation(chalk.yellow('🚀 Pressione ENTER para iniciar a varredura...'));
    
    // Carregar checkpoint se existir
    const checkpoint = await loadCheckpoint(CHECKPOINT_FILE);
    let startIndex = checkpoint.lastIndex + 1;
    let processedDorks = checkpoint.processedDorks || [];
    
    // Iniciar ou continuar relatório
    let reportContent = checkpoint.reportContent || '';
    
    if (startIndex > 0) {
      console.log(chalk.green(`📋 Retomando a partir do dork #${startIndex+1}/${dorks.length}`));
    }
    
    // Estatísticas de execução
    const stats = {
      targetDomain: TARGET_DOMAIN,
      alternativeDomains: ALTERNATIVE_DOMAINS,
      totalDorks: dorks.length,
      startTime: new Date().toISOString(),
      dorksProcessed: 0,
      manuallyChecked: 0, 
      totalExecutionTime: 0
    };
    
    // Processar cada dork a partir do ponto de checkpoint
    const results = [];
    
    for (let i = startIndex; i < dorks.length; i++) {
      const dork = dorks[i];
      
      // Verificar se este dork já foi processado
      if (processedDorks.includes(dork)) {
        console.log(chalk.yellow(`⏭️ Pulando dork já processado: ${dork}`));
        continue;
      }
      
      // Processar o dork no modo de exibição
      const result = await processDorkDisplayMode(dork, i, dorks.length);
      
      // Adicionar aos resultados
      results.push(result);
      processedDorks.push(dork);
      stats.dorksProcessed++;
      
      // Atualizar estatísticas
      if (MANUAL_VALIDATION_MODE && result.manuallyChecked) {
        stats.manuallyChecked++;
      }
      
      // Salvar checkpoint após cada dork
      if (SAVE_CHECKPOINT) {
        await saveCheckpoint(CHECKPOINT_FILE, i, reportContent, processedDorks);
      }
      
      // No modo de exibição, perguntar ao usuário se deseja continuar a cada 10 dorks
      if ((i + 1) % 10 === 0 && i < dorks.length - 1) {
        await waitForUserConfirmation(chalk.yellow(`\nMostrados ${i+1}/${dorks.length} dorks. Pressione ENTER para continuar ou CTRL+C para parar...`));
      }
      
      // Pequeno delay entre exibições
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Finalizar estatísticas
    stats.endTime = new Date().toISOString();
    stats.totalExecutionTime = new Date() - new Date(stats.startTime);
    
    // Salvar lista completa de dorks em arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dorksListPath = path.join(REPORTS_DIR, `dorks_list_${TARGET_DOMAIN}_${timestamp}.json`);
    await fs.writeFile(dorksListPath, JSON.stringify(results, null, 2));
    console.log(chalk.green(`\n✅ Lista de dorks salva em: ${dorksListPath}`));
    
    // Criar também um arquivo de texto com os dorks para fácil cópia
    const dorksTextPath = path.join(REPORTS_DIR, `dorks_list_${TARGET_DOMAIN}_${timestamp}.txt`);
    const textContent = results.map(item => `${item.dork}\n${item.searchUrl}\n\n`).join('');
    await fs.writeFile(dorksTextPath, textContent);
    console.log(chalk.green(`✅ Lista de dorks em formato texto salva em: ${dorksTextPath}`));
    
    // Salvar estatísticas de execução
    await saveExecutionStats(REPORTS_DIR, stats);
    
    // Exibir resumo no console
    console.log(chalk.green('\n✅ Varredura completa!'));
    console.log(chalk.cyan(`📊 ${stats.dorksProcessed} dorks processados`));
    if (MANUAL_VALIDATION_MODE) {
      console.log(chalk.cyan(`🔍 ${stats.manuallyChecked} dorks verificados manualmente`));
    }
    console.log(chalk.cyan(`⏱️ Tempo total: ${(stats.totalExecutionTime / 1000 / 60).toFixed(2)} minutos`));
    
    // Remover arquivo de checkpoint após conclusão bem-sucedida
    if (await fs.pathExists(CHECKPOINT_FILE)) {
      await fs.remove(CHECKPOINT_FILE);
      console.log(chalk.blue('🗑️ Checkpoint removido após conclusão bem-sucedida.'));
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Erro durante a execução: ${error}`));
    
    // Tentar salvar relatório mesmo em caso de falha
    const errorReportPath = path.join(REPORTS_DIR, `error_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(errorReportPath, JSON.stringify({ error: error.message, stack: error.stack }, null, 2));
    console.log(chalk.red(`📄 Relatório de erro salvo em: ${errorReportPath}`));
  } finally {
    // Fechar a interface de CLI
    rl.close();
  }
}

// Função para perguntas simples
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Interceptar CTRL+C para finalização limpa
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n⚠️ Interrupção detectada! Finalizando de forma segura...'));
  
  // Salvar estado atual se possível
  try {
    const errorReportPath = path.join(REPORTS_DIR, `interrupted_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
    await fs.writeFile(errorReportPath, 'Script interrompido pelo usuário.');
  } catch (e) { /* Ignorar erros ao salvar */ }
  
  process.exit(0);
});

// Executar script principal
console.log(chalk.blue('🚀 Iniciando sistema de varredura de dorks...'));

runMultiEngineDorkScan().then(() => {
  console.log(chalk.green('\n✨ Sistema finalizado com sucesso!'));
}).catch(err => {
  console.error(chalk.red(`\n💥 Erro fatal: ${err}`));
  process.exit(1);
});