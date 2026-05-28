const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const fse     = require('fs-extra');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Admin PIN (change this to your secret PIN) ──────────────────────────────
const ADMIN_PIN = '786786';

// ── Data file path ──────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data', 'sitedata.json');

function readData()       { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(data)  { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function makeId(name)     { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') + '-' + Date.now(); }

// ── Multer (image uploads) ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'spe-super-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Auth middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Public website
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Admin login page
app.get('/admin', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Admin dashboard
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: get all site data (public — website reads this)
app.get('/api/sitedata', (req, res) => {
  res.json(readData());
});

// ════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Wrong PIN' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN API — COMPANY
// ════════════════════════════════════════════════════════════════════════════

app.put('/api/admin/company', requireAdmin, (req, res) => {
  const data = readData();
  data.company = { ...data.company, ...req.body };
  writeData(data);
  res.json({ success: true, company: data.company });
});

// Upload logo
app.post('/api/admin/company/logo', requireAdmin, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = readData();
  data.company.logo = '/uploads/' + req.file.filename;
  writeData(data);
  res.json({ success: true, logo: data.company.logo });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN API — HERO
// ════════════════════════════════════════════════════════════════════════════

app.put('/api/admin/hero', requireAdmin, (req, res) => {
  const data = readData();
  // tags come as JSON string or array
  if (req.body.tags && typeof req.body.tags === 'string') {
    try { req.body.tags = JSON.parse(req.body.tags); } catch(e) { req.body.tags = req.body.tags.split('\n').filter(Boolean); }
  }
  data.hero = { ...data.hero, ...req.body };
  writeData(data);
  res.json({ success: true, hero: data.hero });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN API — CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

app.put('/api/admin/categories', requireAdmin, (req, res) => {
  const { categories } = req.body;
  const data = readData();
  data.categories = categories;
  writeData(data);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN API — PRODUCTS
// ════════════════════════════════════════════════════════════════════════════

// Get all products
app.get('/api/admin/products', requireAdmin, (req, res) => {
  res.json(readData().products);
});

// Add product
app.post('/api/admin/products', requireAdmin, upload.single('image'), (req, res) => {
  const data = readData();
  const body = req.body;

  let sizes = [];
  try { sizes = JSON.parse(body.sizes); } catch(e) { sizes = body.sizes ? body.sizes.split('\n').filter(Boolean) : []; }

  const product = {
    id:          makeId(body.name),
    name:        body.name        || 'New Product',
    category:    body.category    || 'accessories',
    badge:       body.badge       || '',
    badgeColor:  body.badgeColor  || '#2563eb',
    description: body.description || '',
    sizes:       sizes,
    sheetSize:   body.sheetSize   || '',
    quality:     body.quality     || '',
    color:       body.color       || '#eff6ff',
    icon:        body.icon        || '📦',
    image:       req.file ? '/uploads/' + req.file.filename : ''
  };

  data.products.push(product);
  writeData(data);
  res.json({ success: true, product });
});

// Update product
app.put('/api/admin/products/:id', requireAdmin, upload.single('image'), (req, res) => {
  const data = readData();
  const idx  = data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const body = req.body;
  let sizes  = data.products[idx].sizes;
  if (body.sizes) {
    try { sizes = JSON.parse(body.sizes); } catch(e) { sizes = body.sizes.split('\n').filter(Boolean); }
  }

  data.products[idx] = {
    ...data.products[idx],
    name:        body.name        || data.products[idx].name,
    category:    body.category    || data.products[idx].category,
    badge:       body.badge       !== undefined ? body.badge       : data.products[idx].badge,
    badgeColor:  body.badgeColor  || data.products[idx].badgeColor,
    description: body.description || data.products[idx].description,
    sizes:       sizes,
    sheetSize:   body.sheetSize   || data.products[idx].sheetSize,
    quality:     body.quality     || data.products[idx].quality,
    color:       body.color       || data.products[idx].color,
    icon:        body.icon        || data.products[idx].icon,
    image:       req.file ? '/uploads/' + req.file.filename : data.products[idx].image
  };

  writeData(data);
  res.json({ success: true, product: data.products[idx] });
});

// Delete product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const data = readData();
  const idx  = data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  // delete image file if it's an upload
  const img = data.products[idx].image;
  if (img && img.startsWith('/uploads/')) {
    const imgPath = path.join(__dirname, 'public', img);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  data.products.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// Reorder products (drag & drop)
app.put('/api/admin/products-order', requireAdmin, (req, res) => {
  const { ids } = req.body;
  const data    = readData();
  const map     = Object.fromEntries(data.products.map(p => [p.id, p]));
  data.products = ids.map(id => map[id]).filter(Boolean);
  writeData(data);
  res.json({ success: true });
});

// ── Ensure uploads dir exists ───────────────────────────────────────────────
fse.ensureDirSync(path.join(__dirname, 'public', 'uploads'));

app.listen(PORT, () => {
  console.log(`\n✅ Shree Parameswari Enterprises server running!`);
  console.log(`   🌐 Website  → http://localhost:${PORT}`);
  console.log(`   🔐 Admin    → http://localhost:${PORT}/admin`);
  console.log(`   🔑 Admin PIN: ${ADMIN_PIN}\n`);
});
