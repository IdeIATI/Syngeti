---
name: syngeti-brand-ui-modernization
description: Moderniza a identidade visual e o frontend da plataforma SyngeTI, aplicando novo ícone, novo logotipo, sistema de temas Dark, Light, Tokyo Night e D'Lamb, com foco em legibilidade, consistência, responsividade e preservação total da lógica existente.
---

# SKILL — Modernização Visual e Frontend da SyngeTI

## 1. Papel do agente

Atue como **Designer de Produto Sênior + UI/UX Designer + Frontend Engineer Sênior**, especializado em sistemas corporativos, dashboards, ERPs, plataformas de TI e design systems.

Sua tarefa é modernizar visualmente a plataforma **SyngeTI — Sistema de Integração e Gestão de TI**, mantendo integralmente a lógica, dados, rotas, permissões, integrações e regras de negócio existentes.

Não redesenhe funções.  
Não remova funcionalidades.  
Não altere banco de dados.  
Não altere APIs.  
Não crie dados fictícios.  
Não substitua componentes funcionais por protótipos estáticos.

O trabalho é de **identidade visual, design system, layout, acessibilidade e frontend**.

---

# 2. Objetivo principal

Transformar a SyngeTI em uma plataforma visualmente:

- moderna;
- tecnológica;
- profissional;
- corporativa;
- limpa;
- consistente;
- de alta legibilidade;
- adequada para uso diário prolongado;
- responsiva;
- preparada para múltiplos temas.

A plataforma deve transmitir:

**integração + gestão de TI + infraestrutura + segurança + dados + suporte + controle operacional.**

---

# 3. Identidade SyngeTI aprovada

Utilizar o **ícone e o logotipo SyngeTI atualmente aprovados no projeto** como arquivos mestres.

## Ícone

O símbolo deve comunicar visualmente:

- infraestrutura;
- cloud;
- servidores;
- integração;
- conectividade;
- gestão centralizada;
- tecnologia.

### Regras do ícone

- não redesenhar;
- não deformar;
- não inclinar;
- não alterar proporção;
- não adicionar elementos;
- não aplicar sombras exageradas;
- não utilizar efeitos neon excessivos;
- manter boa leitura em 16 px, 24 px, 32 px, 64 px, 128 px e 256 px.

Criar variantes somente quando necessárias para contraste:

- principal;
- fundo escuro;
- fundo claro;
- monocromática;
- favicon.

---

# 4. Logotipo SyngeTI

Usar a assinatura:

**SyngeTI**

Subtítulo:

**Sistema de Integração e Gestão de TI**

O logotipo deve possuir:

- versão horizontal;
- versão compacta;
- versão para sidebar;
- versão para login;
- versão clara;
- versão escura;
- versão monocromática.

A geometria e a tipografia do logotipo devem permanecer consistentes entre os temas.

Alterar apenas a cor necessária para garantir contraste.

---

# 5. Tipografia da interface

Utilizar preferencialmente:

## Títulos e números
**Exo 2**

Pesos:
- 600;
- 700.

## Interface, menus e textos
**Inter**

Pesos:
- 400;
- 500;
- 600;
- 700.

Fallback:

`Inter, Manrope, Arial, sans-serif`

Nunca usar fontes decorativas no corpo da interface.

---

# 6. Sistema de temas

Implementar os temas através de **design tokens / CSS variables / Theme Provider**.

Nunca espalhar cores hardcoded por componentes.

Todos os componentes devem consumir tokens semânticos.

Tokens mínimos:

```css
--bg-app
--bg-sidebar
--bg-header
--surface-1
--surface-2
--surface-3
--border-subtle
--border-strong
--text-primary
--text-secondary
--text-muted
--primary
--primary-hover
--primary-soft
--secondary
--success
--warning
--danger
--info
--focus-ring
--shadow-card
```

---

# 7. Tema Dark

Direção:

- fundo azul-marinho quase preto;
- superfícies azul-grafite;
- textos claros;
- ciano/azul somente como destaque;
- aparência tecnológica sem excesso de neon.

Sugestão:

```css
--bg-app: #07111D;
--bg-sidebar: #081522;
--bg-header: #07111D;
--surface-1: #0B1B2B;
--surface-2: #10253A;
--surface-3: #142B42;
--border-subtle: #1E3447;
--text-primary: #F5F7FA;
--text-secondary: #C7D2DE;
--text-muted: #8FA3B7;
--primary: #22D3EE;
--primary-hover: #06B6D4;
--secondary: #14B8A6;
```

Evitar grandes áreas em azul elétrico.

---

# 8. Tema Light

Direção:

- claro;
- corporativo;
- limpo;
- alta legibilidade;
- fundos levemente frios;
- cards brancos;
- azul/ciano como ação.

```css
--bg-app: #F3F6F9;
--bg-sidebar: #FFFFFF;
--bg-header: #FFFFFF;
--surface-1: #FFFFFF;
--surface-2: #F7F9FB;
--surface-3: #EEF3F7;
--border-subtle: #D9E2EA;
--text-primary: #111827;
--text-secondary: #475569;
--text-muted: #718096;
--primary: #0EA5E9;
--primary-hover: #0284C7;
--secondary: #14B8A6;
```

Não usar textos cinza-claro sobre fundo branco.

---

# 9. Tema Tokyo Night

Utilizar direção inspirada no Tokyo Night, sem comprometer contraste.

```css
--bg-app: #1A1B26;
--bg-sidebar: #16161E;
--bg-header: #1A1B26;
--surface-1: #24283B;
--surface-2: #292E42;
--surface-3: #343A52;
--border-subtle: #414868;
--text-primary: #C0CAF5;
--text-secondary: #A9B1D6;
--text-muted: #7F849C;
--primary: #7AA2F7;
--primary-hover: #89B4FA;
--secondary: #BB9AF7;
```

Ciano pode continuar presente em estados informativos.

---

# 10. Tema D'Lamb

O tema D'Lamb deve respeitar o **Manual de Identidade da D'Lamb Sport**.

Cores oficiais da marca:

- Vermelho D'Lamb — Pantone 7622 C — `#821F1B`
- Cinza D'Lamb — Pantone 424 C — `#7A7774`

Utilizar como base:

```css
--bg-app: #F5F5F4;
--bg-sidebar: #FFFFFF;
--bg-header: #FFFFFF;
--surface-1: #FFFFFF;
--surface-2: #F3F2F1;
--surface-3: #ECEAE8;
--border-subtle: #D6D2CF;
--text-primary: #2B2B2B;
--text-secondary: #5F5C5A;
--text-muted: #7A7774;
--primary: #821F1B;
--primary-hover: #6F1815;
--primary-soft: #F4E9E8;
--secondary: #7A7774;
```

## Regras do tema D'Lamb

O tema da plataforma pode utilizar as cores da identidade D'Lamb.

Se o logotipo D'Lamb aparecer dentro da plataforma:

- utilizar somente versões oficiais;
- não alterar as cores oficiais;
- não alterar proporção;
- não inclinar;
- não trocar tipografia;
- respeitar área de proteção;
- utilizar versão positiva/negativa apropriada ao fundo.

A identidade da SyngeTI continua sendo SyngeTI.  
O tema D'Lamb é uma **skin institucional**, não uma substituição da marca do sistema.

---

# 11. Estrutura principal da plataforma

Manter a arquitetura atual, porém melhorar hierarquia visual.

## Sidebar

Largura desktop aproximada:

`240px – 260px`

Características:

- logo SyngeTI no topo;
- menu com ícones consistentes;
- grupos bem definidos;
- item ativo destacado;
- textos com contraste adequado;
- subtítulos menores e menos chamativos;
- hover discreto;
- possibilidade de sidebar recolhida.

Evitar excesso de bordas.

## Header

Altura recomendada:

`60px – 68px`

Organizar:

- nome do módulo;
- ações rápidas;
- ajuda;
- tema;
- usuário;
- logout.

Não misturar informações operacionais com navegação.

---

# 12. Dashboard

Organizar o conteúdo usando grid responsivo.

Desktop:

```css
grid-template-columns: repeat(12, 1fr);
gap: 20px;
```

Cards KPI:

- mesma altura;
- mesmo raio;
- mesmo padding;
- ícone;
- título;
- valor;
- informação complementar;
- CTA quando necessário.

Evitar cards muito altos ou com espaço vazio.

---

# 13. Cards

Padrão:

```css
border-radius: 14px;
padding: 18px 20px;
```

Usar:

- borda sutil;
- sombra leve;
- contraste entre superfície e fundo.

Não utilizar glow em todos os cards.

Glow apenas para:

- foco;
- seleção;
- alerta relevante;
- elementos interativos especiais.

---

# 14. Hierarquia tipográfica

Sugestão:

```text
Título da página: 28–32 px / 700
Título de seção: 18–20 px / 600
Título de card: 14–16 px / 600
Valor KPI: 30–38 px / 700
Texto normal: 14 px / 400–500
Texto auxiliar: 12–13 px
```

Nunca usar textos importantes abaixo de 12 px.

---

# 15. Espaçamento

Adotar escala consistente:

```text
4
8
12
16
20
24
32
40
48
```

Evitar margens aleatórias.

---

# 16. Status e criticidade

Preservar semântica consistente:

- crítico → vermelho;
- alto → laranja;
- médio → amarelo;
- baixo → azul;
- sucesso → verde;
- informativo → azul/ciano.

As cores de status NÃO devem mudar de significado entre temas.

---

# 17. Iconografia

Utilizar uma única família de ícones.

Características:

- traço consistente;
- tamanho padronizado;
- leitura em 16–24 px;
- sem mistura visual entre outline, filled e 3D dentro da interface.

O ícone 3D SyngeTI deve ser usado somente como identidade da aplicação.

Ícones de menu devem permanecer simples.

---

# 18. Tela de login

Atualizar para utilizar:

1. ícone SyngeTI;
2. logotipo SyngeTI;
3. subtítulo “Sistema de Integração e Gestão de TI”;
4. campos de usuário e senha;
5. manter conectado;
6. recuperação de senha;
7. login Google se já estiver funcional.

O layout deve se adaptar automaticamente ao tema.

Não duplicar logos.

---

# 19. Responsividade

Garantir funcionamento mínimo em:

- 1920 px;
- 1440 px;
- 1366 px;
- 1280 px;
- 1024 px;
- tablet;
- mobile administrativo quando aplicável.

Cards devem reorganizar sem overflow horizontal.

Tabelas complexas podem possuir scroll horizontal controlado.

---

# 20. Acessibilidade

Meta mínima:

**WCAG AA**

Garantir:

- contraste;
- foco visível;
- navegação por teclado;
- labels corretos;
- aria-label em ações sem texto;
- estados hover/focus/disabled;
- não depender apenas de cor para transmitir status.

---

# 21. Persistência do tema

O usuário deve poder selecionar:

- Dark;
- Light;
- Tokyo Night;
- D'Lamb;
- Sistema.

Salvar preferência.

Prioridade sugerida:

1. preferência salva do usuário;
2. preferência do sistema operacional;
3. tema padrão definido pelo administrador.

---

# 22. Refatoração técnica

Antes de alterar qualquer tela:

1. identificar stack frontend;
2. mapear componentes compartilhados;
3. localizar cores hardcoded;
4. localizar tipografias;
5. localizar componentes duplicados;
6. identificar layout global.

Depois:

1. criar tokens;
2. criar provider de temas;
3. substituir hardcodes;
4. padronizar componentes;
5. atualizar branding;
6. melhorar responsividade;
7. validar acessibilidade.

---

# 23. Estrutura sugerida

Adaptar ao projeto existente.

Exemplo:

```text
src/
  branding/
    syngeti-logo.svg
    syngeti-logo-light.svg
    syngeti-logo-dark.svg
    syngeti-icon.svg
    syngeti-favicon.svg

  styles/
    tokens.css
    themes/
      dark.css
      light.css
      tokyo-night.css
      dlamb.css

  components/
    layout/
    ui/
    dashboard/
    branding/

  providers/
    ThemeProvider
```

Não alterar estrutura se o projeto possuir arquitetura consolidada.

---

# 24. Regra de segurança de implementação

O agente NÃO pode:

- apagar módulos;
- alterar banco;
- alterar API;
- alterar autenticação;
- alterar permissões;
- alterar regras de negócio;
- trocar nomes de campos usados pelo backend;
- quebrar rotas;
- remover funcionalidades existentes;
- substituir dados reais por mock.

Se uma melhoria visual exigir mudança funcional, sinalizar antes.

---

# 25. QA obrigatório

Testar:

- sidebar expandida;
- sidebar recolhida;
- dashboard;
- modais;
- tabelas;
- formulários;
- selects;
- inputs;
- login;
- Service Desk;
- CMDB;
- Estoque;
- Projetos;
- Contratos;
- Usuários;
- Connect Chat;
- Wiki TI;
- Sentinela IA;
- Configurações.

Testar todos nos cinco modos:

- Dark;
- Light;
- Tokyo Night;
- D'Lamb;
- Sistema.

---

# 26. Critérios de aceite

A implementação só estará concluída quando:

- não houver textos ilegíveis;
- não houver cores hardcoded incompatíveis;
- todos os temas funcionarem;
- branding estiver consistente;
- logo e ícone estiverem nítidos;
- layout estiver responsivo;
- não houver regressão funcional;
- contraste estiver adequado;
- componentes compartilharem o mesmo design system;
- o tema escolhido persistir após recarregar a aplicação.

---

# 27. Entrega do agente

Ao finalizar, apresentar:

## Arquivos modificados
Listar arquivos.

## Componentes criados
Listar componentes.

## Tokens criados
Informar paletas.

## Funcionalidades preservadas
Confirmar que lógica e integrações não foram alteradas.

## Testes realizados
Informar telas e temas testados.

## Pendências
Informar somente o que realmente não foi possível concluir.

---

# ORDEM DE EXECUÇÃO

Não tente redesenhar toda a plataforma em uma única alteração.

Executar nesta ordem:

1. Design tokens.
2. Theme Provider.
3. Logo e ícone.
4. Sidebar.
5. Header.
6. Dashboard.
7. Cards.
8. Tabelas e formulários.
9. Login.
10. Demais módulos.
11. Responsividade.
12. Auditoria visual final.

Após cada etapa, validar visualmente antes de prosseguir.

---

# PRINCÍPIO FINAL

A SyngeTI deve parecer uma plataforma empresarial madura de Gestão e Integração de TI.

Priorizar:

**legibilidade > efeitos**

**consistência > criatividade isolada**

**usabilidade > ornamentação**

**design system > CSS improvisado**

**fidelidade às marcas > experimentação visual**
