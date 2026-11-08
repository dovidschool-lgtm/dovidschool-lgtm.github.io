window.siteReady = true;
const root = document.documentElement;
const motion = root.classList.contains('motion');
const desktop = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// תפריט בטלפון
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// סימון המועד הבא בלוח החופשות לפי התאריך של היום
const calendar = document.querySelector('.calendar');
if (calendar) {
  const today = new Date().toISOString().slice(0, 10);
  let next = null;
  calendar.querySelectorAll('tbody tr').forEach((row) => {
    if (row.dataset.to < today) row.classList.add('is-past');
    else if (!next) next = row;
  });
  if (next) {
    next.classList.add('is-next');
    const tag = document.createElement('span');
    tag.className = 'next-tag';
    tag.textContent = calendar.dataset.nextLabel;
    next.querySelector('th').append(tag);
  }
}

// מסך פתיחה: פעם אחת בכל ביקור
const intro = document.querySelector('.intro');
if (intro) {
  const finish = () => intro.remove();
  if (motion && !root.classList.contains('no-intro')) {
    try { sessionStorage.setItem('introSeen', '1'); } catch { /* גלישה פרטית */ }
    setTimeout(finish, 1700);
    intro.addEventListener('click', finish);
  } else {
    finish();
  }
}

// גלילה חלקה בעכבר. בטלפון נשארת הגלילה הטבעית
let lenis = null;
if (motion && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    const target = a.pathname === location.pathname && a.hash ? document.querySelector(a.hash) : null;
    if (target) a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(target, { offset: -130 }); });
  });
  document.querySelectorAll('details').forEach((d) => d.addEventListener('toggle', () => lenis.resize()));
}

// כניסה בגלילה. הרשימה זהה לזו שב-style.css
if (motion && document.body.dataset.page !== 'registerForm') {
  const items = document.querySelectorAll('main h2, .section .lead, .section > .wrap > .tab-label, main .card, main .pillar, main .schedule li, main .adapt li, main .steps li, main .rule, main .downloads li, main .prose p, main .ticks li, main .callout, main .table-scroll, main .hours div, main .contact-list li, main blockquote, main figcaption, main .fact');
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  items.forEach((el) => {
    if (el.closest('.open-text, .tree-list')) return;
    const order = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--d', `${Math.min(order, 6) * 70}ms`);
    reveal.observe(el);
  });

  // תמונה עם clip-path סגור לא "נראית" ל-IntersectionObserver, ולכן עוקבים אחרי המעטפת שלה
  const clip = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.firstElementChild.classList.add('in');
      clip.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.clip-box').forEach((box) => clip.observe(box));
}

// כל מה שתלוי במיקום הגלילה, פעם אחת בכל פריים
const header = document.querySelector('.site-header');
const bar = document.querySelector('.scroll-progress');
const heroBlock = document.querySelector('.hero');
const opener = document.querySelector('[data-open-scroll]');
const openFrame = opener && opener.querySelector('.open-pin');
const tree = document.querySelector('[data-tree]');
const treeItems = tree ? [...tree.querySelectorAll('.tree-item')] : [];
const bands = [...document.querySelectorAll('.quote-band')];
const drifting = desktop ? [...document.querySelectorAll('[data-parallax]')] : [];
let queued = false;

function update() {
  queued = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  header.classList.toggle('is-scrolled', y > 12);
  const max = root.scrollHeight - vh;
  bar.style.setProperty('--scroll', max > 0 ? (y / max).toFixed(4) : '0');

  if (opener) {
    const box = opener.getBoundingClientRect();
    const p = clamp(-box.top / (box.height - vh));
    const eased = 1 - (1 - clamp(p / 0.8)) ** 2;
    const mobile = window.innerWidth < 700;
    openFrame.style.setProperty('--inset-y', `${((1 - eased) * (mobile ? 14 : 22)).toFixed(2)}%`);
    openFrame.style.setProperty('--inset-x', `${((1 - eased) * (mobile ? 8 : 26)).toFixed(2)}%`);
    openFrame.style.setProperty('--round', `${((1 - eased) * 40).toFixed(1)}px`);
    openFrame.style.setProperty('--zoom', (1.22 - eased * 0.22).toFixed(3));
    const shade = clamp((p - 0.45) / 0.35);
    openFrame.style.setProperty('--shade', shade.toFixed(3));
    openFrame.style.setProperty('--text-y', `${((1 - shade) * 24).toFixed(1)}px`);
  }

  if (tree) {
    const box = tree.getBoundingClientRect();
    tree.style.setProperty('--grow', clamp((vh * 0.8 - box.top) / box.height).toFixed(4));
    treeItems.forEach((item) => {
      const top = item.getBoundingClientRect().top;
      item.style.setProperty('--p', clamp((vh * 0.95 - top) / (vh * 0.4)).toFixed(3));
    });
  }

  if (!motion) return;

  if (heroBlock && desktop) heroBlock.style.setProperty('--drift', `${(y * 0.18).toFixed(1)}px`);

  bands.forEach((band) => {
    const box = band.getBoundingClientRect();
    const p = clamp((vh - box.top) / (vh * 0.7));
    band.style.setProperty('--band', `${((1 - p) * 9).toFixed(2)}%`);
  });

  drifting.forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.bottom < -200 || box.top > vh + 200) return;
    const offset = (box.top + box.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax);
    el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
}

function requestUpdate() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(update);
}

addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate, { passive: true });
update();
