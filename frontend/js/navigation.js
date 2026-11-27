const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  function setMenuOpen(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  navToggle.addEventListener('click', () => setMenuOpen(!navLinks.classList.contains('open')));

  navLinks.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.navbar')) setMenuOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.navbar')) setMenuOpen(false);
  });
  matchMedia('(max-width: 1000px)').addEventListener('change', () => setMenuOpen(false));

  const currentPage = navLinks.querySelector('a.active');
  if (currentPage) currentPage.setAttribute('aria-current', 'page');
}
