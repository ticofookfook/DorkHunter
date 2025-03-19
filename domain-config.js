/**
 * Configuração de Domínio para o Scanner de Dorks
 * 
 * Este arquivo contém a configuração do domínio alvo para o scanner.
 * Edite este arquivo para mudar o domínio alvo, em vez de precisar
 * digitar no console.
 */

// Domínio alvo principal (será usado por padrão)
export const TARGET_DOMAIN = 'tesla.com';

// Lista de domínios alternativos para pesquisas adicionais
export const ALTERNATIVE_DOMAINS = [
  'adm.tesla.com',
  'web.tesla.com'
];

// Outras configurações relacionadas ao domínio
export const DOMAIN_SETTINGS = {
  // Incluir subdomínios nas pesquisas
  includeSubdomains: true,
  
  // Pesquisar também por variações do domínio
  includeVariations: true,
  
  // Limitar pesquisas a certos caminhos
  limitPaths: false,
  paths: ['/wp-content', '/admin', '/api']
};
