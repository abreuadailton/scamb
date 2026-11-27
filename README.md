# Scamb — trocas do virtual ao presencial

Plataforma web de escambo moderno: as pessoas anunciam objetos, propõem trocas (sem dinheiro), combinam pelo chat e concluem a troca **presencialmente** em um ponto seguro, validando o encontro por **QR Code** ou **check-in por GPS**.

MVP desenvolvido como trabalho de faculdade por Felipe Gomes e José Adailton.

> Resumo das tecnologias e das principais partes do código: [RESUMO.md](RESUMO.md)

## Como rodar localmente

**Pré-requisito:** [Node.js](https://nodejs.org) **22.13 ou superior** (recomendado: 24 LTS). Confira com `node -v`.
Não é preciso instalar banco de dados: o SQLite já vem embutido no Node.

```bash
git clone https://github.com/abreuadailton/scamb.git
cd scamb
npm install
npm start
```

Abra **http://localhost:3001** no navegador.

Na primeira execução o banco (`backend/scamb.db`) é criado e preenchido sozinho com os dados de demonstração.

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o site e a API em `http://localhost:3001` |
| `npm run seed` | Apaga tudo e restaura os dados de demonstração (use antes da apresentação) |
| `npm test` | Roda os testes automatizados do fluxo de troca |

Para usar outra porta: `PORT=4000 npm start` (no PowerShell: `$env:PORT=4000; npm start`).

### Contas de demonstração

Senha de todas: `senha123`

| Usuário | E-mail |
|---|---|
| Ana | `ana@scamb.com` |
| Carlos | `carlos@scamb.com` |
| Mariana | `mariana@scamb.com` |
| Lucas | `lucas@scamb.com` |

## Publicar na internet (deploy)

O repositório já traz o arquivo `render.yaml`, que configura um serviço gratuito no [Render](https://render.com).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/abreuadailton/scamb)

1. Clique no botão acima e entre no Render com a conta do GitHub.
2. Confirme em **Deploy Blueprint** (não é preciso preencher nada).
3. Aguarde o build (2 a 3 minutos) e abra o endereço `https://scamb-....onrender.com` exibido no painel.

A cada `git push` no branch `main` o Render publica a nova versão sozinho.

Limites do plano gratuito:

- O serviço "dorme" após 15 minutos sem acesso; o primeiro acesso seguinte demora cerca de 1 minuto. **Abra o site alguns minutos antes de apresentar.**
- O disco não é persistente: a cada reinício o banco volta aos dados de demonstração e itens/fotos cadastrados são perdidos.

## Roteiro sugerido para a apresentação

Dica: use duas janelas (uma normal e uma anônima) para ficar logado com dois usuários ao mesmo tempo.

1. **Página inicial e catálogo** — mostre a busca e os filtros por categoria, sem login.
2. **Pontos seguros** — mapa com os locais públicos sugeridos para o encontro.
3. **Login como Lucas** — abra um item da Mariana e clique em **Propor Troca**: escolha um item seu, o ponto de encontro e a data.
4. **Login como Mariana** (janela anônima) — em **Trocas → Propostas recebidas**, aceite a proposta.
5. **Chat** — troque mensagens entre os dois pelo **Abrir Chat Interno**.
6. **QR Code** — na aba **Ativas**, abra o passaporte de troca com o QR Code.
7. **Check-in por GPS** — clique em check-in com cada usuário. Como vocês não estarão no ponto de encontro, o sistema avisa a distância e oferece **simular o check-in** (modo demonstração). Após os dois check-ins a troca é concluída.
8. **Avaliação** — na aba **Concluídas**, clique em **Avaliar** e veja a reputação subir no perfil.
9. **Meus itens** — cadastre um item novo com foto.

Antes de apresentar de novo, rode `npm run seed` para voltar ao estado inicial.

## Problemas comuns

| Sintoma | Solução |
|---|---|
| Erro citando `node:sqlite` ao iniciar | Node antigo. Instale o Node 22.13+ |
| `EADDRINUSE` / porta 3001 em uso | Feche o outro processo ou rode em outra porta com `PORT=4000` |
| Mapa aparece cinza | O mapa usa imagens do OpenStreetMap e precisa de internet; o resto do sistema funciona offline |
| Dados bagunçados após testes | `npm run seed` |

## Estrutura

```
scamb/
├── backend/     API REST (Express) + banco SQLite + testes
├── frontend/    Páginas HTML, CSS e JavaScript (servidas pelo próprio backend)
├── RESUMO.md    Tecnologias e principais partes do código
└── package.json Atalhos: npm install / start / seed / test
```
