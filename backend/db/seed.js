'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');
const QRCode = require('qrcode');

async function seed() {
  console.log('🌱 Iniciando seed completo de dados para EcoPermuta...');

  // Limpa tabelas existentes para garantir estado limpo e confiável
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

  const users = [
    {
      name: 'Ana Silva',
      email: 'ana@ecopermuta.com',
      bio: 'Apaixonada por leitura, sustentabilidade e plantas. Troco livros já lidos por novos conhecimentos!',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      reputation: 15
    },
    {
      name: 'Carlos Oliveira',
      email: 'carlos@ecopermuta.com',
      bio: 'Entusiasta de jogos de tabuleiro e tecnologia. Adepto da economia circular.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      reputation: 12
    },
    {
      name: 'Mariana Costa',
      email: 'mariana@ecopermuta.com',
      bio: 'Bióloga e jardineira urbana. Sempre multiplicando mudas para espalhar verde pela cidade.',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      reputation: 22
    },
    {
      name: 'Lucas Ferreira',
      email: 'lucas@ecopermuta.com',
      bio: 'Marceneiro amador e fã de DIY (faça você mesmo). Ferramentas paradas são desperdício!',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      reputation: 8
    }
  ];

  const userIds = [];
  for (const u of users) {
    const res = insertUser.run(u.name, u.email, passwordHash, u.bio, u.avatar_url, u.reputation);
    userIds.push(res.lastInsertRowid);
  }

  // 2. Cadastra Itens de Demonstração no Catálogo
  const insertItem = db.prepare(`
    INSERT INTO items (user_id, title, description, category, condition, images, status, latitude, longitude, location_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const items = [
    {
      user_id: userIds[0], // Ana
      title: 'Livro: O Hobbit - Edição Ilustrada',
      description: 'Edição de colecionador em capa dura, ilustrada por Alan Lee. Lido apenas uma vez, sem marcas ou anotações.',
      category: 'Livros',
      condition: 'Ótimo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600']),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'Av. Paulista / MASP'
    },
    {
      user_id: userIds[0], // Ana
      title: 'Muda de Costela-de-Adão (Monstera Deliciosa)',
      description: 'Muda enraizada com 4 folhas lindas, pronta para vaso definitivo ou canteiro.',
      category: 'Plantas',
      condition: 'Novo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600']),
      status: 'available',
      latitude: -23.5873,
      longitude: -46.6573,
      location_name: 'Parque Ibirapuera'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Jogo de Tabuleiro: Catan (Edição Brasileira)',
      description: 'Jogo completo com manual, hexágonos, cartas e todas as peças plásticas em perfeito estado.',
      category: 'Jogos',
      condition: 'Ótimo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600']),
      status: 'available',
      latitude: -23.5505,
      longitude: -46.6333,
      location_name: 'Estação Sé do Metrô'
    },
    {
      user_id: userIds[1], // Carlos
      title: 'Controle sem Fio DualShock Bluetooth',
      description: 'Funciona perfeitamente em PC e consoles. Bateria segurando carga normalmente.',
      category: 'Eletrônicos',
      condition: 'Bom',
      images: JSON.stringify(['https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600']),
      status: 'available',
      latitude: -23.5559,
      longitude: -46.6611,
      location_name: 'Conjunto Nacional'
    },
    {
      user_id: userIds[2], // Mariana
      title: 'Kit 4 Suculentas Raras em Vasos de Barro',
      description: 'Variedades Echeveria, Haworthia e Sedum. Ideais para quem gosta de plantas de fácil cultivo.',
      category: 'Plantas',
      condition: 'Novo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600']),
      status: 'available',
      latitude: -23.5455,
      longitude: -46.7318,
      location_name: 'Parque Villa-Lobos'
    },
    {
      user_id: userIds[2], // Mariana
      title: 'Livro: Sapiens - Uma Breve História da Humanidade',
      description: 'Best-seller de Yuval Noah Harari. Excelente reflexão sobre a evolução humana.',
      category: 'Livros',
      condition: 'Bom',
      images: JSON.stringify(['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600']),
      status: 'available',
      latitude: -23.5614,
      longitude: -46.6560,
      location_name: 'MASP'
    },
    {
      user_id: userIds[3], // Lucas
      title: 'Kit Chaves de Fenda e Phillips com Ponta Magnética (12 Peças)',
      description: 'Estojo rígido completo, cabo ergonômico emborrachado. Pouco usado.',
      category: 'Ferramentas',
      condition: 'Ótimo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600']),
      status: 'available',
      latitude: -23.5455,
      longitude: -46.7318,
      location_name: 'Parque Villa-Lobos'
    },
    {
      user_id: userIds[3], // Lucas
      title: 'Jaqueta Jeans Vintage Tam M (Estilo Retrô)',
      description: 'Jeans pesado de alta durabilidade, lavagem clássica dos anos 90, impecável.',
      category: 'Roupas',
      condition: 'Ótimo',
      images: JSON.stringify(['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600']),
      status: 'available',
      latitude: -23.5559,
      longitude: -46.6611,
      location_name: 'Paulista / Livraria Cultura'
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

  // 3. Cadastra uma Troca Aceita de Exemplo (Carlos oferece Catan para Ana em troca do Hobbit no MASP)
  const tradePayload = {
    tradeId: 1,
    requester: 'Carlos Oliveira',
    owner: 'Ana Silva',
    itemOffered: 'Jogo de Tabuleiro: Catan',
    itemWanted: 'Livro: O Hobbit',
    location: 'MASP - Museu de Arte de São Paulo',
    timestamp: new Date().toISOString()
  };

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(tradePayload), {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#1B5E20', light: '#FFFFFF' },
    width: 280
  });

  const insertTrade = db.prepare(`
    INSERT INTO trades (
      requester_id, owner_id, item_offered_id, item_wanted_id,
      status, qr_code, checkin_requester, checkin_owner,
      meeting_point_id, meeting_lat, meeting_lng, meeting_address, meeting_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tradeRes = insertTrade.run(
    userIds[1], userIds[0], itemIds[2], itemIds[0],
    'accepted', qrDataUrl, 0, 0,
    5, -23.5614, -46.6560, 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', '2026-11-25 15:30'
  );
  const tradeId = tradeRes.lastInsertRowid;

  // 4. Mensagens no Chat da Troca
  const insertMessage = db.prepare(`
    INSERT INTO messages (trade_id, sender_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `);

  insertMessage.run(tradeId, userIds[1], 'Olá Ana! Vi seu exemplar do Hobbit, estou super interessado!', '2026-11-22 14:00:00');
  insertMessage.run(tradeId, userIds[0], 'Oi Carlos! Adorei a proposta pelo Catan, podemos marcar sim.', '2026-11-22 14:15:00');
  insertMessage.run(tradeId, userIds[1], 'Excelente! Vamos nos encontrar no vão do MASP na quarta às 15:30?', '2026-11-22 14:20:00');
  insertMessage.run(tradeId, userIds[0], 'Combinado! Na hora fazemos o check-in por GPS e validamos com o QR Code. Até lá!', '2026-11-22 14:30:00');

  console.log('✅ Seed finalizado com sucesso!');
  console.log('--- Credenciais de Acesso para Demonstração ---');
  console.log('Usuário 1: ana@ecopermuta.com | Senha: senha123');
  console.log('Usuário 2: carlos@ecopermuta.com | Senha: senha123');
  console.log('Usuário 3: mariana@ecopermuta.com | Senha: senha123');
  console.log('Usuário 4: lucas@ecopermuta.com | Senha: senha123');
}

seed().catch(console.error);
