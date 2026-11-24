(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // preloader
  const done = () => document.body.classList.add('is-loaded');
  if (reduce) done(); else { window.addEventListener('load', () => setTimeout(done, 700)); setTimeout(done, 2500); }

  // header on scroll
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // burger
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // parallax hero
  const par = $('[data-parallax]');
  if (par && !reduce) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { const y = Math.min(window.scrollY, 900); par.style.transform = `translate3d(0, ${y * +par.dataset.parallax}px, 0)`; ticking = false; });
    }, { passive: true });
  }

  // reveal + stagger
  $$('.products, .stats__grid, .steps, .delivery__grid, .locs').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--rd', `${(i % 4) * 0.08}s`)));
  const reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('is-visible'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  }

  // counters
  const nums = $$('.stat__num');
  nums.forEach(n => { if (n.dataset.countSince) n.dataset.count = new Date().getFullYear() - +n.dataset.countSince; });
  const run = n => {
    const to = +n.dataset.count, suf = n.dataset.suffix || '';
    if (reduce) { n.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min((t - t0) / dur, 1); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); } }), { threshold: 0.5 });
    nums.forEach(n => io2.observe(n));
  } else nums.forEach(run);

  // filters
  const cards = $$('.product');
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
    const f = chip.dataset.filter;
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.cat === f;
      c.classList.remove('is-shown');
      c.classList.toggle('is-hidden', !show);
      if (show) { c.classList.add('is-visible'); void c.offsetWidth; c.classList.add('is-shown'); }
    });
  }));

  // tabs
  const tabBtns = $$('.tabs__btn');
  tabBtns.forEach(b => b.addEventListener('click', () => {
    tabBtns.forEach(x => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); const p = document.getElementById(x.getAttribute('aria-controls')); p.hidden = !on; p.classList.toggle('is-active', on); });
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }));

  // map: click on address centers the map
  const map = $('#map');
  $$('.loc').forEach(l => l.addEventListener('click', () => {
    $$('.loc').forEach(x => x.classList.toggle('is-active', x === l));
    const base = 'https://yandex.ru/map-widget/v1/?';
    map.src = l.dataset.lat
      ? `${base}ll=${l.dataset.lon}%2C${l.dataset.lat}&z=16&pt=${l.dataset.lon},${l.dataset.lat},pm2rdm`
      : `${base}text=${encodeURIComponent(l.dataset.query)}&z=16`;
    if (window.innerWidth < 860) map.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));

  // reviews slider
  const slider = $('#slider');
  if (slider) {
    const track = $('.slider__track', slider), slides = $$('.review', slider), dots = $('.slider__dots', slider);
    let i = 0, timer;
    const perView = () => window.innerWidth <= 560 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
    const max = () => Math.max(0, slides.length - perView());
    const renderDots = () => { dots.innerHTML = ''; for (let k = 0; k <= max(); k++) { const d = document.createElement('button'); d.setAttribute('aria-label', `Отзыв ${k + 1}`); d.addEventListener('click', () => go(k)); dots.appendChild(d); } };
    const go = k => { i = (k + max() + 1) % (max() + 1); track.style.transform = `translateX(-${i * 100 / perView()}%)`; $$('button', dots).forEach((d, n) => d.classList.toggle('is-active', n === i)); };
    $$('.slider__btn', slider).forEach(b => b.addEventListener('click', () => { go(i + +b.dataset.dir); restart(); }));
    const restart = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 5000); };
    let sx = null;
    track.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    track.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); } sx = null; });
    window.addEventListener('resize', () => { renderDots(); go(Math.min(i, max())); });
    renderDots(); go(0); restart();
  }
})();
