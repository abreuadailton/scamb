'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');
const QRCode = require('qrcode');

async function seed() {
  console.log('🚀 Iniciando seed completo e enriquecido para Swaply...');

  // Limpa tabelas existentes
  db.exec(`
    DELETE FROM ratings;
    DELETE FROM messages;
    DELETE FROM trades;
    DELETE FROM items;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('senha123', 10);

  // 1. Cadastra Usuários de Demonstração
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, bio, avatar_url, reputation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const demoUsers = [
    {
      name: 'Ana Silva',
      email: 'ana@swaply.com',
      bio: 'Apaixonada por leitura, literatura clássica, café e design. Troco livros já lidos, itens de decoração e café por novas descobertas!',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      reputation: 98
    },
    {
      name: 'Carlos Oliveira',
      email: 'carlos@swaply.com',
      bio: 'Gamer, fã de tecnologia, colecionador de board games e gadgets. Acredito que objeto parado na estante deve circular!',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      reputation: 92
    },
    {
      name: 'Mariana Costa',
      email: 'mariana@swaply.com',
      bio: 'Arquiteta e entusiasta de botânica urbana. Troco plantas, peças de decoração modernistas e livros técnicos.',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      reputation: 95
    },
    {
      name: 'Lucas Ferreira',
      email: 'lucas@swaply.com',
      bio: 'Músico, marceneiro e criador de conteúdo DIY. Tenho instrumentos, pedais de efeito e ferramentas que procuro trocar por equipamentos de áudio.',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      reputation: 89
    },
    // Compatibilidade com login antigo caso o usuário digite @ecotroca.com
    {
      name: 'Ana Silva (Eco)',
      email: 'ana@ecotroca.com',
      bio: 'Conta de acesso complementar.',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      reputation: 98
    },
    {
      name: 'Carlos Oliveira (Eco)',
      email: 'carlos@ecotroca.com',
      bio: 'Conta de acesso complementar.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      reputation: 92
    }
  ];

  const userIds = [];
  for (const u of demoUsers) {
    const res = insertUser.run(u.name, u.email, passwordHash, u.bio, u.avatar_url, u.reputation);
    userIds.push(res.lastInsertRowid);
  }

  // 2. Cadastra Itens de Demonstração Ricos no Catálogo (Troque de Tudo)
  const insertItem = db.prepare(`
    INSERT INTO items (user_id, title, description, category, condition, images, status, latitude, longitude, location_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const items = [
    // --- LIVROS & HQS ---
    {
      user_id: userIds[0], // Ana
      title: 'Box Colecionador: O Senhor dos Anéis (3 Volumes + Mapa)',
      description: 'Trilogia completa de J.R.R. Tolkien em edição especial de capa dura com mapas dobráveis e ilustrações coloridas de Alan Lee. Lido apenas uma vez, estado de colecionador impecável.',
      category: 'Livros',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'MASP / Av. Paulista'
    },
    {
      user_id: userIds[0], // Ana
      title: 'Graphic Novel: Sandman - Edição Definitiva Vol. 1',
      description: 'Edição de luxo da obra-prima de Neil Gaiman pela Vertigo/DC. Capa em couro sintético com sobrecapa transparente. Item raro para fãs de quadrinhos e fantasia.',
      category: 'Livros',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5587,
      longitude: -46.6601,
      location_name: 'Conjunto Nacional / Livraria Cultura'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Kindle Paperwhite 11ª Geração (8GB, Tela 6.8")',
      description: 'E-reader Amazon com iluminação ajustável quente/fria, resistência à água IPX8 e bateria com semanas de duração. Acompanha capa magnética anti-impacto preta.',
      category: 'Eletrônicos',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5505,
      longitude: -46.6333,
      location_name: 'Estação Sé'
    },

    // --- GAMES & CONSOLES ---
    {
      user_id: userIds[1], // Carlos
      title: 'Jogo de Tabuleiro Moderno: Catan (Edição Clássica)',
      description: 'Jogo completo com todas as 19 peças de terreno hexagonais, 95 cartas de recurso, estradas e cidades intactas. Perfeito para noites de jogos com família e amigos.',
      category: 'Jogos',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'MASP / Av. Paulista'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Controle Sem Fio Xbox Wireless Controller Carbon Black',
      description: 'Controle original Microsoft compatível com Xbox Series X/S, Xbox One, PC e Smartphones via Bluetooth. Pouquíssimo uso, botões e analógicos calibrados.',
      category: 'Jogos',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5505,
      longitude: -46.6333,
      location_name: 'Estação Sé'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Jogo Nintendo Switch: The Legend of Zelda Breath of the Wild',
      description: 'Mídia física original europeia/americana para Nintendo Switch com encarte e caixa originais em perfeito estado. Um dos maiores jogos da história.',
      category: 'Jogos',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5489,
      longitude: -46.7233,
      location_name: 'Parque Villa-Lobos'
    },

    // --- ÁUDIO & INSTRUMENTOS ---
    {
      user_id: userIds[3], // Lucas
      title: 'Fone de Ouvido Bluetooth Sony WH-CH720N Noise-Cancelling',
      description: 'Headphone supra-auricular com cancelamento ativo de ruído, som espacial, multiponto para 2 aparelhos simultâneos e bateria para até 35 horas. Acompanha cabo P2 e bag.',
      category: 'Eletrônicos',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5874,
      longitude: -46.6576,
      location_name: 'Parque Ibirapuera'
    },
    {
      user_id: userIds[3], // Lucas
      title: 'Violão Acústico Giannini Start Aço Tampo Natural',
      description: 'Violão clássico folk acústico, cordas D’Addario 0.10 recém trocadas, braço regulado e macio. Acompanha capa acolchoada e palhetas variadas.',
      category: 'Outros',
      condition: 'Bom',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5874,
      longitude: -46.6576,
      location_name: 'Parque Ibirapuera'
    },

    // --- FERRAMENTAS & DIY ---
    {
      user_id: userIds[3], // Lucas
      title: 'Parafusadeira e Furadeira de Impacto Bosch GSB 12V-30 Brushless',
      description: 'Motor sem escovas de carvão, luz LED integrada, 2 baterias de lítio de 2.0Ah, carregador bivolt rápido e maleta rígida original. Excelente para montagens e manutenções residenciais.',
      category: 'Ferramentas',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'MASP / Av. Paulista'
    },
    {
      user_id: userIds[3], // Lucas
      title: 'Maleta de Ferramentas Manuais Profissionais 110 Peças',
      description: 'Jogo completo de catracas, soquetes, bits torx/philips, alicate universal, chave inglesa e martelo de fibra. Aço cromo-vanádio de alta durabilidade.',
      category: 'Ferramentas',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5489,
      longitude: -46.7233,
      location_name: 'Parque Villa-Lobos'
    },

    // --- CASA & DECORAÇÃO ---
    {
      user_id: userIds[0], // Ana
      title: 'Cafeteira Prensa Francesa Bialetti Smart 1 Litro',
      description: 'Corpo em vidro borossilicato resistente a altas temperaturas, estrutura em aço inox escovado e filtro de malha fina que dispensa filtro de papel. Extrai café encorpado e aromático.',
      category: 'Outros',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5587,
      longitude: -46.6601,
      location_name: 'Conjunto Nacional / Livraria Cultura'
    },
    {
      user_id: userIds[2], // Mariana
      title: 'Luminária Articulada Minimalista Estilo Pixar (Preto Fosco)',
      description: 'Luminária de mesa em metal fosco com braço flexível e mola de tensão, base pesada antiderrapante e soquete E27. Acompanha lâmpada de filamento LED vintage luz quente.',
      category: 'Outros',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5874,
      longitude: -46.6576,
      location_name: 'Parque Ibirapuera'
    },

    // --- PLANTAS & JARDIM ---
    {
      user_id: userIds[2], // Mariana
      title: 'Muda Grande de Costela-de-Adão (Monstera Deliciosa)',
      description: 'Planta ornamental exuberante com folhas recortadas de mais de 40cm, enraizada em vaso cerâmico esmaltado terracota com substrato aerado premium rico em perlita.',
      category: 'Plantas',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5874,
      longitude: -46.6576,
      location_name: 'Parque Ibirapuera'
    },
    {
      user_id: userIds[2], // Mariana
      title: 'Coleção de 6 Suculentas Raras em Vasos de Cimento Geométrico',
      description: 'Echeveria Laui, Haworthia Cooperi, Sedum Burrito e outras variedades bem desenvolvidas e adaptadas a meia-sombra. Ideais para escritórios e varandas.',
      category: 'Plantas',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5489,
      longitude: -46.7233,
      location_name: 'Parque Villa-Lobos'
    },

    // --- MODA & ACESSÓRIOS ---
    {
      user_id: userIds[0], // Ana
      title: 'Jaqueta Jeans Oversized Vintage Customizada (Tamanho M/G)',
      description: 'Jeans 100% algodão pesado com lavagem stonewash retrô, detalhes de desfiado artesanal e botões em metal envelhecido. Peça atemporal e unissex.',
      category: 'Roupas',
      condition: 'Ótimo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'MASP / Av. Paulista'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Mochila Impermeável Antifurto Urbana para Notebook 15.6"',
      description: 'Tecido Oxford impermeável com porta USB externa para carregador portátil, compartimento oculto nas costas e alça ergonômica acolchoada. Ideal para quem usa metrô.',
      category: 'Roupas',
      condition: 'Novo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'
      ]),
      status: 'available',
      latitude: -23.5505,
      longitude: -46.6333,
      location_name: 'Estação Sé'
    }
  ];

  const itemIds = [];
  for (const it of items) {
    const res = insertItem.run(
      it.user_id, it.title, it.description, it.category, it.condition,
      it.images, it.status, it.latitude, it.longitude, it.location_name
    );
    itemIds.push(res.lastInsertRowid);
  }

  // 3. Cadastra Trocas de Exemplo (Uma Aceita e Uma Concluída)
  const insertTrade = db.prepare(`
    INSERT INTO trades (
      requester_id, owner_id, item_offered_id, item_wanted_id,
      status, qr_code, checkin_requester, checkin_owner,
      meeting_point_id, meeting_lat, meeting_lng, meeting_address, meeting_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Troca 1: Aceita com QR Code gerado para MASP
  const tradePayload1 = {
    swaply_trade_id: 1,
    requester: 'Carlos Oliveira',
    owner: 'Ana Silva',
    itemOffered: 'Jogo de Tabuleiro Moderno: Catan (Edição Clássica)',
    itemWanted: 'Box Colecionador: O Senhor dos Anéis (3 Volumes + Mapa)',
    location: 'MASP - Av. Paulista, 1578',
    auth_code: 'SWAP-0001-21',
    timestamp: new Date().toISOString()
  };

  const qrDataUrl1 = await QRCode.toDataURL(JSON.stringify(tradePayload1), {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#4f46e5', light: '#ffffff' },
    width: 320
  });

  const tradeRes1 = insertTrade.run(
    userIds[1], userIds[0], itemIds[3], itemIds[0],
    'accepted', qrDataUrl1, 0, 0,
    5, -23.5614, -46.6560, 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', '2026-11-26 15:30'
  );
  const tradeId1 = tradeRes1.lastInsertRowid;

  // Troca 2: Concluída com Sucesso no Ibirapuera
  const tradeRes2 = insertTrade.run(
    userIds[2], userIds[0], itemIds[12], itemIds[1],
    'completed', qrDataUrl1, 1, 1,
    1, -23.5874, -46.6576, 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP', '2026-11-20 11:00'
  );
  const tradeId2 = tradeRes2.lastInsertRowid;

  // 4. Mensagens de Demonstração no Chat da Troca 1
  const insertMessage = db.prepare(`
    INSERT INTO messages (trade_id, sender_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `);

  insertMessage.run(tradeId1, userIds[1], 'Olá Ana! Vi sua edição de O Senhor dos Anéis, sou apaixonado pela obra do Tolkien!', '2026-11-22 14:00:00');
  insertMessage.run(tradeId1, userIds[0], 'Oi Carlos! Adorei a proposta pelo Catan, jogo sensacional para reunir amigos no fim de semana.', '2026-11-22 14:15:00');
  insertMessage.run(tradeId1, userIds[1], 'Perfeito! Vamos nos encontrar no vão livre do MASP na quinta-feira às 15:30?', '2026-11-22 14:20:00');
  insertMessage.run(tradeId1, userIds[0], 'Combinadíssimo! Quando chegarmos lá fazemos o check-in por GPS no Swaply e validamos com o QR Code. Até lá!', '2026-11-22 14:30:00');

  // 5. Avaliações e Notas Reais (Ratings & Reviews com Comentários)
  const insertRating = db.prepare(`
    INSERT INTO ratings (trade_id, rater_id, rated_id, score, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Avaliações para Ana (User 0)
  insertRating.run(tradeId2, userIds[2], userIds[0], 5, 'A troca no Parque Ibirapuera foi impecável! A Ana foi super pontual, atenciosa e o livro estava exatamente como descrito nas fotos. O QR code autenticou na hora!', '2026-11-20 12:30:00');
  insertRating.run(null, userIds[1], userIds[0], 5, 'Super confiável! Já combinamos várias trocas pelo Swaply. Comunicação rápida no chat e itens de altíssima qualidade.', '2026-11-15 16:45:00');
  insertRating.run(null, userIds[3], userIds[0], 5, 'Experiência fantástica. Marcamos no Conjunto Nacional e validamos a entrega em menos de dois minutos. Recomendo de olhos fechados!', '2026-11-10 18:20:00');

  // Avaliações para Carlos (User 1)
  insertRating.run(null, userIds[0], userIds[1], 5, 'O Carlos é super gente boa! O jogo estava completinho, todas as peças e cartas em sleeves plásticos protetores. Valeu demais!', '2026-11-18 17:10:00');
  insertRating.run(null, userIds[3], userIds[1], 5, 'Troca tranquila na Estação Sé. Pontualidade britânica e ótimo papo sobre board games e tecnologia.', '2026-11-12 14:00:00');
  insertRating.run(null, userIds[2], userIds[1], 4, 'Troca muito rápida e segura. Recomendo o Carlos para qualquer pessoa na comunidade Swaply.', '2026-11-05 10:15:00');

  // Avaliações para Mariana (User 2)
  insertRating.run(null, userIds[0], userIds[2], 5, 'A muda de Costela-de-Adão da Mariana é a coisa mais linda da minha sala! Veio saudável e com orientações detalhadas de rega.', '2026-11-19 13:00:00');
  insertRating.run(null, userIds[3], userIds[2], 5, 'Encontro no Parque Villa-Lobos foi muito tranquilo. Pessoa educada e pontual.', '2026-11-08 11:30:00');

  // Avaliações para Lucas (User 3)
  insertRating.run(null, userIds[0], userIds[3], 5, 'A parafusadeira salvou a montagem dos móveis do meu apartamento novo! Lucas testou tudo comigo no local antes de validarmos o QR Code.', '2026-11-16 19:00:00');
  insertRating.run(null, userIds[1], userIds[3], 5, 'Fone de ouvido funcionando com som cristalino. Negociação transparente e ágil.', '2026-11-09 15:20:00');

  console.log(`✅ Seed concluído! ${items.length} itens cadastrados com fotos de alta qualidade e reviews reais.`);
  console.log('--- Credenciais de Acesso Swaply ---');
  console.log('1. ana@swaply.com    | Senha: senha123');
  console.log('2. carlos@swaply.com | Senha: senha123');
  console.log('3. mariana@swaply.com| Senha: senha123');
  console.log('4. lucas@swaply.com  | Senha: senha123');
}

seed().catch(console.error);
