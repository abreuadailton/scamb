# 🌿 EcoPermuta — Rede Sustentável de Permutas

> **Do virtual ao presencial, trocas que fazem sentido.**

EcoPermuta é uma plataforma web que conecta pessoas que desejam trocar objetos sem envolvimento de dinheiro, unindo o poder do ambiente virtual com encontros presenciais em pontos seguros.

---

## 📋 Sobre o Projeto

**Tema:** Do Virtual ao Presencial  
**Conceito:** Usuários catalogam itens parados em casa (livros, jogos, ferramentas, mudas de plantas, roupas) para troca sem envolvimento de dinheiro, marcando a entrega em pontos físicos seguros (parques, estações de metrô, cafeterias parceiras ou eventos mensais).

**Como o virtual potencializa o presencial:** Elimina a frustração de ir a uma feira de trocas sem saber o que vai encontrar. O usuário já chega no encontro presencial com o "match" feito e o item reservado.

---

## ✨ Diferenciais Técnicos

### 🗺️ Integração com Mapas (Leaflet.js)
- Mapa interativo mostrando todos os pontos de troca seguros na cidade
- Itens disponíveis georreferenciados no mapa
- Leaflet.js gratuito e leve, sem custos de API

### 📍 Check-in por Geolocalização
- Sistema de check-in usando `navigator.geolocation` nativo do navegador
- Validação de proximidade (raio de 500 metros do ponto de encontro)
- Apenas quando ambos os usuários fazem check-in a troca é confirmada

### 📱 Geração de QR Code
- QR Code único gerado para cada troca aceita
- Contém dados criptografados: IDs, itens, participantes, timestamp
- Usado para validar a troca no encontro físico
- Gerado no backend com a biblioteca `qrcode`

---

## 🛠️ Stack Tecnológico

### Frontend
- HTML5 semântico
- CSS3 com variáveis e design responsivo
- JavaScript ES6+ (Vanilla)
- **Leaflet.js** — mapas interativos
- **QRCode.js** — renderização de QR Codes
- Font Awesome 6 — ícones

### Backend
- **Node.js** com **Express.js**
- **SQLite** (via better-sqlite3) — banco de dados leve e portátil
- **JWT** — autenticação stateless
- **bcryptjs** — hash seguro de senhas
- **qrcode** — geração de QR Codes
- **multer** — upload de imagens

---

## 📁 Estrutura do Projeto

```
ecopermuta/
├── backend/
│   ├── server.js              # Servidor principal Express
│   ├── package.json
│   ├── .env                   # Variáveis de ambiente
│   ├── db/
│   │   └── database.js        # Configuração SQLite + schema
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticação JWT
│   └── routes/
│       ├── auth.js            # Rotas de autenticação
│       ├── items.js           # CRUD de itens
│       ├── trades.js          # Sistema de trocas + QR Code + Check-in
│       ├── messages.js        # Chat entre usuários
│       └── exchangepoints.js  # Pontos de troca
└── frontend/
    ├── index.html             # Landing page
    ├── login.html             # Login
    ├── register.html          # Cadastro
    ├── dashboard.html         # Dashboard do usuário
    ├── catalog.html           # Catálogo de itens
    ├── item-detail.html       # Detalhe do item
    ├── my-items.html          # Gerenciar meus itens
    ├── trades.html            # Minhas trocas
    ├── chat.html              # Chat por troca
    ├── map.html               # Mapa de pontos de troca
    ├── profile.html           # Perfil do usuário
    └── css/
        └── style.css          # Estilos globais
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm

### Instalação

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

Acesse em: **http://localhost:3001**

### Desenvolvimento

```bash
npm run dev  # Com auto-reload (nodemon)
```

---

## 🔐 Sistema de Autenticação

- **Registro:** Email + senha (hash bcrypt) + perfil
- **Login:** JWT com expiração de 7 dias
- **Token:** Armazenado no `localStorage`, enviado no header `Authorization: Bearer <token>`
- **Rotas protegidas:** Itens (criar/editar/deletar), Trocas, Mensagens, Perfil

---

## 🔄 Fluxo de Uma Troca

```
1. Usuário A cataloga item X
2. Usuário B encontra item X no catálogo/mapa
3. B propõe troca: oferece item Y em troca de X
4. A recebe notificação e aceita/rejeita
5. Se aceito: QR Code é gerado para o trade
6. A e B combinam local/horário pelo chat interno
7. No dia: ambos fazem check-in por geolocalização
8. Sistema confirma que estão no local (<500m)
9. Troca concluída → reputação +1 para ambos
```

---

## 🌍 Pontos de Troca Cadastrados (SP)

| Ponto | Endereço |
|-------|----------|
| Parque Ibirapuera | Av. Pedro Álvares Cabral, Vila Mariana |
| Estação Sé | Praça da Sé, Centro |
| Livraria Cultura | Av. Paulista, 2073 |
| Parque Villa-Lobos | Av. Prof. Fonseca Rodrigues, 2001 |
| MASP | Av. Paulista, 1578 |

---

## 📊 Funcionalidades

| Funcionalidade | Status |
|----------------|--------|
| Cadastro/Login JWT | ✅ |
| CRUD de Itens | ✅ |
| Sistema de Trocas | ✅ |
| Chat Interno | ✅ |
| Mapa Leaflet.js | ✅ |
| Geolocalização Check-in | ✅ |
| Geração de QR Code | ✅ |
| Sistema de Reputação | ✅ |
| Design Responsivo | ✅ |

---

## 👥 Autores

Projeto desenvolvido para a disciplina de Desenvolvimento Web  
Tema: **Do Virtual ao Presencial**

---

## 📄 Licença

MIT License — livre para uso educacional.
