/**
 * Utilities Module
 * 
 * Este módulo contém funções utilitárias para o script de dorks
 * como formatação de dados, relatórios, delays, etc.
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk'; // Para colorir saídas no console (você precisará instalar: npm install chalk)

/**
 * Gera um delay aleatório para comportamento mais humano
 * @param {number} baseDelay - Delay base em ms
 * @param {number} randomMax - Delay adicional máximo em ms
 * @returns {Promise} - Promise que resolve após o delay
 */
export async function randomDelay(baseDelay, randomMax) {
  const randomExtra = Math.floor(Math.random() * randomMax);
  const totalDelay = baseDelay + randomExtra;
  
  console.log(chalk.yellow(`⏳ Aguardando ${(totalDelay/1000).toFixed(2)}s antes da próxima ação...`));
  
  return new Promise(resolve => setTimeout(resolve, totalDelay));
}

/**
 * Cria um hash único para um dork para usar como identificador
 * @param {string} dork - String do dork
 * @returns {string} - Hash abreviado
 */
export function generateDorkHash(dork) {
  return crypto.createHash('md5').update(dork).digest('hex').substring(0, 8);
}

/**
 * Carrega um checkpoint se existir
 * @param {string} checkpointFile - Caminho para o arquivo de checkpoint
 * @returns {Object} - Dados do checkpoint ou objeto vazio
 */
export async function loadCheckpoint(checkpointFile) {
  try {
    if (await fs.pathExists(checkpointFile)) {
      console.log(chalk.blue('📋 Checkpoint encontrado. Carregando estado anterior...'));
      const data = await fs.readFile(checkpointFile, 'utf8');
      const checkpoint = JSON.parse(data);
      console.log(chalk.green(`✅ Checkpoint carregado: processado até dork #${checkpoint.lastIndex}`));
      return checkpoint;
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro ao carregar checkpoint:'), error);
  }
  return { lastIndex: -1, reportContent: null, processedDorks: [] };
}

/**
 * Salva o progresso atual em um arquivo de checkpoint
 * @param {string} checkpointFile - Caminho para o arquivo de checkpoint
 * @param {number} index - Índice do último dork processado
 * @param {string} reportContent - Conteúdo do relatório até agora
 * @param {Array} processedDorks - Lista de dorks já processados
 */
export async function saveCheckpoint(checkpointFile, index, reportContent, processedDorks = []) {
  try {
    await fs.writeFile(checkpointFile, JSON.stringify({ 
      lastIndex: index, 
      reportContent,
      processedDorks,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(chalk.green(`📝 Checkpoint salvo: processado até dork #${index}`));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao salvar checkpoint:'), error);
  }
}

/**
 * Formata um dork para uso seguro em nomes de arquivos
 * @param {string} dork - String original do dork
 * @param {number} maxLength - Comprimento máximo para o nome
 * @returns {string} - Versão segura para uso em nomes de arquivo
 */
export function formatDorkForFilename(dork, maxLength = 50) {
  return dork.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength);
}

/**
 * Cria um relatório consolidado dos resultados da varredura
 * @param {string} targetDomain - Domínio alvo
 * @param {Array} results - Resultados da varredura
 * @param {string} outputDir - Diretório para salvar o relatório
 * @returns {string} - Caminho para o arquivo de relatório
 */
export async function generateReport(targetDomain, results, outputDir) {
  // Garantir que o diretório existe
  await fs.ensureDir(outputDir);
  
  // Criar nome do arquivo com timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(outputDir, `dorks_scan_report_${timestamp}.md`);
  
  // Criar conteúdo do relatório
  let reportContent = `# Relatório de Varredura de Dorks de Segurança\n\n`;
  reportContent += `**Domínio Alvo:** ${targetDomain}\n`;
  reportContent += `**Data da Varredura:** ${new Date().toISOString()}\n`;
  reportContent += `**Total de Dorks Verificados:** ${results.length}\n\n`;
  
  // Sumário de resultados
  const vulnerabilitiesFound = results.filter(r => r.resultsCount > 0);
  reportContent += `## Sumário\n\n`;
  reportContent += `- **Vulnerabilidades Potenciais Encontradas:** ${vulnerabilitiesFound.length}\n`;
  reportContent += `- **Taxa de Sucesso:** ${((vulnerabilitiesFound.length / results.length) * 100).toFixed(2)}%\n\n`;
  
  if (vulnerabilitiesFound.length > 0) {
    reportContent += `## Vulnerabilidades Potenciais Encontradas\n\n`;
    reportContent += `| # | Dork | Motor de Busca | Resultados | Screenshot |\n`;
    reportContent += `|---|------|---------------|------------|------------|\n`;
    
    vulnerabilitiesFound.forEach((result, idx) => {
      const screenshotLink = result.screenshotPath ? 
        `[Screenshot](${path.basename(result.screenshotPath)})` : 'N/A';
      
      reportContent += `| ${idx+1} | \`${result.dork}\` | ${result.searchEngine} | ${result.resultsCount} | ${screenshotLink} |\n`;
    });
    
    reportContent += `\n\n`;
  }
  
  // Detalhes completos
  reportContent += `## Detalhes Completos\n\n`;
  
  results.forEach((result, idx) => {
    reportContent += `### ${idx+1}. \`${result.dork}\`\n\n`;
    reportContent += `**Motor de Busca:** ${result.searchEngine}\n`;
    reportContent += `**Resultados Encontrados:** ${result.resultsCount}\n`;
    reportContent += `**Tempo de Processamento:** ${result.processingTime}ms\n\n`;
    
    if (result.screenshotPath) {
      reportContent += `![Screenshot](${path.basename(result.screenshotPath)})\n\n`;
    }
    
    if (result.urls && result.urls.length > 0) {
      reportContent += `#### URLs Encontradas:\n\n`;
      result.urls.forEach((url, urlIdx) => {
        reportContent += `${urlIdx+1}. [${url.title}](${url.link})\n`;
        if (url.snippet) {
          reportContent += `   ${url.snippet}\n\n`;
        }
      });
    } else {
      reportContent += `*Nenhum resultado encontrado para este dork.*\n\n`;
    }
    
    reportContent += `---\n\n`;
  });
  
  // Salvar o relatório
  await fs.writeFile(reportPath, reportContent);
  console.log(chalk.green(`📊 Relatório salvo em: ${reportPath}`));
  
  return reportPath;
}

/**
 * Registra estatísticas e métricas sobre a execução do script
 * @param {string} outputDir - Diretório para salvar as estatísticas
 * @param {Object} stats - Objeto contendo as estatísticas
 */
export async function saveExecutionStats(outputDir, stats) {
  await fs.ensureDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const statsPath = path.join(outputDir, `execution_stats_${timestamp}.json`);
  
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
  console.log(chalk.blue(`📊 Estatísticas de execução salvas em: ${statsPath}`));
}

/**
 * Exibe um banner no console para melhorar a experiência de uso
 * @param {string} targetDomain - Domínio alvo
 * @param {number} dorkCount - Número total de dorks
 */
export function displayBanner(targetDomain, dorkCount) {
  console.log('\n');
  console.log(chalk.bgBlue.white('╔═════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bgBlue.white('║                      DORKS SECURITY SCANNER                     ║'));
  console.log(chalk.bgBlue.white('╚═════════════════════════════════════════════════════════════════╝'));
  console.log('\n');
  console.log(chalk.cyan(`🎯 Domínio alvo: ${chalk.bold(targetDomain)}`));
  console.log(chalk.cyan(`🔍 Total de dorks: ${chalk.bold(dorkCount)}`));
  console.log(chalk.cyan(`⏱️  Data/hora de início: ${chalk.bold(new Date().toISOString())}`));
  console.log('\n');
  console.log(chalk.yellow('⚠️  Este script automatiza pesquisas de vulnerabilidades.'));
  console.log(chalk.yellow('⚠️  Use apenas em domínios para os quais você tem permissão.'));
  console.log(chalk.yellow('⚠️  O uso em sites sem autorização pode ser ilegal.'));
  console.log('\n');
}

/**
 * Realiza uma captura de tela com nome baseado no dork
 * @param {Object} page - Instância da página Puppeteer
 * @param {string} dork - String do dork
 * @param {number} index - Índice do dork
 * @param {string} outputDir - Diretório para salvar a captura
 * @returns {string} - Caminho para o arquivo de captura de tela
 */
export async function takeScreenshot(page, dork, index, outputDir) {
  await fs.ensureDir(outputDir);
  
  const dorkHash = generateDorkHash(dork);
  const screenshotFilename = `dork_${index}_${dorkHash}.png`;
  const screenshotPath = path.join(outputDir, screenshotFilename);
  
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(chalk.green(`📸 Screenshot salvo em: ${screenshotFilename}`));
    return screenshotPath;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao capturar screenshot:'), error);
    return null;
  }
}

/**
 * Gera uma navegação aleatória para evitar bloqueios
 * @param {Object} page - Instância da página Puppeteer
 */
export async function performRandomBrowsing(page) {
  try {
    // Scroll aleatório
    await page.evaluate(() => {
      const maxScroll = Math.max(
        document.body.scrollHeight, 
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      
      // Número aleatório de scrolls
      const scrollCount = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < scrollCount; i++) {
        const targetPos = Math.floor(Math.random() * maxScroll);
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
    
    await randomDelay(500, 1500);
    
    // Movimentos de mouse aleatórios (simulados pelo avaliador JS)
    await page.evaluate(() => {
      const moveCount = Math.floor(Math.random() * 10) + 5;
      
      // Simular movimentos de mouse
      for (let i = 0; i < moveCount; i++) {
        const x = Math.floor(Math.random() * window.innerWidth);
        const y = Math.floor(Math.random() * window.innerHeight);
        
        // Criar um elemento temporário para simular hover
        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = x + 'px';
        temp.style.top = y + 'px';
        temp.style.width = '1px';
        temp.style.height = '1px';
        temp.style.zIndex = '-1000';
        document.body.appendChild(temp);
        
        // Simular hover
        const hoverEvent = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        temp.dispatchEvent(hoverEvent);
        
        // Remover após uso
        setTimeout(() => temp.remove(), 100);
      }
    });
  } catch (error) {
    console.error('Erro ao realizar navegação aleatória:', error);
  }
}

/**
 * Extrai informações úteis de metadados da página
 * @param {Object} page - Instância da página Puppeteer
 * @returns {Object} - Metadados extraídos
 */
export async function extractPageMetadata(page) {
  try {
    return await page.evaluate(() => {
      // Extrair metadados
      const metaTags = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) metaTags[name] = content;
      });
      
      // Extrair informações do cabeçalho
      const headers = {};
      if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        resources.forEach(resource => {
          if (resource.name && resource.name.includes(window.location.hostname)) {
            headers[resource.name] = {
              duration: resource.duration,
              size: resource.transferSize || 0
            };
          }
        });
      }
      
      return {
        title: document.title,
        url: window.location.href,
        metaTags,
        headers,
        loadTime: window.performance ? window.performance.timing.domComplete - window.performance.timing.navigationStart : null,
        scripts: Array.from(document.scripts).map(s => s.src).filter(Boolean),
        links: Array.from(document.querySelectorAll('a')).map(a => a.href).filter(Boolean).slice(0, 20),
        images: Array.from(document.querySelectorAll('img')).map(img => img.src).filter(Boolean).slice(0, 20)
      };
    });
  } catch (error) {
    console.error('Erro ao extrair metadados da página:', error);
    return {};
  }
}