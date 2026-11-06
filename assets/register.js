// טופס הרישום באתר: מעבר בין שלבים, בדיקת שדות ושליחה ישירה לטופס Google של בית הספר.
// שום פרט לא נשמר באתר או בדפדפן.
const form = document.getElementById('reg-form');

if (form) {
  const steps = [...form.querySelectorAll('.reg-step')];
  const back = form.querySelector('[data-action="back"]');
  const next = form.querySelector('[data-action="next"]');
  const submit = form.querySelector('[data-action="submit"]');
  const error = form.querySelector('.reg-error');
  const progress = document.querySelector('.reg-progress');
  const counter = progress.querySelector('span');
  const bar = progress.querySelector('i');
  const done = document.getElementById('reg-done');
  const pagesInGoogleForm = steps.length + 1;
  let current = 0;

  form.classList.add('is-ready');

  function show(index) {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    back.hidden = index === 0;
    next.hidden = index === steps.length - 1;
    submit.hidden = index !== steps.length - 1;
    error.hidden = true;
    counter.textContent = form.dataset.stepLabel.replace('{n}', index + 1).replace('{total}', steps.length);
    bar.style.width = `${((index + 1) / steps.length) * 100}%`;
    progress.scrollIntoView({ block: 'center' });
  }

  function fail(message, target) {
    error.textContent = message;
    error.hidden = false;
    if (target) target.focus();
    return false;
  }

  function validStep(step) {
    for (const group of step.querySelectorAll('[data-required-group]')) {
      if (!group.querySelector('input:checked')) return fail(form.dataset.errorRequired, group.querySelector('input'));
    }
    const other = step.querySelector('[data-other-choice]:checked');
    if (other) {
      const text = other.closest('fieldset').querySelector('[data-other-text]');
      if (!text.value.trim()) return fail(form.dataset.errorRequired, text);
    }
    for (const field of step.querySelectorAll('input:not([type=radio]), textarea')) {
      field.value = field.type === 'date' ? field.value : field.value.trim();
      if (!field.checkValidity()) {
        return fail(field.validity.typeMismatch ? form.dataset.errorEmail : form.dataset.errorRequired, field);
      }
    }
    return true;
  }

  function payload() {
    const data = new URLSearchParams();
    for (const field of form.querySelectorAll('input, textarea')) {
      if (!field.name || field.name === 'website') continue;
      if ((field.type === 'radio' || field.type === 'checkbox') && !field.checked) continue;
      if (!field.value) continue;
      if (field.type === 'date') {
        const [year, month, day] = field.value.split('-');
        data.append(`${field.name}_year`, year);
        data.append(`${field.name}_month`, month);
        data.append(`${field.name}_day`, day);
      } else {
        data.append(field.name, field.value);
      }
    }
    data.append('pageHistory', Array.from({ length: pagesInGoogleForm }, (_, i) => i).join(','));
    data.append('fvv', '1');
    return data;
  }

  back.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => { if (validStep(steps[current])) show(current + 1); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validStep(steps[current])) return;
    const trap = form.elements.website;
    if (trap && trap.value) return;
    submit.disabled = true;
    submit.textContent = form.dataset.sending;
    try {
      // Google לא מחזיר תשובה קריאה לאתר אחר, לכן no-cors. כשל רשת כן נתפס כאן.
      await fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload(),
      });
      form.hidden = true;
      progress.hidden = true;
      form.reset();
      done.hidden = false;
      done.focus();
    } catch {
      submit.disabled = false;
      submit.textContent = form.dataset.submitLabel;
      fail(form.dataset.errorNetwork);
    }
  });

  show(0);
  window.scrollTo(0, 0);
}
