(function () {
  "use strict";

  const mq = (q) => window.matchMedia(q);
  const prefersReduced = mq("(prefers-reduced-motion: reduce)").matches;

  /* ── Переходы включаем после применения стилей ──────────── */

  /* Два кадра: к этому моменту вся цепочка @import уже применена
     и геометрия посчитана, поэтому первый переход не тащит за
     собой скачок от дефолтных размеров.                      */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
  });

  /* ── Перезагрузка открывает страницу сверху ─────────────── */

  /* Браузер сам возвращает позицию скролла при F5, а с плавным
     скроллом это выглядит как рывок вниз на старте. Отключаем
     восстановление и на всякий случай встаём в ноль.        */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("beforeunload", () => window.scrollTo(0, 0));

  /* ── Плавный скролл (Lenis) ─────────────────────────────── */

  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.5 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ── Маска телефона +7 (999) 999 9999 ───────────────────── */

  const initPhoneMask = () => {
    const inputs = document.querySelectorAll('input[type="tel"]');
    if (!inputs.length) return;

    const extractDigits = (raw) => {
      let value = String(raw).replace(/\D/g, "");
      const trimmed = String(raw).trim();

      if (trimmed.startsWith("+7") && value.startsWith("7")) {
        value = value.slice(1);
      } else if (value.length > 10 && (value.startsWith("7") || value.startsWith("8"))) {
        value = value.slice(1);
      } else if (trimmed.startsWith("8") && value.startsWith("8") && value.length >= 11) {
        value = value.slice(1);
      }

      return value.slice(0, 10);
    };

    const formatPhone = (value) => {
      if (!value) return "";

      let formatted = "+7";
      if (value.length > 0) formatted += ` (${value.slice(0, 3)}`;
      if (value.length >= 3) formatted += ")";
      if (value.length > 3) formatted += ` ${value.slice(3, 6)}`;
      if (value.length > 6) formatted += ` ${value.slice(6, 10)}`;
      return formatted;
    };

    const mask = function (event) {
      const prevDigits = this.dataset.phoneDigits || "";
      let value = extractDigits(this.value);

      const isDelete =
        event.inputType === "deleteContentBackward" ||
        event.inputType === "deleteContentForward" ||
        (event.type === "input" && this.value.length < (this.dataset.phoneLen | 0));

      if (isDelete && value.length === prevDigits.length && value.length > 0) {
        value = value.slice(0, -1);
      }

      const formatted = formatPhone(value);
      this.value = formatted;
      this.dataset.phoneDigits = value;
      this.dataset.phoneLen = String(formatted.length);
    };

    inputs.forEach((input) => {
      input.dataset.phoneDigits = extractDigits(input.value);
      input.dataset.phoneLen = String(input.value.length);
      input.addEventListener("input", mask, false);
      input.addEventListener("blur", mask, false);
    });
  };

  initPhoneMask();

  /* ── Плавающие лейблы полей ─────────────────────────────── */

  const syncFieldFilled = (input) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.toggle("is-filled", input.value.trim().length > 0);
  };

  document.querySelectorAll(".field input").forEach((input) => {
    const sync = () => syncFieldFilled(input);
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    input.addEventListener("blur", sync);
    sync();
  });

  // автозаполнение браузера приходит с задержкой
  window.setTimeout(() => {
    document.querySelectorAll(".field input").forEach(syncFieldFilled);
  }, 300);

  /* ── Hero направлений: картинка появляется целиком ──────── */

  document.querySelectorAll(".hero-dir__img").forEach((img) => {
    const show = () => img.classList.add("is-loaded");

    // decode() ждёт не загрузку, а готовность к отрисовке: только
    // после неё картинка выводится разом, а не построчно
    if (img.complete && img.naturalWidth) {
      if (img.decode) img.decode().then(show).catch(show);
      else show();
      return;
    }

    img.addEventListener("load", () => {
      if (img.decode) img.decode().then(show).catch(show);
      else show();
    });
    img.addEventListener("error", show);
  });

  /* ── Hero: вступительный вид → рабочий ──────────────────── */

  /* Состоянием управляет класс has-hero-intro на <html>: он стоит
     прямо в разметке, поэтому шапка и заголовок не успевают
     мигнуть до того, как отработает скрипт.                  */

  /* ── Сколько держится заставка, мс ─────────────────────────
     Главная и направления настраиваются независимо.          */
  const INTRO_MAIN_MS = 1500;   // главная — с большой картинкой
  const INTRO_DIR_MS  = 1000;   // страницы направлений

  const root = document.documentElement;
  if (root.classList.contains("has-hero-intro")) {
    const isDirection = !!document.querySelector(".hero-dir");
    const hold = isDirection ? INTRO_DIR_MS : INTRO_MAIN_MS;

    const drop = () => root.classList.remove("has-hero-intro");

    // на мобильной вступительный вид пропускаем совсем
    if (prefersReduced || mq("(max-width: 767px)").matches) drop();
    else window.setTimeout(drop, hold);
  }

  /* ── Шапка: прозрачная над hero, светлая ниже ───────────── */

  const header = document.querySelector("[data-header]");
  if (header) {
    // пока hero на экране, шапка остаётся прозрачной поверх него
    const hero = document.querySelector("[data-hero-scroll], .hero, .hero-dir");

    // на тёмных страницах (контакты) шапка прозрачная всегда
    const alwaysLight = header.hasAttribute("data-header-transparent");

    const setState = () => {
      let solid;

      if (alwaysLight) {
        solid = false;
      } else if (hero) {
        const bottom = hero.getBoundingClientRect().bottom;
        solid = bottom <= header.offsetHeight;
      } else {
        // на страницах без hero фон светлый — шапка сразу непрозрачная
        solid = true;
      }

      header.classList.toggle("is-scrolled", solid);
    };

    let headerTicking = false;
    const requestHeader = () => {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(() => { headerTicking = false; setState(); });
    };

    setState();
    if (lenis) lenis.on("scroll", requestHeader);
    else window.addEventListener("scroll", requestHeader, { passive: true });
    window.addEventListener("resize", requestHeader);
  }

  /* ── Новости: «Показать еще» ────────────────────────────── */

  const newsMore = document.querySelector("[data-news-more]");
  const newsList = document.querySelector("[data-news-list]");
  if (newsMore && newsList) {
    const STEP = 3;

    newsMore.addEventListener("click", () => {
      const hidden = [...newsList.querySelectorAll(".news-card.is-hidden")];
      if (!hidden.length) return;

      hidden.slice(0, STEP).forEach((card, i) => {
        card.classList.remove("is-hidden");
        card.classList.add("is-appearing");
        card.style.setProperty("animation-delay", `${i * 90}ms`);
        card.addEventListener("animationend", () => card.classList.remove("is-appearing"), { once: true });
      });

      if (!newsList.querySelector(".news-card.is-hidden")) newsMore.hidden = true;
    });
  }

  /* ── Hero «О компании»: 4 положения по скроллу ──────────── */

  const heroTrack = document.querySelector("[data-hero-scroll]");
  if (heroTrack && !prefersReduced) {
    const STOPS = 4;                     // 1: заголовок, 2: второй заголовок,
    const LAST = STOPS - 1;              // 3: первый абзац, 4: второй абзац
    const TAIL_VH = 0.25;                 // хвост после 4-го положения,
                                         // дублирует --hero-tail в CSS

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const part = (p, from, to) => clamp01((p - from) / (to - from));

    const paras = [...heroTrack.querySelectorAll(".hero-about__para")];

    // наклон картинки в каждом из четырёх положений, градусы.
    // Минус — правый угол поднимается вверх (против часовой).
    const ANGLES = [0, -5.49, -8.09, -10.36];

    // угол между соседними положениями — линейно
    const angleAt = (p) => {
      const scaled = clamp01(p) * LAST;
      const i = Math.min(Math.floor(scaled), LAST - 1);
      const t = scaled - i;
      return ANGLES[i] + (ANGLES[i + 1] - ANGLES[i]) * t;
    };

    // натуральные высоты абзацев — для схлопывания без «прыжков»
    const measure = () => {
      paras.forEach((el, i) => {
        el.style.height = "auto";
        heroTrack.style.setProperty(`--h${i + 1}`, `${el.scrollHeight}px`);
        el.style.height = "";
      });
    };

    const metrics = () => {
      const pinned = heroTrack.firstElementChild.offsetHeight;
      const tail = window.innerHeight * TAIL_VH;
      // прогресс добирает 1 до хвоста: последний экран блок
      // просто стоит на месте, давая дочитать текст
      const distance = heroTrack.offsetHeight - pinned - tail;
      const start = heroTrack.getBoundingClientRect().top + window.scrollY;
      return { distance, start };
    };

    let ticking = false;

    const update = () => {
      ticking = false;
      const { distance } = metrics();
      if (distance <= 0) return;

      const p = clamp01(-heroTrack.getBoundingClientRect().top / distance);

      heroTrack.style.setProperty("--p-img", p.toFixed(4));
      heroTrack.style.setProperty("--p-title", part(p, 0, 1 / LAST).toFixed(4));
      heroTrack.style.setProperty("--p-t1", part(p, 1 / LAST, 2 / LAST).toFixed(4));
      heroTrack.style.setProperty("--p-t2", part(p, 2 / LAST, 1).toFixed(4));
      heroTrack.style.setProperty("--img-rot", `${angleAt(p).toFixed(3)}deg`);
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    if (lenis) lenis.on("scroll", request);
    else window.addEventListener("scroll", request, { passive: true });

    window.addEventListener("resize", () => { measure(); request(); });
    window.addEventListener("load", () => { measure(); request(); });
    measure();
    update();
  }

  /* ── Структура посевов: переключение по годам ───────────── */

  document.querySelectorAll("[data-years]").forEach((box) => {
    // TODO: цифры 2022–2024 условные, ждём данные от клиента
    const DATA = {
      2022: { wheat: "6 120 (46%)", flax: "2 410 (18%)", lentil: "3 980 (30%)",
              sunflower: "—", forage: "420 (3%)", fallow: "380 (3%)", total: "13 310 га" },
      2023: { wheat: "5 940 (45%)", flax: "2 630 (20%)", lentil: "4 010 (30%)",
              sunflower: "—", forage: "390 (3%)", fallow: "260 (2%)", total: "13 230 га" },
      2024: { wheat: "5 720 (43%)", flax: "2 880 (22%)", lentil: "4 190 (31%)",
              sunflower: "—", forage: "360 (3%)", fallow: "—", total: "13 150 га" },
      2025: { wheat: "5 581 (42%)", flax: "2 990 (22%)", lentil: "4 448 (33%)",
              sunflower: "—", forage: "348 (3%)", fallow: "—", total: "13 367 га" },
    };

    const buttons = [...box.querySelectorAll("[data-year]")];
    const cells = [...box.querySelectorAll("[data-cell]")];

    const show = (year) => {
      const row = DATA[year];
      if (!row) return;

      cells.forEach((cell) => { cell.textContent = row[cell.dataset.cell] ?? "—"; });
      buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.year === year));
    };

    buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.year)));

    const active = box.querySelector("[data-year].is-active") || buttons[buttons.length - 1];
    if (active) show(active.dataset.year);
  });

  /* ── Графики: кривая разгибается из прямой ──────────────── */

  document.querySelectorAll(".chart-card, .chart-wide").forEach((chart) => {
    const paths = [...chart.querySelectorAll(".chart-line__stroke, .chart-line__fill")];
    const dots = [...chart.querySelectorAll(".chart-card__dot, .chart-dot, .chart-wide__dot")];

    /* Разбираем «d» на команды с аргументами. Морфинг возможен
       только между путями одинаковой структуры, поэтому вместо
       готовых библиотек считаем плоский вариант из самого пути:
       все вертикальные координаты садим на нижнюю линию.      */
    const ARGS = { M: [0, 1], L: [0, 1], C: [0, 1, 0, 1, 0, 1], V: [1], H: [0], Z: [] };

    const parse = (d) => {
      const out = [];
      const tokens = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?|[A-Za-z]/g) || [];
      let cmd = null;

      tokens.forEach((t) => {
        if (/[A-Za-z]/.test(t)) { cmd = t; out.push({ cmd, args: [] }); }
        else if (out.length) out[out.length - 1].args.push(parseFloat(t));
      });
      return out;
    };

    const serialize = (cmds) =>
      cmds.map((c) => c.cmd + c.args.map((n) => Math.round(n * 100) / 100).join(" ")).join("");

    /* нижняя линия — по высоте viewBox, минус пиксель на обводку */
    const svg = chart.querySelector("svg");
    const box = svg ? svg.getAttribute("viewBox").split(/\s+/) : null;
    const baseline = box ? parseFloat(box[3]) - 1 : 0;

    const shapes = paths
      .map((el) => {
        const real = parse(el.getAttribute("d") || "");
        if (!real.length || real.some((c) => ARGS[c.cmd] === undefined)) return null;

        // плоская копия: та же структура команд, но по вертикали ровно
        const flat = real.map((c) => ({
          cmd: c.cmd,
          args: c.args.map((n, i) => (ARGS[c.cmd][i % ARGS[c.cmd].length] ? baseline : n)),
        }));
        return { el, real, flat };
      })
      .filter(Boolean);

    if (!shapes.length) return;

    const draw = (t) => {
      shapes.forEach(({ el, real, flat }) => {
        el.setAttribute(
          "d",
          serialize(
            real.map((c, ci) => ({
              cmd: c.cmd,
              args: c.args.map((n, i) => flat[ci].args[i] + (n - flat[ci].args[i]) * t),
            }))
          )
        );
      });
    };

    const DURATION = parseFloat(getComputedStyle(chart).getPropertyValue("--duration-draw")) || 1400;

    const build = () => {
      dots.forEach((dot, i) => dot.style.setProperty("--i", i));
      chart.classList.add("is-drawn");

      const started = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - started) / DURATION);
        // тот же характер, что у --ease-out: быстрый старт, мягкий выход
        draw(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (prefersReduced || !("IntersectionObserver" in window)) { draw(1); chart.classList.add("is-drawn"); return; }

    draw(0);

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        build();
        obs.unobserve(en.target);
      });
    }, { threshold: 0.25 });

    io.observe(chart);
  });

  /* ── Галерея: центральный кадр крупнее, листание стрелками ─ */

  document.querySelectorAll("[data-gallery]").forEach((row) => {
    const track = row.querySelector("[data-gallery-track]");
    const items = track ? [...track.querySelectorAll("img")] : [];
    if (!items.length) return;

    const root = row.closest(".gallery") || row.parentElement;
    const prev = root.querySelector("[data-gallery-prev]");
    const next = root.querySelector("[data-gallery-next]");

    let index = items.findIndex((el) => el.classList.contains("is-active"));
    if (index < 0) index = Math.floor(items.length / 2);

    /* Размеры замеряем один раз в покое и кешируем: во время анимации
       ширина кадра промежуточная, и замер по ней уводит центр. Из CSS
       переменные читать нельзя — calc() в них браузер не вычисляет.   */
    let side = 0;
    let active = 0;
    let gap = 0;

    const measure = () => {
      gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const idle = items.find((el) => !el.classList.contains("is-active"));
      side = idle ? idle.getBoundingClientRect().width : 0;
      active = items[index].getBoundingClientRect().width;
    };

    /* Позиция считается формулой, а не по offsetLeft: все кадры левее
       активного идут в боковом размере, значит центр активного известен
       заранее — ещё до того, как анимация размера началась.            */
    const place = () => {
      const centre = index * (side + gap) + active / 2;
      track.style.setProperty("--g-shift", (row.clientWidth / 2 - centre) + "px");
    };

    const show = (i) => {
      index = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((el, n) => el.classList.toggle("is-active", n === index));
      place();
    };

    prev?.addEventListener("click", () => show(index - 1));
    next?.addEventListener("click", () => show(index + 1));

    /* Свайп / перетаскивание: лента едет за пальцем, по порогу
       переключает кадр, иначе возвращается. Вертикаль отдаём
       странице — иначе нельзя проскроллить, начав жест на фото. */
    let dragging = false;
    let locked = "";
    let startX = 0;
    let startY = 0;
    let dragX = 0;
    let swiped = false;

    // клик по боковому кадру тоже делает его центральным
    items.forEach((el, n) => el.addEventListener("click", (e) => {
      if (swiped) { e.preventDefault(); e.stopPropagation(); return; }
      show(n);
    }));

    const setDrag = (x) => row.style.setProperty("--g-drag", x + "px");

    const finish = () => {
      if (!dragging) return;
      dragging = false;
      locked = "";
      row.classList.remove("is-swiping");
      const threshold = Math.min(80, row.clientWidth * 0.18);
      swiped = Math.abs(dragX) > 8;
      const nextIndex = dragX < -threshold ? index + 1
        : dragX > threshold ? index - 1
        : index;
      setDrag(0);
      show(nextIndex);
      window.setTimeout(() => { swiped = false; }, 0);
    };

    row.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      locked = "";
      startX = e.clientX;
      startY = e.clientY;
      dragX = 0;
    });

    row.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (locked !== "x") return;
        row.classList.add("is-swiping");
        row.setPointerCapture(e.pointerId);
      }
      if (locked !== "x") return;
      dragX = dx;
      setDrag(dx);
    });

    row.addEventListener("pointerup", finish);
    row.addEventListener("pointercancel", finish);

    measure();
    place();

    window.addEventListener("resize", () => { measure(); place(); });
    // шрифты и --wm пересчитываются после первой отрисовки — перемеряем
    window.addEventListener("load", () => { measure(); place(); });
  });

  /* ── Текущая страница подсвечена в футере ───────────────── */

  (() => {
    /* Сравниваем по разобранному пути, а не по строке href: во
       вложенных папках ссылки идут через ../ и не совпадут.   */
    const here = location.pathname.replace(/\/$/, "/index.html");

    document.querySelectorAll(".footer__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (new URL(href, location.href).pathname === here) link.classList.add("is-current");
    });
  })();

  /* ── Слайдшоу в hero: кросс-фейд по кругу ────────────────── */

  document.querySelectorAll("[data-hero-slides]").forEach((box) => {
    const slides = [...box.querySelectorAll(".hero__slide")];
    const dots = [...document.querySelectorAll(".hero__dot")];
    if (slides.length < 2) return;

    const DELAY = 5000;
    let index = Math.max(0, slides.findIndex((el) => el.classList.contains("is-active")));
    let timer = 0;

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((el, n) => el.classList.toggle("is-active", n === index));
      dots.forEach((el, n) => {
        el.classList.toggle("is-active", n === index);
        el.setAttribute("aria-selected", n === index ? "true" : "false");
      });
    };

    /* таймер перезапускаем от каждого переключения — после клика
       по полоске следующий кадр ждёт полный интервал, а не остаток */
    const play = () => {
      window.clearInterval(timer);
      if (prefersReduced) return;
      timer = window.setInterval(() => show(index + 1), DELAY);
    };

    dots.forEach((dot, n) => dot.addEventListener("click", () => { show(n); play(); }));

    // вкладку свернули — таймер не мотает кадры вхолостую
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.clearInterval(timer);
      else play();
    });

    show(index);
    play();
  });

  /* ── Партнёры: бегущая строка из двух одинаковых наборов ── */

  document.querySelectorAll(".partners__row").forEach((row) => {
    const items = [...row.children].filter((el) => el.classList.contains("partners__item"));
    if (items.length < 2) return;

    const track = document.createElement("div");
    track.className = "partners__track";
    const set = document.createElement("div");
    set.className = "partners__set";
    items.forEach((el) => set.append(el));
    track.append(set, set.cloneNode(true));
    row.append(track);
    row.removeAttribute("data-drag-scroll");

    if (prefersReduced) return;

    const pause = () => { track.style.animationPlayState = "paused"; };
    const play = () => { track.style.animationPlayState = ""; };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause();
      else play();
    });
  });

  /* ── Команда: карточка проявляется, входя в кадр ленты ── */

  document.querySelectorAll(".team__row").forEach((row) => {
    const cards = [...row.children];
    if (!cards.length) return;

    let raf = 0;

    /* Доля карточки, попавшая в видимую часть ленты: 1 — целиком внутри,
       0 — целиком за краем. Считаем на каждом кадре скролла, поэтому
       переход получается непрерывным, без ступенек и без transition. */
    const paint = () => {
      raf = 0;
      const box = row.getBoundingClientRect();

      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        const ratio = r.width ? Math.max(0, Math.min(1, seen / r.width)) : 1;
        card.style.setProperty("--card-in", ratio.toFixed(3));
      });
    };

    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

    row.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    paint();
  });

  /* ── Горизонтальные ленты: тянем мышью ──────────────────── */

  document.querySelectorAll("[data-drag-scroll]").forEach((row) => {
    let startX = 0;
    let startLeft = 0;
    let dragging = false;

    row.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;   // тач листает сам
      dragging = true;
      startX = e.clientX;
      startLeft = row.scrollLeft;
      row.setPointerCapture(e.pointerId);
    });

    row.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const shift = e.clientX - startX;
      if (Math.abs(shift) > 4) row.classList.add("is-dragging");
      row.scrollLeft = startLeft - shift;
    });

    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      row.classList.remove("is-dragging");
      if (e.pointerId !== undefined && row.hasPointerCapture(e.pointerId)) {
        row.releasePointerCapture(e.pointerId);
      }
    };

    row.addEventListener("pointerup", stop);
    row.addEventListener("pointercancel", stop);
    row.addEventListener("pointerleave", stop);
  });

  /* ── Переключатель карты ────────────────────────────────── */

  document.querySelectorAll("[data-switch]").forEach((box) => {
    const buttons = [...box.querySelectorAll("button")];
    if (buttons.length !== 2) return;

    const set = (index) => {
      box.classList.toggle("is-second", index === 1);
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
      box.dispatchEvent(new CustomEvent("switch-change", { detail: { index } }));
    };

    buttons.forEach((b, i) => b.addEventListener("click", () => set(i)));
  });

  /* ── Глобус в блоке поставок (globe.gl) ───────────────────
     Вид настраивается: текстура Земли, цвет атмосферы, дуги
     экспорта, точки присутствия. Библиотека
     подгружается только если на странице есть [data-globe]. */

  (() => {
    const el = document.querySelector("[data-globe]");
    if (!el) return;

    const map = el.closest(".geo__map");
    const sw = map?.querySelector("[data-switch]");
    const GLOBE_SRC = "https://cdn.jsdelivr.net/npm/globe.gl@2.46.1";
    const TEX = "https://unpkg.com/three-globe/example/img";

    const ORIGIN = { lat: 53.15, lng: 66.77, name: "Казахстан" };
    const MARKETS = [
      { lat: 35.0, lng: 103.0, name: "Китай" },
      { lat: 32.4, lng: 53.7, name: "Иран" },
      { lat: 41.3, lng: 64.6, name: "Центральная Азия" },
      { lat: 39.0, lng: 35.2, name: "Турция" },
      { lat: 50.1, lng: 10.0, name: "Европа" }
    ];
    const ARCS = MARKETS.map((to) => ({
      startLat: ORIGIN.lat,
      startLng: ORIGIN.lng,
      endLat: to.lat,
      endLng: to.lng,
      name: `Казахстан → ${to.name}`
    }));
    const PLACES = [ORIGIN, ...MARKETS];
    const VIEW = {
      lat: (ORIGIN.lat + MARKETS.reduce((s, m) => s + m.lat, 0)) / PLACES.length,
      lng: (ORIGIN.lng + MARKETS.reduce((s, m) => s + m.lng, 0)) / PLACES.length,
      altitude: 2.15
    };
    const GREEN = "#5ebf66";
    const ORANGE = "#e1a623";

    const loadScript = (src) => new Promise((resolve, reject) => {
      if (window.Globe) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    const boot = async () => {
      try { await loadScript(GLOBE_SRC); }
      catch { return; }
      if (!window.Globe) return;

      const makeLabel = (d) => {
        const node = document.createElement("div");
        node.className = "geo__label";
        node.textContent = d.name;
        return node;
      };

      const globe = new window.Globe(el, { animateIn: !prefersReduced, waitForGlobeReady: true })
        .globeImageUrl(`${TEX}/earth-blue-marble.jpg`)
        .bumpImageUrl(`${TEX}/earth-topology.png`)
        .backgroundColor("#ffffff")
        .showAtmosphere(true)
        .atmosphereColor("#8ecae6")
        .atmosphereAltitude(0.15)
        .showGraticules(false)
        .arcColor(() => [GREEN, ORANGE])
        .arcStroke(0.6)
        .arcDashLength(0.4)
        .arcDashGap(0.15)
        .arcDashAnimateTime(prefersReduced ? 0 : 2200)
        .arcAltitudeAutoScale(0.35)
        .arcLabel("name")
        .pointColor((d) => (d.name === ORIGIN.name ? GREEN : ORANGE))
        .pointAltitude(0.03)
        .pointRadius(0.45)
        .pointLabel("name")
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.02)
        .htmlElement(makeLabel)
        .ringColor(() => GREEN)
        .ringMaxRadius(2.4)
        .ringPropagationSpeed(1.8)
        .ringRepeatPeriod(prefersReduced ? 0 : 1400);

      const apply = (index) => {
        const exportMode = index !== 1;
        globe
          .arcsData(exportMode ? ARCS : [])
          .pointsData(PLACES)
          .htmlElementsData(PLACES)
          .ringsData([ORIGIN]);
      };

      apply(sw?.classList.contains("is-second") ? 1 : 0);
      sw?.addEventListener("switch-change", (e) => apply(e.detail.index));

      const size = () => globe.width(el.clientWidth).height(el.clientHeight);
      size();
      globe.pointOfView(VIEW, prefersReduced ? 0 : 800);

      const controls = globe.controls();
      controls.autoRotate = false;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = true;

      globe.onGlobeReady(() => map?.classList.add("is-globe"));

      window.addEventListener("resize", size);

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) globe.resumeAnimation();
            else globe.pauseAnimation();
          });
        }, { threshold: 0.05 });
        io.observe(map || el);
      }
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        boot();
      }, { rootMargin: "200px" });
      io.observe(map || el);
    } else {
      boot();
    }
  })();

  /* ── Мобильное меню ─────────────────────────────────────── */

  const burger = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        if (a.matches("[aria-haspopup]")) return;
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ── Выпадающие пункты меню ─────────────────────────────── */

  document.querySelectorAll("[data-nav-drop]").forEach((item) => {
    const btn = item.querySelector("[aria-haspopup]");
    if (!btn) return;

    const set = (open) => {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    };

    btn.addEventListener("click", (e) => {
      // на десктопе список открывает наведение, клик по ссылке ведёт дальше
      if (mq("(hover: hover)").matches && btn.tagName === "A") return;
      e.preventDefault();
      set(!item.classList.contains("is-open"));
    });

    /* На тач-экране касание сначала даёт фокус и наведение —
       список открывается, — а следом приходит click и тут же
       его закрывает: пункт приходилось жать дважды. Оба этих
       способа вешаем только там, где есть настоящий указатель;
       на телефоне список открывает само касание.             */
    if (mq("(hover: hover)").matches) {
      item.addEventListener("mouseenter", () => set(true));
      item.addEventListener("mouseleave", () => set(false));
      item.addEventListener("focusin", () => set(true));
      item.addEventListener("focusout", (e) => {
        if (!item.contains(e.relatedTarget)) set(false);
      });
    }
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { set(false); btn.blur(); }
    });
  });

  /* ── Аккордеон (FAQ) ────────────────────────────────────── */

  document.querySelectorAll("[data-accordion]").forEach((list) => {
    const items = [...list.querySelectorAll(".faq-item")];

    const set = (item, open) => {
      item.classList.toggle("is-open", open);
      const btn = item.querySelector("button");
      if (btn) btn.setAttribute("aria-expanded", String(open));
    };

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !list.contains(btn)) return;
      const item = btn.closest(".faq-item");
      const open = !item.classList.contains("is-open");
      items.forEach((i) => set(i, i === item && open));
    });
  });

  /* ── Кастомный select ───────────────────────────────────── */

  document.querySelectorAll("[data-select]").forEach((select) => {
    const toggle = select.querySelector(".select__toggle");
    const label = select.querySelector("[data-select-label]");
    const input =
      select.querySelector("[data-select-input]") ||
      select.querySelector('input[type="hidden"]');
    const options = [...select.querySelectorAll('[role="option"]')];
    if (!toggle || !label || !input) return;

    const open = (state) => {
      select.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", String(state));
    };

    const choose = (option) => {
      options.forEach((o) => o.setAttribute("aria-selected", String(o === option)));
      label.textContent = option.textContent;
      input.value = option.dataset.value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      open(false);
      toggle.focus();
    };

    toggle.addEventListener("click", () => open(!select.classList.contains("is-open")));
    options.forEach((o) => o.addEventListener("click", () => choose(o)));

    select.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { open(false); toggle.focus(); }
    });

    document.addEventListener("click", (e) => {
      if (!select.contains(e.target)) open(false);
    });
  });

  /* ── Блокировка скролла ─────────────────────────────────── */

  const scrollLock = { x: 0, y: 0, count: 0 };

  const lockScroll = () => {
    if (scrollLock.count++ > 0) return;
    scrollLock.x = window.scrollX;
    scrollLock.y = window.scrollY;
    if (lenis) lenis.stop();
    document.documentElement.classList.add("is-locked");
  };

  const unlockScroll = () => {
    if (scrollLock.count === 0) return;
    if (--scrollLock.count > 0) return;
    document.documentElement.classList.remove("is-locked");
    if (lenis) lenis.start();
    window.scrollTo(scrollLock.x, scrollLock.y);
  };

  /* ── Fancybox: просмотр лицензий ────────────────────────── */

  (() => {
    const Fancybox = window.Fancybox;
    if (!Fancybox?.bind || !document.querySelector("[data-fancybox]")) return;

    Fancybox.bind("[data-fancybox]", {
      groupAll: false,
      compact: false,
      on: {
        init: lockScroll,
        close: unlockScroll
      }
    });
  })();

  /* ── Модальные окна (<dialog>) ──────────────────────────── */

  const modalAnimMs = prefersReduced ? 0 : 280;

  const openDialog = (dlg) => {
    if (dlg.open) return;
    lockScroll();
    try {
      dlg.classList.remove("is-visible");
      dlg.showModal();
      window.scrollTo(scrollLock.x, scrollLock.y);
      requestAnimationFrame(() => {
        window.scrollTo(scrollLock.x, scrollLock.y);
        requestAnimationFrame(() => dlg.classList.add("is-visible"));
      });
    } catch (err) {
      unlockScroll();
      throw err;
    }
  };

  const closeDialog = (dlg) => {
    if (!dlg.open || dlg.dataset.closing === "1") return;
    if (prefersReduced || !dlg.classList.contains("is-visible")) {
      dlg.classList.remove("is-visible");
      dlg.close();
      return;
    }

    dlg.dataset.closing = "1";
    dlg.classList.remove("is-visible");

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dlg.dataset.closing = "";
      if (dlg.open) dlg.close();
    };
    const onEnd = (e) => {
      if (e.target !== dlg) return;
      dlg.removeEventListener("transitionend", onEnd);
      finish();
    };

    dlg.addEventListener("transitionend", onEnd);
    setTimeout(finish, modalAnimMs);
  };

  document.querySelectorAll("[data-modal-open]").forEach((btn) => {
    const dlg = document.getElementById(btn.dataset.modalOpen);
    if (!dlg) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDialog(dlg);
    });
  });

  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.querySelectorAll("[data-modal-close]").forEach((b) =>
      b.addEventListener("click", () => closeDialog(dlg))
    );

    dlg.addEventListener("click", (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right &&
                     e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeDialog(dlg);
    });

    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeDialog(dlg);
    });

    dlg.addEventListener("close", () => {
      dlg.classList.remove("is-visible");
      dlg.dataset.closing = "";
      unlockScroll();
    });
  });

  /* ── Якорные ссылки с учётом высоты шапки ───────────────── */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = header ? header.offsetHeight + 12 : 0;
      if (lenis) lenis.scrollTo(target, { offset: -offset });
      else window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    });
  });

  /* ── Появление секций при скролле ───────────────────────── */

  const revealUnique = [
    ...new Set(
      document.querySelectorAll(
        ".reveal, main > section:not(.hero):not(.hero-dir):not(.hero-about-track), main > article.article, .footer"
      )
    ),
  ];

  const showReveal = (el, delay = 0) => {
    if (el.classList.contains("is-visible")) return;
    el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.classList.add("is-visible");
  };

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealUnique.forEach((el) => showReveal(el));
  } else if (revealUnique.length) {
    let batch = 0;
    let batchTimer = 0;

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const delay = batch * 90;
          batch += 1;
          showReveal(en.target, delay);
          obs.unobserve(en.target);
          window.clearTimeout(batchTimer);
          batchTimer = window.setTimeout(() => { batch = 0; }, 120);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );

    revealUnique.forEach((el) => io.observe(el));

    // страховка: если что-то не попало в наблюдателя
    window.setTimeout(() => revealUnique.forEach((el) => showReveal(el)), 2500);
  }
})();
