'use strict';

// 40 itens adicionais (10 por usuário) para simulações completas de troca
const SPOTS = [
  { lat: -23.5614, lng: -46.6560, name: 'MASP / Av. Paulista' },
  { lat: -23.5505, lng: -46.6333, name: 'Estação Sé' },
  { lat: -23.5559, lng: -46.6611, name: 'Conjunto Nacional / Livraria Cultura' },
  { lat: -23.5873, lng: -46.6573, name: 'Parque Ibirapuera' },
  { lat: -23.5455, lng: -46.7318, name: 'Parque Villa-Lobos' }
];

function buildExtraItems(userIds) {
  const catalog = [
    // Ana Silva (10 itens)
    { u: 0, s: 0, title: 'Coleção Completa: Duna (Edição Capa Dura 3 Volumes)', category: 'Livros', condition: 'Ótimo', img: 'img/demo/photo-1519682337058-a94d519337bc.jpg', desc: 'Trilogia clássica de Frank Herbert em capa dura com acabamento texturizado e marcadores originais.' },
    { u: 0, s: 2, title: 'Box Sherlock Holmes: Obras Completas Ilustradas', category: 'Livros', condition: 'Novo', img: 'img/demo/photo-1524995997946-a1c2e315a42f.jpg', desc: 'Edição comemorativa com os 4 romances e 56 contos de Arthur Conan Doyle em perfeito estado.' },
    { u: 0, s: 2, title: 'Moedor Manual de Café em Aço Inox com Ajuste de Moagem', category: 'Outros', condition: 'Novo', img: 'img/demo/photo-1514228742587-6b1558fcca3d.jpg', desc: 'Mós cônicas em aço inox com 24 cliques de regulagem para espresso, V60 e prensa francesa.' },
    { u: 0, s: 0, title: 'Chaleira Bico de Ganso (Gooseneck) Preta 900ml', category: 'Outros', condition: 'Ótimo', img: 'img/demo/photo-1517256064527-09c73fc73e38.jpg', desc: 'Chaleira em aço inox com termômetro integrado na tampa para controle preciso de extração.' },
    { u: 0, s: 0, title: 'Bolsa Tote de Couro Ecológico Caramelo para Notebook', category: 'Roupas', condition: 'Ótimo', img: 'img/demo/photo-1553062407-98eeb64c6a62.jpg', desc: 'Bolsa espaçosa com divisória acolchoada para laptop até 14 polegadas e alça reforçada.' },
    { u: 0, s: 3, title: 'Trench Coat Bege Clássico Feminino (Tamanho M)', category: 'Roupas', condition: 'Bom', img: 'img/demo/photo-1591047139829-d91aecb6caea.jpg', desc: 'Casaco alongado em sarja estruturada com cinto ajustável e forro interno xadrez.' },
    { u: 0, s: 2, title: 'HQ Maus (Edição Completa Capa Dura) — Art Spiegelman', category: 'Livros', condition: 'Novo', img: 'img/demo/photo-1516979187457-637abb4f9353.jpg', desc: 'Obra vencedora do Prêmio Pulitzer em edição integral brasileira, páginas sem marcas ou dobras.' },
    { u: 0, s: 3, title: 'Luminária de Mesa Estilo Industrial Cobre com Lâmpada Edison', category: 'Outros', condition: 'Ótimo', img: 'img/demo/photo-1507473885765-e6ed057f782c.jpg', desc: 'Estrutura metálica escovada com interruptor no cabo revestido em tecido e lâmpada quente.' },
    { u: 0, s: 0, title: 'Livro: O Design do Dia a Dia — Don Norman', category: 'Livros', condition: 'Novo', img: 'img/demo/photo-1544716278-ca5e3f4abd8c.jpg', desc: 'Referência essencial de usabilidade e design de produtos. Edição ampliada e revisada.' },
    { u: 0, s: 4, title: 'Óculos de Sol Polarizados Armação Tartaruga Unissex', category: 'Roupas', condition: 'Ótimo', img: 'img/demo/photo-1523275335684-37898b6baf30.jpg', desc: 'Proteção UV400 real com lentes polarizadas âmbar e estojo rígido de microfibra.' },

    // Carlos Oliveira (10 itens)
    { u: 1, s: 1, title: 'Teclado Mecânico Keychron K2 Wireless Switch Brown RGB', category: 'Eletrônicos', condition: 'Ótimo', img: 'img/demo/photo-1587829741301-dc798b83add3.jpg', desc: 'Layout 75% compacto, conexão Bluetooth para 3 dispositivos ou cabo USB-C, compatível Windows/Mac.' },
    { u: 1, s: 0, title: 'Mouse Sem Fio Logitech MX Master 3S Grafite', category: 'Eletrônicos', condition: 'Novo', img: 'img/demo/photo-1542751371-adc38448a05e.jpg', desc: 'Sensor Darkfield de 8000 DPI, cliques silenciosos, roda eletromagnética MagSpeed e bateria longa.' },
    { u: 1, s: 0, title: 'Jogo de Tabuleiro Ticket to Ride Europa (Galápagos)', category: 'Jogos', condition: 'Ótimo', img: 'img/demo/photo-1610890716171-6b1bb98ffd09.jpg', desc: 'Todas as miniaturas de trens, estações e cartas conferidas e organizadas em saquinhos zip.' },
    { u: 1, s: 1, title: 'Jogo de Tabuleiro Azul (Edição Clássica em Português)', category: 'Jogos', condition: 'Novo', img: 'img/demo/photo-1632516643720-e7f5d7d6ecc9.jpg', desc: 'Jogo abstrato premiado com 100 peças de resina estilo azulejo português, jogado 2 vezes.' },
    { u: 1, s: 1, title: 'Console Portátil Anbernic RG35XX Plus (64GB + Capa)', category: 'Jogos', condition: 'Novo', img: 'img/demo/photo-1511512578047-dfb367046420.jpg', desc: 'Tela IPS 3.5" nítida, saída mini-HDMI para TV, Wi-Fi integrado e película aplicada.' },
    { u: 1, s: 2, title: 'Webcam Logitech C920s Pro Full HD 1080p com Tampa', category: 'Eletrônicos', condition: 'Bom', img: 'img/demo/photo-1526170375885-4d8ecf77b99f.jpg', desc: 'Lente de vidro Carl Zeiss com foco automático e microfones estéreos duplos para reuniões.' },
    { u: 1, s: 4, title: "Jogo PS5: Marvel's Spider-Man 2 Mídia Física", category: 'Jogos', condition: 'Ótimo', img: 'img/demo/photo-1550745165-9bc0b252726f.jpg', desc: 'Disco sem riscos com caixa e encarte originais em português, pronto para rodar.' },
    { u: 1, s: 1, title: 'SSD Externo Portátil SanDisk 1TB USB-C', category: 'Eletrônicos', condition: 'Ótimo', img: 'img/demo/photo-1581092160607-ee22621dd758.jpg', desc: 'Transferência rápida até 1050 MB/s, resistente a quedas e água IP65, acompanha cabo.' },
    { u: 1, s: 3, title: 'Jaqueta Corta-Vento Impermeável Preta (Tamanho G)', category: 'Roupas', condition: 'Ótimo', img: 'img/demo/photo-1576995853123-5a10305d93c0.jpg', desc: 'Tecido leve respirável com capuz retrátil e bolsos com zíper selado para pedal ou chuva.' },
    { u: 1, s: 4, title: 'Tênis Casual Urbano Branco Tamanho 41 (Pouco Uso)', category: 'Roupas', condition: 'Bom', img: 'img/demo/photo-1542291026-7eec264c27ff.jpg', desc: 'Solado limpo e palmilha confortável, usado poucas vezes em ambiente interno.' },

    // Mariana Costa (10 itens)
    { u: 2, s: 3, title: 'Vaso Auto-Irrigável com Ficus Lyrata (Figueira-Lira 70cm)', category: 'Plantas', condition: 'Novo', img: 'img/demo/photo-1614594975525-e45190c55d0b.jpg', desc: 'Planta vigorosa com folhas largas saudáveis e reservatório para até 12 dias sem rega.' },
    { u: 2, s: 3, title: 'Jiboia Variegata Pendente em Cachepô de Macramê', category: 'Plantas', condition: 'Novo', img: 'img/demo/photo-1485955900006-10f4d324d411.jpg', desc: 'Ramos longos bem cheios adaptados a meia-sombra, acompanha suporte artesanal em algodão.' },
    { u: 2, s: 2, title: 'Livro Técnico: Uma Linguagem de Padrões — Christopher Alexander', category: 'Livros', condition: 'Ótimo', img: 'img/demo/photo-1512820790803-83ca734da794.jpg', desc: 'Clássico da arquitetura e urbanismo (Bookman), sem grifos ou anotações nas páginas.' },
    { u: 2, s: 4, title: 'Kit Terrário Fechado Artesanal com Musgos e Fitônias', category: 'Plantas', condition: 'Novo', img: 'img/demo/photo-1459411552884-841db9b3cc2a.jpg', desc: 'Ecossistema autossustentável em vidro de 22cm com rolha de cortiça, exige mínima manutenção.' },
    { u: 2, s: 0, title: 'Conjunto de 3 Quadros Minimalistas Botânicos Moldura Carvalho', category: 'Outros', condition: 'Novo', img: 'img/demo/photo-1513519245088-0e12902e5a38.jpg', desc: 'Impressão fine art em papel algodão 300g com vidro antirreflexo (30x40cm cada).' },
    { u: 2, s: 3, title: 'Zamioculca Adulta Saudável em Vaso Cerâmico Cinza', category: 'Plantas', condition: 'Ótimo', img: 'img/demo/photo-1466692476868-aef1dfb1e735.jpg', desc: 'Planta super resistente para apartamentos com pouca luz direta, já aclimatada.' },
    { u: 2, s: 4, title: 'Regador de Metal Vintage Verde-Musgo Bico Longo 1.5L', category: 'Ferramentas', condition: 'Novo', img: 'img/demo/photo-1466692476868-aef1dfb1e735.jpg', desc: 'Ideal para rega precisa de suculentas, terrários e vasos internos sem molhar móveis.' },
    { u: 2, s: 3, title: 'Conjunto de Ferramentas de Jardinagem Tramontina (4 Peças)', category: 'Ferramentas', condition: 'Ótimo', img: 'img/demo/photo-1530124566582-a618bc2615dc.jpg', desc: 'Pazinha larga, pazinha estreita, ancinho e tesoura de poda com cabos ergonômicos.' },
    { u: 2, s: 0, title: 'Tapete de Yoga Cortiça Natural Antiderrapante 5mm', category: 'Outros', condition: 'Ótimo', img: 'img/demo/photo-1545205597-3d9d02c29597.jpg', desc: 'Superfície ecológica antibacteriana com alça de transporte em algodão cru.' },
    { u: 2, s: 2, title: 'Relógio Analógico Minimalista Pulseira Couro Marrom', category: 'Roupas', condition: 'Bom', img: 'img/demo/photo-1523275335684-37898b6baf30.jpg', desc: 'Mostrador branco limpo de 40mm, vidro mineral sem riscos e bateria nova.' },

    // Lucas Ferreira (10 itens)
    { u: 3, s: 0, title: 'Microfone Condensador USB HyperX QuadCast S RGB', category: 'Eletrônicos', condition: 'Ótimo', img: 'img/demo/photo-1511671782779-c97d3d27a1d4.jpg', desc: 'Com shock mount antivibração, filtro pop interno, sensor mute por toque e 4 padrões polares.' },
    { u: 3, s: 1, title: 'Interface de Áudio Focusrite Scarlett 2i2 (3ª Geração)', category: 'Eletrônicos', condition: 'Ótimo', img: 'img/demo/photo-1484704849700-f032a568e944.jpg', desc: 'Dois pré-amplificadores cristalinos com modo Air, ideal para gravação de voz e violão.' },
    { u: 3, s: 3, title: 'Pedal de Efeito Overdrive Boss SD-1 para Guitarra', category: 'Outros', condition: 'Bom', img: 'img/demo/photo-1510915361894-db8b60106cb1.jpg', desc: 'Clássico timbre quente de overdrive assimétrico, funcionando 100% na caixa original.' },
    { u: 3, s: 4, title: 'Serra Tico-Tico Bosch GST 650 450W com Jogo de Lâminas', category: 'Ferramentas', condition: 'Ótimo', img: 'img/demo/photo-1504148455328-c376907d081c.jpg', desc: 'Velocidade variável para cortes precisos em madeira, MDF e alumínio. Pouco uso.' },
    { u: 3, s: 0, title: 'Nível a Laser Verde Autonivelante 15m com Tripé', category: 'Ferramentas', condition: 'Novo', img: 'img/demo/photo-1572981779307-38b8cabb2407.jpg', desc: 'Linhas horizontal e vertical de alta visibilidade com suporte magnético e bolsa protetora.' },
    { u: 3, s: 4, title: 'Lixadeira Orbital Makita BO4556 200W Profissional', category: 'Ferramentas', condition: 'Bom', img: 'img/demo/photo-1530124566582-a618bc2615dc.jpg', desc: 'Base quadrada com coletor de pó original e baixa vibração para marcenaria fina.' },
    { u: 3, s: 2, title: 'Câmera Analógica Vintage Canon AE-1 com Lente 50mm', category: 'Eletrônicos', condition: 'Regular', img: 'img/demo/photo-1526170375885-4d8ecf77b99f.jpg', desc: 'Clássica SLR 35mm mecânica testada com filme recente, fotômetro e obturador funcionando.' },
    { u: 3, s: 3, title: 'Ukulele Concerto Tagima Madeira Mahogany + Capa', category: 'Outros', condition: 'Novo', img: 'img/demo/photo-1510915361894-db8b60106cb1.jpg', desc: 'Cordas Aquila originais, afinação estável e som encorpado para iniciantes ou músicos.' },
    { u: 3, s: 1, title: 'Multímetro Digital Automático Hikari HM-2090', category: 'Ferramentas', condition: 'Novo', img: 'img/demo/photo-1581092160607-ee22621dd758.jpg', desc: 'True RMS com detecção NCV sem contato, visor retroiluminado e pontas de prova silicone.' },
    { u: 3, s: 3, title: "Caixa de Som Portátil JBL Flip 6 À Prova d'Água", category: 'Eletrônicos', condition: 'Ótimo', img: 'img/demo/photo-1505740420928-5e560c06d30e.jpg', desc: 'Áudio potente com radiadores passivos, 12h de bateria e certificação IP67.' }
  ];

  return catalog.map((item) => {
    const spot = SPOTS[item.s];
    return {
      user_id:       userIds[item.u],
      title:         item.title,
      description:   item.desc,
      category:      item.category,
      condition:     item.condition,
      images:        JSON.stringify([item.img]),
      status:        'available',
      latitude:      spot.lat,
      longitude:     spot.lng,
      location_name: spot.name
    };
  });
}

module.exports = { buildExtraItems };
