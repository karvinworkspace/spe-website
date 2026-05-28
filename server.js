const express  = require('express');
const session  = require('express-session');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const fse      = require('fs-extra');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config ──────────────────────────────────────────────────────────────────
const ADMIN_PIN  = process.env.ADMIN_PIN  || '786786';
const MONGO_URI  = process.env.MONGO_URI  || '';

// ── MongoDB Schema ───────────────────────────────────────────────────────────
const siteSchema = new mongoose.Schema({ key: String, value: mongoose.Schema.Types.Mixed });
const SiteData   = mongoose.model('SiteData', siteSchema);

// ── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  company: {
    name:      'Shree Parameswari Enterprises',
    tagline:   'Your trusted one-stop shop for Thermocol, Foam & Packaging materials',
    logo:      '/images/logo-default.svg',
    phone:     '+91 76048 27435',
    whatsapp:  '917604827435',
    email:     'contact@shreeparameswari.com',
    address:   'Shop No. 6/2, Arcot Rd, near AVM Studios, Ottagapalayam, Kannika Puram, Vadapalani, Chennai — 600026',
    hours:     'Mon – Sat: 9:00 AM – 7:00 PM',
    mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.8!2d80.2107!3d13.0508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5260236d4a3e3f%3A0x0!2zMTPCsDAzJzAyLjkiTiA4MMKwMTInMzguNSJF!5e0!3m2!1sen!2sin!4v1234567890',
    mapsLink:  'https://share.google/Si1WUDVmA4AeaM9Fn'
  },
  hero: {
    badge:             '📍 Vadapalani, Chennai — Near AVM Studios',
    heading:           'Shree Parameswari',
    headingHighlight:  'Enterprises',
    description:       'Your trusted one-stop shop for Thermocol Sheets, Foam Sheets, Thermorex Boards and all packaging accessories. MD & HD quality available. Custom sizes. Bulk orders welcome.',
    tags:  ['✅ Thermocol MD & HD', '✅ Foam 3mm – 12mm', '✅ Thermorex Black & White', '✅ Adhesives & Tools'],
    stats: [
      { val: '12+',    lab: 'Product Categories' },
      { val: 'Custom', lab: 'Sizes on Request'   },
      { val: 'Retail &', lab: 'Wholesale Orders' },
      { val: 'Trusted', lab: 'Shop in Vadapalani'}
    ]
  },
  categories: ['thermocol','foam','thermorex','accessories'],
  products: [
    { id:'thermocol-md',    name:'Thermocol Sheet — MD',     category:'thermocol',   badge:'Most Popular', badgeColor:'#2563eb', description:'Medium Density thermocol sheets ideal for packaging, crafts, insulation, display boards and general purpose use.', sizes:['12.5mm (0.5")','19mm (0.75")','25mm (1")','38mm (1.5")','50mm (2")','75mm (3")','100mm (4")','125mm (5")','150mm (6")','175mm (7")','200mm (8")','250mm (10")','300mm (12")','500mm (20")'], sheetSize:'Custom sizes available on order', quality:'Medium Density (MD)', color:'#e0f2fe', icon:'🧊', image:'' },
    { id:'thermocol-hd',    name:'Thermocol Sheet — HD',     category:'thermocol',   badge:'Heavy Duty',   badgeColor:'#1e40af', description:'High Density thermocol sheets engineered for structural strength, cold storage insulation, construction and heavy-duty packaging.', sizes:['12.5mm (0.5")','19mm (0.75")','25mm (1")','38mm (1.5")','50mm (2")','75mm (3")','100mm (4")','125mm (5")','150mm (6")','175mm (7")','200mm (8")','250mm (10")','300mm (12")','500mm (20")'], sheetSize:'Custom sizes available on order', quality:'High Density (HD)', color:'#dbeafe', icon:'🏗️', image:'' },
    { id:'foam',            name:'Foam Sheets',               category:'foam',        badge:'Flexible',     badgeColor:'#0891b2', description:'Premium quality foam sheets for cushioning, furniture padding, packaging and protective cases.', sizes:['3mm','4mm','5mm','6mm','8mm','10mm','12mm'], sheetSize:'8 × 4 ft per sheet', quality:'Standard Grade', color:'#cffafe', icon:'🔲', image:'' },
    { id:'thermorex-white', name:'Thermorex Sheet — White',   category:'thermorex',   badge:'Premium',      badgeColor:'#6366f1', description:'White Thermorex sheets with excellent surface finish for signage, cladding and display applications.', sizes:['12.5mm (0.5")','25mm (1")','50mm (2")'], sheetSize:'6 × 3 ft per sheet', quality:'Thermorex Standard', color:'#f0f9ff', icon:'⬜', image:'' },
    { id:'thermorex-black', name:'Thermorex Sheet — Black',   category:'thermorex',   badge:'Premium',      badgeColor:'#374151', description:'Black Thermorex sheets for dark signage, backdrops, partition boards and premium display applications.', sizes:['12.5mm (0.5")','25mm (1")','50mm (2")'], sheetSize:'6 × 3 ft per sheet', quality:'Thermorex Standard', color:'#f1f5f9', icon:'⬛', image:'' },
    { id:'fevicol',         name:'Fevicol',                   category:'accessories', badge:'Adhesive',     badgeColor:'#d97706', description:'High quality Fevicol adhesive for bonding thermocol, foam, wood and packaging materials.', sizes:['Small Pack','Medium Pack','Large Pack','Bulk/Trade Pack'], sheetSize:'Multiple pack sizes', quality:'Standard', color:'#fef3c7', icon:'🧴', image:'' },
    { id:'rubber-milk',     name:'Rubber Milk (Latex)',        category:'accessories', badge:'Adhesive',     badgeColor:'#d97706', description:'Rubber milk / natural latex adhesive for bonding foam, fabric and lightweight materials.', sizes:['Small Bottle','Medium Can','Large Can'], sheetSize:'Multiple sizes', quality:'Standard', color:'#fef9c3', icon:'🥛', image:'' },
    { id:'tapes',           name:'Tapes',                     category:'accessories', badge:'Packing',      badgeColor:'#059669', description:'Wide range of packaging tapes — BOPP, masking, double-sided and foam tape.', sizes:['1 inch','2 inch','3 inch','Custom Width'], sheetSize:'Various roll lengths', quality:'Standard & Heavy Duty', color:'#d1fae5', icon:'📎', image:'' },
    { id:'adhesive',        name:'Adhesive / Glue',           category:'accessories', badge:'Bonding',      badgeColor:'#7c3aed', description:'All-purpose adhesive and specialty glues for thermocol, foam and packaging materials.', sizes:['Small','Medium','Large','Bulk'], sheetSize:'Multiple pack sizes', quality:'Standard', color:'#ede9fe', icon:'🔗', image:'' },
    { id:'clapboard',       name:'Clap Board',                category:'accessories', badge:'Board',        badgeColor:'#b45309', description:'Corrugated clap boards in big and small sizes for signage, packaging support and display boards.', sizes:['Small','Big','Custom Size'], sheetSize:'Big & Small available', quality:'Standard', color:'#fef3c7', icon:'🗂️', image:'' },
    { id:'cutters',         name:'Cutters & Knives',          category:'accessories', badge:'Tools',        badgeColor:'#dc2626', description:'Sharp durable cutters, utility knives and scissors for precise cutting of thermocol and foam.', sizes:['Small Cutter','Large Cutter','Box Knife','Scissors'], sheetSize:'Individual & combo packs', quality:'Standard', color:'#fee2e2', icon:'✂️', image:'' },
    { id:'scissors',        name:'Scissors',                  category:'accessories', badge:'Tools',        badgeColor:'#dc2626', description:'Heavy-duty scissors for cutting foam sheets, packaging materials and thermocol edges cleanly.', sizes:['Small','Medium','Large'], sheetSize:'Available individually', quality:'Standard', color:'#fce7f3', icon:'✂️', image:'' }
  ]
};

// ── DB helpers ───────────────────────────────────────────────────────────────
async function readData() {
  const doc = await SiteData.findOne({ key: 'sitedata' });
  if (!doc) {
    // First time — seed default data
    await SiteData.create({ key: 'sitedata', value: DEFAULT_DATA });
    return DEFAULT_DATA;
  }
  return doc.value;
}

async function writeData(data) {
  await SiteData.findOneAndUpdate(
    { key: 'sitedata' },
    { value: data },
    { upsert: true, new: true }
  );
}

function makeId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}

// ── Multer (local upload — temp storage) ─────────────────────────────────────
fse.ensureDirSync(path.join(__dirname, 'public', 'uploads'));
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'spe-super-secret-2025',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Auth ──────────────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════════════════
app.get('/',                (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin',           (req, res) => { if (req.session.isAdmin) return res.redirect('/admin/dashboard'); res.sendFile(path.join(__dirname, 'public', 'admin-login.html')); });
app.get('/admin/dashboard', (req, res) => { if (!req.session.isAdmin) return res.redirect('/admin'); res.sendFile(path.join(__dirname, 'public', 'admin.html')); });
app.get('/api/sitedata',    async (req, res) => res.json(await readData()));

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  if (req.body.pin === ADMIN_PIN) { req.session.isAdmin = true; return res.json({ success: true }); }
  res.status(401).json({ error: 'Wrong PIN' });
});
app.post('/api/admin/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/admin/check',   (req, res) => res.json({ isAdmin: !!req.session.isAdmin }));

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN — COMPANY
// ════════════════════════════════════════════════════════════════════════════
app.put('/api/admin/company', requireAdmin, async (req, res) => {
  const data = await readData();
  data.company = { ...data.company, ...req.body };
  await writeData(data);
  res.json({ success: true, company: data.company });
});

app.post('/api/admin/company/logo', requireAdmin, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const data = await readData();
  data.company.logo = '/uploads/' + req.file.filename;
  await writeData(data);
  res.json({ success: true, logo: data.company.logo });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN — HERO
// ════════════════════════════════════════════════════════════════════════════
app.put('/api/admin/hero', requireAdmin, async (req, res) => {
  const data = await readData();
  if (req.body.tags && typeof req.body.tags === 'string') {
    try { req.body.tags = JSON.parse(req.body.tags); } catch(e) { req.body.tags = req.body.tags.split('\n').filter(Boolean); }
  }
  data.hero = { ...data.hero, ...req.body };
  await writeData(data);
  res.json({ success: true, hero: data.hero });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN — CATEGORIES
// ════════════════════════════════════════════════════════════════════════════
app.put('/api/admin/categories', requireAdmin, async (req, res) => {
  const data = await readData();
  data.categories = req.body.categories;
  await writeData(data);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN — PRODUCTS
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  const data = await readData();
  res.json(data.products);
});

app.post('/api/admin/products', requireAdmin, upload.single('image'), async (req, res) => {
  const data = await readData();
  const body = req.body;
  let sizes = [];
  try { sizes = JSON.parse(body.sizes); } catch(e) { sizes = body.sizes ? body.sizes.split('\n').filter(Boolean) : []; }
  const product = {
    id: makeId(body.name),
    name: body.name || 'New Product',
    category: body.category || 'accessories',
    badge: body.badge || '',
    badgeColor: body.badgeColor || '#2563eb',
    description: body.description || '',
    sizes,
    sheetSize: body.sheetSize || '',
    quality: body.quality || '',
    color: body.color || '#eff6ff',
    icon: body.icon || '📦',
    image: req.file ? '/uploads/' + req.file.filename : ''
  };
  data.products.push(product);
  await writeData(data);
  res.json({ success: true, product });
});

app.put('/api/admin/products/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const data = await readData();
  const idx  = data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const body = req.body;
  let sizes = data.products[idx].sizes;
  if (body.sizes) {
    try { sizes = JSON.parse(body.sizes); } catch(e) { sizes = body.sizes.split('\n').filter(Boolean); }
  }
  data.products[idx] = {
    ...data.products[idx],
    name:        body.name        || data.products[idx].name,
    category:    body.category    || data.products[idx].category,
    badge:       body.badge       !== undefined ? body.badge : data.products[idx].badge,
    badgeColor:  body.badgeColor  || data.products[idx].badgeColor,
    description: body.description || data.products[idx].description,
    sizes,
    sheetSize:   body.sheetSize   || data.products[idx].sheetSize,
    quality:     body.quality     || data.products[idx].quality,
    color:       body.color       || data.products[idx].color,
    icon:        body.icon        || data.products[idx].icon,
    image:       req.file ? '/uploads/' + req.file.filename : data.products[idx].image
  };
  await writeData(data);
  res.json({ success: true, product: data.products[idx] });
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const data = await readData();
  const idx  = data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const img = data.products[idx].image;
  if (img && img.startsWith('/uploads/')) {
    const imgPath = path.join(__dirname, 'public', img);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  data.products.splice(idx, 1);
  await writeData(data);
  res.json({ success: true });
});

app.put('/api/admin/products-order', requireAdmin, async (req, res) => {
  const data = await readData();
  const map  = Object.fromEntries(data.products.map(p => [p.id, p]));
  data.products = req.body.ids.map(id => map[id]).filter(Boolean);
  await writeData(data);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════════════════════
async function start() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set!');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas!');

  app.listen(PORT, () => {
    console.log(`\n✅ Shree Parameswari Enterprises server running!`);
    console.log(`   🌐 Website  → http://localhost:${PORT}`);
    console.log(`   🔐 Admin    → http://localhost:${PORT}/admin`);
    console.log(`   🔑 Admin PIN: ${ADMIN_PIN}\n`);
  });
}

start();
