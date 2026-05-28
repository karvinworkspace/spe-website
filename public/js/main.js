/* =============================================
   Shree Parameswari Enterprises — Public JS
   ============================================= */

let SITE = null;
let allProducts = [];

async function init() {
  try {
    const res = await fetch('/api/sitedata');
    SITE = await res.json();
    allProducts = SITE.products;
    applyCompany();
    applyHero();
    applyFilters();
    renderProducts(allProducts);
    applyLocation();
    applyContact();
    initScrollEffects();
  } catch(e) {
    console.error('Failed to load site data:', e);
  }
}

// ── Company ──────────────────────────────────────────────────────────────────
function applyCompany() {
  const c = SITE.company;
  document.title = c.name + ' | Thermocol & Foam Sheets — Chennai';
  setTxt('companyName', c.name);
  setTxt('footerName', c.name);
  setTxt('footerTagline', c.tagline || '');
  setTxt('footerCopyright', '© ' + new Date().getFullYear() + ' ' + c.name + '. All rights reserved.');
  setTxt('footerAddr', '📍 ' + c.address);
  setSrc('siteLogo',   c.logo);
  setSrc('footerLogo', c.logo);
  setHref('navWA',   'https://wa.me/' + c.whatsapp + '?text=Hello!%20I%20want%20to%20enquire%20about%20your%20products.');
  setHref('heroWA',  'https://wa.me/' + c.whatsapp + '?text=Hello!%20I%20want%20to%20enquire%20about%20your%20products.');
  setHref('ctaWA',   'https://wa.me/' + c.whatsapp + '?text=Hello!%20I%20want%20to%20enquire%20about%20your%20products.');
  setHref('footerPhone', 'tel:' + c.phone.replace(/\s/g,''));
  setTxt('footerPhone', '📞 ' + c.phone);
  setHref('footerWA',  'https://wa.me/' + c.whatsapp);
  setHref('footerMap', c.mapsLink);
  const porterBtn = document.getElementById('porterBtn');
  if (porterBtn) {
    porterBtn.onclick = function() {
      window.open('https://wa.me/' + c.whatsapp + '?text=Hello!%20I%20need%20to%20book%20a%20porter%20for%20delivery.', '_blank');
    };
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function applyHero() {
  const h = SITE.hero;
  setTxt('heroBadge', h.badge);
  setTxt('heroHeading', h.heading);
  setTxt('heroHL', h.headingHighlight);
  setTxt('heroDesc', h.description);

  const tagsEl = document.getElementById('heroTags');
  if (tagsEl) tagsEl.innerHTML = (h.tags || []).map(function(t){ return '<span>' + t + '</span>'; }).join('');

  const statsEl = document.getElementById('heroStats');
  const icons = ['📦','📐','🏪','⭐'];
  if (statsEl) statsEl.innerHTML = (h.stats || []).map(function(s, i){
    return '<div class="stat-card' + (i===3?' highlight-card':'') + '">' +
      '<div class="stat-icon">' + (icons[i]||'⭐') + '</div>' +
      '<div class="stat-val">' + s.val + '</div>' +
      '<div class="stat-lab">' + s.lab + '</div>' +
    '</div>';
  }).join('');
}

// ── Filters ───────────────────────────────────────────────────────────────────
function applyFilters() {
  const tabs = document.getElementById('filterTabs');
  if (!tabs) return;
  const cats = SITE.categories || [];
  let html = '<button class="filter-btn active" onclick="filterProducts(\'all\',this)">All Products</button>';
  cats.forEach(function(cat) {
    html += '<button class="filter-btn" onclick="filterProducts(\'' + cat + '\',this)">' + capitalize(cat) + '</button>';
  });
  tabs.innerHTML = html;
}

function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  const filtered = cat === 'all' ? allProducts : allProducts.filter(function(p){ return p.category === cat; });
  renderProducts(filtered);
}

// ── Products ──────────────────────────────────────────────────────────────────
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = '<p class="loading-msg">No products found.</p>';
    return;
  }

  let html = '';
  products.forEach(function(p, i) {
    const imgHTML = p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/><div class="card-placeholder" style="display:none">' + (p.icon||'📦') + '</div>'
      : '<div class="card-placeholder">' + (p.icon||'📦') + '</div>';

    const badgeHTML = p.badge
      ? '<span class="card-badge" style="background:' + (p.badgeColor||'#2563eb') + '">' + p.badge + '</span>'
      : '';

    const sizesPreview = p.sizes.slice(0,6).join(' · ') + (p.sizes.length > 6 ? ' · …' : '');

    html += '<div class="product-card reveal" style="transition-delay:' + (i*0.06) + 's" data-pid="' + i + '">' +
      '<div class="card-img">' + imgHTML + badgeHTML +
        '<span class="card-type">' + capitalize(p.category) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<h3>' + p.name + '</h3>' +
        '<p>' + truncate(p.description, 90) + '</p>' +
        '<div class="card-sizes">' + sizesPreview + '</div>' +
        '<div class="card-footer">' +
          '<span class="card-quality" style="background:' + (p.color||'#eff6ff') + '40;color:' + (p.badgeColor||'#2563eb') + '">' + p.quality + '</span>' +
          '<span class="card-arrow">→</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  grid.innerHTML = html;

  // Attach click events using index to avoid quote issues in IDs
  grid.querySelectorAll('.product-card').forEach(function(card) {
    const idx = parseInt(card.getAttribute('data-pid'));
    card.addEventListener('click', function() {
      openModal(products[idx].id);
    });
  });

  setTimeout(observeReveal, 50);
}

function openModal(id) {
  const p = allProducts.find(function(x){ return x.id === id; });
  if (!p) return;
  const c = SITE.company;
  const waMsg = encodeURIComponent('Hello! I\'m interested in ' + p.name + '. Please share pricing and availability.');
  const overlay = document.getElementById('modalOverlay');

  const imgHTML = p.image
    ? '<img src="' + p.image + '" alt="' + p.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/><div class="modal-img-ph" style="display:none">' + (p.icon||'📦') + '</div>'
    : '<div class="modal-img-ph">' + (p.icon||'📦') + '</div>';

  const badgeHTML = p.badge
    ? '<span class="card-badge" style="background:' + p.badgeColor + ';position:absolute;top:14px;left:14px">' + p.badge + '</span>'
    : '';

  const sizeTags = p.sizes.map(function(s){ return '<span class="size-tag">' + s + '</span>'; }).join('');

  overlay.innerHTML =
    '<div class="modal" role="dialog">' +
      '<div class="modal-img">' +
        imgHTML +
        '<button class="modal-close" id="modalCloseBtn">✕</button>' +
        badgeHTML +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="modal-header">' +
          '<h2 class="modal-title">' + p.name + '</h2>' +
          '<span class="modal-cat-badge" style="background:' + (p.badgeColor||'#2563eb') + '">' + capitalize(p.category) + '</span>' +
        '</div>' +
        '<p class="modal-desc">' + p.description + '</p>' +
        '<div class="modal-info-grid">' +
          '<div class="modal-info-box"><div class="modal-info-label">Quality</div><div class="modal-info-val">' + p.quality + '</div></div>' +
          '<div class="modal-info-box"><div class="modal-info-label">Sheet / Pack Size</div><div class="modal-info-val">' + p.sheetSize + '</div></div>' +
        '</div>' +
        '<div class="sizes-section">' +
          '<div class="sizes-title">Available Sizes / Variants</div>' +
          '<div class="sizes-list">' + sizeTags + '</div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<a href="https://wa.me/' + c.whatsapp + '?text=' + waMsg + '" target="_blank" class="modal-btn-wa" rel="noopener">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
            ' WhatsApp Enquiry' +
          '</a>' +
          '<a href="' + c.mapsLink + '" target="_blank" class="modal-btn-map" rel="noopener">📍 Our Location</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Attach close button event
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ── Location ──────────────────────────────────────────────────────────────────
function applyLocation() {
  const c = SITE.company;
  setAttr('mapEmbed', 'src', c.mapsEmbed);
  setTxt('mapCompanyName', c.name);
  setTxt('mapAddress', '📍 ' + c.address);
  setHref('mapsLink', c.mapsLink);
  setTxt('locSubtext', 'Visit our shop — ' + c.address);
}

// ── Contact ───────────────────────────────────────────────────────────────────
function applyContact() {
  const c = SITE.company;
  const cards = document.getElementById('contactCards');
  if (!cards) return;
  cards.innerHTML =
    '<div class="contact-card">' +
      '<div class="contact-card-icon">📞</div>' +
      '<div class="contact-card-label">Phone</div>' +
      '<div class="contact-card-val"><a href="tel:' + c.phone.replace(/\s/g,'') + '">' + c.phone + '</a></div>' +
    '</div>' +
    '<div class="contact-card">' +
      '<div class="contact-card-icon">💬</div>' +
      '<div class="contact-card-label">WhatsApp</div>' +
      '<div class="contact-card-val"><a href="https://wa.me/' + c.whatsapp + '" target="_blank" rel="noopener">+' + c.whatsapp + '</a></div>' +
    '</div>' +
    '<div class="contact-card" style="grid-column:1/-1">' +
      '<div class="contact-card-icon">📍</div>' +
      '<div class="contact-card-label">Address</div>' +
      '<div class="contact-card-val">' + c.address + '</div>' +
    '</div>' +
    '<div class="contact-card">' +
      '<div class="contact-card-icon">🕐</div>' +
      '<div class="contact-card-label">Hours</div>' +
      '<div class="contact-card-val">' + c.hours + '</div>' +
    '</div>' +
    '<div class="contact-card">' +
      '<div class="contact-card-icon">🚚</div>' +
      '<div class="contact-card-label">Delivery</div>' +
      '<div class="contact-card-val">Porter Booking Available</div>' +
    '</div>';
}

// ── Scroll effects ─────────────────────────────────────────────────────────
function initScrollEffects() {
  window.addEventListener('scroll', function() {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  });
  observeReveal();
}

function observeReveal() {
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
}

// ── Nav ────────────────────────────────────────────────────────────────────
function navScrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}

// ── Utils ──────────────────────────────────────────────────────────────────
function setTxt(id, v)         { const e=document.getElementById(id); if(e) e.textContent=v; }
function setSrc(id, v)         { const e=document.getElementById(id); if(e) e.src=v; }
function setHref(id, v)        { const e=document.getElementById(id); if(e) e.href=v; }
function setAttr(id, a, v)     { const e=document.getElementById(id); if(e) e.setAttribute(a,v); }
function capitalize(s)         { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function truncate(s, n)        { return s && s.length>n ? s.slice(0,n)+'…' : s; }

init();
