# 🔍 DorkHunter - Scanner Avançado de Dorks para Segurança

<div align="center">
  
![DorkHunter Banner]

[![Licença: MIT](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js: v18+](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![feito-com-javascript](https://img.shields.io/badge/Feito%20com-JavaScript-1f425f.svg)](https://www.javascript.com)
[![PRs Bem-vindos](https://img.shields.io/badge/PRs-bem--vindos-brightgreen.svg)](http://makeapullrequest.com)

**Eleve seu jogo de reconhecimento com um scanner de dorks modular, poderoso e discreto**

*Descubra ativos expostos, vulnerabilidades potenciais e informações sensíveis como um profissional*

</div>

## ✨ Recursos

- **🚀 Suporte a Múltiplos Buscadores** - Alterna perfeitamente entre Google, Bing, Yahoo, DuckDuckGo
- **🔄 Arquitetura Modular** - Código facilmente extensível com módulos dedicados
- **🤖 Estratégias Anti-Detecção** - Padrões de comportamento humano para evitar bloqueios
- **👤 Validação Manual Interativa** - Você decide quais URLs verificar, eliminando falsos positivos
- **📊 Relatórios Abrangentes** - Relatórios em formato JSON e texto para fácil utilização
- **💾 Recuperação de Checkpoints** - Retome a varredura de onde parou
- **📋 Biblioteca Extensa de Dorks** - Dorks selecionados para vulnerabilidades genéricas, AEM, CMS e e-commerce
- **🏃 Modo Apenas Exibição** - Visualize dorks sem visitar sites automaticamente
- **⚙️ Configuração Baseada em Arquivos** - Direcionamento fácil de domínios via arquivo de configuração


## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm
- Conexão com a Internet

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seuusuario/DorkHunter.git
cd DorkHunter
```

2. Instale as dependências:
```bash
npm install
```

3. Configure seu domínio alvo:
```bash
# Edite domain-config.js com as informações do seu domínio alvo
```

4. Execute o scanner:
```bash
npm start
# ou diretamente:
node dork-scanner.js
```

## 🎮 Uso

### Configure o Domínio Alvo

Edite `domain-config.js` para definir seu domínio alvo:

```javascript
// Domínio alvo principal (será usado por padrão)
export const TARGET_DOMAIN = 'exemplo.com.br';

// Lista de domínios alternativos para pesquisas adicionais
export const ALTERNATIVE_DOMAINS = [
  'dev.exemplo.com.br',
  'staging.exemplo.com.br'
];
```

### Modos de Execução

1. **Modo de Validação Manual (Recomendado)**: 
```javascript
// Em dork-scanner.js
const MANUAL_VALIDATION_MODE = true;
```
Neste modo, o script exibe cada dork e pergunta se você deseja verificá-lo no navegador:
```
[1/53] Dork:
🔍 site:exemplo.com.br inurl:admin
🔗 URL: https://google.com/search?q=site%3Aexemplo.com.br+inurl%3Aadmin
🌐 Motor: Google

👉 Deseja verificar esta URL no navegador? (s/N):
```
Digite 's' para abrir o navegador e verificar o dork, ou ENTER para pular.

2. **Modo Apenas Exibição**: 
```javascript
// Em dork-scanner.js
const ONLY_DISPLAY_DORKS = true;
```
Apenas mostra os dorks e suas URLs sem acessar sites.

### Categorias de Dorks

Escolha entre várias categorias de dorks durante a execução:
- Vulnerabilidades Genéricas
- Adobe Experience Manager (AEM)
- Sistemas de Gerenciamento de Conteúdo (WordPress, Joomla, Drupal)
- E-commerce e Páginas de Pagamento

## 📁 Estrutura do Projeto

```
DorkHunter/
├── dork-scanner.js       # Script principal
├── domain-config.js      # Configuração do domínio alvo
├── dorks-config.js       # Configuração de dorks e motores de busca
├── human-interaction.js  # Interação do usuário e tratamento de CAPTCHA
├── utils.js              # Funções utilitárias
├── dorks-results/        # Diretório de resultados
│   ├── reports/          # Relatórios gerados
│   └── screenshots/      # Capturas de tela
└── node_modules/         # Dependências
```

## 🔧 Personalização

### Adicionando Dorks Personalizados

Edite o arquivo `dorks-config.js` para adicionar seus próprios dorks. Exemplo:

```javascript
export function generateCustomDorks(domain) {
  return [
    `site:${domain} inurl:admin/login`,
    `site:${domain} intitle:"Dashboard"`,
    // Adicione mais dorks...
  ];
}
```

### Configurando Motores de Busca

Você pode modificar a configuração dos motores de busca em `dorks-config.js`:

```javascript
export const SEARCH_ENGINES = [
  {
    name: 'MotorDeBusca',
    url: 'https://motordebusca.com/search?q=',
    resultSelector: '.result',
    titleSelector: '.title',
    // ... outros seletores
  },
  // Adicione mais motores...
];
```

## 🛠️ Configuração Avançada

Configurações adicionais podem ser ajustadas em `dork-scanner.js`:

```javascript
const DELAY_BETWEEN_SEARCHES = 5000; // Atraso entre pesquisas (ms)
const RANDOM_DELAY_MAX = 5000;       // Atraso aleatório adicional (ms)
const MANUAL_VALIDATION_MODE = true; // Validação manual de dorks
```

## 📋 Formato de Saída

O scanner gera dois tipos de arquivos:

1. **Arquivo JSON** - Contém detalhes técnicos sobre cada dork:
```json
[
  {
    "dork": "site:exemplo.com.br inurl:admin",
    "searchEngine": "Google",
    "searchUrl": "https://www.google.com/search?q=site%3Aexemplo.com.br+inurl%3Aadmin",
    "timestamp": "2023-04-15T14:30:22.120Z"
  },
  ...
]
```

2. **Arquivo de texto** - Formato simples para referência rápida:
```
site:exemplo.com.br inurl:admin
https://www.google.com/search?q=site%3Aexemplo.com.br+inurl%3Aadmin

site:exemplo.com.br filetype:log
https://www.google.com/search?q=site%3Aexemplo.com.br+filetype%3Alog

...
```

## 🌟 Casos de Uso

- **Avaliações de Segurança**: Descubra interfaces administrativas expostas, logs e arquivos sensíveis
- **Pesquisa de Vulnerabilidades**: Encontre potenciais pontos de entrada para testes de segurança adicionais
- **Inteligência Competitiva**: Colete informações sobre ativos digitais e tecnologias
- **Caça a Bugs (Bug Bounty)**: Identifique problemas potenciais antes de reportá-los
- **Análise de Pegada Digital**: Entenda a superfície de ataque externa da sua organização

## ⚠️ Aviso de Uso Ético

Esta ferramenta é destinada apenas para pesquisa legítima de segurança e testes de penetração autorizados. Sempre:

1. Escaneie apenas domínios que você possui ou tem permissão explícita para testar
2. Respeite robots.txt e limites de taxa
3. Siga práticas de divulgação responsável
4. Cumpra todas as leis e regulamentos aplicáveis

**O autor não é responsável por qualquer uso indevido desta ferramenta.**

## 🔄 Atualizações e Roteiro

- [x] Suporte a múltiplos motores de busca
- [x] Modo de validação manual interativa
- [x] Recuperação de checkpoint
- [x] Arquivo de configuração de domínio
- [x] Interface amigável e intuitiva
- [ ] Suporte a proxy
- [ ] Integração com TOR
- [ ] Cabeçalhos e cookies personalizados
- [ ] Modo API para integração
- [ ] Banco de dados de resultados para análise de tendências

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para enviar um Pull Request.

1. Faça um fork do repositório
2. Crie sua branch de recurso (`git checkout -b recurso/recurso-incrivel`)
3. Faça commit das suas alterações (`git commit -m 'Adicionar algum recurso incrível'`)
4. Envie para a branch (`git push origin recurso/recurso-incrivel`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para obter detalhes.

## 💬 Contato e Suporte

- Crie uma issue para relatórios de bugs ou solicitações de recursos
- Estrele o repositório se você o achar útil
- Compartilhe suas histórias de sucesso e melhorias

---

<div align="center">
  
  **Feito com ❤️ para a comunidade de pesquisa em segurança**
  
  [⬆ Voltar ao Topo](#-dorkhunter---scanner-avançado-de-dorks-para-segurança)
  
</div>
