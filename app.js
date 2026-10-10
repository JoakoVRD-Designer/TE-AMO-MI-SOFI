'use strict';

const messages = [
  { title: 'Eres mi lugar bonito.', body: 'Mi bebé, entre tantas cosas que pasan en un día, pensarte siempre me hace bien. Me encanta que estés en mi vida y que ese lugar tan especial tenga tu nombre: Sofía.' },
  { title: 'Me encanta que seas tú.', body: 'No necesitas hacer nada extraordinario para ser especial para mí. Me gusta tu forma de ser, me gusta conocerte un poquito más y me gusta poder decirte: mi bebé, te amo.' },
  { title: 'Te elijo a ti.', body: 'En los días bonitos y también en los que cuestan un poquito. Quiero escucharte, cuidarte y acompañarte. Porque tú me importas, Sofi. Muchísimo.' },
  { title: 'Tu sonrisa, mi debilidad.', body: 'Si esta pequeña sorpresa te saca una sonrisa, ya me regalaste la parte más bonita del día. Ojalá pudiera estar cerquita para verla y darte un beso, mi bebé.' },
  { title: 'Aquí va un abrazo.', body: 'Uno de esos abrazos en los que no hace falta decir nada. Para cuando me extrañes, para cuando estés cansadita o simplemente porque sí. Cierra los ojitos un segundo: este es para ti.' },
  { title: 'Todo esto es solo para ti.', body: 'Esta página tiene tu nombre, pero lo que de verdad la llena eres tú. Ningún corazón está aquí por casualidad. Son seis maneras de decirte una misma cosa: te amo mucho, mi bebé.' },
];

const found = new Set();
const invitation = document.querySelector('#invitation');
const game = document.querySelector('#game');
const grid = document.querySelector('#heart-grid');
const messageDialog = document.querySelector('#message-dialog');
const letterDialog = document.querySelector('#letter-dialog');
const progressText = document.querySelector('#progress-text');
const progressBar = document.querySelector('[role="progressbar"]');
const progressFill = document.querySelector('#progress-fill');
const letterLocked = document.querySelector('#letter-locked');
const letterUnlocked = document.querySelector('#letter-unlocked');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let gameStarted = false;
let rainTimer;

function updateProgress() {
  const complete = found.size === messages.length;
  progressText.textContent = `${found.size} de ${messages.length} mensajes descubiertos`;
  progressBar.setAttribute('aria-valuenow', String(found.size));
  progressFill.style.width = `${found.size / messages.length * 100}%`;
  letterLocked.hidden = complete;
  letterUnlocked.hidden = !complete;
}

function openDialog(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('has-dialog');
}

function heartRain() {
  if (reducedMotion.matches) return;
  const container = document.querySelector('#confetti');
  clearTimeout(rainTimer);
  container.replaceChildren();
  for (let index = 0; index < 22; index++) {
    const heart = document.createElement('span');
    heart.className = 'confetti-heart';
    heart.textContent = '♥';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${11 + Math.random() * 13}px`;
    heart.style.animationDelay = `${Math.random() * .9}s`;
    container.append(heart);
  }
  rainTimer = setTimeout(() => container.replaceChildren(), 4000);
}

document.querySelector('#start-button').addEventListener('click', () => {
  gameStarted = true;
  invitation.hidden = true;
  game.hidden = false;
  document.querySelector('#game-title').focus({ preventScroll: true });
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-heart]');
  if (!gameStarted || !button || !grid.contains(button) || messageDialog.open || letterDialog.open) return;
  const index = Number(button.dataset.heart);
  const message = messages[index];
  if (!message) return;
  const firstVisit = !found.has(index);
  found.add(index);
  button.classList.add('is-found');
  button.setAttribute('aria-label', `Volver a leer el mensaje ${index + 1}: ${message.title}`);
  button.querySelector('.heart-caption').textContent = 'volver a leerlo';
  document.querySelector('#message-number').textContent = `UN TE QUIERO PARA TI · ${index + 1} / ${messages.length}`;
  document.querySelector('#message-title').textContent = message.title;
  document.querySelector('#message-body').textContent = message.body;
  updateProgress();
  openDialog(messageDialog);
  if (firstVisit && found.size === messages.length) heartRain();
});

document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});

[messageDialog, letterDialog].forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (!messageDialog.open && !letterDialog.open) document.body.classList.remove('has-dialog');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});

document.querySelector('#letter-button').addEventListener('click', () => {
  if (found.size === messages.length) openDialog(letterDialog);
});

document.querySelector('#replay-button').addEventListener('click', () => {
  found.clear();
  grid.querySelectorAll('[data-heart]').forEach(button => {
    const index = Number(button.dataset.heart);
    button.classList.remove('is-found');
    button.setAttribute('aria-label', `Descubrir el mensaje ${index + 1}`);
    button.querySelector('.heart-caption').textContent = ['un poquito de amor', 'y otro poquito', 'este también es tuyo', 'un abrazo escondido', 'algo que no te dije hoy', 'y todo mi corazón'][index];
  });
  clearTimeout(rainTimer);
  document.querySelector('#confetti').replaceChildren();
  updateProgress();
  grid.querySelector('[data-heart]').focus({ preventScroll: true });
});
