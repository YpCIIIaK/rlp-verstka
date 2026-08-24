(function () {
  "use strict";

  const mq = (q) => window.matchMedia(q);
  const prefersReduced = mq("(prefers-reduced-motion: reduce)").matches;




  const reveal = () => {
    if (document.documentElement.classList.contains("is-ready")) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
    });
  };
  if (document.readyState === "complete") reveal();
  else window.addEventListener("load", reveal);
  window.setTimeout(reveal, 4000);




  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("beforeunload", () => window.scrollTo(0, 0));



  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.5 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }



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


  window.setTimeout(() => {
    document.querySelectorAll(".field input").forEach(syncFieldFilled);
  }, 300);



  document.querySelectorAll(".hero-dir__img").forEach((img) => {
    const show = () => img.classList.add("is-loaded");


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






  const INTRO_MAIN_MS = 1500;
  const INTRO_DIR_MS  = 1000;

  const root = document.documentElement;
  if (root.classList.contains("has-hero-intro")) {
    const isDirection = !!document.querySelector(".hero-dir");
    const hold = isDirection ? INTRO_DIR_MS : INTRO_MAIN_MS;

    const drop = () => root.classList.remove("has-hero-intro");


    if (prefersReduced || mq("(max-width: 767px)").matches) drop();
    else window.setTimeout(drop, hold);
  }



  const header = document.querySelector("[data-header]");
  if (header) {

    const hero = document.querySelector("[data-hero-scroll], .hero, .hero-dir");


    const alwaysLight = header.hasAttribute("data-header-transparent");
    const scrollSolid = header.hasAttribute("data-header-scroll");

    const setState = () => {
      let solid;

      if (alwaysLight) {
        solid = false;
      } else if (scrollSolid) {
        const y = lenis ? lenis.scroll : window.scrollY;
        solid = y > 24;
      } else if (hero) {
        const bottom = hero.getBoundingClientRect().bottom;
        solid = bottom <= header.offsetHeight;
      } else {

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



  const heroTrack = document.querySelector("[data-hero-scroll]");
  if (heroTrack && !prefersReduced) {
    const STOPS = 4;
    const LAST = STOPS - 1;
    const TAIL_VH = 0.25;


    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const part = (p, from, to) => clamp01((p - from) / (to - from));

    const paras = [...heroTrack.querySelectorAll(".hero-about__para")];


    const ANGLES = [0, -5.49, -8.09, -10.36];


    const angleAt = (p) => {
      const scaled = clamp01(p) * LAST;
      const i = Math.min(Math.floor(scaled), LAST - 1);
      const t = scaled - i;
      return ANGLES[i] + (ANGLES[i + 1] - ANGLES[i]) * t;
    };


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



  document.querySelectorAll("[data-years]").forEach((box) => {

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



  document.querySelectorAll(".chart-card, .chart-wide").forEach((chart) => {
    const paths = [...chart.querySelectorAll(".chart-line__stroke, .chart-line__fill")];
    const dots = [...chart.querySelectorAll(".chart-card__dot, .chart-dot, .chart-wide__dot")];


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


    const svg = chart.querySelector("svg");
    const box = svg ? svg.getAttribute("viewBox").split(/\s+/) : null;
    const baseline = box ? parseFloat(box[3]) - 1 : 0;

    const shapes = paths
      .map((el) => {
        const real = parse(el.getAttribute("d") || "");
        if (!real.length || real.some((c) => ARGS[c.cmd] === undefined)) return null;


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



  if (typeof Swiper !== "undefined") {
    document.querySelectorAll("[data-gallery]").forEach((el) => {
      const root = el.closest(".gallery") || el.parentElement;
      const prev = root.querySelector("[data-gallery-prev]");
      const next = root.querySelector("[data-gallery-next]");
      const count = el.querySelectorAll(".swiper-slide").length;
      const start = count > 2 ? 2 : 0;

      const swiper = new Swiper(el, {
        slidesPerView: "auto",
        centeredSlides: true,
        spaceBetween: 12,
        speed: 520,
        initialSlide: start,
        grabCursor: true,
        slideToClickedSlide: true,
        watchSlidesProgress: true,
        resistanceRatio: 0.7,
        longSwipesRatio: 0.2,
        threshold: 8,
        navigation: prev && next ? { prevEl: prev, nextEl: next } : undefined,
        on: {
          resize(s) { s.update(); },
          touchStart() { if (lenis) lenis.stop(); },
          touchEnd() { if (lenis) lenis.start(); },
        },
      });

      window.addEventListener("load", () => swiper.update());
    });

    document.querySelectorAll("[data-team]").forEach((el) => {
      const cards = [...el.querySelectorAll(".team-card")];

      const paint = () => {
        const box = el.getBoundingClientRect();
        cards.forEach((card) => {
          const r = card.getBoundingClientRect();
          const seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
          const ratio = r.width ? Math.max(0, Math.min(1, seen / r.width)) : 1;
          card.style.setProperty("--card-in", ratio.toFixed(3));
        });
      };

      new Swiper(el, {
        slidesPerView: "auto",
        grabCursor: true,
        speed: 500,
        breakpoints: {
          0: { spaceBetween: 12, centeredSlides: true },
          768: { spaceBetween: 32, centeredSlides: false },
        },
        on: {
          init: paint,
          setTranslate: paint,
          resize: paint,
        },
      });
    });
  }



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

    const play = () => {
      window.clearInterval(timer);
      if (prefersReduced) return;
      timer = window.setInterval(() => show(index + 1), DELAY);
    };

    dots.forEach((dot, n) => dot.addEventListener("click", () => { show(n); play(); }));

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.clearInterval(timer);
      else play();
    });

    show(index);
    play();
  });







  (() => {

    const here = location.pathname.replace(/\/$/, "/index.html");

    document.querySelectorAll(".footer__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (new URL(href, location.href).pathname === here) link.classList.add("is-current");
    });
  })();



  document.querySelectorAll(".partners__row").forEach((row) => {
    const items = [...row.children].filter((el) => el.classList.contains("partners__item"));
    if (items.length < 2) return;

    const track = document.createElement("div");
    track.className = "partners__track";
    const set = document.createElement("div");
    set.className = "partners__set";
    items.forEach((el) => set.append(el));
    track.append(set);
    row.append(track);
    row.removeAttribute("data-drag-scroll");

    const fill = () => {
      [...track.querySelectorAll(".partners__set")].forEach((el, i) => { if (i) el.remove(); });
      const base = set.scrollWidth;
      if (!base) return;
      const copies = Math.max(2, Math.ceil((row.clientWidth * 2) / base) + 1);
      for (let i = 1; i < copies; i++) track.append(set.cloneNode(true));
      track.style.setProperty("--marquee-shift", `-${base}px`);
    };

    fill();
    window.addEventListener("load", fill);
    window.addEventListener("resize", fill);

    if (prefersReduced) return;

    const pause = () => { track.style.animationPlayState = "paused"; };
    const play = () => { track.style.animationPlayState = ""; };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause();
      else play();
    });
  });



  document.querySelectorAll("[data-drag-scroll]").forEach((row) => {
    let startX = 0;
    let startLeft = 0;
    let dragging = false;

    row.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
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



  (() => {
    const el = document.querySelector("[data-globe]");
    if (!el) return;

    const map = el.closest(".geo__map");
    const sw = map?.querySelector("[data-switch]");
    const GLOBE_SRC = "https://cdn.jsdelivr.net/npm/globe.gl@2.46.1";
    const GEO_SRC = "https://cdn.jsdelivr.net/gh/vasturiano/globe.gl@master/example/datasets/ne_110m_admin_0_countries.geojson";

    const ORIGIN = { lat: 51.1694, lng: 71.4278, name: "Казахстан" };
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
    const VIEW_EXPORT = {
      lat: (ORIGIN.lat + MARKETS.reduce((s, m) => s + m.lat, 0)) / PLACES.length,
      lng: (ORIGIN.lng + MARKETS.reduce((s, m) => s + m.lng, 0)) / PLACES.length,
      altitude: 2.15
    };
    const VIEW_KZ = { lat: 51.1694, lng: 71.4278, altitude: 0.62 };
    const GREEN = "#5ebf66";
    const ORANGE = "#e1a623";
    const PARTNER_ISO = new Set(["CN", "IR", "TR", "UZ", "KG", "TJ", "TM", "DE", "FR", "IT", "PL", "ES", "NL", "GB", "AT", "BE", "CZ", "RO"]);

    const oceanTex = () => {
      const c = document.createElement("canvas");
      c.width = 4;
      c.height = 2;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#f3f3f3";
      ctx.fillRect(0, 0, 4, 2);
      return c.toDataURL("image/png");
    };

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

      let countries = [];
      try {
        const geo = await fetch(GEO_SRC).then((r) => r.json());
        countries = (geo.features || []).filter((d) => {
          const iso = d.properties?.ISO_A2;
          return iso && iso !== "AQ" && iso !== "-99";
        });
      } catch {
        countries = [];
      }

      const makeLabel = (d) => {
        const node = document.createElement("div");
        node.className = "geo__label";
        node.textContent = d.name;
        return node;
      };

      const isoOf = (feat) => String(feat.properties?.ISO_A2 || feat.properties?.ISO_A3 || "");

      const capColor = (feat) => {
        const iso = isoOf(feat);
        if (iso === "KZ") return GREEN;
        if (PARTNER_ISO.has(iso)) return "rgba(94, 191, 102, 0.38)";
        return "#c9c9c9";
      };

      const globe = new window.Globe(el, {
        animateIn: false,
        waitForGlobeReady: true,
        rendererConfig: { antialias: false, alpha: false, powerPreference: "high-performance" }
      })
        .globeImageUrl(oceanTex())
        .bumpImageUrl(null)
        .backgroundColor("#ffffff")
        .showAtmosphere(false)
        .showGraticules(false)
        .enablePointerInteraction(false)
        .polygonsData(countries)
        .polygonCapColor(capColor)
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "#6f6f6f")
        .polygonAltitude(0.006)
        .polygonCapCurvatureResolution(2)
        .polygonsTransitionDuration(0)
        .arcColor(() => [GREEN, ORANGE])
        .arcStroke(0.55)
        .arcDashLength(1)
        .arcDashGap(0)
        .arcDashAnimateTime(0)
        .arcAltitudeAutoScale(0.35)
        .arcsTransitionDuration(0)
        .pointColor((d) => (d.name === ORIGIN.name ? GREEN : ORANGE))
        .pointAltitude(0.015)
        .pointRadius(0.32)
        .pointsTransitionDuration(0)
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.02)
        .htmlTransitionDuration(0)
        .htmlElement(makeLabel)
        .htmlElementVisibilityModifier((node, on) => {
          node.style.opacity = on ? "1" : "0";
        });

      const renderer = globe.renderer?.();
      if (renderer?.setPixelRatio) renderer.setPixelRatio(1);

      const controls = globe.controls();
      controls.autoRotate = false;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = true;
      controls.enableDamping = false;
      controls.rotateSpeed = 0.55;

      let visible = true;
      let idle = 0;
      const wake = (ms = 800) => {
        if (!visible || document.hidden) return;
        globe.resumeAnimation();
        window.clearTimeout(idle);
        idle = window.setTimeout(() => globe.pauseAnimation(), ms);
      };

      const look = (index) => {
        const view = index === 1 ? VIEW_KZ : VIEW_EXPORT;
        globe.pointOfView(view, prefersReduced ? 0 : 900);
        wake(1000);
      };

      const apply = (index) => {
        const exportMode = index !== 1;
        globe
          .arcsData(exportMode ? ARCS : [])
          .pointsData(exportMode ? PLACES : [ORIGIN])
          .htmlElementsData(exportMode ? PLACES : [ORIGIN]);
        look(index);
      };

      apply(sw?.classList.contains("is-second") ? 1 : 0);
      sw?.addEventListener("switch-change", (e) => apply(e.detail.index));

      const size = () => globe.width(el.clientWidth).height(el.clientHeight);
      size();

      globe.onGlobeReady(() => {
        map?.classList.add("is-globe");
        wake(1200);
      });

      el.addEventListener("pointerdown", () => wake(4000));
      controls.addEventListener("start", () => wake(4000));
      controls.addEventListener("end", () => wake(600));
      window.addEventListener("resize", () => { size(); wake(800); });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) globe.pauseAnimation();
        else if (visible) wake(800);
      });

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            visible = en.isIntersecting;
            if (visible) wake(800);
            else globe.pauseAnimation();
          });
        }, { threshold: 0.08 });
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



  document.querySelectorAll("[data-nav-drop]").forEach((item) => {
    const btn = item.querySelector("[aria-haspopup]");
    if (!btn) return;

    const set = (open) => {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    };

    btn.addEventListener("click", (e) => {

      if (mq("(hover: hover)").matches && btn.tagName === "A") return;
      e.preventDefault();
      set(!item.classList.contains("is-open"));
    });


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



  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || link.hasAttribute("data-modal-open")) return;
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


    window.setTimeout(() => revealUnique.forEach((el) => showReveal(el)), 2500);
  }
})();
