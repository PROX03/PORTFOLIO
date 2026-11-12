/* ==========================================================================
   Md Prottoy Bhuyian — portfolio renderer (vanilla JavaScript, no dependencies)
   Reads every file in /content, builds the page, then wires up navigation,
   pop-up panels, the lightbox, animations and the contact form.
   All content is inserted as text nodes, never as HTML, so edits made in the
   admin panel cannot break or inject markup.
   ========================================================================== */
(function () {
  'use strict';

  var FILES = ['site', 'profile', 'proof', 'about', 'research', 'education', 'experience',
    'case-studies', 'projects', 'competitions', 'skills', 'extracurricular',
    'certificates', 'photos', 'contact'];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var data = {};

  /* Netlify Identity sends invite and password-reset links to the home page.
     Pass them on to /admin/, where the login widget lives. */
  if (/(invite|recovery|confirmation|email_change)_token=|access_token=/.test(location.hash)) {
    location.replace('/admin/' + location.hash);
    return;
  }

  /* ---------- Small helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /** Create an element. attrs: {class, text, rich, ...attributes}; children: nodes or strings. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'rich') node.appendChild(rich(value));
      else node.setAttribute(key, value === true ? '' : value);
    });
    [].concat(children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Text with optional **bold** parts, returned as safe DOM nodes. */
  function rich(text) {
    var frag = document.createDocumentFragment();
    String(text || '').split(/\*\*(.+?)\*\*/g).forEach(function (part, i) {
      if (!part) return;
      frag.appendChild(i % 2 ? el('strong', { text: part }) : document.createTextNode(part));
    });
    return frag;
  }

  /** Only items whose "visible" switch is on (missing means visible). */
  function shown(list) {
    return (Array.isArray(list) ? list : []).filter(function (item) {
      return item && (typeof item !== 'object' || item.visible !== false);
    });
  }

  /** Allow only safe link targets coming from content files. */
  function safeUrl(url) {
    url = String(url || '').trim();
    return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) ? url : '';
  }
  function isExternal(url) { return /^https?:\/\//i.test(url); }

  function link(attrs, children) {
    if (isExternal(attrs.href)) { attrs.target = '_blank'; attrs.rel = 'noopener'; }
    return el('a', attrs, children);
  }

  function fill(node, children) {
    if (!node) return;
    node.textContent = '';
    [].concat(children || []).forEach(function (c) { if (c) node.appendChild(c); });
  }

  /* ---------- Icons: one consistent line set (Lucide-style, 24px grid) ---------- */
  var ICONS = {
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  };
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONS[name] || ICONS.link; // fixed strings from this file only
    return svg;
  }

  /* ---------- Load content ---------- */
  function load(name) {
    return fetch('/content/' + name + '.json', { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error(name); return res.json(); })
      .then(function (json) { data[name] = json || {}; })
      .catch(function () { data[name] = {}; console.warn('Could not load content/' + name + '.json'); });
  }

  /* ---------- Renderers, one per section ---------- */

  function renderSite() {
    var site = data.site, sections = site.sections || {};
    if (site.site_title) document.title = site.site_title;
    Object.keys(sections).forEach(function (key) {
      var s = sections[key] || {};
      var title = $('[data-title="' + key + '"]');
      var intro = $('[data-intro="' + key + '"]');
      var nav = $('[data-nav="' + key + '"]');
      if (title && s.title) title.textContent = s.title;
      if (nav && s.nav) nav.textContent = s.nav;
      if (intro) { intro.textContent = s.intro || ''; intro.hidden = !s.intro; }
    });
    if (site.footer_line) $('#footer-line').textContent = site.footer_line;
    if (site.last_updated) {
      var date = new Date(site.last_updated + 'T00:00:00');
      var label = isNaN(date) ? site.last_updated
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      fill($('#footer-updated'), [
        document.createTextNode((site.last_updated_label || 'Last updated') + ': '),
        el('time', { datetime: site.last_updated, text: label })
      ]);
    }
  }

  function renderProfile() {
    var p = data.profile;
    $$('[data-f^="profile."]').forEach(function (node) {
      var value = p[node.getAttribute('data-f').split('.')[1]];
      if (value) node.textContent = value;
    });
    if (shown(p.status).length) {
      fill($('#hero-status'), shown(p.status).map(function (s) {
        return el('li', { class: 'chip chip--status', text: s });
      }));
    }
    var photo = $('#hero-photo');
    if (safeUrl(p.headshot) && photo.getAttribute('src') !== p.headshot) photo.src = p.headshot;
    if (p.headshot_alt) photo.alt = p.headshot_alt;
    if (safeUrl(p.cv_file)) $$('[data-cv]').forEach(function (a) { a.href = p.cv_file; });
    if (p.cv_label) $$('[data-cv-label]').forEach(function (s) { s.textContent = p.cv_label; });
    if (safeUrl(p.linkedin_url)) $('#hero-linkedin').href = p.linkedin_url;
  }

  function renderProof() {
    var items = shown(data.proof.items);
    if (!items.length) return;
    fill($('#proof'), items.map(function (item) {
      var value = el('span', { class: 'proof__value' }, [
        item.prefix ? el('small', { text: item.prefix }) : null,
        item.prefix ? ' ' : null,
        el('span', { 'data-count': item.value, text: item.value }),
        item.suffix || null
      ]);
      return el('li', { class: 'proof__item' }, [value, el('span', { class: 'proof__label', text: item.label })]);
    }));
  }

  function renderAbout() {
    var a = data.about;
    fill($('#about-text'), shown(a.paragraphs).map(function (p) { return el('p', { rich: p }); }));
    var looking = $('#about-looking');
    looking.hidden = !a.looking_text;
    fill(looking, [el('h3', { text: a.looking_title || '' }), el('p', { rich: a.looking_text })]);

    var edu = shown(data.education.items);
    fill($('#about-education'), edu.length ? [
      el('h3', { class: 'block-title', text: data.education.title || 'Education' }),
      el('ol', { class: 'mini-timeline' }, edu.map(function (e) {
        return el('li', {}, [
          el('strong', { text: e.qualification }),
          el('span', { text: [e.institution, e.period].filter(Boolean).join(' · ') }),
          e.detail ? el('span', { rich: e.detail }) : null
        ]);
      }))
    ] : []);

    var langs = shown(a.languages);
    fill($('#about-languages'), langs.length ? [
      el('h3', { class: 'block-title', text: a.languages_title || 'Languages' }),
      el('ul', { class: 'langs' }, langs.map(function (l) {
        return el('li', {}, [el('span', { text: l.name }), el('span', { text: l.level })]);
      }))
    ] : []);

    var research = shown(data.research.items);
    fill($('#about-research'), research.length ? [el('div', { class: 'research' }, [
      el('h3', { class: 'block-title', text: data.research.title || 'Research interests' }),
      el('ul', { class: 'research__grid' }, research.map(function (r) {
        return el('li', { class: 'card' }, [el('strong', { text: r.title }), r.detail ? el('p', { rich: r.detail }) : null]);
      }))
    ])] : []);
  }

  function renderExperience() {
    fill($('#impact-list'), shown(data.experience.items).map(function (x) {
      return el('li', {}, [el('article', { class: 'card' }, [
        el('h3', { text: x.role }),
        el('p', { class: 'card__org', text: x.organisation }),
        el('p', { class: 'card__meta', text: [x.context, x.period].filter(Boolean).join(' ') }),
        shown(x.bullets).length ? el('p', { class: 'eyebrow', text: x.bullets_label || 'What I do' }) : null,
        el('ul', { class: 'bullets' }, shown(x.bullets).map(function (b) { return el('li', { rich: b }); }))
      ])]);
    }));
  }

  function caseItems() { return shown(data['case-studies'].items).filter(function (c) { return c.id; }); }

  function renderCases() {
    var labels = data['case-studies'].labels || {};
    fill($('#cases-list'), caseItems().map(function (c) {
      return el('article', { class: 'card card--hover case-card' }, [
        c.badge ? el('span', { class: 'badge', text: c.badge }) : null,
        el('h3', { text: c.title }),
        el('p', { class: 'card__meta', text: c.organiser }),
        c.summary ? el('p', { rich: c.summary }) : null,
        el('a', { class: 'case-card__link', href: '#case-' + c.id }, [
          el('span', {}, [labels.open || 'Read case study', el('span', { class: 'visually-hidden', text: ': ' + c.title })]),
          icon('arrow')
        ])
      ]);
    }));
  }

  function renderProjects() {
    fill($('#projects-list'), shown(data.projects.items).map(function (p) {
      var url = safeUrl(p.link);
      return el('article', { class: 'card card--hover' }, [
        el('h3', { text: p.title }),
        el('p', { class: 'card__meta', text: p.type }),
        el('p', { rich: p.description }),
        url ? el('p', {}, [link({ href: url, text: p.link_label || 'View project' })]) : null
      ]);
    }));
  }

  function renderCompetitions() {
    var ids = caseItems().map(function (c) { return c.id; });
    var list = $('#competitions-list');
    list.className = 'rows rows--comp';
    fill(list, shown(data.competitions.items).map(function (c) {
      var hasCase = c.case_id && ids.indexOf(c.case_id) !== -1;
      return el('li', {}, [
        el('span', { class: 'rows__title' }, [c.name, c.organiser ? el('span', { text: ', ' + c.organiser }) : null]),
        el('span', { class: 'rows__text', rich: c.result }),
        hasCase ? el('a', { class: 'rows__link', href: '#case-' + c.case_id }, [
          data.competitions.case_link_label || 'View case study',
          el('span', { class: 'visually-hidden', text: ': ' + c.name })
        ]) : el('span')
      ]);
    }));
  }

  function renderSkills() {
    var s = data.skills;
    fill($('#skills-list'), shown(s.groups).map(function (g) {
      return el('div', {}, [
        el('h3', { text: g.title }),
        el('ul', { class: 'chips' }, shown(g.items).map(function (item) {
          return el('li', { class: 'chip' }, [item.name,
            item.learning ? el('span', { class: 'chip__tag', text: s.learning_label || 'learning' }) : null]);
        }))
      ]);
    }));
    var ai = s.ai || {}, box = $('#skills-ai'), gh = safeUrl(ai.github_url);
    box.hidden = !ai.title;
    fill(box, [
      el('h3', { text: ai.title || '' }),
      el('ul', { class: 'bullets' }, shown(ai.lines).map(function (l) { return el('li', { rich: l }); })),
      ai.note ? el('p', { class: 'ai__note', rich: ai.note }) : null,
      gh ? link({ class: 'btn btn--outline btn--small', href: gh }, [icon('github'), ai.github_label || 'GitHub']) : null
    ]);
  }

  function renderExtra() {
    var x = data.extracurricular, list = $('#extracurricular-list');
    list.className = 'rows rows--extra';
    fill(list, shown(x.items).map(function (item) {
      return el('li', {}, [
        el('span', { class: 'rows__title' }, [item.role, el('span', {}, [', ', rich(item.organisation)])]),
        el('p', { class: 'rows__text', rich: item.description })
      ]);
    }));
    var interests = $('#interests');
    interests.hidden = !x.interests;
    fill(interests, [el('strong', { text: (x.interests_title || 'Interests') + ': ' }), rich(x.interests)]);
  }

  /** Certificates and event photos share one grid layout and the lightbox. */
  function renderGallery(key, subKey) {
    var items = shown(data[key].items).filter(function (i) { return safeUrl(i.image); });
    var section = $('#' + key), navItem = $('[data-nav="' + key + '"]').parentNode;
    section.hidden = navItem.hidden = !items.length; // hide grid and nav link while empty
    fill($('#' + key + '-list'), items.map(function (item, index) {
      var meta = [item[subKey], item.year].filter(Boolean).join(' · ');
      var button = el('button', { class: 'gallery__btn', type: 'button', 'aria-label': 'View larger: ' + item.title }, [
        el('img', { src: item.image, alt: [item.title, item[subKey]].filter(Boolean).join(', '), width: 640, height: 480, loading: 'lazy', decoding: 'async' })
      ]);
      button.addEventListener('click', function () { openLightbox(items, index, subKey); });
      return el('li', {}, [button, el('p', { class: 'gallery__title', text: item.title }), meta ? el('p', { class: 'gallery__meta', text: meta }) : null]);
    }));
  }

  function renderContact() {
    var c = data.contact, form = c.form || {};
    $$('[data-form]').forEach(function (node) {
      var value = form[node.getAttribute('data-form')];
      if (value) node.textContent = value;
    });
    var links = shown(c.links).filter(function (l) { return safeUrl(l.url); });
    var socialSeen = false;
    fill($('#contact-links'), links.map(function (l) {
      var firstSocial = l.group === 'social' && !socialSeen;
      if (firstSocial) socialSeen = true;
      return el('li', { class: firstSocial ? 'is-social-first' : null }, [
        link({ href: l.url }, [icon(l.icon), el('b', { text: l.label }), el('span', { text: l.display || '' })])
      ]);
    }));
    fill($('#footer-icons'), links.map(function (l) {
      return el('li', {}, [link({ href: l.url, 'aria-label': l.label, title: l.label }, [icon(l.icon)])]);
    }));
    var loc = $('#contact-location');
    loc.hidden = !c.location;
    fill(loc, [icon('pin'), document.createTextNode(c.location || '')]);
  }

  /* ---------- Case study pop-up panel (native <dialog>: focus trap + Esc built in) ---------- */
  var caseDialog = $('#case-dialog'), lightbox = $('#lightbox');

  function caseBlock(title, text, points) {
    var list = shown(points);
    if (!text && !list.length) return [];
    return [
      el('h3', { text: title }),
      text ? el('p', { rich: text }) : null,
      list.length ? el('ul', { class: 'bullets' }, list.map(function (p) { return el('li', { rich: p }); })) : null
    ];
  }

  function buildCase(c) {
    var L = data['case-studies'].labels || {};
    var shots = shown(c.screenshots).filter(function (s) { return safeUrl(s.image); });
    var files = shown(c.downloads).filter(function (d) { return safeUrl(d.file); });
    var parts = [
      c.badge ? el('span', { class: 'badge', text: c.badge }) : null,
      el('h2', { id: 'case-dialog-title', text: c.title }),
      el('p', { class: 'case__organiser', text: c.organiser })
    ].concat(
      caseBlock(L.context || 'Context', c.context),
      caseBlock(L.role || 'My role', c.role),
      caseBlock(L.approach || 'Approach', c.approach_text, c.approach),
      caseBlock(L.outcome || 'Outcome', c.outcome, c.outcome_points),
      caseBlock(L.learned || 'What I learned', '', c.learned)
    );
    if (shots.length) {
      parts.push(el('h3', { text: L.screenshots || 'Screenshots' }));
      parts.push(el('div', { class: 'case__shots' }, shots.map(function (s) {
        return el('img', { src: s.image, alt: s.alt || c.title + ' screenshot', width: 1200, height: 675, loading: 'lazy', decoding: 'async' });
      })));
    }
    if (files.length) {
      parts.push(el('h3', { text: L.downloads || 'Downloads' }));
      parts.push(el('div', { class: 'case__downloads' }, files.map(function (d) {
        return el('a', { class: 'btn btn--outline btn--small', href: d.file, download: true }, [icon('download'), d.label || 'Download']);
      })));
    }
    return el('article', { class: 'case' }, parts);
  }

  function showDialog(dialog) {
    if (dialog.open) return;
    dialog.showModal();
    document.documentElement.classList.add('is-locked');
  }

  /** Open the case study named in the URL hash (#case-<id>), or close the panel. */
  function syncCaseToHash() {
    var match = /^#case-(.+)$/.exec(location.hash);
    var item = match && caseItems().filter(function (c) { return c.id === decodeURIComponent(match[1]); })[0];
    if (item) {
      fill($('#case-dialog-content'), [buildCase(item)]);
      showDialog(caseDialog);
      caseDialog.scrollTop = 0;
    } else if (caseDialog.open) {
      caseDialog.close();
    }
  }

  function initDialogs() {
    [caseDialog, lightbox].forEach(function (dialog) {
      dialog.addEventListener('click', function (event) {
        // click on the dark backdrop or the close button
        if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
      });
      dialog.addEventListener('close', function () {
        document.documentElement.classList.remove('is-locked');
      });
      // keep Tab inside the open panel (wrap from last control to first and back)
      dialog.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') return;
        var items = $$('a[href], button', dialog).filter(function (n) { return n.offsetParent !== null; });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
    });
    caseDialog.addEventListener('close', function () {
      // remove the #case-… hash without jumping the page
      if (/^#case-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + '#cases');
    });
    window.addEventListener('hashchange', syncCaseToHash);
    syncCaseToHash();
  }

  /* ---------- Lightbox ---------- */
  var lb = { items: [], index: 0, sub: 'issuer' };

  function drawLightbox() {
    var item = lb.items[lb.index], url = safeUrl(item.link);
    var img = $('#lightbox-img');
    img.src = item.image;
    img.alt = [item.title, item[lb.sub]].filter(Boolean).join(', ');
    fill($('#lightbox-caption'), [
      el('strong', { text: item.title }),
      el('span', { text: [item[lb.sub], item.year].filter(Boolean).join(' · ') }),
      url ? link({ href: url }, [item.link_label || 'Open link']) : null
    ]);
    var many = lb.items.length > 1;
    $('#lightbox-prev').hidden = $('#lightbox-next').hidden = !many;
  }
  function stepLightbox(delta) {
    lb.index = (lb.index + delta + lb.items.length) % lb.items.length;
    drawLightbox();
  }
  function openLightbox(items, index, sub) {
    lb = { items: items, index: index, sub: sub };
    drawLightbox();
    showDialog(lightbox);
  }
  function initLightbox() {
    $('#lightbox-prev').addEventListener('click', function () { stepLightbox(-1); });
    $('#lightbox-next').addEventListener('click', function () { stepLightbox(1); });
    lightbox.addEventListener('keydown', function (event) {
      if (lb.items.length < 2) return;
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    });
  }

  /* ---------- Navigation: mobile menu, current section, progress line ---------- */
  function initNav() {
    var toggle = $('#nav-toggle'), nav = $('#site-nav');
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (event) { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('#site-header')) setOpen(false);
    });

    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          $$('.nav a').forEach(function (a) {
            if (a.getAttribute('data-nav') === entry.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      $$('main section[id]').forEach(function (s) { spy.observe(s); });
    }

    if (reduceMotion) return;
    var bar = $('#progress-bar'), ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Motion: fade-and-rise on scroll, count-up on the proof numbers ---------- */
  function initMotion() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var targets = $$('.section__head, .card, .rows > li, .skills > div, .prose, .gallery > li, .form, .contact__direct, #about-education, #about-languages, .research .block-title');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (node) {
      // leave anything already on screen alone, so nothing flashes on load
      if (node.getBoundingClientRect().top < window.innerHeight) return;
      node.classList.add('reveal');
      observer.observe(node);
    });

    $$('[data-count]').forEach(function (node) {
      var finalText = node.getAttribute('data-count');
      var target = parseFloat(finalText);
      if (isNaN(target)) return;
      var decimals = (finalText.split('.')[1] || '').length;
      var start = null, duration = 1100;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = t < 1 ? (target * eased).toFixed(decimals) : finalText;
        if (t < 1) requestAnimationFrame(frame);
      }
      node.textContent = (0).toFixed(decimals);
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Contact form (Netlify Forms, sent without leaving the page) ---------- */
  function initForm() {
    var form = $('#contact-form'), status = $('#form-status'), button = $('button[type="submit"]', form);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var messages = (data.contact && data.contact.form) || {};
      button.disabled = true;
      status.className = 'form__status';
      status.textContent = '';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('Form error ' + res.status);
        form.reset();
        status.classList.add('is-success');
        status.textContent = messages.success_message || 'Thank you. Your message has been sent.';
      }).catch(function () {
        status.textContent = messages.error_message || 'Sorry, the message could not be sent. Please email me directly.';
      }).then(function () { button.disabled = false; });
    });
  }

  /* ---------- Start ---------- */
  initNav();
  initForm();
  initLightbox();

  Promise.all(FILES.map(load)).then(function () {
    [renderSite, renderProfile, renderProof, renderAbout, renderExperience, renderCases,
      renderProjects, renderCompetitions, renderSkills, renderExtra, renderContact,
      function () { renderGallery('certificates', 'issuer'); },
      function () { renderGallery('photos', 'event'); }
    ].forEach(function (render) {
      try { render(); } catch (error) { console.error(error); } // one bad file must not blank the page
    });
    initDialogs();
    initMotion();
    // if the page was opened on a section link, re-align once content has filled in
    if (location.hash && !/^#case-/.test(location.hash)) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  });
})();
