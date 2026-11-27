# Scamb — resumo técnico

## O que é

Sistema web de trocas de objetos entre pessoas. O diferencial é ligar o **virtual** (anúncio, proposta, chat) ao **presencial** (encontro em ponto seguro, validado por QR Code ou GPS).

## Tecnologias

| Camada | Tecnologia | Para quê |
|---|---|---|
| Servidor | **Node.js** + **Express** | API REST e entrega das páginas |
| Banco de dados | **SQLite** (`node:sqlite`, embutido no Node 22.5+) | Um único arquivo, sem instalação |
| Autenticação | **JWT** (`jsonwebtoken`) + **bcryptjs** | Login por token e senha com hash |
| Upload | **Multer** | Fotos dos itens e avatar |
| QR Code | **qrcode** (servidor) e **QRCode.js** (navegador) | Passaporte de troca |
| Tempo real | **Server-Sent Events** | Feed de atividade do catálogo |
| Interface | **HTML5**, **CSS3**, **JavaScript puro** | Sem framework nem etapa de build |
| Mapa | **Leaflet** + **OpenStreetMap** | Pontos seguros e localização dos itens |
| Ícones | **Font Awesome** | Ícones da interface |
| Testes | `node:test` (nativo) | Teste do fluxo completo da API |

As bibliotecas do navegador ficam em `frontend/vendor/`, então o site abre sem depender de CDN.

## Arquitetura

```
Navegador (HTML/CSS/JS)  ──fetch + token JWT──▶  Express (/api/...)  ──SQL──▶  SQLite (scamb.db)
```

Um único processo Node serve as páginas de `frontend/` e a API em `/api`.

## Principais partes do código

### Backend (`backend/`)

| Arquivo | Responsabilidade |
|---|---|
| `server.js` | Configura o Express, registra as rotas, serve o frontend e popula o banco na primeira execução |
| `db/database.js` | Abre o SQLite, cria as tabelas e cadastra os pontos seguros |
| `db/seed.js`, `db/extraItems.js` | Dados de demonstração (usuários, itens, trocas, mensagens, avaliações) |
| `middleware/auth.js` | Valida o token JWT e identifica o usuário nas rotas protegidas |
| `routes/auth.js` | Cadastro, login, perfil e avatar |
| `routes/items.js` | CRUD de itens, busca/filtros e upload de fotos |
| `routes/trades.js` | **Coração do sistema**: proposta, aceite, recusa, cancelamento, QR Code e check-in |
| `routes/messages.js` | Chat de cada troca |
| `routes/reviews.js` | Avaliações e reputação |
| `routes/exchangepoints.js` | Pontos seguros de encontro |
| `routes/activity.js`, `services/activityBus.js` | Feed de atividade em tempo real (SSE) |
| `test/api.test.js` | Teste automatizado: login → proposta → aceite → QR → check-in → avaliação |

### Banco de dados

Seis tabelas: `users`, `items`, `exchange_points`, `trades`, `messages`, `ratings`.
A tabela `trades` liga dois itens, dois usuários e um ponto de encontro, e guarda o status e os check-ins.

### Frontend (`frontend/`)

| Página | Função |
|---|---|
| `index.html` | Página inicial |
| `catalog.html` + `js/marketplace.js` | Catálogo com busca, filtros e feed de atividade |
| `item-detail.html` | Detalhe do item e formulário de proposta |
| `map.html` | Mapa dos pontos seguros |
| `login.html`, `register.html` | Acesso |
| `dashboard.html` | Painel do usuário |
| `my-items.html` | Cadastro e edição dos próprios itens |
| `trades.html` | Propostas, QR Code e check-in |
| `chat.html` | Conversa da troca |
| `profile.html` | Perfil, reputação e avaliações |

Estilos em `css/style.css` e `css/marketplace.css`. O token do login fica no `localStorage` e vai no cabeçalho `Authorization` de cada chamada.

## Regras de negócio mais importantes

**Ciclo de uma troca** (`routes/trades.js`):

```
pending ──aceite──▶ accepted ──2 check-ins ou QR──▶ completed
   │                   │
   └── recusa/cancelamento ──▶ rejected / cancelled
```

- Só o dono do item desejado pode aceitar ou recusar.
- Não é possível propor com item já trocado nem repetir uma proposta ativa.
- Ao concluir, os dois itens viram `traded`, os dois usuários ganham reputação e outras propostas com esses itens são canceladas — tudo em uma transação.

**Check-in por GPS:** o servidor calcula a distância entre o usuário e o ponto de encontro pela **fórmula de Haversine** e só aceita se for menor que **500 m**. A troca é concluída quando os dois fazem check-in.

**QR Code:** cada troca aceita gera um código único; validá-lo no encontro também conclui a troca.

**Avaliação:** só entre participantes de uma troca concluída, uma vez por troca. Notas 4–5 dão +10 de reputação; as demais, +5.

## Principais rotas da API

| Método e rota | Descrição |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Cadastro e login |
| `GET /api/items`, `GET /api/items/:id` | Catálogo (público) |
| `POST/PUT/DELETE /api/items` | Gerenciar os próprios itens |
| `POST /api/trades` | Propor troca |
| `PUT /api/trades/:id/accept` · `reject` · `cancel` | Responder à proposta |
| `GET /api/trades/:id/qrcode`, `POST /api/trades/:id/validate-qr` | QR Code |
| `POST /api/trades/:id/checkin` | Check-in por GPS |
| `GET/POST /api/messages/trade/:tradeId` | Chat |
| `POST /api/reviews` | Avaliar |
| `GET /api/exchange-points` | Pontos seguros |

## Limitações do MVP

- Chat por consulta periódica (a cada 3 s), não por WebSocket.
- O mapa e as rotas dependem de internet (OpenStreetMap).
- SQLite e segredo JWT padrão servem para demonstração; em produção usar um banco gerenciado e definir `JWT_SECRET` (ver `backend/.env.example`).
