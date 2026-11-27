(() => {
  const profileKeys = ['scamb', 'swaply', 'ecotroca', 'ecopermuta'];
  const guest = !profileKeys.some(key => localStorage.getItem(key + '_token'));
  const apiBase = location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';

  for (const id of ['nav-guest-login', 'nav-guest-register']) {
    document.getElementById(id).hidden = !guest;
  }
  for (const id of ['nav-dashboard', 'nav-my-items', 'nav-trades', 'nav-profile', 'nav-logout']) {
    document.getElementById(id).hidden = guest;
  }

  document.getElementById('marketLogout').addEventListener('click', () => {
    for (const key of profileKeys) {
      localStorage.removeItem(key + '_token');
      localStorage.removeItem(key + '_user');
    }
    window.location.reload();
  });

  const conditionClass = {
    Novo: 'badge-condition--new',
    Ótimo: 'badge-condition--great',
    Bom: 'badge-condition--good',
    Regular: 'badge-condition--regular'
  };

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function icon(className) {
    const el = element('i', 'fas scamb-icon ' + className);
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function getFirstImage(images) {
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch {
        return images;
      }
    }
    return Array.isArray(images) ? images[0] : images;
  }

  const categoryIcons = {
    Livros: 'fa-book-open',
    Jogos: 'fa-gamepad',
    Eletrônicos: 'fa-headphones',
    Roupas: 'fa-shirt',
    Plantas: 'fa-seedling',
    Ferramentas: 'fa-screwdriver-wrench',
    Outros: 'fa-shapes'
  };

  function getItemStatus(item) {
    return (item && (item.effective_status || item.status)) || 'available';
  }

  function createCard(item, showLocation = false) {
    const itemStatus = getItemStatus(item);
    const card = element('a', 'market-item' + (itemStatus === 'traded' ? ' market-item--traded' : itemStatus === 'in_trade' ? ' market-item--intrade' : ''));
    card.href = 'item-detail.html?id=' + encodeURIComponent(item.id);
    const category = item.category || 'Outros';
    const media = element('div', 'market-item-media');
    media.dataset.category = category;
    const placeholder = element('span', 'market-media-placeholder');
    placeholder.append(icon(categoryIcons[category] || 'fa-box-open'));
    media.append(placeholder);

    const photoNote = element('span', 'market-photo-note', 'Foto indisponível');
    photoNote.setAttribute('aria-hidden', 'true');
    media.append(photoNote);

    const imageUrl = getFirstImage(item.images);
    if (typeof imageUrl === 'string' && imageUrl) {
      photoNote.hidden = true;
      const img = element('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('load', () => img.classList.add('is-ready'), { once: true });
      img.addEventListener('error', () => {
        img.remove();
        photoNote.hidden = false;
      }, { once: true });
      img.src = imageUrl;
      media.append(img);
    }
    media.append(element('span', 'market-item-category', category));

    const statusLabelMap = {
      available: { cls: 'market-item-status--available', text: 'Disponível' },
      in_trade:  { cls: 'market-item-status--trade', text: 'Em negociação' },
      traded:    { cls: 'market-item-status--traded', text: 'Trocado' }
    };
    const stMeta = statusLabelMap[itemStatus] || statusLabelMap.available;
    const statusBadge = element('span', 'market-item-status ' + stMeta.cls);
    statusBadge.append(element('span', 'market-status-dot'), stMeta.text);
    media.append(statusBadge);

    const copy = element('div', 'market-item-content');
    copy.append(element('h3', '', item.title));
    if (itemStatus === 'traded') {
      copy.append(element('p', 'market-item-note market-item-note--traded', 'Item trocado · Não está mais disponível'));
    } else if (itemStatus === 'in_trade') {
      copy.append(element('p', 'market-item-note market-item-note--trade', 'Em negociação para troca'));
    }
    if (item.description) copy.append(element('p', 'market-item-description', item.description));

    const details = element('div', 'market-item-bottom');
    if (item.condition) {
      const condition = element('span', 'badge ' + (conditionClass[item.condition] || ''), item.condition);
      condition.setAttribute('aria-label', 'Condição: ' + item.condition);
      details.append(condition);
    }

    if (showLocation && item.location_name) {
      const location = element('span', 'market-item-location');
      location.append(icon('fa-location-dot'), element('span', '', item.location_name));
      details.append(location);
    } else {
      details.append(element('span', '', item.owner_name || 'Usuário'));
    }
    const actionLabel = itemStatus === 'traded'
      ? 'Indisponível · Ver histórico'
      : (itemStatus === 'in_trade' ? 'Em negociação · Ver item' : 'Ver anúncio');
    const action = element('span', 'market-item-action', actionLabel);
    action.append(icon('fa-arrow-right'));
    copy.append(details, action);
    card.append(media, copy);
    return card;
  }

  async function fetchItems() {
    const response = await fetch(apiBase + '/items');
    if (!response.ok) throw new Error('Erro ao carregar os anúncios.');
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(items)) throw new Error('Resposta inválida do catálogo.');
    return items;
  }

  function revealHomeSections() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('fade-shown');
        entry.target.classList.remove('fade-pending');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });

    for (const section of document.querySelectorAll('[data-fade]')) {
      section.classList.add('fade-pending');
      observer.observe(section);
    }
  }

  function mountHero() {
    const panel = document.getElementById('heroPanel');
    const scenes = [...panel.querySelectorAll('.hero-scene')];
    const marks = [...panel.querySelectorAll('.hero-indicators span')];
    const listingsBox = document.getElementById('heroListings');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let latest = [];
    let selected = 0;
    let active = 0;
    let timer;
    let listingTimer;
    let touchStart;
    let hovered = false;
    let onScreen = true;

    function buildHeroListing(item) {
      const card = element('a', 'hero-listing');
      card.href = 'item-detail.html?id=' + encodeURIComponent(item.id);
      const thumb = element('span', 'hero-listing-thumb');
      thumb.append(icon(categoryIcons[item.category] || 'fa-box-open'));
      const url = getFirstImage(item.images);
      if (typeof url === 'string' && url) {
        const img = element('img');
        img.alt = '';
        img.addEventListener('error', () => img.remove(), { once: true });
        img.src = url;
        thumb.append(img);
      }
      const copy = element('span', 'hero-listing-copy');
      copy.append(
        element('small', '', (item.category || 'Outros') + (item.location_name ? ' · ' + item.location_name : '')),
        element('strong', '', item.title)
      );
      card.append(thumb, copy, icon('fa-arrow-right'));
      return card;
    }

    function renderListing() {
      if (!listingsBox || !latest.length || listingsBox.contains(document.activeElement)) return;
      const count = Math.min(3, latest.length);
      const batch = [];
      for (let i = 0; i < count; i += 1) {
        batch.push(latest[(selected + i) % latest.length]);
      }
      const sig = batch.map(it => it.id).join(',');
      if (listingsBox.dataset.itemIds === sig) return;
      listingsBox.dataset.itemIds = sig;
      listingsBox.replaceChildren(...batch.map(buildHeroListing));
      if (active === 2 && !motion.matches) {
        [...listingsBox.children].forEach((node, idx) => {
          node.animate(
            [{ opacity: .25, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
            { duration: 360, delay: idx * 70, easing: 'ease-out', fill: 'backwards' }
          );
        });
      }
    }

    function schedule() {
      clearTimeout(timer);
      clearTimeout(listingTimer);
      if (motion.matches || hovered || !onScreen || document.hidden || panel.contains(document.activeElement)) return;
      if (active === 2 && latest.length > 3) {
        listingTimer = setTimeout(() => {
          selected = (selected + 3) % latest.length;
          renderListing();
        }, 2300);
      }
      timer = setTimeout(() => advance(1), active === 2 ? 4800 : 3500);
    }

    function advance(direction) {
      const total = latest.length ? 3 : 2;
      if (active === 2 && latest.length > 3) selected = (selected + 3) % latest.length;
      active = (active + direction + total) % total;
      scenes.forEach((scene, index) => {
        const current = active === index;
        scene.classList.toggle('is-current', current);
        scene.inert = !current;
        scene.setAttribute('aria-hidden', String(!current));
        marks[index].classList.toggle('is-current', current);
      });
      if (active === 2) renderListing();
      schedule();
    }

    panel.addEventListener('keydown', event => {
      if (event.target !== panel || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      advance(event.key === 'ArrowRight' ? 1 : -1);
    });
    panel.addEventListener('touchstart', event => {
      touchStart = event.touches[0];
    }, { passive: true });
    panel.addEventListener('touchend', event => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.clientX;
      const dy = event.changedTouches[0].clientY - touchStart.clientY;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) advance(dx < 0 ? 1 : -1);
      touchStart = null;
    }, { passive: true });
    panel.addEventListener('pointerenter', event => { hovered = event.pointerType === 'mouse'; schedule(); });
    panel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    panel.addEventListener('focusin', schedule);
    panel.addEventListener('focusout', () => requestAnimationFrame(() => {
      if (active === 2) renderListing();
      schedule();
    }));
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; schedule(); }).observe(panel);
    }
    schedule();

    return items => {
      const next = items.filter(i => getItemStatus(i) === 'available')
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || Number(b.id) - Number(a.id)).slice(0, 9);
      if (latest[0]?.id !== next[0]?.id || selected >= next.length) selected = 0;
      latest = next;
      marks[2].hidden = !latest.length;
      if (!latest.length && active === 2) advance(0);
      if (latest.length) renderListing();
    };
  }

  function mountRecent(list) {
    const status = document.getElementById('recentStatus');
    const ticker = document.getElementById('recentTicker');
    const count = document.getElementById('recentCount');
    const updateHero = mountHero();
    const itemCard = item => createCard(item, true);
    let updateTicker;
    let items = [];
    let fingerprint;
    let fetching = false;
    let queued = false;

    if (!guest) {
      for (const publish of document.querySelectorAll('[data-publish]')) publish.href = 'my-items.html';
    }
    revealHomeSections();

    function render(next) {
      const signature = JSON.stringify(next);
      if (signature === fingerprint) return;
      fingerprint = signature;
      items = next;
      updateHero(items);
      status.removeAttribute('data-loading');
      status.hidden = items.length > 0;
      ticker.hidden = !items.length;
      if (!items.length) status.textContent = 'Ainda não há itens anunciados para troca.';
      const focusId = list.contains(document.activeElement) ? document.activeElement.href : null;
      list.replaceChildren(...items.map(itemCard));
      if (focusId) [...list.children].find(card => card.href === focusId)?.focus({ preventScroll: true });
      const available = items.filter(i => getItemStatus(i) === 'available').length;
      const negotiating = items.filter(i => getItemStatus(i) === 'in_trade').length;
      const traded = items.filter(i => getItemStatus(i) === 'traded').length;
      count.textContent = [available + (available === 1 ? ' disponível' : ' disponíveis'),
        negotiating && negotiating + ' em negociação', traded && traded + (traded === 1 ? ' trocado' : ' trocados')].filter(Boolean).join(' · ');
      if (updateTicker) updateTicker();
      else if (items.length) updateTicker = mountListingTicker(ticker, amount => items.slice(0, amount).map(item => {
        const card = itemCard(item);
        card.tabIndex = -1;
        return card;
      }));
    }

    return async function refresh() {
      if (fetching) { queued = true; return; }
      fetching = true;
      try {
        do {
          queued = false;
          render(await fetchItems());
        } while (queued);
      } catch {
        if (fingerprint === undefined) {
          status.removeAttribute('data-loading');
          status.textContent = 'Não foi possível carregar os anúncios. Tentaremos novamente em instantes.';
        }
      } finally {
        fetching = false;
      }
    };
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
  }

  async function showCatalog() {
    const filters = document.getElementById('catalogFilters');
    const search = document.getElementById('searchInput');
    const category = document.getElementById('categoryFilter');
    const condition = document.getElementById('conditionFilter');
    const pills = document.getElementById('catPills');
    const count = document.getElementById('resultsCount');
    const grid = document.getElementById('itemsGrid');
    const pagination = document.getElementById('pagination');
    const params = new URLSearchParams(window.location.search);
    const size = 9;
    let items = [];
    let currentPage = 1;
    let loadFailed = false;

    search.value = params.get('search') || '';
    const initialCategory = params.get('category');
    if ([...category.options].some(option => option.value === initialCategory)) category.value = initialCategory;

    function syncPills() {
      for (const button of pills.querySelectorAll('button')) {
        const active = button.dataset.category === category.value;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      }
    }

    function changePage(page) {
      currentPage = page;
      render();
      count.focus();
    }

    function renderPagination(totalPages) {
      pagination.replaceChildren();
      if (totalPages <= 1) return;

      function addButton(label, page, current = false) {
        const button = element('button', 'btn btn-sm ' + (current ? 'btn-primary' : 'btn-secondary'), label);
        button.type = 'button';
        if (current) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => changePage(page));
        pagination.append(button);
      }

      if (currentPage > 1) addButton('Anterior', currentPage - 1);
      for (let page = 1; page <= totalPages; page += 1) {
        addButton(String(page), page, page === currentPage);
      }
      if (currentPage < totalPages) addButton('Próxima', currentPage + 1);
    }

    function showEmpty(title, description) {
      const empty = element('div', 'catalog-empty');
      empty.append(icon('fa-magnifying-glass'), element('h3', '', title), element('p', '', description));
      grid.replaceChildren(empty);
    }

    function render() {
      syncPills();
      if (loadFailed) {
        count.textContent = 'Catálogo indisponível';
        showEmpty('Não foi possível carregar os anúncios', 'Atualize a página para tentar novamente.');
        return;
      }

      const query = normalize(search.value.trim());
      const filtered = items.filter(item =>
        (!query || normalize(item.title).includes(query) || normalize(item.description).includes(query)) &&
        (!category.value || item.category === category.value) &&
        (!condition.value || item.condition === condition.value)
      );
      const totalPages = Math.ceil(filtered.length / size);
      const start = (currentPage - 1) * size;
      count.textContent = filtered.length + (filtered.length === 1 ? ' anúncio encontrado' : ' anúncios encontrados');
      if (filtered.length) {
        grid.replaceChildren(...filtered.slice(start, start + size).map(item => createCard(item)));
      } else {
        showEmpty('Nenhum anúncio encontrado', 'Tente mudar a busca ou limpar os filtros.');
      }
      renderPagination(totalPages);
    }

    function applyFilters() {
      currentPage = 1;
      render();
    }

    syncPills();
    try {
      items = await fetchItems();
    } catch {
      loadFailed = true;
    }
    render();

    filters.addEventListener('submit', event => event.preventDefault());
    search.addEventListener('input', applyFilters);
    category.addEventListener('change', applyFilters);
    condition.addEventListener('change', applyFilters);
    pills.addEventListener('click', event => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      category.value = button.dataset.category;
      applyFilters();
    });
    document.getElementById('clearFilters').addEventListener('click', () => {
      filters.reset();
      applyFilters();
    });
  }

  const recent = document.getElementById('recentItems');
  const liveFeedEl = document.getElementById('liveActivityFeed');

  function formatRelativeTime(iso) {
    if (!iso) return 'Agora';
    const normalized = String(iso).includes('T') ? iso : String(iso).replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return 'Recente';
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours} h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function describeActivity(ev) {
    if (ev.type === 'trade_completed') {
      return {
        dotClass: 'live-dot--done',
        meta: `${formatRelativeTime(ev.created_at)} · ${ev.meeting_point_name || 'Ponto seguro'}`,
        label: `Trocado: ${ev.offered_title || 'Item'} ⇄ ${ev.wanted_title || 'Item'}`,
        href: ev.item_id ? `item-detail.html?id=${encodeURIComponent(ev.item_id)}` : 'map.html'
      };
    }
    if (ev.type === 'trade_accepted') {
      return {
        dotClass: 'live-dot--active',
        meta: `${formatRelativeTime(ev.created_at)} · ${ev.meeting_point_name || 'Encontro'}`,
        label: `Troca aceita: ${ev.offered_title || 'Item'} ⇄ ${ev.wanted_title || 'Item'}`,
        href: ev.item_id ? `item-detail.html?id=${encodeURIComponent(ev.item_id)}` : 'trades.html'
      };
    }
    if (ev.type === 'trade_proposed') {
      return {
        dotClass: 'live-dot--active',
        meta: `${formatRelativeTime(ev.created_at)} · ${ev.actor_name || 'Membro'} → ${ev.partner_name || 'Membro'}`,
        label: `Em negociação: ${ev.offered_title || 'Item'} ⇄ ${ev.wanted_title || 'Item'}`,
        href: ev.item_id ? `item-detail.html?id=${encodeURIComponent(ev.item_id)}` : 'trades.html'
      };
    }
    if (ev.type === 'review_created') {
      return {
        dotClass: 'live-dot--review',
        meta: `${formatRelativeTime(ev.created_at)} · Troca verificada`,
        label: `Avaliação ${ev.score || 5}★: ${ev.actor_name || 'Membro'} avaliou ${ev.partner_name || 'Membro'}`,
        href: 'catalog.html'
      };
    }
    return {
      dotClass: 'live-dot--new',
      meta: `${formatRelativeTime(ev.created_at)} · ${ev.actor_name || 'Membro'}${ev.location_name ? ' · ' + ev.location_name : ''}`,
      label: `Anunciado: ${ev.item_title || 'Novo item'}`,
      href: ev.item_id ? `item-detail.html?id=${encodeURIComponent(ev.item_id)}` : 'catalog.html'
    };
  }

  function initLiveActivity(refresh) {
    let queue = [];
    let cursor = 0;
    let cooldownUntil = 0;
    let wakeTimer;
    let closeTimer;

    function closeCard(card, immediate = false) {
      clearTimeout(closeTimer);
      card.classList.add('is-leaving');
      setTimeout(() => {
        card.remove();
        if (queue.length) wakeTimer = setTimeout(present, immediate ? 200 : 280);
      }, 220);
    }

    function isBusy(card) {
      return card.matches(':hover') || card.contains(document.activeElement);
    }

    function nextEvent() {
      if (!queue.length) return null;
      const ev = queue[cursor % queue.length];
      cursor = (cursor + 1) % queue.length;
      return ev;
    }

    function present() {
      clearTimeout(wakeTimer);
      if (!queue.length || document.hidden || liveFeedEl.firstChild || document.querySelector('.navbar-links.open')) return;
      const wait = cooldownUntil - Date.now();
      if (wait > 0) { wakeTimer = setTimeout(present, wait); return; }

      const ev = nextEvent();
      if (!ev) return;
      const info = describeActivity(ev);
      const card = element('li', 'live-feed-card');
      const link = element('a', 'live-feed-card-link');
      link.href = info.href;
      const copy = element('span', 'live-feed-copy');
      copy.append(element('small', 'live-feed-time', info.meta), element('span', 'live-feed-text', info.label));
      link.append(element('span', 'live-dot ' + info.dotClass), copy);
      const dismiss = element('button', 'live-dismiss', '×');
      dismiss.type = 'button';
      dismiss.setAttribute('aria-label', 'Dispensar notificação');
      dismiss.addEventListener('click', () => {
        cooldownUntil = Date.now() + 30000;
        closeCard(card);
      });
      card.append(link, dismiss);
      liveFeedEl.replaceChildren(card);
      requestAnimationFrame(() => card.classList.add('is-shown'));

      function expire() {
        if (isBusy(card)) closeTimer = setTimeout(expire, 700);
        else closeCard(card);
      }
      closeTimer = setTimeout(expire, 2100);
    }

    async function loadEvents() {
      try {
        const res = await fetch(apiBase + '/activity');
        if (!res.ok) return;
        const data = await res.json();
        const events = data?.data?.events || data?.events;
        if (Array.isArray(events) && events.length) {
          queue = events;
          if (!liveFeedEl.firstChild) wakeTimer = setTimeout(present, 450);
        }
      } catch {}
    }

    loadEvents();

    if ('EventSource' in window) {
      const source = new EventSource(apiBase + '/activity/stream');
      source.addEventListener('connected', refresh);
      source.addEventListener('activity', event => {
        let payload;
        try { payload = JSON.parse(event.data); } catch { return; }
        queue = [payload, ...queue.filter(e => e.id !== payload.id)].slice(0, 50);
        cursor = 0;
        cooldownUntil = 0;
        if (liveFeedEl.firstChild) {
          closeCard(liveFeedEl.firstChild, true);
        } else {
          present();
        }
        refresh();
      });
    }
    setInterval(() => { if (!document.hidden) { refresh(); loadEvents(); } }, 45000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { present(); refresh(); }
    });
  }

  if (recent) {
    const refresh = mountRecent(recent);
    refresh();
    initLiveActivity(refresh);
  } else {
    showCatalog();
  }
})();
