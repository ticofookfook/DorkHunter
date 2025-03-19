/**
 * Dorks Configuration File
 * 
 * Este arquivo contém configurações de dorks genéricos para busca de vulnerabilidades,
 * exposições de informações sensíveis e pontos fracos comuns em aplicações web.
 * 
 * Uso:
 * - Importe este arquivo no script principal para usar as listas de dorks
 * - Modifique ou adicione novos dorks conforme necessário
 */

// Lista de motores de busca para alternar (reduz chance de bloqueio)
export const SEARCH_ENGINES = [
    {
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      resultSelector: 'div.g',
      titleSelector: 'h3',
      linkSelector: 'a',
      snippetSelector: 'div.VwiC3b',
      statsSelector: '#result-stats',
      cookieAcceptSelector: 'button[id="L2AGLb"]'
    },
    {
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      resultSelector: '.b_algo',
      titleSelector: 'h2',
      linkSelector: 'a',
      snippetSelector: '.b_caption p',
      statsSelector: '.sb_count',
      cookieAcceptSelector: '#bnp_btn_accept'
    },
    {
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=',
      resultSelector: '.result',
      titleSelector: '.result__title',
      linkSelector: '.result__a',
      snippetSelector: '.result__snippet',
      statsSelector: 'null',
      cookieAcceptSelector: 'null'
    },
    {
      name: 'Yahoo',
      url: 'https://search.yahoo.com/search?p=',
      resultSelector: '.algo',
      titleSelector: 'h3',
      linkSelector: 'a.d-ib',
      snippetSelector: '.compText',
      statsSelector: '.searchCenterMiddle',
      cookieAcceptSelector: 'button[name="agree"]'
    }
  ];
  
  // Lista de User Agents para rotação
  export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
  ];
  
  /**
   * Função geradora de dorks genéricos para qualquer domínio
   * @param {string} domain - O domínio alvo para a busca
   * @returns {Array} - Array com dorks formatados com o domínio alvo
   */
  export function generateGenericDorks(domain) {
    return [
      // ===== Exposição de Informações Sensíveis =====
      
      // Credenciais e chaves
      `site:${domain} filetype:env OR filetype:yml password`,
      `site:${domain} filetype:xml password`,
      `site:${domain} filetype:log username password`,
      `site:${domain} filetype:ini password OR key OR secret`,
      `site:${domain} filetype:config password`,
      `site:${domain} intext:"API_KEY" OR intext:"apikey" OR intext:"api_key"`,
      `site:${domain} intext:"SECRET_KEY" OR intext:"client_secret"`,
      `site:${domain} "authorization: Bearer"`,
      `site:${domain} "access_token"`,
      `site:${domain} intext:"aws_access_key_id" filetype:txt OR filetype:log`,
      `site:${domain} intext:"jdbc:mysql:" -github`,
      `site:${domain} "password" filetype:txt OR filetype:sql OR filetype:ini`,
      
      // Arquivos expostos/sensíveis
      `site:${domain} intitle:"Index of" "parent directory"`,
      `site:${domain} intitle:"Index of" wp-admin`,
      `site:${domain} inurl:"/wp-content/uploads/"`,
      `site:${domain} intitle:"Index of" inurl:backup OR inurl:old OR inurl:bkp`,
      `site:${domain} filetype:bak OR filetype:backup OR filetype:sql`,
      `site:${domain} filetype:sql "INSERT INTO" -"SQL dump"`,
      `site:${domain} filetype:sql intext:password`,
      `site:${domain} filetype:log`,
      `site:${domain} intext:"<!ENTITY % xx SYSTEM xx;"`,
      `site:${domain} intext:"syntax error" filetype:sql`,
      `site:${domain} filetype:json "api" OR "key" OR "token"`,
      
      // ===== Vulnerabilidades Comuns =====
      
      // Apache/Nginx/Servidor Web
      `site:${domain} filetype:conf "location ~"`,
      `site:${domain} intitle:"Apache HTTP Server" intitle:"documentation"`,
      `site:${domain} intext:"Apache Tomcat/" "error report"`,
      `site:${domain} intext:"nginx error log"`,
      `site:${domain} intitle:"Welcome to nginx!" intext:"Welcome to nginx"`,
      `site:${domain} intitle:"403 Forbidden" intext:"nginx"`,
      
      // Painéis de Administração e Debug
      `site:${domain} inurl:login OR inurl:admin OR inurl:backend`,
      `site:${domain} inurl:"/phpinfo.php" OR inurl:".php?mode=phpinfo"`,
      `site:${domain} inurl:"/phpmyadmin/" OR inurl:"/adminer.php"`,
      `site:${domain} inurl:"/wp-login.php" OR inurl:"/administrator/"`,
      `site:${domain} inurl:"/server-status" OR inurl:"/server-info"`,
      
      // Aplicações e Frameworks Específicos
      `site:${domain} inurl:"/wp-json/wp/v2/users"`,
      `site:${domain} inurl:"/api/swagger" OR inurl:"/swagger-ui.html"`,
      `site:${domain} inurl:"/api/v1" OR inurl:"/api/v2"`,
      `site:${domain} inurl:"/.git" "Index of /.git"`,
      `site:${domain} inurl:"/actuator/health" OR inurl:"/actuator/env"`,
      `site:${domain} inurl:"/.env" OR inurl:"/config.js"`,
      `site:${domain} inurl:"/.well-known/"`,
      `site:${domain} "error occured at line" OR "syntax error"`,
      `site:${domain} "Warning:" "database" "on line"`,
      `site:${domain} "ERROR: The requested URL could not be retrieved"`,
      
      // ===== Exposição em repositórios externos =====
      `site:github.com ${domain}`,
      `site:gitlab.com ${domain}`,
      `site:bitbucket.org ${domain}`,
      `site:pastebin.com ${domain}`,
      `site:jsfiddle.net ${domain}`,
      `site:codepen.io ${domain}`,
      `site:trello.com ${domain}`,
      
      // ===== Subdomínios e ambientes de desenvolvimento =====
      `site:*.${domain} inurl:test OR inurl:dev OR inurl:stage OR inurl:beta`,
      `site:*.${domain} inurl:uat OR inurl:qa OR inurl:staging`,
      `site:test.${domain} OR site:dev.${domain} OR site:stage.${domain} OR site:stg.${domain}`,
      `site:*.${domain} -www intext:admin OR intext:login`,
      
      // ===== Cloud Storage e CDNs expostos =====
      `site:s3.amazonaws.com ${domain}`,
      `site:blob.core.windows.net ${domain}`,
      `site:storage.googleapis.com ${domain}`,
      `site:cloudfront.net ${domain}`,
      `site:digitaloceanspaces.com ${domain}`,
      
      // ===== Outros vetores de ataque =====
      `site:${domain} inurl:"server-status" OR inurl:"status.php"`,
      `site:${domain} intext:"Fatal error: Call to undefined function"`,
      `site:${domain} inurl:"?page=" OR inurl:"?file=" OR inurl:"?id="`,
      `site:${domain} inurl:"?php=" OR inurl:"?lang="`,
      `site:${domain} ext:json OR ext:xml OR ext:conf OR ext:cnf OR ext:reg OR ext:inf OR ext:rdp OR ext:cfg OR ext:txt OR ext:ora OR ext:ini`
    ];
  }
  
  /**
   * Dorks específicos para vulnerabilidades em Adobe Experience Manager (AEM)
   * @param {string} domain - O domínio alvo para a busca
   * @returns {Array} - Array com dorks específicos para AEM
   */
  export function generateAEMDorks(domain) {
    return [
      `site:${domain} inurl:crx`,
      `site:${domain} inurl:bin/querybuilder.json`,
      `site:${domain} inurl:.infinity.json`,
      `site:${domain} inurl:.1.json`,
      `site:${domain} inurl:.tidy.json`,
      `site:${domain} inurl:.model.json`,
      `site:${domain} inurl:/libs/granite/security/currentuser.json`,
      `site:${domain} inurl:/system/console`,
      `site:${domain} inurl:/crx/de/index.jsp`,
      `site:${domain} inurl:/crx/explorer`,
      `site:${domain} inurl:/etc/replication`,
      `site:${domain} inurl:/etc/dam`,
      `site:${domain} inurl:/system/sling/cqform`,
      `site:${domain} inurl:/apps/`,
      `site:${domain} inurl:/content/dam`,
      `site:${domain} inurl:felix/bundles`,
      `site:${domain} inurl:etc/clientlibs`,
      `site:${domain} inurl:system/console/configMgr`,
      `site:${domain} inurl:.servlet.json`,
      `site:${domain} inurl:.servlet.html`
    ];
  }
  
  /**
   * Dorks específicos para vulnerabilidades em Content Management Systems (CMSs)
   * @param {string} domain - O domínio alvo para a busca
   * @returns {Array} - Array com dorks específicos para CMSs
   */
  export function generateCMSDorks(domain) {
    return [
      // WordPress
      `site:${domain} inurl:wp-content`,
      `site:${domain} inurl:wp-includes`,
      `site:${domain} inurl:wp-admin`,
      `site:${domain} inurl:wp-config.php`,
      `site:${domain} inurl:wp-json/wp/v2/users`,
      `site:${domain} inurl:xmlrpc.php`,
      
      // Joomla
      `site:${domain} inurl:index.php?option=com_`,
      `site:${domain} inurl:/administrator/index.php`,
      `site:${domain} intext:"Joomla! Debug Console"`,
      `site:${domain} inurl:com_users`,
      
      // Drupal
      `site:${domain} inurl:/?q=user/`,
      `site:${domain} inurl:/?q=admin/`,
      `site:${domain} intext:"Powered by Drupal" inurl:user`,
      `site:${domain} inurl:/sites/default/files/`,
      
      // Magento
      `site:${domain} inurl:/app/etc/local.xml`,
      `site:${domain} inurl:/downloader/`,
      `site:${domain} intext:"Mage.Cookies.path"`,
      `site:${domain} inurl:/admin_SOMETHING`,
      
      // Outros CMS
      `site:${domain} inurl:"/administrator/"`,
      `site:${domain} inurl:"/admin/" OR inurl:"/cp/" OR inurl:"/backend/"`
    ];
  }
  
  /**
   * Dorks específicos para vulnerabilidades em e-commerce e páginas de pagamento
   * @param {string} domain - O domínio alvo para a busca
   * @returns {Array} - Array com dorks específicos para e-commerce
   */
  export function generateEcommerceDorks(domain) {
    return [
      `site:${domain} inurl:/checkout/ OR inurl:/cart/ OR inurl:/basket/`,
      `site:${domain} inurl:/order OR inurl:/payment OR inurl:/transaction`,
      `site:${domain} intext:"credit card" OR intext:"card number"`,
      `site:${domain} inurl:checkout.php OR inurl:checkout.asp OR inurl:checkout.jsp`,
      `site:${domain} intext:"cvv" OR intext:"cvc" inurl:payment`,
      `site:${domain} intext:"payment gateway" OR intext:"gateway id"`,
      `site:${domain} intext:"CHECKOUT_SESSION_ID"`,
      `site:${domain} filetype:log intext:payment`
    ];
  }