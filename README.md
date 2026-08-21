# RLP — вёрстка

Вёрстка в стандартах Factum: чистые **HTML + CSS + ванильный JS**, без сборщиков,
progressive enhancement. Структура повторяет hairline.kz / UAK_trade.

## Структура

```
index.html                # главная (скелет с секциями-заготовками)
assets/images/            # картинки из Figma, с явными width/height
assets/logo/              # SVG-логотип
assets/fonts/             # woff2/woff (положить и раскомментировать @font-face)
assets/favicon/           # favicon
assets/vendor/            # самохостинг библиотек (lenis.min.js), pinned-версии
src/styles/main.css       # точка входа — только @import в порядке каскада
  ├ vars.css              # дизайн-токены :root (цвета/типографика/отступы)
  ├ fonts.css             # @font-face
  ├ global.css            # reset, типографика, утилиты, reveal
  ├ header.css            # шапка + мобильное меню
  ├ footer.css            # футер
  └ style.css             # кнопки, поля, модалка, FAQ, блоки страниц
src/lib/main.js           # единый IIFE: Lenis, меню, модалки, аккордеон, select,
                          # маска телефона, якоря, reveal
```

## Правила

- **Один main.css** — только `@import`, порядок = каскад.
- Новые стили блока → `style.css`; медиа-запросы блока класть **сразу за блоком**.
- Правки шапки/футера → в их файлы; новые токены → `vars.css`.
- После правки файла бампать его `?v=` в main.css (и `?v=` main.css в HTML при правке main.css).
- Инлайн-стилей нет. JS-хуки через `data-*`, состояния — классы `is-*`.
- Значения из макета пишем как `calc(N * var(--wm))` — вёрстка тянется от `--width-base`
  (1440 / 768 / 390). Никаких «магических» px.

## Что уже работает в заготовке

- Шапка: появление, сжатие при скролле, бургер, выпадающее подменю (hover / tap на мобиле).
- Модалка на `<dialog>`: анимация, клик по подложке, Esc, блокировка скролла.
- Поля: плавающие лейблы, маска телефона `+7 (999) 999 9999`, состояния error/success.
- Аккордеон FAQ, кастомный select, якорные ссылки с учётом высоты шапки.
- Плавный скролл Lenis + появление секций при скролле, всё с `prefers-reduced-motion`.

## Типографика

Шрифты самохостятся в `assets/fonts` (woff2, сабсеты latin / latin-ext / cyrillic / cyrillic-ext):

- **Inter** 400 / 500 / 700 — основной, `--font-sans`.
- **Euclid Flex** 300 / 400 / 500 / 600 / 700 — `--font-alt`, для Button/Extra small.
  Из поставки клиента (`euclid-flex.zip`, ttf → woff2/woff через fonttools), кириллица есть.
  Italic и Thin/UltraLight не подключены (в макете нет) — лежат в архиве.

Токены названы по слоям Figma, есть парные классы-утилиты:

| Figma | токены | класс |
|---|---|---|
| Hero/Heading | `--text-hero` | `.hero-heading` |
| Section/Heading | `--text-section-h` | `.section-heading` |
| Section/Description | `--text-section-desc` | `.section-description` |
| Section/Label | `--text-section-label` | `.section-label` |
| Stats/Value · Prefix · Unit · Description | `--text-stats-*` | `.stats-value` · `.stats-prefix` · `.stats-unit` · `.stats-description` |
| Card/Label · Heading-large/medium/small · Description · Meta · Action | `--text-card-*` | `.card-label` · `.card-heading-l/m/s` · `.card-description` · `.card-meta` · `.card-action` |
| Button/Medium · Small · Extra small | `--text-btn-*` | `.btn` · `.btn--sm` · `.btn--xs` |

`h1`–`h5` — алиасы на эти же токены (h1 = Hero, h2 = Section, h3–h5 = Card).
`line-height` безразмерный (`px_line / px_size`), поэтому корректно тянется вместе с `--wm`.

## Плейсхолдеры к замене

- [ ] Палитра `--color-*` / `--main-*` в vars.css — из макета.
- [ ] Мобильные размеры `--text-*` в медиа 767px — сейчас рабочий даунскейл, нужен мобильный макет.
- [ ] Логотип, favicon, hero-картинка (preload + fetchpriority).
- [ ] Телефон, e-mail, адрес, соцсети, WhatsApp-ссылка, canonical/OG/JSON-LD.
- [ ] Секции главной и внутренние страницы.
- [ ] Отправка формы (WordPress REST / CF7).
