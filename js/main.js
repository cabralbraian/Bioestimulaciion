(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- DNA generator ---- */
  const NS = 'http://www.w3.org/2000/svg';
  const helixGroups = [];
  function helix(svg, w, h, amp, period, rot, parent) {
    if (!svg) return null;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `rotate(${rot} ${w / 2} ${h / 2})`);
    const pts = (ph) => { let d = ''; for (let y = -60; y <= h + 60; y += 6) d += `${y === -60 ? 'M' : 'L'}${(w / 2 + amp * Math.sin(y / period + ph)).toFixed(1)} ${y} `; return d; };
    const add = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; };
    for (let y = -60; y <= h + 60; y += 15) {
      const a = amp * Math.sin(y / period), depth = Math.cos(y / period);
      add('line', { x1: w / 2 + a, x2: w / 2 - a, y1: y, y2: y, stroke: '#35c3ff', 'stroke-width': 1, opacity: (0.18 + 0.3 * Math.abs(depth)).toFixed(2) });
      add('circle', { cx: w / 2 + a, cy: y, r: 2 + 1.4 * depth, fill: '#7fdcff', opacity: (0.5 + 0.4 * depth).toFixed(2) });
      add('circle', { cx: w / 2 - a, cy: y, r: 2 - 1.4 * depth, fill: '#35c3ff', opacity: (0.5 - 0.3 * depth).toFixed(2) });
    }
    add('path', { d: pts(0), fill: 'none', stroke: '#7fdcff', 'stroke-width': 2, opacity: .85 });
    add('path', { d: pts(Math.PI), fill: 'none', stroke: '#35c3ff', 'stroke-width': 2, opacity: .6 });
    (parent || svg).appendChild(g);
    helixGroups.push({ el: g, rot, cx: w / 2, cy: h / 2 });
    return g;
  }
  const dna = $('#dnaSvg');
  if (dna) { dna.style.filter = 'drop-shadow(0 0 8px rgba(53,195,255,.55))'; helix(dna, 300, 560, 80, 38, 22); }
  const hh = $('.helix-lines');
  if (hh && hh.ownerSVGElement) helix(hh.ownerSVGElement, 400, 800, 110, 60, 18, hh);
  const introDna = $('#introDnaSvg');
  if (introDna) { introDna.style.filter = 'drop-shadow(0 0 10px rgba(53,195,255,.5))'; helix(introDna, 300, 560, 70, 36, 16); }

  /* ---- Elementos Clave de Scroll ---- */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav'), progressBar = $('#scrollProgress');
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link', nav);
  const trackerDots = $$('.tracker-dot');
  const orb1 = $('#orb1'), orb2 = $('#orb2');
  const stepsEl = $('.steps');
  const stepsProgress = $('#stepsProgress');
  const stepItems = $$('.step');

  /* ---- Dinámica de Scroll Suave ---- */
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  const updateScrollDynamics = () => {
    const y = window.scrollY;
    const innerH = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - innerH;

    // 1. Header con sombra y blur dinámico
    header.classList.toggle('scrolled', y > 40);

    // 2. Barra de lectura superior
    if (progressBar) {
      const pct = maxScroll > 0 ? (y / maxScroll) * 100 : 0;
      progressBar.style.width = pct + '%';
    }

    // 3. Orbes de fondo reactivos
    if (orb1 && !reduce) {
      orb1.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
    }
    if (orb2 && !reduce) {
      orb2.style.transform = `translate3d(0, ${(-y * 0.1).toFixed(1)}px, 0)`;
    }

    // 4. Rotación del ADN con el scroll
    if (!reduce && helixGroups.length) {
      helixGroups.forEach(({ el, rot, cx, cy }) => {
        const currentRot = rot + (y * 0.04);
        el.setAttribute('transform', `rotate(${currentRot.toFixed(2)} ${cx} ${cy})`);
      });
    }

    // 5. Progreso interactivo de los pasos (01 -> 02 -> 03 -> 04)
    if (stepsEl && stepsProgress) {
      const r = stepsEl.getBoundingClientRect();
      if (r.top < innerH * 0.8 && r.bottom > 0) {
        // En pantalla
        const progress = Math.max(0, Math.min(1, (innerH * 0.7 - r.top) / (r.height || 1)));
        stepsProgress.style.width = (progress * 76).toFixed(1) + '%';

        stepItems.forEach((st, idx) => {
          const threshold = (idx + 0.2) / stepItems.length;
          st.classList.toggle('is-active', progress >= threshold);
        });
      }
    }

    // 6. Detección de Sección Activa para Nav y Tracker Lateral
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      if (y >= top) currentId = sec.getAttribute('id');
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
      });
      trackerDots.forEach(dot => {
        dot.classList.toggle('active', dot.getAttribute('href') === '#' + currentId);
      });
    }

    lastScrollY = y;
    scrollTicking = false;
  };

  addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScrollDynamics);
    }
  }, { passive: true });
  updateScrollDynamics();

  /* ---- Menu Hamburguesa ---- */
  if (burger) {
    burger.addEventListener('click', () => {
      const o = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', o);
      nav.classList.toggle('open', o);
      document.body.style.overflow = o ? 'hidden' : '';
    });
  }
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    if (burger) burger.setAttribute('aria-expanded', false);
    nav.classList.remove('open');
    document.body.style.overflow = '';
  }));

  /* ---- Pantalla de Presentación / Intro Splash (Opción 3) ---- */
  const introScreen = $('#introScreen');
  const introBrand = $('#introBrand');
  const introDnaFill = $('#introDnaFill');
  const introTitleFill = $('#introTitleFill');
  const introPct = $('#introPct');
  const introEnterBtn = $('#introEnterBtn');
  const hero = $('.hero');

  let introDone = false;
  const finishIntro = () => {
    if (introDone || !introScreen) return;
    introDone = true;

    // Asegurar 100% de luz
    if (introDnaFill) introDnaFill.style.clipPath = 'inset(0% 0 0 0)';
    if (introTitleFill) introTitleFill.style.clipPath = 'inset(0 0% 0 0)';
    if (introPct) introPct.textContent = '100%';
    if (introBrand) introBrand.classList.add('flash');

    setTimeout(() => {
      introScreen.classList.add('is-exiting');
      setTimeout(() => {
        if (hero) hero.classList.add('go');
      }, 260);

      setTimeout(() => {
        introScreen.classList.add('is-finished');
        document.body.style.overflow = '';
      }, 950);
    }, 200);
  };

  if (introScreen) {
    document.body.style.overflow = 'hidden';

    const startTime = performance.now();
    const introDuration = 2200; // 2.2 segundos para una carga fluida y elegante

    const updateIntro = (now) => {
      if (introDone) return;
      const p = Math.min((now - startTime) / introDuration, 1);
      // Easing suave cuadrático
      const easeP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const currentPct = Math.round(easeP * 100);

      // 1. El ADN se llena de energía de abajo hacia arriba (inset top)
      if (introDnaFill) {
        introDnaFill.style.clipPath = `inset(${Math.max(0, 100 - currentPct)}% 0 0 0)`;
      }

      // 2. El nombre BIOESTIMULACIÓN se llena de luz de izquierda a derecha (inset right)
      if (introTitleFill) {
        introTitleFill.style.clipPath = `inset(0 ${Math.max(0, 100 - currentPct)}% 0 0)`;
      }

      // 3. Porcentaje numérico limpio
      if (introPct) {
        introPct.textContent = currentPct + '%';
      }

      if (p < 1) {
        requestAnimationFrame(updateIntro);
      } else {
        finishIntro();
      }
    };
    requestAnimationFrame(updateIntro);

    if (introEnterBtn) introEnterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishIntro();
    });
    introScreen.addEventListener('click', () => {
      finishIntro();
    });
    addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && !introDone) finishIntro();
    });
  } else {
    if (hero) requestAnimationFrame(() => setTimeout(() => hero.classList.add('go'), 150));
  }

  /* ---- Reveal on scroll ---- */
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }), { threshold: .1, rootMargin: '0px 0px -4% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---- Parallax continuo en imágenes ---- */
  const par = $$('[data-parallax]');
  if (!reduce && par.length) {
    let tickPar = false;
    const runPar = () => {
      const innerH = window.innerHeight;
      par.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerH + 100) return;
        const k = parseFloat(el.dataset.parallax);
        const off = (r.top + r.height / 2 - innerH / 2) * -k;
        el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
      });
      tickPar = false;
    };
    addEventListener('scroll', () => {
      if (!tickPar) {
        tickPar = true;
        requestAnimationFrame(runPar);
      }
    }, { passive: true });
    runPar();
  }

  /* ---- Contadores numéricos animados ---- */
  const counters = $$('.counter');
  if (counters.length) {
    const counterIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10) || 0;
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const duration = 1600;
          const start = performance.now();

          const update = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const easeP = 1 - Math.pow(1 - p, 3);
            const val = Math.round(easeP * target);
            el.textContent = `${prefix}${val.toLocaleString('es-UY')}${suffix}`;
            if (p < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          counterIo.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(c => counterIo.observe(c));
  }

  /* ---- Filtro interactivo de tratamientos ---- */
  const filterTabs = $$('.treat__tab');
  const treatCards = $$('.card[data-category]');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;

      treatCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.classList.remove('is-hidden');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s var(--ease), transform 0.4s var(--ease)';
            card.style.opacity = '1';
            card.style.transform = 'none';
          });
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });

  /* ---- Microinteracción 3D Tilt en Cards ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    treatCards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);

        const rx = ((y - r.height / 2) / (r.height / 2)) * -6;
        const ry = ((x - r.width / 2) / (r.width / 2)) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---- Modal interactivo de Tratamiento ---- */
  const tModal = $('#tModal');
  const tModalOverlay = $('#tModalOverlay');
  const tModalClose = $('#tModalClose');
  const tModalImg = $('#tModalImg');
  const tModalTitle = $('#tModalTitle');
  const tModalDesc = $('#tModalDesc');
  const tModalTag = $('#tModalTag');
  const tModalWaBtn = $('#tModalWaBtn');

  const openModal = (card) => {
    if (!tModal) return;
    const title = card.dataset.treatment || 'Tratamiento';
    const desc = card.dataset.desc || '';
    const img = card.dataset.img || '';
    const cat = card.dataset.category || 'Medicina Regenerativa';

    tModalTitle.textContent = title;
    tModalDesc.textContent = desc;
    tModalTag.textContent = cat.toUpperCase();
    if (img) tModalImg.src = img;

    const waMsg = encodeURIComponent(`Hola, quisiera consultar por el tratamiento de ${title} que vi en la web de Bioestimulación.`);
    tModalWaBtn.href = `https://api.whatsapp.com/send?phone=+59892374367&text=${waMsg}`;

    tModal.classList.add('is-open');
    tModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!tModal) return;
    tModal.classList.remove('is-open');
    tModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  treatCards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });
  if (tModalClose) tModalClose.addEventListener('click', closeModal);
  if (tModalOverlay) tModalOverlay.addEventListener('click', closeModal);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tModal && tModal.classList.contains('is-open')) closeModal();
  });

  /* ---- Before / After Interactivos con Auto-Peek Demo ---- */
  const baElements = $$('.ba');
  let hasPeeked = false;

  baElements.forEach(ba => {
    const b = $('.ba__before', ba), a = $('.ba__after', ba), h = $('.ba__handle', ba);
    const src = ba.dataset.img || ba.dataset.before;
    if (src) {
      const img = new Image();
      img.onload = () => {
        b.style.backgroundImage = `url("${img.src}")`;
        a.style.backgroundImage = `url("${img.src}")`;
        ba.classList.add('has-img');
      };
      img.src = src;
    }

    const set = (p) => {
      p = Math.max(2, Math.min(98, p));
      ba.style.setProperty('--p', p + '%');
      if (h) h.setAttribute('aria-valuenow', Math.round(p));
    };

    const move = (clientX) => {
      const r = ba.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    };

    let drag = false;
    ba.addEventListener('pointerdown', e => {
      drag = true;
      hasPeeked = true; // El usuario ya tomó control manual
      ba.classList.add('drag');
      ba.setPointerCapture(e.pointerId);
      move(e.clientX);
    });
    ba.addEventListener('pointermove', e => {
      if (drag) move(e.clientX);
    });
    const end = () => { drag = false; ba.classList.remove('drag'); };
    ba.addEventListener('pointerup', end);
    ba.addEventListener('pointercancel', end);

    if (h) {
      h.addEventListener('keydown', e => {
        hasPeeked = true;
        const cur = parseFloat(getComputedStyle(ba).getPropertyValue('--p')) || 50;
        if (e.key === 'ArrowLeft') set(cur - 4);
        if (e.key === 'ArrowRight') set(cur + 4);
      });
    }
  });

  // Auto-Peek demostración al llegar con el scroll a Resultados
  const resultsSec = $('#resultados');
  if (resultsSec && baElements.length) {
    const resultsIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasPeeked && !reduce) {
          hasPeeked = true;
          const firstBa = baElements[0];
          const duration = 1800;
          const start = performance.now();

          const animatePeek = (now) => {
            const p = Math.min((now - start) / duration, 1);
            // Curva sinusoidal: 50 -> 30 -> 70 -> 50
            const offset = Math.sin(p * Math.PI * 2) * 20;
            firstBa.style.setProperty('--p', `${(50 + offset).toFixed(1)}%`);
            if (p < 1 && !firstBa.classList.contains('drag')) {
              requestAnimationFrame(animatePeek);
            } else if (!firstBa.classList.contains('drag')) {
              firstBa.style.setProperty('--p', '50%');
            }
          };
          requestAnimationFrame(animatePeek);
          resultsIo.unobserve(resultsSec);
        }
      });
    }, { threshold: 0.35 });
    resultsIo.observe(resultsSec);
  }

  const track = $('#baTrack');
  if (track) {
    const step = () => {
      const first = track.querySelector('.ba');
      return first ? first.getBoundingClientRect().width + 16 : 300;
    };
    const nextBtn = $('#baNext'), prevBtn = $('#baPrev');
    if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  }

  /* ---- FAQ: solo uno abierto a la vez ---- */
  const ds = $$('details');
  ds.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) ds.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ---- Botón Flotante WhatsApp ---- */
  const waBtn = $('#waBtn');

  /* ---- Efecto magnético sutil en botones ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    $$('.btn--magnetic').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---- Cursor custom suave (solo desktop) ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    const c = document.createElement('div');
    c.className = 'cursor';
    document.body.appendChild(c);
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => {
      tx = e.clientX;
      ty = e.clientY;
      c.classList.add('on');
    });
    (function loop() {
      x += (tx - x) * .18;
      y += (ty - y) * .18;
      c.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', e => {
      c.classList.toggle('big', !!e.target.closest('.card, .ba, .btn, .wa-btn, .treat__tab, .tracker-dot'));
    });
  }
})();
