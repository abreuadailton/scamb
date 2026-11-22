# ⚡ Swaply — Rede Inteligente de Trocas: Do Virtual ao Presencial

> **"Troque de tudo: conecte no virtual, encontre no presencial."**

O **Swaply** é uma plataforma web completa desenvolvida com **Node.js, Express, SQLite nativo, HTML5, CSS3 moderno e Vanilla JavaScript**. Ela conecta pessoas para a troca direta de quaisquer objetos (games, livros, eletrônicos, instrumentos musicais, ferramentas, roupas, plantas e artigos para casa) sem envolver dinheiro, combinando a agilidade e conveniência do ambiente virtual com encontros seguros no mundo físico.

---

## 🎯 Tema e Proposta: "Do Virtual ao Presencial"

- **Tema:** *Do Virtual ao Presencial*
- **Fundamento conceitual:** O virtual não é o oposto do real — ele é um **potencializador**. Em feiras de troca tradicionais, as pessoas saem de casa sem saber se haverá alguém interessado no que levaram. No Swaply:
  1. O **match é realizado virtualmente**: o usuário encontra o item desejado, analisa fotos em alta resolução e o estado de conservação.
  2. O item é **reservado com garantia**, evitando deslocamentos inúteis.
  3. O chat interno permite alinhar o horário e escolher um ponto físico seguro pré-cadastrado.
  4. O encontro físico é **validado por tecnologia** (QR Code + GPS), criando um ciclo de reputação real.

---

## ✨ Os 3 Diferenciais Tecnológicos Obrigatórios

### 1. 🗺️ Integração com Mapas Interativos (Leaflet.js + OpenStreetMap)
- Mapeamento geográfico gratuito e leve dos pontos seguros homologados em São Paulo (MASP, Estação Sé, Conjunto Nacional / Livraria Cultura, Parque Ibirapuera, Parque Villa-Lobos).
- Marcador estilizado de **Pontos Seguros** (`<div class="spot-marker-pin">`) com popups contendo foto, endereço, horários de funcionamento e itens próximos.
- Marcador animado de **"Você está aqui!"** (`<div class="user-marker-pin">`) com pulso de radar.
- **Interatividade instantânea:** ao clicar em qualquer local do mapa, o indicador "Você está aqui" se desloca e a distância real até o ponto de troca mais próximo é calculada e informada em tempo real.

### 2. 📱 Passaporte Digital com QR Code de Autenticação
- Toda troca aceita gera automaticamente um **Voucher / Passaporte Digital com QR Code** criptografado com hash de segurança (`SWAP-0001-...`).
- No encontro presencial, a parte que entrega o item apresenta o QR Code e o destinatário pode validar a retirada.
- Botão **"Validar / Simular Leitura do QR Code"** que consome a API `POST /api/trades/:id/validate-qr`, autentica a transação presencial, conclui a troca e credita **+10 pontos de reputação** para ambos os participantes.

### 3. 📍 Check-in por Geolocalização Real (`navigator.geolocation`)
- Utiliza a API nativa do navegador para capturar as coordenadas de latitude/longitude do usuário.
- O backend calcula a distância física exata até o ponto de encontro seguro utilizando a **Fórmula de Haversine**.
- Valida tolerância de proximidade de até **500 metros** do local acordado.
- Somente quando ambos atestam presença física, a troca é formalizada.

---

## ⭐ Sistema de Reputação, Avaliações e Notas (Reviews)

- Pontuação cumulativa de reputação exibida no perfil e nos anúncios.
- Média geral de notas (ex: `5.0 ★★★★★`) e gráfico de distribuição por estrelas (5★, 4★, 3★...).
- **Depoimentos e comentários detalhados** de outros membros com selo *"Troca Presencial Verificada"*.
- Modal interativo para registrar novas avaliações com seleção de estrelas (1 a 5) e comentário em texto (`POST /api/reviews`).

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologias Utilizadas |
|---|---|
| **Front-end** | HTML5 Semântico, CSS3 Moderno (Design Tokens, Glassmorphism, paleta Electric Indigo, Violet & Coral), Tipografia Google Fonts (Outfit & Plus Jakarta Sans), Vanilla JavaScript (ES6+), Leaflet.js, QRCode.js, Font Awesome 6 |
| **Back-end** | Node.js, Express.js REST API JSON, Multer (upload local de fotos de itens e avatares), QRCode generator |
| **Banco de Dados** | SQLite nativo via `node:sqlite` (`DatabaseSync`), sem necessidade de compiladores externos de C++ |
| **Autenticação & Segurança** | JWT (JSON Web Tokens) stateless, Bcrypt.js (hash de senhas), middleware `authMiddleware` em todas as rotas privadas |

---

## 👥 Contas de Demonstração (Prontas com 1 Clique)

Na tela de login (`login.html`), botões de atalho preenchem as credenciais de teste automaticamente:

| Nome | E-mail | Senha | Reputação | Especialidade de Troca |
|---|---|---|---|---|
| **Ana Silva** | `ana@swaply.com` | `senha123` | ⭐ 98 pts | Livros, Boxes de Colecionador, Decoração |
| **Carlos Oliveira** | `carlos@swaply.com` | `senha123` | ⭐ 92 pts | Board Games, Consoles, Games, Mochilas |
| **Mariana Costa** | `mariana@swaply.com` | `senha123` | ⭐ 95 pts | Botânica Urbana, Plantas Raras, Luminárias |
| **Lucas Ferreira** | `lucas@swaply.com` | `senha123` | ⭐ 89 pts | Ferramentas Bosch, Áudio, Violão Giannini |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18, 20 ou 24)
- NPM

### Passo a Passo

```bash
# 1. Acesse a pasta do backend
cd "Troca troca/backend"

# 2. Instale as dependências (caso seja a primeira execução)
npm install

# 3. Popule o banco com dados ricos e completos
npm run seed

# 4. Inicie o servidor
npm start
```

Acesse no navegador: **`http://localhost:3001`**.

---

## 📁 Estrutura de Arquivos

```
Troca troca/
├── backend/
│   ├── server.js               # Servidor Express & middleware de compatibilidade
│   ├── package.json
│   ├── db/
│   │   ├── database.js         # Configuração SQLite com node:sqlite nativo
│   │   └── seed.js             # Povoamento rico (16 itens, 4 usuários, reviews, trocas)
│   ├── middleware/
│   │   └── auth.js             # Verificação de tokens JWT
│   └── routes/
│       ├── auth.js             # Registro, login, me, upload de avatar
│       ├── items.js            # CRUD de itens e upload de fotos
│       ├── trades.js           # Propostas, aceitação, QR Code e check-in GPS
│       ├── reviews.js          # Listagem e cadastro de avaliações/notas
│       ├── messages.js         # Chat interno de negociação
│       └── exchangepoints.js   # Pontos seguros de São Paulo
└── frontend/
    ├── css/
    │   └── style.css           # Design tokens, Outfit/Plus Jakarta Sans, responsividade
    ├── img/
    │   ├── avatars/            # Uploads de fotos de perfil
    │   └── items/              # Uploads de fotos de itens
    ├── index.html              # Landing Page moderna com explicação completa do conceito
    ├── catalog.html            # Catálogo com filtros por categoria, busca e paginação
    ├── item-detail.html        # Detalhe do item, carrossel de fotos, mapa e modal de proposta
    ├── map.html                # Mapa Leaflet com Pontos Seguros e indicador "Você está aqui"
    ├── trades.html             # Painel de trocas, Passaporte QR Code e Check-in GPS
    ├── chat.html               # Chat com chips de ação rápida, proposta de ponto seguro e WhatsApp
    ├── profile.html            # Perfil com avaliações, notas comunitárias e upload de avatar
    ├── dashboard.html          # Métricas e atalhos rápidos
    ├── login.html              # Login com botões de preenchimento rápido
    └── register.html           # Cadastro de novos usuários
```

---

## 👨‍💻 Autores
Feito com ❤️ por **Felipe e Adailton**.

---

## 📄 Licença
Projeto acadêmico desenvolvido para a disciplina de Desenvolvimento Web: *Do Virtual ao Presencial*.  
Licença MIT.
