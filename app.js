'use strict';

(() => {
  const messages = [
    { name: 'Mi lugar bonito', title: 'Eres mi lugar bonito.', color: '#eaa0bd', body: 'Mi bebé, entre tantas cosas que pasan en un día, pensarte siempre me hace bien. Me encanta que estés en mi vida y que ese lugar tan especial tenga tu nombre: Sofía.' },
    { name: 'Me gustas tú', title: 'Me encanta que seas tú.', color: '#f2c095', body: 'No necesitas hacer nada extraordinario para ser especial para mí. Me gusta tu forma de ser, me gusta conocerte un poquito más y me gusta poder decirte: mi bebé, te amo.' },
    { name: 'Te elijo', title: 'Te elijo a ti.', color: '#c5b2e4', body: 'En los días bonitos y también en los que cuestan un poquito. Quiero escucharte, cuidarte y acompañarte. Porque tú me importas, Sofi. Muchísimo.' },
    { name: 'Tu sonrisa', title: 'Tu sonrisa, mi debilidad.', color: '#f3c9d5', body: 'Si esta pequeña sorpresa te saca una sonrisa, ya me regalaste la parte más bonita del día. Ojalá pudiera estar cerquita para verla y darte un beso, mi bebé.' },
    { name: 'Un abrazo mío', title: 'Aquí va un abrazo.', color: '#edcc87', body: 'Uno de esos abrazos en los que no hace falta decir nada. Para cuando me extrañes, para cuando estés cansadita o simplemente porque sí. Cierra los ojitos un segundo: este es para ti.' },
    { name: 'Solo para ti', title: 'Todo esto es solo para ti.', color: '#da91b2', body: 'Este jardín tiene tu nombre, pero lo que de verdad lo llena eres tú. Ninguna flor está aquí por casualidad. Son seis maneras de decirte una misma cosa: te amo mucho, mi bebé.' },
  ];
  const $ = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Saving is optional. */ } },
  };
  const progressKey = 'sofi-garden-v2-hearts';
  const saved = Number(storage.get(progressKey));
  const sound = new GardenSound(storage.get('sofi-garden-sound') !== 'off');
  const canvas = $('garden');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 650, catchY = 552;
  const game = { started: false, paused: false, collected: Number.isInteger(saved) && saved >= 0 && saved <= 18 ? saved : 0, hearts: [], particles: [], player: 400, target: 400, spawn: .3, time: 0, bounce: 0, celebrated: saved === 18 };
  const keys = new Set();
  const flowerX = [76, 188, 293, 507, 616, 725];
  const flowerBirth = messages.map(() => -10);
  let lastFrame = 0, frameId = 0, toastTimer, confettiTimer, draggedPointer = null;
  let returnFocus = canvas;
  const backdrop = document.createElement('canvas');
  backdrop.width = W * 2; backdrop.height = H * 2;
  const bg = backdrop.getContext('2d');
  bg.scale(2, 2);

  function ellipse(c, x, y, rx, ry, color, rotation = 0) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); c.fillStyle = color; c.fill();
  }

  function heart(c, x, y, size, color, rotation = 0) {
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(size / 28, size / 28);
    c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-29, -5, -17, -25, 0, -11); c.bezierCurveTo(17, -25, 29, -5, 0, 12);
    c.fillStyle = color; c.fill();
    c.restore();
  }

  function flower(c, x, y, size, color, lean = 0, bloom = 1) {
    c.save(); c.translate(x, y); c.rotate(lean);
    c.strokeStyle = '#7e9b82'; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(7, -size * .8, 0, -size * 1.8); c.stroke();
    ellipse(c, -7, -size * .6, size * .42, size * .16, '#86a48a', -.5);
    ellipse(c, 8, -size * .95, size * .45, size * .18, '#a7b595', .5);
    c.translate(0, -size * 1.8); c.scale(bloom, bloom);
    for (let i = 0; i < 7; i++) {
      const angle = i / 7 * Math.PI * 2;
      ellipse(c, Math.cos(angle) * size * .47, Math.sin(angle) * size * .47, size * .49, size * .27, color, angle);
    }
    ellipse(c, 0, 0, size * .25, size * .25, '#ffe9ad');
    ellipse(c, -size * .06, -size * .07, size * .08, size * .07, '#fff3d2');
    c.restore();
  }

  function hill(c, y, color, bend) {
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, y);
    c.bezierCurveTo(200, y + bend, 380, y - bend, 800, y + 10);
    c.lineTo(W, H); c.closePath(); c.fillStyle = color; c.fill();
  }

  function drawBackdrop() {
    const sky = bg.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#77759f'); sky.addColorStop(.45, '#bc9db8'); sky.addColorStop(.76, '#e9bbb8'); sky.addColorStop(1, '#f1d1b9');
    bg.fillStyle = sky; bg.fillRect(0, 0, W, H);
    const halo = bg.createRadialGradient(661, 100, 5, 661, 100, 110);
    halo.addColorStop(0, '#fff2d85c'); halo.addColorStop(1, '#fff2d800'); bg.fillStyle = halo; bg.fillRect(550, 0, 230, 230);
    ellipse(bg, 661, 100, 33, 33, '#fff0d7'); ellipse(bg, 673, 91, 28, 29, '#8b80a6');
    ellipse(bg, 646, 108, 4, 3, '#e8ceb4'); ellipse(bg, 650, 121, 2, 2, '#e8ceb4');
    for (const [x, y, scale] of [[55, 147, 1.2], [717, 237, 1], [239, 76, .8], [361, 305, 1.4]]) {
      bg.save(); bg.globalAlpha = .14;
      ellipse(bg, x, y, 90 * scale, 18 * scale, '#fff4e3'); ellipse(bg, x + 35 * scale, y - 12 * scale, 45 * scale, 22 * scale, '#fff4e3');
      bg.restore();
    }
    hill(bg, 415, '#acacb7', 85); hill(bg, 458, '#a7b9ae', -70); hill(bg, 500, '#8ca99d', 50);
    // A little winding path through the meadow.
    bg.beginPath(); bg.moveTo(477, 452); bg.bezierCurveTo(369, 478, 479, 523, 381, 567); bg.bezierCurveTo(334, 600, 344, 620, 317, 650);
    bg.lineTo(549, 650); bg.bezierCurveTo(491, 606, 411, 610, 443, 566); bg.bezierCurveTo(531, 516, 426, 478, 492, 455); bg.fillStyle = '#cfbea8'; bg.fill();
    hill(bg, 578, '#789b8e', -22);
    // The fairy-light garland hangs above the whole garden.
    bg.lineWidth = 1.8; bg.strokeStyle = '#564d6c77';
    bg.beginPath(); bg.moveTo(-10, 35); bg.quadraticCurveTo(210, 177, 400, 70); bg.quadraticCurveTo(594, 208, 810, 60); bg.stroke();
    for (let i = 0; i <= 17; i++) {
      const x = i * 47, local = (x % 400) / 400;
      const y = x < 400 ? 35 * (1 - local) ** 2 + 354 * local * (1 - local) + 70 * local ** 2 : 70 * (1 - local) ** 2 + 416 * local * (1 - local) + 60 * local ** 2;
      bg.strokeStyle = '#62587280'; bg.beginPath(); bg.moveTo(x, y); bg.lineTo(x, y + 8); bg.stroke();
      const glow = bg.createRadialGradient(x, y + 10, 1, x, y + 10, 20); glow.addColorStop(0, '#ffe6b59c'); glow.addColorStop(1, '#ffe6b500');
      bg.fillStyle = glow; bg.fillRect(x - 20, y - 10, 40, 40); ellipse(bg, x, y + 10, 3, 4, '#fff0c7');
    }
    for (let i = 0; i < 50; i++) {
      const x = (i * 139 + 41) % W, y = 572 + (i * 31) % 80;
      bg.strokeStyle = i % 2 ? '#aec0a470' : '#446f6560'; bg.lineWidth = 1;
      bg.beginPath(); bg.moveTo(x, y + 10); bg.quadraticCurveTo(x - 7, y - 8, x - 13, y - 9); bg.moveTo(x, y + 10); bg.quadraticCurveTo(x + 2, y - 8, x + 9, y - 15); bg.stroke();
    }
    for (const [x, y, size, tint] of [[21, 596, 23, '#e9b0c0'], [780, 587, 26, '#ead2ac'], [40, 647, 18, '#cbc0e1'], [757, 655, 17, '#e7adbd'], [143, 661, 13, '#fff0c9'], [656, 659, 16, '#e9b0c0']]) flower(bg, x, y, size, tint, (x % 3 - 1) * .2);
    // Ferns frame the scene without hiding the falling hearts.
    for (const side of [0, 1]) {
      bg.save(); bg.translate(side ? 800 : 0, 575); bg.scale(side ? -1 : 1, 1);
      for (let stem = 0; stem < 3; stem++) {
        bg.save(); bg.rotate(.18 + stem * .25); bg.strokeStyle = '#6e8f83'; bg.lineWidth = 3;
        bg.beginPath(); bg.moveTo(0, 10); bg.quadraticCurveTo(5, -55, 1, -120); bg.stroke();
        for (let leaf = 0; leaf < 6; leaf++) { ellipse(bg, -10, -leaf * 18, 17 - leaf, 5, '#8da593', .5); ellipse(bg, 11, -leaf * 18 - 8, 18 - leaf, 5, '#9db2a0', -.5); }
        bg.restore();
      }
      bg.restore();
    }
  }

  const stars = Array.from({ length: 28 }, (_, i) => ({ x: (i * 137 + 73) % W, y: 30 + (i * 71) % 290, size: i % 4 ? 1.3 : 2.4 }));
  const fireflies = Array.from({ length: 12 }, (_, i) => ({ x: (i * 157 + 57) % W, y: 372 + (i * 59) % 175, phase: i * 1.71 }));

  function drawBunny(t) {
    const bob = motion.matches ? 0 : Math.sin(t * 2) * 1.6;
    ctx.save(); ctx.translate(game.player, bob - game.bounce);
    ellipse(ctx, 0, 615, 52, 9, '#41645c40');
    ellipse(ctx, -14, 496, 10, 36, '#fff0e2', -.14); ellipse(ctx, 14, 496, 10, 36, '#fff0e2', .14);
    ellipse(ctx, -14, 492, 4, 24, '#eab5c0', -.14); ellipse(ctx, 14, 492, 4, 24, '#eab5c0', .14);
    ellipse(ctx, 0, 573, 32, 37, '#fff0e2'); ellipse(ctx, -19, 607, 14, 8, '#fff0e2'); ellipse(ctx, 19, 607, 14, 8, '#fff0e2');
    ellipse(ctx, 0, 531, 35, 29, '#fff4e6');
    const blinking = !motion.matches && Math.sin(t * .8) > .997;
    ellipse(ctx, -12, 529, 2.4, blinking ? .6 : 3.1, '#554149'); ellipse(ctx, 12, 529, 2.4, blinking ? .6 : 3.1, '#554149');
    ellipse(ctx, -23, 537, 6, 3.5, '#efbdc5'); ellipse(ctx, 23, 537, 6, 3.5, '#efbdc5'); ellipse(ctx, 0, 536, 3, 2, '#c78999');
    ctx.strokeStyle = '#8b6270'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, 538); ctx.quadraticCurveTo(-2, 544, -5, 540); ctx.moveTo(0, 538); ctx.quadraticCurveTo(2, 544, 5, 540); ctx.stroke();
    // A pink bow, and a woven basket that follows the pointer.
    ellipse(ctx, -7, 554, 10, 6, '#d899ad', -.4); ellipse(ctx, 7, 554, 10, 6, '#d899ad', .4); ellipse(ctx, 0, 554, 4, 4, '#b86687');
    ctx.strokeStyle = '#b48b70'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 564, 33, 27, 0, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-44, 565); ctx.lineTo(-34, 597); ctx.quadraticCurveTo(0, 610, 34, 597); ctx.lineTo(44, 565); ctx.closePath(); ctx.fillStyle = '#d6ad89'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#b78c704f';
    for (let x = -40; x < 45; x += 9) { ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x + 10, 610); ctx.stroke(); }
    for (let y = 574; y < 610; y += 8) { ctx.beginPath(); ctx.moveTo(-50, y); ctx.lineTo(50, y); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = '#ebc3a0'; ctx.beginPath(); ctx.roundRect(-46, 560, 92, 9, 4); ctx.fill();
    heart(ctx, 0, 586, 10, '#fff0dc'); ellipse(ctx, -35, 560, 8, 5, '#fff0e2', -.25); ellipse(ctx, 35, 560, 8, 5, '#fff0e2', .25);
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H); ctx.drawImage(backdrop, 0, 0, W, H);
    for (const star of stars) {
      const alpha = motion.matches ? .6 : .35 + (Math.sin(t * .7 + star.x) + 1) * .25;
      ellipse(ctx, star.x, star.y, star.size, star.size, `rgba(255,242,215,${alpha})`);
      if (star.size > 2) { ctx.strokeStyle = `rgba(255,242,215,${alpha * .55})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(star.x - 5, star.y); ctx.lineTo(star.x + 5, star.y); ctx.moveTo(star.x, star.y - 5); ctx.lineTo(star.x, star.y + 5); ctx.stroke(); }
    }
    for (const fly of fireflies) {
      const x = fly.x + (motion.matches ? 0 : Math.sin(t * .6 + fly.phase) * 14);
      const y = fly.y + (motion.matches ? 0 : Math.cos(t * .7 + fly.phase) * 10);
      ctx.globalAlpha = motion.matches ? .5 : .35 + (Math.sin(t * 1.3 + fly.phase) + 1) * .28;
      const light = ctx.createRadialGradient(x, y, 0, x, y, 13); light.addColorStop(0, '#ffedba'); light.addColorStop(.15, '#ffe8ab88'); light.addColorStop(1, '#ffe8ab00');
      ctx.fillStyle = light; ctx.fillRect(x - 13, y - 13, 26, 26); ctx.globalAlpha = 1;
    }
    const flowers = Math.floor(game.collected / 3);
    for (let i = 0; i < 6; i++) {
      const growth = i < flowers ? (motion.matches ? 1 : Math.min(1, .2 + (game.time - flowerBirth[i]) * 1.4)) : .08;
      const sway = motion.matches ? 0 : Math.sin(t + i) * .04;
      flower(ctx, flowerX[i], 625 + (i % 2) * 8, 25 + (i % 3) * 5, messages[i].color, sway, growth);
    }
    for (const drop of game.hearts) {
      ctx.save(); ctx.shadowColor = drop.gold ? '#ffe1a8' : '#ffd0e6'; ctx.shadowBlur = 14;
      heart(ctx, drop.x, drop.y, drop.radius, drop.gold ? '#f7d690' : ['#f1a1c1', '#ffd5dc', '#e9aacd'][drop.variant], motion.matches ? 0 : Math.sin(t * 2 + drop.phase) * .15);
      ctx.restore(); ellipse(ctx, drop.x - 5, drop.y - 10, 3, 2, '#fff2e8b3', -.5);
      if (drop.gold) { ctx.fillStyle = '#fff7d8'; ctx.font = '14px Georgia'; ctx.fillText('✦', drop.x - 5, drop.y + 1); }
    }
    drawBunny(t);
    for (const particle of game.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      if (particle.heart) heart(ctx, particle.x, particle.y, particle.size, particle.color, particle.life);
      else ellipse(ctx, particle.x, particle.y, particle.size, particle.size, particle.color);
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw(game.time);
  }

  function hasDialog() { return $('message-dialog').open || $('letter-dialog').open; }
  function playing() { return game.started && !game.paused && !hasDialog() && !document.hidden && game.collected < 18; }

  function spawnHeart(center = false) {
    const drop = { baseX: center ? game.player : 68 + Math.random() * 664, x: 400, y: center ? 91 : -25, radius: 22, speed: 92 + Math.random() * 23, phase: Math.random() * 6, variant: Math.floor(Math.random() * 3), gold: !center && Math.random() < .17 };
    drop.x = drop.baseX; game.hearts.push(drop);
  }

  function burst(x, y, color) {
    if (motion.matches) return;
    for (let i = 0; i < 14; i++) game.particles.push({ x, y, vx: (Math.random() - .5) * 170, vy: -30 - Math.random() * 140, life: .8, maxLife: .8, size: 2 + Math.random() * 4, color, heart: i % 4 === 0 });
  }

  function toast(text) {
    clearTimeout(toastTimer); $('scene-toast').textContent = text; $('scene-toast').classList.add('is-visible');
    toastTimer = setTimeout(() => $('scene-toast').classList.remove('is-visible'), 1800);
  }

  function updateProgress() {
    const flowers = Math.floor(game.collected / 3);
    $('heart-count').textContent = game.collected;
    $('progress-detail').textContent = `${flowers} / 6`;
    $('progress-text').textContent = game.collected === 18 ? 'Tu jardín está lleno de mis te quiero.' : game.collected ? `${flowers} ${flowers === 1 ? 'flor guarda' : 'flores guardan'} un mensaje para ti.` : 'Seis flores esperan por ti';
    $('progress-fill').style.width = `${game.collected / 18 * 100}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', game.collected);
    document.querySelectorAll('.flower-memory').forEach((button, index) => {
      const unlocked = index < flowers;
      button.disabled = !unlocked; button.classList.toggle('is-found', unlocked);
      button.setAttribute('aria-label', unlocked ? `Volver a leer: ${messages[index].title}` : `Flor ${index + 1}, todavía por descubrir`);
      button.querySelector('small').textContent = unlocked ? 'volver a leer ♡' : 'aún por florecer';
    });
    $('finish-card').hidden = !game.started || game.collected < 18;
    $('game-hud').hidden = !game.started || game.collected >= 18;
    $('game-controls').hidden = !game.started || game.collected >= 18;
    $('garden-scene').classList.toggle('is-playing', game.started && game.collected < 18);
    $('catch-button').disabled = game.paused || game.collected >= 18;
    if (game.collected === 18) $('memories-hint').textContent = 'Todas son tuyas. Toca una flor cuando quieras volver a sentirme cerquita.';
    else $('memories-hint').textContent = 'Se irán abriendo mientras juegas. Después, puedes volver a leerlas.';
  }

  function openDialog(dialog) {
    if (hasDialog()) return;
    keys.clear(); returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : canvas;
    dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('has-dialog');
  }

  function openMessage(index) {
    $('message-number').textContent = `Un te quiero que floreció para ti · ${index + 1} de 6`;
    $('message-title').textContent = messages[index].title; $('message-body').textContent = messages[index].body;
    $('message-flower').style.color = messages[index].color;
    openDialog($('message-dialog'));
  }

  function collect(drop) {
    if (!playing() || !game.hearts.includes(drop)) return;
    game.hearts.splice(game.hearts.indexOf(drop), 1); game.collected++;
    storage.set(progressKey, game.collected);
    game.bounce = motion.matches ? 0 : 7;
    burst(drop.x, drop.y, drop.gold ? '#ffe7ad' : '#ffd0e2');
    sound.effect('pickup', game.collected);
    toast(drop.gold ? 'Un besito extra, mi bebé.' : ['Este te quiero es tuyo.', 'Me encantas, Sofi.', 'Otro abrazo para mi bebé.', 'Te elijo. Siempre a ti.'][game.collected % 4]);
    updateProgress();
    if (game.collected % 3 === 0) {
      const index = game.collected / 3 - 1;
      flowerBirth[index] = game.time;
      sound.effect('flower'); openMessage(index);
    }
  }

  function petalRain() {
    if (motion.matches) return;
    clearTimeout(confettiTimer); $('confetti').replaceChildren();
    for (let i = 0; i < 27; i++) {
      const petal = document.createElement('span'); petal.className = 'confetti-petal'; petal.textContent = i % 3 ? '✿' : '♡';
      petal.style.left = `${Math.random() * 100}%`; petal.style.fontSize = `${14 + Math.random() * 18}px`;
      petal.style.animationDelay = `${Math.random() * .7}s`; petal.style.setProperty('--drift', `${(Math.random() - .5) * 180}px`);
      $('confetti').append(petal);
    }
    confettiTimer = setTimeout(() => $('confetti').replaceChildren(), 5000);
  }

  function finish() {
    game.celebrated = true; game.hearts.length = 0; keys.clear(); sound.effect('finish'); petalRain();
    $('letter-button').focus({ preventScroll: true });
  }

  function start() {
    game.started = true; game.paused = false; $('invitation').hidden = true;
    updateProgress(); canvas.focus({ preventScroll: true });
    void sound.begin().then(() => sound.effect('start'));
    if (game.collected === 18) $('letter-button').focus({ preventScroll: true });
    else { spawnHeart(true); toast('Atrapa mis te quiero, mi bebé.'); }
    if (innerWidth < 761) $('garden-scene').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
  }

  function assistCatch() {
    if (!playing()) return;
    if (!game.hearts.length) spawnHeart(true);
    const drop = game.hearts.reduce((lowest, item) => item.y > lowest.y ? item : lowest);
    game.target = drop.x;
    collect(drop);
  }

  function setPaused(paused) {
    if (!game.started || game.collected >= 18 || hasDialog()) return;
    game.paused = paused; keys.clear(); $('pause-card').hidden = !paused; updateProgress();
    if (paused) { sound.stopLoop(); $('resume-button').focus({ preventScroll: true }); }
    else { void sound.begin(); canvas.focus({ preventScroll: true }); }
  }

  function frame(timestamp) {
    frameId = 0;
    const dt = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .04) : 0;
    lastFrame = timestamp; game.time += dt;
    if (playing()) {
      if (keys.has('ArrowLeft') || keys.has('a')) game.target -= dt * 410;
      if (keys.has('ArrowRight') || keys.has('d')) game.target += dt * 410;
      game.target = Math.max(53, Math.min(W - 53, game.target));
      game.player += (game.target - game.player) * Math.min(1, dt * 16);
      if (!motion.matches) {
        game.spawn -= dt;
        if (game.spawn <= 0 && game.hearts.length < 7) { spawnHeart(); game.spawn = .85 + Math.random() * .25; }
        for (const drop of [...game.hearts]) {
          if (!playing()) break;
          const previousY = drop.y; drop.y += dt * drop.speed;
          drop.x = drop.baseX + Math.sin(game.time * 1.2 + drop.phase) * 18;
          if (drop.y >= catchY - 12 && previousY <= catchY + 15 && Math.abs(drop.x - game.player) < 62) collect(drop);
          else if (drop.y > H + 30) game.hearts.splice(game.hearts.indexOf(drop), 1);
        }
      } else {
        // Stationary hearts: the same game remains usable without falling or swaying.
        if (game.hearts.length < 3) {
          spawnHeart(); const drop = game.hearts[game.hearts.length - 1];
          drop.x = drop.baseX = 160 + (game.hearts.length - 1) * 240; drop.y = 260 + (game.hearts.length % 2) * 85;
        }
      }
    }
    game.bounce *= Math.max(0, 1 - dt * 12);
    for (const particle of game.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += dt * 140; particle.life -= dt; }
    game.particles = game.particles.filter(particle => particle.life > 0);
    draw(game.time);
    if (!document.hidden) frameId = requestAnimationFrame(frame);
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * W, y: (event.clientY - rect.top) / rect.height * H };
  }

  canvas.addEventListener('pointerdown', event => {
    if (!playing()) return;
    const pos = point(event);
    const hit = [...game.hearts].reverse().find(drop => Math.hypot(drop.x - pos.x, drop.y - pos.y) < 42);
    if (hit) collect(hit);
    game.target = Math.max(53, Math.min(W - 53, pos.x));
    if (playing()) { draggedPointer = event.pointerId; canvas.setPointerCapture(event.pointerId); }
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', event => {
    if (!playing() || (event.pointerType !== 'mouse' && draggedPointer !== event.pointerId)) return;
    game.target = Math.max(53, Math.min(W - 53, point(event).x));
  });
  const releasePointer = () => { draggedPointer = null; };
  canvas.addEventListener('pointerup', releasePointer); canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('keydown', event => {
    if (!playing()) return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) { event.preventDefault(); keys.add(event.key); }
    if (event.code === 'Space' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) assistCatch(); }
  });
  canvas.addEventListener('keyup', event => keys.delete(event.key));
  canvas.addEventListener('blur', () => keys.clear());
  $('start-button').addEventListener('click', start);
  $('catch-button').addEventListener('click', assistCatch);
  $('pause-button').addEventListener('click', () => setPaused(true));
  $('resume-button').addEventListener('click', () => setPaused(false));
  $('letter-button').addEventListener('click', () => { if (game.collected === 18) { sound.effect('letter'); openDialog($('letter-dialog')); } });
  $('replay-button').addEventListener('click', () => {
    game.collected = 0; game.celebrated = false; game.hearts.length = 0; game.particles.length = 0; game.paused = false; game.player = game.target = 400; game.spawn = .5;
    storage.set(progressKey, 0); $('pause-card').hidden = true; $('confetti').replaceChildren(); updateProgress();
    spawnHeart(true); void sound.begin(); canvas.focus({ preventScroll: true }); toast('Otro jardín de abrazos, solo para ti.');
  });

  messages.forEach((message, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'flower-memory'; button.dataset.flower = index;
    // All values below are fixed local copy, never user-supplied HTML.
    button.innerHTML = `<svg viewBox="0 0 50 62" aria-hidden="true"><path d="M25 59Q29 39 25 21" stroke="#8ba086" stroke-width="2" fill="none"/><ellipse cx="19" cy="43" rx="9" ry="3.4" fill="#9daf93" transform="rotate(30 19 43)"/><ellipse cx="31" cy="36" rx="8" ry="3" fill="#a6b597" transform="rotate(-30 31 36)"/>${Array.from({ length: 7 }, (_, i) => `<ellipse cx="25" cy="13" rx="5" ry="9" fill="${message.color}" transform="rotate(${i * 360 / 7} 25 21)"/>`).join('')}<circle cx="25" cy="21" r="4.5" fill="#f1d89c"/></svg><span>${message.name}</span><small>aún por florecer</small>`;
    button.addEventListener('click', () => { if (index < Math.floor(game.collected / 3)) { sound.effect('flower'); openMessage(index); } });
    $('flower-shelf').append(button);
  });

  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  for (const dialog of [$('message-dialog'), $('letter-dialog')]) {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('has-dialog'); keys.clear();
      if (dialog.id === 'message-dialog' && game.started && game.collected === 18 && !game.hearts.length) returnFocus = $('letter-button');
      returnFocus?.focus({ preventScroll: true });
      if (dialog.id === 'message-dialog' && game.started && game.collected === 18 && !game.celebrated) finish();
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  }

  function updateSoundButton() {
    $('sound-button').setAttribute('aria-pressed', sound.enabled);
    $('sound-button').setAttribute('aria-label', sound.enabled ? 'Desactivar sonido' : 'Activar sonido');
    $('sound-label').textContent = sound.enabled ? 'Sonido' : 'Sin sonido'; $('sound-icon').textContent = sound.enabled ? '♫' : '♪';
  }
  $('sound-button').addEventListener('click', () => { sound.setEnabled(!sound.enabled); storage.set('sofi-garden-sound', sound.enabled ? 'on' : 'off'); updateSoundButton(); });
  document.addEventListener('visibilitychange', () => {
    keys.clear(); void sound.visibility();
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; lastFrame = 0; }
    else if (!frameId) frameId = requestAnimationFrame(frame);
  });
  window.addEventListener('blur', () => keys.clear());
  new ResizeObserver(resize).observe(canvas);
  motion.addEventListener('change', () => { game.hearts.length = 0; game.particles.length = 0; spawnHeart(true); });
  if (game.collected) $('start-button').firstChild.textContent = game.collected === 18 ? 'Volver a mi jardín ' : 'Seguir cuidando mi jardín ';
  updateSoundButton(); updateProgress(); drawBackdrop(); resize(); frameId = requestAnimationFrame(frame);
})();
