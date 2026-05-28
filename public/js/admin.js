/* =============================================
   Shree Parameswari Enterprises — Admin JS
   ============================================= */

let SITE = null;

// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
async function init() {
  const authRes = await fetch('/api/admin/check');
  const auth = await authRes.json();
  if (!auth.isAdmin) { window.location.href = '/admin'; return; }

  const res = await fetch('/api/sitedata');
  SITE = await res.json();

  populateCompanyForm();
  populateHeroForm();
  populateCategoryList();
  populateLocationForm();
  populateContactForm();
  renderAdminProducts();
  renderDashboard();
}

// ════════════════════════════════════════════════════════
// TAB NAVIGATION
// ════════════════════════════════════════════════════════
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.snav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.snav-btn').forEach(b => {
    if (b.getAttribute('onclick').includes("'" + name + "'")) b.classList.add('active');
  });
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
function renderDashboard() {
  const stats = [
    { sv: SITE.products.length, sl: 'Total Products' },
    { sv: SITE.categories.length, sl: 'Categories' },
    { sv: SITE.company.phone, sl: 'Phone' },
    { sv: 'Live', sl: 'Website Status' },
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s =>
    `<div class="stat-box"><div class="sv">${s.sv}</div><div class="sl">${s.sl}</div></div>`
  ).join('');

  document.getElementById('prodCount').textContent = SITE.products.length;
  document.getElementById('dashProductList').innerHTML = SITE.products.map(p => `
    <div class="dash-prod-row">
      <div class="dash-prod-icon">
        ${p.image ? `<img src="${p.image}" alt="${p.name}"/>` : p.icon||'📦'}
      </div>
      <div>
        <div class="dash-prod-name">${p.name}</div>
        <div class="dash-prod-cat">${capitalize(p.category)}</div>
      </div>
      <div class="dash-prod-actions">
        <button class="dash-edit-btn" onclick="showTab('products');setTimeout(()=>editProduct('${p.id}'),100)">✏️ Edit</button>
        <button class="dash-del-btn" onclick="deleteProduct('${p.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════
// COMPANY
// ════════════════════════════════════════════════════════
function populateCompanyForm() {
  const c = SITE.company;
  val('compName', c.name);
  val('compTagline', c.tagline || '');
  const prev = document.getElementById('logoPreview');
  if (c.logo) prev.src = c.logo;
  // Update sidebar logo too
  document.getElementById('sidebarLogo').src = c.logo || '/images/logo-default.svg';
}

function previewLogo(inp) {
  if (!inp.files[0]) return;
  document.getElementById('logoPreview').src = URL.createObjectURL(inp.files[0]);
}

async function uploadLogo() {
  const file = document.getElementById('logoFile').files[0];
  if (!file) { showToast('Please choose a logo file first', 'error'); return; }
  const fd = new FormData();
  fd.append('logo', file);
  const res = await fetch('/api/admin/company/logo', { method:'POST', body: fd });
  const d = await res.json();
  if (d.success) {
    SITE.company.logo = d.logo;
    document.getElementById('sidebarLogo').src = d.logo;
    showToast('✅ Logo uploaded!', 'success');
  } else showToast('Upload failed', 'error');
}

async function saveCompany() {
  const body = { name: val('compName'), tagline: val('compTagline') };
  const res = await fetch('/api/admin/company', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await res.json();
  if (d.success) { SITE.company = d.company; showToast('✅ Company info saved!', 'success'); }
  else showToast('Save failed', 'error');
}

// ════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════
function populateHeroForm() {
  const h = SITE.hero;
  val('heroBadgeInp', h.badge);
  val('heroHeadInp',  h.heading);
  val('heroHLInp',    h.headingHighlight);
  val('heroDescInp',  h.description);
  val('heroTagsInp',  (h.tags || []).join('\n'));
}

async function saveHero() {
  const tags = val('heroTagsInp').split('\n').map(t=>t.trim()).filter(Boolean);
  const body = {
    badge: val('heroBadgeInp'),
    heading: val('heroHeadInp'),
    headingHighlight: val('heroHLInp'),
    description: val('heroDescInp'),
    tags
  };
  const res = await fetch('/api/admin/hero', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await res.json();
  if (d.success) { SITE.hero = d.hero; showToast('✅ Hero section saved!', 'success'); }
  else showToast('Save failed', 'error');
}

// ════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════
function populateCategoryList() {
  const list = document.getElementById('catList');
  list.innerHTML = (SITE.categories || []).map(cat => `
    <div class="cat-list-item" id="catitem-${cat}">
      <span class="cat-name">${cat}</span>
      <button class="cat-del-btn" onclick="removeCategory('${cat}')">✕</button>
    </div>
  `).join('');
}

function addCategory() {
  const input = document.getElementById('newCatInput');
  const name = input.value.trim().toLowerCase().replace(/\s+/g,'-');
  if (!name) return;
  if (SITE.categories.includes(name)) { showToast('Category already exists', 'error'); return; }
  SITE.categories.push(name);
  populateCategoryList();
  input.value = '';
}

function removeCategory(cat) {
  SITE.categories = SITE.categories.filter(c => c !== cat);
  populateCategoryList();
}

async function saveCategories() {
  const res = await fetch('/api/admin/categories', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ categories: SITE.categories })
  });
  const d = await res.json();
  if (d.success) showToast('✅ Categories saved!', 'success');
  else showToast('Save failed', 'error');
}

// ════════════════════════════════════════════════════════
// LOCATION
// ════════════════════════════════════════════════════════
function populateLocationForm() {
  val('mapsEmbed', SITE.company.mapsEmbed || '');
  val('mapsLink',  SITE.company.mapsLink  || '');
  const frame = document.getElementById('mapPreviewFrame');
  if (SITE.company.mapsEmbed) frame.src = SITE.company.mapsEmbed;
}

function previewMap() {
  const url = val('mapsEmbed');
  document.getElementById('mapPreviewFrame').src = url;
}

async function saveLocation() {
  const body = {
    mapsEmbed: val('mapsEmbed'),
    mapsLink:  val('mapsLink')
  };
  const res = await fetch('/api/admin/company', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await res.json();
  if (d.success) { SITE.company = d.company; showToast('✅ Location saved!', 'success'); }
  else showToast('Save failed', 'error');
}

// ════════════════════════════════════════════════════════
// CONTACT
// ════════════════════════════════════════════════════════
function populateContactForm() {
  const c = SITE.company;
  val('contPhone', c.phone    || '');
  val('contWA',    c.whatsapp || '');
  val('contAddr',  c.address  || '');
  val('contHours', c.hours    || '');
  val('contEmail', c.email    || '');
}

async function saveContact() {
  const body = {
    phone:     val('contPhone'),
    whatsapp:  val('contWA'),
    address:   val('contAddr'),
    hours:     val('contHours'),
    email:     val('contEmail')
  };
  const res = await fetch('/api/admin/company', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await res.json();
  if (d.success) { SITE.company = d.company; showToast('✅ Contact details saved!', 'success'); }
  else showToast('Save failed', 'error');
}

// ════════════════════════════════════════════════════════
// PRODUCTS — ADMIN GRID
// ════════════════════════════════════════════════════════
function renderAdminProducts() {
  const search = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const filtered = SITE.products.filter(p =>
    p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)
  );
  const grid = document.getElementById('adminProductGrid');
  if (!filtered.length) {
    grid.innerHTML = '<p style="color:#94a3b8;padding:24px">No products found.</p>';
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <div class="admin-product-card">
      <div class="apc-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:48px;background:linear-gradient(135deg,#eff6ff,#dbeafe)">${p.icon||'📦'}</div>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:linear-gradient(135deg,#eff6ff,#dbeafe)">${p.icon||'📦'}</div>`
        }
      </div>
      <div class="apc-body">
        <div class="apc-name">${p.name}</div>
        <div class="apc-cat">${capitalize(p.category)} · ${p.sizes.length} sizes</div>
        <div class="apc-actions">
          <button class="apc-edit" onclick="editProduct('${p.id}')">✏️ Edit</button>
          <button class="apc-del"  onclick="deleteProduct('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════
// PRODUCT MODAL — ADD / EDIT
// ════════════════════════════════════════════════════════
function openProductModal() {
  clearProductForm();
  document.getElementById('prodModalTitle').textContent = 'Add New Product';
  document.getElementById('editProductId').value = '';
  populateCategorySelect();
  openModal();
}

function editProduct(id) {
  const p = SITE.products.find(x => x.id === id);
  if (!p) return;
  clearProductForm();
  document.getElementById('prodModalTitle').textContent = 'Edit Product';
  document.getElementById('editProductId').value = p.id;
  populateCategorySelect(p.category);
  val('pName',          p.name);
  val('pBadge',         p.badge || '');
  val('pBadgeColor',    p.badgeColor || '#2563eb');
  val('pBadgeColorText',p.badgeColor || '#2563eb');
  document.getElementById('pBadgeColor').value = p.badgeColor || '#2563eb';
  val('pColor',         p.color || '#e0f2fe');
  val('pColorText',     p.color || '#e0f2fe');
  document.getElementById('pColor').value = p.color || '#e0f2fe';
  val('pIcon',          p.icon || '');
  val('pDesc',          p.description);
  val('pSizes',         p.sizes.join('\n'));
  val('pSheetSize',     p.sheetSize || '');
  val('pQuality',       p.quality || '');

  if (p.image) {
    const prev = document.getElementById('pImgPreview');
    prev.src = p.image; prev.style.display = 'block';
    document.getElementById('imgUploadText').style.display = 'none';
  }

  // Sync color pickers
  document.getElementById('pBadgeColor').addEventListener('input', function() {
    document.getElementById('pBadgeColorText').value = this.value;
  });
  document.getElementById('pColor').addEventListener('input', function() {
    document.getElementById('pColorText').value = this.value;
  });

  openModal();
}

function populateCategorySelect(selected) {
  const sel = document.getElementById('pCategory');
  sel.innerHTML = (SITE.categories || []).map(c =>
    `<option value="${c}" ${c === selected ? 'selected' : ''}>${capitalize(c)}</option>`
  ).join('');
  if (!SITE.categories.length) sel.innerHTML = '<option value="accessories">Accessories</option>';
}

function clearProductForm() {
  ['pName','pBadge','pBadgeColorText','pColorText','pIcon','pDesc','pSizes','pSheetSize','pQuality'].forEach(id => val(id,''));
  document.getElementById('pBadgeColor').value = '#2563eb';
  document.getElementById('pColor').value = '#e0f2fe';
  document.getElementById('pBadgeColorText').value = '#2563eb';
  document.getElementById('pColorText').value = '#e0f2fe';
  const prev = document.getElementById('pImgPreview');
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('imgUploadText').style.display = 'block';
  document.getElementById('pImage').value = '';
}

function syncColorFromText() {
  const v = document.getElementById('pBadgeColorText').value;
  if (/^#[0-9a-fA-F]{6}$/.test(v)) document.getElementById('pBadgeColor').value = v;
}
function syncColorFromText2() {
  const v = document.getElementById('pColorText').value;
  if (/^#[0-9a-fA-F]{6}$/.test(v)) document.getElementById('pColor').value = v;
}

function previewProductImg(inp) {
  if (!inp.files[0]) return;
  const prev = document.getElementById('pImgPreview');
  prev.src = URL.createObjectURL(inp.files[0]);
  prev.style.display = 'block';
  document.getElementById('imgUploadText').style.display = 'none';
}

async function saveProduct() {
  const name = val('pName').trim();
  if (!name) { showToast('Product name is required', 'error'); return; }

  const fd = new FormData();
  fd.append('name',        name);
  fd.append('category',    document.getElementById('pCategory').value);
  fd.append('badge',       val('pBadge'));
  fd.append('badgeColor',  document.getElementById('pBadgeColorText').value || document.getElementById('pBadgeColor').value);
  fd.append('color',       document.getElementById('pColorText').value || document.getElementById('pColor').value);
  fd.append('icon',        val('pIcon'));
  fd.append('description', val('pDesc'));
  fd.append('sizes',       JSON.stringify(val('pSizes').split('\n').map(s=>s.trim()).filter(Boolean)));
  fd.append('sheetSize',   val('pSheetSize'));
  fd.append('quality',     val('pQuality'));

  const file = document.getElementById('pImage').files[0];
  if (file) fd.append('image', file);

  const editId = document.getElementById('editProductId').value;
  const url    = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
  const method = editId ? 'PUT' : 'POST';

  const res = await fetch(url, { method, body: fd });
  const d   = await res.json();

  if (d.success) {
    if (editId) {
      const idx = SITE.products.findIndex(p => p.id === editId);
      if (idx !== -1) SITE.products[idx] = d.product;
    } else {
      SITE.products.push(d.product);
    }
    closeProdModal();
    renderAdminProducts();
    renderDashboard();
    showToast(editId ? '✅ Product updated!' : '✅ Product added!', 'success');
  } else {
    showToast('Save failed: ' + (d.error || 'Unknown error'), 'error');
  }
}

async function deleteProduct(id) {
  const p = SITE.products.find(x => x.id === id);
  if (!confirm(`Delete "${p?.name}"? This cannot be undone.`)) return;

  const res = await fetch(`/api/admin/products/${id}`, { method:'DELETE' });
  const d   = await res.json();

  if (d.success) {
    SITE.products = SITE.products.filter(x => x.id !== id);
    renderAdminProducts();
    renderDashboard();
    showToast('🗑️ Product deleted', 'success');
  } else showToast('Delete failed', 'error');
}

// Modal open/close helpers
function openModal()     { document.getElementById('prodModalOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeProdModal(){ document.getElementById('prodModalOverlay').classList.remove('open'); document.body.style.overflow=''; }

// ════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════
async function doLogout() {
  await fetch('/api/admin/logout', { method:'POST' });
  window.location.href = '/admin';
}

// ════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════
function val(id, set) {
  const el = document.getElementById(id);
  if (!el) return '';
  if (set !== undefined) { el.value = set; return set; }
  return el.value;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// Close modal on overlay click
document.getElementById('prodModalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeProdModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProdModal(); });

// Sync color pickers on init
document.getElementById('pBadgeColor').addEventListener('input', function() {
  document.getElementById('pBadgeColorText').value = this.value;
});
document.getElementById('pColor').addEventListener('input', function() {
  document.getElementById('pColorText').value = this.value;
});

init();
