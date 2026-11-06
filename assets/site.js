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
