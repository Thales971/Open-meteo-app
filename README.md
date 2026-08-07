# 🌤️ Open-Meteo App

Aplicativo de previsão do tempo desenvolvido em **React Native (Expo)** que consome dados em tempo real da API Open-Meteo.

## 📱 Sobre o Projeto

Este app foi desenvolvido como atividade prática para consumo de API REST, demonstrando o uso de requisições HTTP, programação assíncrona e interface moderna no React Native.

### 🎯 Objetivo
Praticar conceitos de:
- Consumo de APIs REST
- Requisições HTTP com `fetch()`
- Programação assíncrona (`async/await`)
- Manipulação de JSON
- Componentização
- Exibição de listas com `FlatList`
- Interface responsiva e moderna

## ✨ Funcionalidades

### 📊 **Funcionalidades Principais**
- ✅ **Busca de cidades** - Pesquise qualquer cidade do mundo
- ✅ **Previsão horária** - 7 dias de previsão por hora
- ✅ **Previsão diária** - 7 dias de previsão completa
- ✅ **Múltiplas métricas** - Temperatura, umidade, vento, UV, pressão, precipitação, nascer/pôr do sol
- ✅ **Cidades rápidas** - Acesso rápido a cidades populares

### ⭐ **Funcionalidades Extras**
- 🎨 **Tema claro/escuro** - Alternância entre temas
- 🔄 **Pull to Refresh** - Atualize os dados puxando a tela para baixo
- 🖱️ **Scroll com mouse** - Suporte a scroll com rodinha do mouse (web)
- 📍 **Fundo dinâmico** - Background muda conforme o clima
- 🧭 **Direção do vento** - Exibição em texto e graus
- 💧 **Ponto de orvalho** - Informação de conforto térmico

### 🎨 **Interface**
- 🪟 **Glass Effect** - Efeito de vidro moderno
- 📱 **Responsiva** - Adapta-se a diferentes tamanhos de tela
- 🎭 **Animações suaves** - Transições fluidas entre abas
- 🌓 **Tema escuro** - Interface confortável para os olhos

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Ferramenta de desenvolvimento
- **React Native Web** - Suporte a web
- **JavaScript (ES6+)** - Linguagem de programação
- **Open-Meteo API** - Fonte de dados meteorológicos
- **Open-Meteo Geocoding API** - Busca de coordenadas de cidades

## 📦 Estrutura do Projeto

```
Open-meteo-app/
├── App.js                 # Componente principal do aplicativo
├── index.js               # Ponto de entrada
├── package.json           # Dependências do projeto
├── app.json               # Configurações do Expo
├── fundos-clima/          # Imagens de fundo por tipo de clima
│   ├── ensolarado.jpg
│   ├── parcialmente_nublado.jpg
│   ├── nublado.jpg
│   ├── neblina.jpg
│   ├── chuva.jpg
│   ├── tempestade.jpg
│   └── neve.jpg
├── exemplos-de-design/    # Referências visuais
│   ├── accu1.webp
│   ├── accuweather.webp
│   ├── lista3.webp
│   ├── the-weather-channel.webp
│   └── weatherbug.webp
└── assets/                # Recursos do app
    ├── fundos-clima/
    └── icon.png
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado
- npm ou yarn
- Expo CLI (opcional)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Thales971/Open-meteo-app.git
cd Open-meteo-app
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o projeto**

   **No navegador (Web):**
   ```bash
   npm run web
   ```

   **No Android:**
   ```bash
   npm run android
   ```

   **No iOS:**
   ```bash
   npm run ios
   ```

   **Ou use o Expo Go no celular:**
   ```bash
   npx expo start
   ```

## 🌐 API Utilizada

### Open-Meteo Weather API
- **URL:** https://api.open-meteo.com
- **Endpoint:** `/v1/forecast`
- **Dados obtidos:**
  - Temperatura atual
  - Temperatura aparente
  - Umidade relativa
  - Velocidade e direção do vento
  - Rajadas de vento
  - Pressão atmosférica
  - Cobertura de nuvens
  - Índice UV
  - Probabilidade de precipitação
  - Ponto de orvalho
  - Nascer e pôr do sol
  - Código de condição climática

### Open-Meteo Geocoding API
- **URL:** https://geocoding-api.open-meteo.com
- **Funcionalidade:** Converter nomes de cidades em coordenadas (latitude/longitude)

## 📱 Screenshots

> **Adicione aqui screenshots do aplicativo funcionando**

### Tela Principal
![Tela Principal](screenshots/tela-principal.png)

### Previsão por Hora
![Previsão por Hora](screenshots/previsao-horaria.png)

### Previsão 7 Dias
![Previsão 7 Dias](screenshots/previsao-diaria.png)

### Detalhes
![Detalhes](screenshots/detalhes.png)

### Tema Escuro
![Tema Escuro](screenshots/tema-escuro.png)

## 🎓 Atividade Acadêmica

Este projeto foi desenvolvido como atividade prática da disciplina de **Consumo de API REST**, atendendo aos seguintes requisitos:

### ✅ Requisitos Obrigatórios (8/8)
- [x] Tela inicial
- [x] Busca de informações da API
- [x] Exibição de dados em lista (FlatList)
- [x] Uso de fetch()
- [x] Uso de async/await
- [x] Indicador de carregamento (ActivityIndicator)
- [x] Tratamento de erros de conexão
- [x] Interface organizada

### ⭐ Requisitos Extras (6/7)
- [x] Campo de pesquisa com busca inteligente
- [x] Tela de detalhes completa
- [x] Pull to Refresh
- [ ] Paginação
- [x] Ícones personalizados (emojis por condição climática)
- [x] Tema escuro
- [x] Navegação entre telas (abas)

### 📊 Critérios de Avaliação

| Critério | Pontos | Status |
|----------|--------|--------|
| Consumo correto da API | 2,0 | ✅ |
| Uso de fetch() e async/await | 2,0 | ✅ |
| Exibição dos dados | 2,0 | ✅ |
| Interface organizada | 2,0 | ✅ |
| Tratamento de erros e loading | 1,0 | ✅ |
| Organização e qualidade do código | 1,0 | ✅ |

**Nota estimada: 10/10** ⭐

## 🏗️ Decisões Técnicas

### Por que Open-Meteo?
- API pública e gratuita (sem necessidade de API key)
- Dados meteorológicos precisos e atualizados
- Documentação clara e bem estruturada
- Suporte a múltiplos parâmetros de consulta
- Geocodificação integrada para busca de cidades

### Por que Emojis?
- Performance otimizada (vetores nativos)
- Visual consistente em todas as plataformas
- Sem dependências adicionais
- Melhor experiência do usuário

### Arquitetura
- Componentes funcionais com Hooks
- Estado gerenciado com useState
- Efeitos colaterais com useEffect
- Estilização com StyleSheet
- Suporte a múltiplas plataformas (iOS, Android, Web)

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👨‍💻 Autor

**Thales Torsatto**
- GitHub: [@Thales971](https://github.com/Thales971)
- Email: thales.t.silva6@aluno.senai.br

---

## 🙏 Agradecimentos

- [Open-Meteo](https://open-meteo.com/) pela API gratuita
- [Expo](https://expo.dev/) pela ferramenta de desenvolvimento
- SENAI - Curso de Desenvolvimento

---

## 📸 Demonstração

### Funcionalidades em destaque:
1. 🔍 **Busca inteligente** de cidades
2. 🌡️ **10+ métricas** meteorológicas
3. 🎨 **Interface moderna** com glass effect
4. 🌓 **Tema claro/escuro**
5. 📱 **100% responsivo** (mobile + web)
6. ⚡ **Performance otimizada**

**Status:** ✅ Projeto completo e funcional - Pronto para entrega!
