# Shree Parameswari Enterprises — Full Stack Website

## 🔑 Admin PIN
**Default PIN: `786786`**
To change it → open `server.js` → find `ADMIN_PIN = '786786'` → change it.

---

## 📁 Project Structure
```
spe-fullstack/
├── server.js              ← Backend (Node.js + Express)
├── package.json
├── data/
│   └── sitedata.json      ← All website data (auto-updated by admin)
├── public/
│   ├── index.html         ← Public website (buyers see this)
│   ├── admin-login.html   ← Admin PIN login page
│   ├── admin.html         ← Admin dashboard
│   ├── css/
│   │   ├── main.css       ← Public website styles
│   │   └── admin.css      ← Admin panel styles
│   ├── js/
│   │   ├── main.js        ← Public website logic
│   │   └── admin.js       ← Admin panel logic
│   ├── images/
│   │   └── logo-default.svg
│   └── uploads/           ← Uploaded images stored here
```

---

## 🚀 Installation & Running

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 — Install dependencies
```bash
cd spe-fullstack
npm install
```

### Step 3 — Start the server
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### Step 4 — Open in browser
| URL | What it is |
|-----|------------|
| http://localhost:3000 | 🌐 Public website (buyers) |
| http://localhost:3000/admin | 🔐 Admin login |
| http://localhost:3000/admin/dashboard | 📊 Admin panel |

---

## 🛡️ Admin Panel Features

| Section | What you can edit |
|---------|------------------|
| 🏢 Company Info | Name, tagline, logo upload |
| 🎯 Hero Section | Heading, description, feature tags |
| 📦 Products | Add / Edit / Delete products + image upload |
| 🏷️ Categories | Add / Remove filter categories |
| 📍 Location | Google Maps embed + directions link |
| 📞 Contact | Phone, WhatsApp, address, hours |

---

## 📦 Adding a Product (in Admin Panel)
1. Go to http://localhost:3000/admin → login with PIN
2. Click **Products** in sidebar
3. Click **➕ Add New Product**
4. Fill: Name, Category, Description, Sizes (one per line), upload image
5. Click **💾 Save Product** — appears on website instantly

---

## 🖼️ Adding Product Images
- In the Add/Edit Product modal, click the image upload area
- Supports JPG, PNG up to 5MB
- Images are stored in `public/uploads/`

---

## 🌐 Deploying to a Server (VPS/Hostinger/etc.)

### Option A — PM2 (recommended)
```bash
npm install -g pm2
pm2 start server.js --name spe-website
pm2 save
pm2 startup
```

### Option B — Direct
```bash
node server.js
```

### Nginx reverse proxy config (optional):
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## ⚙️ Environment Variables (optional)
Create a `.env` file:
```
PORT=3000
ADMIN_PIN=your_secret_pin
```
And in server.js:
```js
const ADMIN_PIN = process.env.ADMIN_PIN || '786786';
```

---

## 📞 Business Info
- Phone: +91 76048 27435
- WhatsApp: Same
- Address: Shop No. 6/2, Arcot Rd, near AVM Studios, Vadapalani, Chennai — 600026
- Google Maps: https://share.google/Si1WUDVmA4AeaM9Fn
