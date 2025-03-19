/**
 * Human Interaction Module
 * 
 * Este módulo gerencia interações humanas necessárias durante o processo de automação,
 * como resolução de CAPTCHAs, confirmação para continuar após bloqueios, etc.
 */

import readline from 'readline';
import puppeteer from 'puppeteer';

// Criar interface para interação por linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Aguarda confirmação do usuário para continuar o processo
 * @param {string} message - Mensagem a ser exibida para o usuário
 * @returns {Promise} - Promise que resolve quando o usuário confirma
 */
export function waitForUserConfirmation(message = 'Pressione ENTER para continuar...') {
  return new Promise((resolve) => {
    rl.question(message, () => {
      resolve();
    });
  });
}

/**
 * Aguarda o usuário resolver um CAPTCHA ou outro desafio de segurança
 * @param {object} page - Instância da página Puppeteer
 * @param {number} timeoutMs - Tempo máximo para aguardar (em ms)
 * @param {boolean} autoDetect - Tentar detectar automaticamente o CAPTCHA
 * @returns {Promise<boolean>} - Promise que resolve quando o captcha é resolvido ou timeout
 */
export async function waitForCaptchaResolution(page, timeoutMs = 60000, autoDetect = true) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    console.log('\n⚠️ Página não está mais disponível para verificar CAPTCHA.');
    return false;
  }

  console.log('\n🔍 Verificando necessidade de interação humana...');
  
  // Verificar se há indicadores de CAPTCHA/bloqueio
  let needsHumanInteraction = false;
  try {
    needsHumanInteraction = await detectCaptchaOrBlock(page);
  } catch (error) {
    console.log(`\n⚠️ Erro ao detectar CAPTCHA: ${error.message}`);
    // Em caso de erro, assumir que precisa de interação
    needsHumanInteraction = true;
  }
  
  if (needsHumanInteraction) {
    console.log('\n⚠️ CAPTCHA ou bloqueio detectado!');
    console.log('---------------------------------------------');
    console.log('🤖 -> 👤 Transferindo controle para o humano');
    console.log('---------------------------------------------');
    
    // Destacar o navegador para chamar atenção do usuário
    try {
      await flashBrowserWindow(page);
    } catch (error) {
      console.log(`\n⚠️ Erro ao destacar janela: ${error.message}`);
    }
    
    console.log('\n✅ Por favor, resolva o CAPTCHA ou desafio no navegador.');
    console.log(`⏳ Você tem ${timeoutMs / 1000} segundos para resolver.`);
    
    // Iniciar timer para monitorar resolução ou timeout
    const startTime = Date.now();
    let resolved = false;
    
    while (Date.now() - startTime < timeoutMs && !resolved) {
      // Aguardar confirmação do usuário
      await waitForUserConfirmation('\n👆 Digite ENTER após resolver o desafio ou digite "skip" para pular: ');
      
      // Verificar se o usuário deseja pular
      const lastAnswer = rl.history && rl.history[0];
      if (lastAnswer && lastAnswer.toLowerCase() === 'skip') {
        console.log('\n⏭️ Pulando este site. Continuando com o próximo...');
        return false;
      }
      
      // Verificar se a página ainda está aberta
      if (page.isClosed()) {
        console.log('\n⚠️ A página foi fechada durante a resolução do CAPTCHA.');
        return false;
      }
      
      // Verificar se o CAPTCHA ainda está presente
      try {
        const stillBlocked = await detectCaptchaOrBlock(page);
        
        if (!stillBlocked) {
          console.log('\n✅ Desafio resolvido com sucesso! Continuando...');
          resolved = true;
        } else {
          console.log('\n❌ Ainda detectamos o desafio. Tente novamente ou digite "skip" para pular.');
        }
      } catch (error) {
        console.log(`\n⚠️ Erro ao verificar o estado do CAPTCHA: ${error.message}`);
        // Em caso de erro na verificação, assumir que foi resolvido para continuar
        console.log('\n✅ Assumindo que o desafio foi resolvido devido a erro de verificação.');
        resolved = true;
      }
    }
    
    if (!resolved) {
      console.log('\n⏰ Tempo esgotado para resolver o desafio. Pulando...');
      return false;
    }
    
    return true;
  } else {
    return true; // Não precisa de interação humana
  }
}

/**
 * Detecta se há captcha ou bloqueio na página atual
 * @param {object} page - Instância da página Puppeteer
 * @returns {Promise<boolean>} - Promise que resolve com true se detectar captcha/bloqueio
 */
export async function detectCaptchaOrBlock(page) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    throw new Error('Página não está disponível para detectar captcha');
  }

  try {
    // Verificar padrões comuns de texto e elementos de bloqueio/captcha
    const blocked = await page.evaluate(() => {
      const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
      
      if (!document.body) {
        return {detected: false, reason: 'Body não disponível'};
      }
      
      // Array com palavras-chave comuns em páginas de bloqueio/captcha
      const blockKeywords = [
        'captcha', 
        'robot', 
        'automated', 
        'bot check', 
        'suspicious activity',
        'unusual traffic', 
        'security check', 
        'human verification',
        'verify you are human',
        'are you a robot',
        'challenge',
        'blocked',
        'access denied',
        'denied access',
        'too many requests',
        'rate limit exceeded',
        'please wait',
        'suspicious',
        'behavior detected',
        'verifica'
      ];
      
      // Verificar cada palavra-chave no texto da página
      for (const keyword of blockKeywords) {
        if (bodyText.includes(keyword)) {
          return {detected: true, reason: `Texto da página contém "${keyword}"`};
        }
      }
      
      // Verificar elementos comuns de captcha por seletores
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        'iframe[src*="hcaptcha"]',
        'iframe[src*="funcaptcha"]',
        'iframe[src*="arkoselabs"]',
        'div.g-recaptcha',
        'div.h-captcha',
        'div#captcha',
        'div.captcha',
        'input[name*="captcha"]',
        'img[alt*="captcha"]',
        'form[action*="captcha"]'
      ];
      
      // Verificar cada seletor
      for (const selector of captchaSelectors) {
        if (document.querySelector(selector)) {
          return {detected: true, reason: `Elemento captcha encontrado: "${selector}"`};
        }
      }
      
      // Verificar bloquinhos de imagem para selecionar (tipo reCAPTCHA)
      const gridImages = document.querySelectorAll('table td img, div.rc-imageselect-tile');
      if (gridImages.length > 4) {
        return {detected: true, reason: 'Grid de imagens encontrado (possível reCAPTCHA)'};
      }
      
      return {detected: false};
    });
    
    if (blocked.detected) {
      console.log(`🛑 Bloqueio detectado: ${blocked.reason}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao detectar captcha:', error);
    // Em caso de erro, assumir que há bloqueio por segurança
    return true;
  }
}

/**
 * Destaca a janela do navegador para chamar atenção do usuário
 * @param {object} page - Instância da página Puppeteer
 */
async function flashBrowserWindow(page) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    throw new Error('Página não está disponível para destacar janela');
  }

  try {
    // Adicionar borda vermelha piscante para destacar a janela
    await page.evaluate(() => {
      if (!document.head || !document.body) return;
      
      const style = document.createElement('style');
      style.id = 'attention-needed-style';
      style.innerHTML = `
        body {
          animation: flash-border 1s infinite alternate;
          box-shadow: 0 0 20px red !important;
          border: 5px solid red !important;
        }
        
        @keyframes flash-border {
          from { border-color: red !important; }
          to { border-color: yellow !important; }
        }
        
        #attention-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: rgba(255, 0, 0, 0.8);
          color: white;
          text-align: center;
          padding: 15px;
          font-size: 18px;
          z-index: 999999;
          font-weight: bold;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `;
      document.head.appendChild(style);
      
      // Adicionar banner de atenção
      const banner = document.createElement('div');
      banner.id = 'attention-banner';
      banner.innerText = '⚠️ ATENÇÃO: Ação humana necessária! Por favor resolva o CAPTCHA ou desafio ⚠️';
      document.body.prepend(banner);
      
      // Rolar para o topo para garantir que o usuário veja o banner
      window.scrollTo(0, 0);
    });
    
    // Maximizar a janela para facilitar a visualização
    try {
      const session = await page.target().createCDPSession();
      await session.send('Browser.setWindowBounds', {
        windowId: 1,
        bounds: { windowState: 'maximized' }
      });
    } catch (error) {
      console.log(`⚠️ Erro ao maximizar janela: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Erro ao destacar janela:', error);
  }
}

/**
 * Remove os elementos visuais adicionados para chamada de atenção
 * @param {object} page - Instância da página Puppeteer
 */
export async function removeVisualAlerts(page) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    return; // Sai silenciosamente se a página estiver fechada
  }

  try {
    await page.evaluate(() => {
      if (!document.head || !document.body) return;
      
      const style = document.getElementById('attention-needed-style');
      if (style) style.remove();
      
      const banner = document.getElementById('attention-banner');
      if (banner) banner.remove();
    });
  } catch (error) {
    console.error('Erro ao remover alertas visuais:', error);
  }
}

/**
 * Fecha a interface de linha de comando
 */
export function closeInterface() {
  rl.close();
}

/**
 * Aguarda até que uma condição na página seja atendida ou timeout ocorra
 * @param {object} page - Instância da página Puppeteer
 * @param {Function} conditionFn - Função que retorna true/false (executada na página)
 * @param {number} timeout - Tempo máximo de espera em ms
 * @param {number} checkInterval - Intervalo entre verificações em ms
 * @returns {Promise<boolean>} - Se a condição foi atendida ou não
 */
export async function waitForCondition(page, conditionFn, timeout = 30000, checkInterval = 500) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    throw new Error('Página não está disponível para aguardar condição');
  }

  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Verificar se a página ainda está disponível
    if (page.isClosed()) {
      throw new Error('Página fechada durante aguardo de condição');
    }
    
    try {
      const conditionMet = await page.evaluate(conditionFn);
      
      if (conditionMet) {
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Erro ao avaliar condição: ${error.message}`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return false;
}

/**
 * Monitora uma página para detectar mudanças que possam indicar carregamento completo
 * Útil para sites com carregamento dinâmico sem eventos de navegação
 * @param {object} page - Instância da página Puppeteer
 * @param {number} stableTime - Tempo em ms sem alterações para considerar estável
 * @param {number} maxWaitTime - Tempo máximo total de espera
 * @returns {Promise<boolean>} - Se a página estabilizou
 */
export async function waitForPageStability(page, stableTime = 3000, maxWaitTime = 20000) {
  // Verificar se a página ainda está aberta
  if (!page || page.isClosed()) {
    throw new Error('Página não está disponível para aguardar estabilidade');
  }

  console.log('Aguardando estabilidade da página...');
  
  const startTime = Date.now();
  let lastChangeTime = startTime;
  let domSize = 0;
  
  try {
    // Instalar observador de DOM que atualiza lastChangeTime quando ocorrem mudanças
    await page.evaluate((stableTimeMs) => {
      window.__lastChange = Date.now();
      
      try {
        const observer = new MutationObserver(() => {
          window.__lastChange = Date.now();
        });
        
        if (document.body) {
          observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
          });
        }
        
        // Também monitorar eventos de rede e XHR
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
          window.__lastChange = Date.now();
          return originalXHROpen.apply(this, arguments);
        };
        
        // Auto-clean após o tempo estável
        setTimeout(() => {
          observer.disconnect();
          XMLHttpRequest.prototype.open = originalXHROpen;
        }, stableTimeMs + 1000);
      } catch (e) {
        console.error('Erro no observer:', e);
      }
    }, stableTime);
  } catch (error) {
    console.log(`⚠️ Erro ao configurar monitoramento de estabilidade: ${error.message}`);
    return false; // Em caso de erro, presume que a página está estável
  }
  
  // Verificar se a página está estável
  while (Date.now() - startTime < maxWaitTime) {
    // Verificar se a página ainda está disponível
    if (page.isClosed()) {
      throw new Error('Página fechada durante aguardo de estabilidade');
    }
    
    try {
      // Verificar última alteração e tamanho atual do DOM
      const stats = await page.evaluate(() => {
        return {
          lastChange: window.__lastChange || Date.now(),
          domSize: document.body ? document.body.innerHTML.length : 0
        };
      });
      
      // Se o tamanho do DOM mudou, atualizar lastChangeTime
      if (stats.domSize !== domSize) {
        lastChangeTime = Date.now();
        domSize = stats.domSize;
      }
      
      // Verificar se a página está estável pelo tempo mínimo
      if (Date.now() - lastChangeTime >= stableTime) {
        console.log('Página estabilizada!');
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Erro durante verificação de estabilidade: ${error.message}`);
      return false; // Em caso de erro, presume que a página está estável
    }
    
    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Tempo máximo (${maxWaitTime}ms) atingido sem estabilidade completa.`);
  return true; // Considera estável após tempo máximo
}