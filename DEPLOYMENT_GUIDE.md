# Plasma Donor Finder - Complete Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying your full-stack application with:
- **Frontend:** React (client/)
- **Backend:** Node.js/Express (server/)
- **Database:** MongoDB Atlas (already configured)
- **ML/AI:** Python scripts
- **Blockchain:** Ethereum Sepolia testnet

---

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts (Free)
1. **Vercel** - Frontend hosting (https://vercel.com)
2. **Render** or **Railway** - Backend hosting (https://render.com or https://railway.app)
3. **MongoDB Atlas** - Database (already configured ✅)
4. **GitHub** - Code repository (https://github.com)

### ✅ Environment Variables Ready
Your `.env` file contains:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://plasma_donor:Plasma%401234@plasmadonor.wfbjc5b.mongodb.net/plasmalink
JWT_SECRET=your_jwt_secret_key_here_plasma2024_secure
CLIENT_URL=https://your-frontend-url.vercel.app
PYTHON_PATH=python
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_ethereum_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

---

## 🎯 Option 1: Deploy to Vercel (Frontend) + Render (Backend) - RECOMMENDED ⭐

### Step 1: Prepare Your Code

1. **Create GitHub Repository:**
```bash
cd "c:\Users\chinn\Downloads\Plasma-Donor-Finder-main (3)\Plasma-Donor-Finder-main (2)\Plasma-Donor-Finder-main\Plasma-Donor-Finder-main"
git init
git add .
git commit -m "Initial commit - Plasma Donor Finder"
```

2. **Create `.gitignore` in root:**
```
node_modules/
.env
.env.local
build/
dist/
*.log
.DS_Store
__pycache__/
*.pyc
.vscode/
```

3. **Push to GitHub:**
   - Create a new repository on GitHub.com
   - Follow GitHub's instructions to push your code

### Step 2: Deploy Backend to Render

1. **Go to https://render.com** and sign up (free)

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `plasma-donor-backend`
     - **Root Directory:** `server`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `node index.js`
     - **Instance Type:** `Free`

3. **Add Environment Variables** in Render dashboard:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://plasma_donor:Plasma%401234@plasmadonor.wfbjc5b.mongodb.net/plasmalink
JWT_SECRET=your_jwt_secret_key_here_plasma2024_secure
CLIENT_URL=https://your-frontend-url.vercel.app
PYTHON_PATH=python3
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_ethereum_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

4. **Install Python Dependencies:**
   - Add `render.yaml` in server directory:
```yaml
services:
  - type: web
    name: plasma-donor-backend
    env: node
    buildCommand: npm install && pip install pandas numpy scikit-learn matplotlib seaborn joblib
    startCommand: node index.js
```

5. **Deploy** - Render will give you a URL like: `https://plasma-donor-backend.onrender.com`

### Step 3: Deploy Frontend to Vercel

1. **Update API URL in client/src/services/api.js:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://plasma-donor-backend.onrender.com/api';
```

2. **Create `vercel.json` in client directory:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://plasma-donor-backend.onrender.com/api"
  }
}
```

3. **Go to https://vercel.com** and sign up

4. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Framework Preset: `Create React App`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`

5. **Add Environment Variable:**
   - `REACT_APP_API_URL` = `https://plasma-donor-backend.onrender.com/api`

6. **Deploy** - Vercel will give you a URL like: `https://plasma-donor-finder.vercel.app`

7. **Update Backend CLIENT_URL:**
   - Go back to Render dashboard
   - Update `CLIENT_URL` environment variable with your Vercel URL
   - Redeploy backend

---

## 🎯 Option 2: Deploy Everything to Railway

### Step 1: Deploy Backend

1. **Go to https://railway.app** and sign up

2. **New Project → Deploy from GitHub:**
   - Connect your repository
   - Select "server" directory
   - Railway auto-detects Node.js

3. **Add Environment Variables:**
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://plasma_donor:Plasma%401234@plasmadonor.wfbjc5b.mongodb.net/plasmalink
JWT_SECRET=your_jwt_secret_key_here_plasma2024_secure
CLIENT_URL=https://your-frontend-url.up.railway.app
PYTHON_PATH=python3
```

4. **Add Python Support:**
   - Create `railway.toml` in server directory:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node index.js"

[nixpacks.config]
packages = ["nodejs", "python3", "python3Packages.pip"]
buildCommand = "npm install && pip install pandas numpy scikit-learn matplotlib seaborn joblib"
```

5. **Generate Domain** - Railway gives you a URL like: `https://plasma-donor-backend.up.railway.app`

### Step 2: Deploy Frontend

1. **New Project → Deploy from GitHub:**
   - Select "client" directory
   - Railway auto-detects React

2. **Add Environment Variable:**
   - `REACT_APP_API_URL` = `https://plasma-donor-backend.up.railway.app/api`

3. **Build Settings:**
   - Build Command: `npm run build`
   - Start Command: `npx serve -s build -l $PORT`

4. **Add serve package** to client/package.json:
```json
"dependencies": {
  "serve": "^14.2.0",
  ...
}
```

---

## 🎯 Option 3: Traditional VPS Deployment (DigitalOcean/AWS/Azure)

### Requirements:
- Ubuntu 22.04 LTS server
- Domain name (optional)

### Installation Steps:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Python and dependencies
sudo apt install -y python3 python3-pip
pip3 install pandas numpy scikit-learn matplotlib seaborn joblib

# 4. Install MongoDB (if not using Atlas)
# Skip if using MongoDB Atlas

# 5. Install Nginx
sudo apt install -y nginx

# 6. Install PM2 for process management
sudo npm install -g pm2

# 7. Clone your repository
cd /var/www
git clone https://github.com/yourusername/plasma-donor-finder.git
cd plasma-donor-finder

# 8. Setup Backend
cd server
npm install
# Create .env file with your production values
nano .env

# 9. Setup Frontend
cd ../client
npm install
REACT_APP_API_URL=http://your-server-ip:5000/api npm run build

# 10. Start Backend with PM2
cd ../server
pm2 start index.js --name plasma-backend
pm2 startup
pm2 save

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/plasma-donor
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    root /var/www/plasma-donor-finder/client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/plasma-donor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL (optional but recommended)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

### Before Going Live:

1. **Update Environment Variables:**
   - ✅ Change JWT_SECRET to a strong random string
   - ✅ Use strong MongoDB password
   - ✅ Set NODE_ENV=production
   - ✅ Update CLIENT_URL to production URL

2. **Backend Security:**
   - ✅ CORS is configured (already done)
   - ✅ Helmet.js for security headers (already done)
   - ✅ Rate limiting enabled (already done)
   - ✅ Input validation active (already done)

3. **Frontend Security:**
   - ✅ No sensitive data in client code
   - ✅ API keys not exposed
   - ✅ HTTPS enabled

4. **Database Security:**
   - ✅ MongoDB Atlas has network access restrictions
   - ✅ Strong password used
   - ✅ Backup strategy in place

---

## 🧪 Testing Deployment

### 1. Test Backend API:
```bash
curl https://your-backend-url.onrender.com/api/auth/health
```

### 2. Test Frontend:
- Visit https://your-frontend-url.vercel.app
- Register a new account
- Login
- Test donor search
- Test location detection
- Test ML ranking

### 3. Test Real-Time Features:
- Open chat
- Test notifications
- Test Socket.IO connection

---

## 📊 Monitoring & Maintenance

### Free Monitoring Tools:

1. **Backend Monitoring:**
   - Render/Railway has built-in logs
   - Use PM2 logs for VPS: `pm2 logs plasma-backend`

2. **Database Monitoring:**
   - MongoDB Atlas Dashboard
   - Set up alerts for high usage

3. **Error Tracking:**
   - Add Sentry.io (free tier):
```bash
npm install @sentry/node @sentry/react
```

### Regular Maintenance:

1. **Weekly:**
   - Check server logs
   - Monitor MongoDB usage
   - Check API response times

2. **Monthly:**
   - Update dependencies: `npm update`
   - Review security alerts
   - Backup MongoDB database

3. **Quarterly:**
   - Update Node.js version
   - Review and optimize queries
   - Scale resources if needed

---

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure CLIENT_URL matches frontend URL exactly
   - Check backend CORS configuration

2. **ML Models Not Working:**
   - Verify Python is installed on server
   - Check PYTHON_PATH environment variable
   - Install required packages: pandas, numpy, scikit-learn

3. **Socket.IO Not Connecting:**
   - Check WebSocket configuration
   - Ensure proxy passes WebSocket upgrade headers

4. **MongoDB Connection Failed:**
   - Verify MongoDB Atlas network access
   - Check connection string format
   - Ensure password is URL-encoded

### Getting Help:

- **Backend Logs:** Check Render/Railway dashboard
- **Frontend Errors:** Browser console (F12)
- **MongoDB:** Atlas dashboard → Metrics

---

## 💰 Cost Breakdown (Monthly)

### Free Tier (Recommended for Start):
- **Vercel (Frontend):** FREE ✅
- **Render (Backend):** FREE (with sleep after inactivity) ✅
- **MongoDB Atlas:** FREE (512MB) ✅
- **Total:** $0/month

### Paid Tier (Production Ready):
- **Vercel Pro:** $20/month
- **Render Starter:** $7/month
- **MongoDB Atlas M2:** $9/month
- **Total:** $36/month

### VPS Option:
- **DigitalOcean Droplet:** $6-12/month
- **Domain Name:** $12/year
- **Total:** ~$8-14/month

---

## 🎉 Next Steps After Deployment

1. **Custom Domain:**
   - Buy domain from Namecheap/GoDaddy
   - Configure DNS with Vercel/Render

2. **SSL Certificate:**
   - Vercel/Render provide free SSL ✅
   - For VPS: Use Let's Encrypt (free)

3. **Analytics:**
   - Add Google Analytics
   - Track user behavior

4. **SEO Optimization:**
   - Add meta tags
   - Create sitemap.xml
   - Submit to Google Search Console

5. **Marketing:**
   - Share with potential users
   - Create social media presence
   - Get feedback and iterate

---

## 📞 Support

Need help with deployment? 

1. Check logs first
2. Review this guide
3. Search for specific error messages
4. Check hosting provider documentation

---

**Good Luck with Your Deployment! 🚀**

Your Plasma Donor Finder app will help save lives! 💉❤️
