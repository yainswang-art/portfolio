/* 整本《疍家渔韵》：横向摊页 + 整本阅读器。只做增量，不改动原版式。 */
(() => {
  'use strict';

  const TOTAL = 70;
  const CHAPTERS = [
    { no: '01', name: '联动', from: 7, to: 10 },
    { no: '02', name: '起源', from: 11, to: 24 },
    { no: '03', name: '变革', from: 25, to: 28 },
    { no: '04', name: '语言·婚礼', from: 29, to: 34 },
    { no: '05', name: '巧艺', from: 35, to: 38 },
    { no: '06', name: '生活', from: 39, to: 44 },
    { no: '07', name: '生态', from: 45, to: 49 },
    { no: '08', name: '人物', from: 50, to: 55 },
    { no: '09', name: '文旅', from: 56, to: 60 },
    { no: '', name: '器物', from: 61, to: 64 },
    { no: '10', name: '政策·地图', from: 65, to: 70 }
  ];

  const band = document.getElementById('book');
  const tide = document.getElementById('book-tide');
  const chipBar = document.getElementById('book-chapters');
  const folio = document.getElementById('book-folio');
  const reader = document.getElementById('book-reader');
  if (!band || !tide || !chipBar || !reader) return;

  const img = document.getElementById('br-img');
  const now = document.getElementById('br-now');
  const chapterLabel = document.getElementById('br-chapter');
  const scrub = document.getElementById('br-scrub');
  const prev = document.getElementById('br-prev');
  const next = document.getElementById('br-next');
  const pad = n => String(n).padStart(2, '0');
  const pageSrc = n => 'assets/book/p' + pad(n) + '.webp';
  const thumbSrc = n => 'assets/book/t' + pad(n) + '.webp';

  let current = 1;
  let activeChip = null;

  /* ---------- 摊页 ---------- */
  const leaves = [];
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= TOTAL; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'leaf';
    b.dataset.page = String(i);
    b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', '翻开第 ' + i + ' 页');
    b.style.setProperty('--fy', (Math.sin(i * 0.53) * 4.6).toFixed(1) + 'px');
    b.style.setProperty('--fr', (Math.cos(i * 0.47) * 0.55).toFixed(2) + 'deg');

    const im = document.createElement('img');
    im.src = thumbSrc(i);
    im.alt = '《疍家渔韵》第 ' + i + ' 页';
    im.loading = 'lazy';
    im.decoding = 'async';
    im.width = 320;
    im.height = 453;
    b.appendChild(im);

    b.addEventListener('click', () => open(i));
    leaves.push(b);
    frag.appendChild(b);
  }
  tide.appendChild(frag);

  /* ---------- 章节 ---------- */
  CHAPTERS.forEach(ch => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.from = String(ch.from);
    b.dataset.to = String(ch.to);
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = (ch.no ? '<b>' + ch.no + '</b>' : '') + ch.name + '<em>' + ch.from + '–' + ch.to + '</em>';
    b.addEventListener('click', () => toggleChapter(b, ch));
    chipBar.appendChild(b);
  });

  function toggleChapter(button, ch) {
    const on = activeChip === button;
    activeChip = on ? null : button;
    chipBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === activeChip)));
    leaves.forEach(leaf => {
      const p = Number(leaf.dataset.page);
      leaf.classList.toggle('is-out', !!activeChip && (p < ch.from || p > ch.to));
    });
    if (!on) {
      const target = leaves[ch.from - 1];
      tide.scrollTo({ left: target.offsetLeft - tide.offsetLeft - 8, behavior: 'smooth' });
      setFolio(ch.from);
    }
  }

  function setFolio(n) {
    if (folio) folio.textContent = pad(n);
  }

  /* ---------- 当前页码（跟随横向滚动） ---------- */
  let scrollTick = 0;
  tide.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = requestAnimationFrame(() => {
      scrollTick = 0;
      const edge = tide.scrollLeft + 30;
      let best = 1, dist = Infinity;
      for (const leaf of leaves) {
        const d = Math.abs(leaf.offsetLeft - tide.offsetLeft - edge);
        if (d < dist) { dist = d; best = Number(leaf.dataset.page); }
      }
      setFolio(best);
    });
  }, { passive: true });

  tide.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    tide.scrollBy({ left: (event.key === 'ArrowLeft' ? -1 : 1) * 180, behavior: 'smooth' });
  });

  /* ---------- 阅读器 ---------- */
  function chapterOf(page) {
    if (page <= 6) return '前置 · 封面与目录';
    const ch = CHAPTERS.find(c => page >= c.from && page <= c.to);
    return ch ? (ch.no ? ch.no + ' ' : '') + ch.name : '《疍家渔韵》';
  }

  function go(page) {
    current = Math.max(1, Math.min(TOTAL, page));
    img.src = pageSrc(current);
    img.alt = '《疍家渔韵》第 ' + current + ' 页';
    now.textContent = String(current);
    scrub.value = String(current);
    chapterLabel.textContent = '第 ' + current + ' 页 · ' + chapterOf(current);
    prev.disabled = current === 1;
    next.disabled = current === TOTAL;
    [current - 1, current + 1].forEach(n => {
      if (n >= 1 && n <= TOTAL) { const pre = new Image(); pre.src = pageSrc(n); }
    });
  }

  function open(page) {
    go(page);
    leaves.forEach(leaf => leaf.classList.toggle('is-current', Number(leaf.dataset.page) === current));
    if (!reader.open) {
      reader.showModal();
      document.body.classList.add('book-reading');
    }
    const target = leaves[current - 1];
    if (target) tide.scrollTo({ left: target.offsetLeft - tide.offsetLeft - 8, behavior: 'auto' });
  }

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  scrub.addEventListener('input', () => go(Number(scrub.value)));

  reader.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(current + 1); }
  });

  let startX = null;
  reader.addEventListener('pointerdown', event => { startX = event.clientX; });
  reader.addEventListener('pointerup', event => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    if (Math.abs(delta) > 46) go(current + (delta < 0 ? 1 : -1));
  });

  reader.addEventListener('close', () => {
    document.body.classList.remove('book-reading');
    leaves.forEach(leaf => leaf.classList.toggle('is-current', Number(leaf.dataset.page) === current));
  });

  /* 器物段落与其它入口：点一下直接翻到某一页 */
  document.addEventListener('click', event => {
    const hit = event.target.closest('[data-book-page]');
    if (!hit) return;
    event.preventDefault();
    open(Number(hit.dataset.bookPage));
  }, true);

  window.openBookPage = open;

  const openBtn = document.getElementById('book-open');
  if (openBtn) openBtn.addEventListener('click', () => open(1));
})();
