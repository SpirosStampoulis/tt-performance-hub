# Deployment Guide - TT Performance Hub

## Option 1: Deploy to Vercel (Recommended)

Vercel is perfect for Vue apps and offers free hosting with automatic deployments.

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Step-by-Step Instructions

#### 1. Push Your Code to Git
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

**Option B: Using Vercel Dashboard (Easier)**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Vite/Vue
5. Configure environment variables (see below)
6. Click "Deploy"

#### 3. Set Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** Add these for all environments (Production, Preview, Development)

#### 4. Build Settings (Auto-detected by Vercel)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### 5. Deploy!
- Vercel will automatically deploy on every push to your main branch
- Preview deployments are created for pull requests

---

## Option 2: Deploy to Firebase Hosting

Since you're already using Firebase, this is a great alternative.

### Prerequisites
- Firebase CLI installed
- Firebase project set up

### Step-by-Step Instructions

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase
```bash
firebase login
```

#### 3. Initialize Firebase Hosting
```bash
firebase init hosting
```

When prompted:
- Select your Firebase project
- Public directory: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (or Yes if you want GitHub integration)
- Overwrite index.html: **No**

#### 4. Build Your App
```bash
npm run build
```

#### 5. Deploy
```bash
firebase deploy --only hosting
```

#### 6. Environment Variables

Firebase Hosting serves static files, so you need to set environment variables at build time. Create a `.env.production` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then build:
```bash
npm run build
firebase deploy --only hosting
```

---

## Option 3: Deploy to Netlify

Another excellent option for static sites.

### Step-by-Step Instructions

#### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. Build Your App
```bash
npm run build
```

#### 3. Deploy
```bash
netlify deploy --prod --dir=dist
```

Or use Netlify Dashboard:
1. Go to https://app.netlify.com
2. Drag and drop your `dist` folder
3. Set environment variables in Site settings

---

## Environment Variables Setup

**Important:** Never commit your `.env` file to Git! It's already in `.gitignore`.

For production, set these in your hosting platform:

### Vercel
- Dashboard → Project → Settings → Environment Variables

### Firebase
- Use `.env.production` file (not committed to Git)
- Or use Firebase Functions for server-side (advanced)

### Netlify
- Dashboard → Site settings → Environment variables

---

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] App loads without errors
- [ ] Firebase connection works
- [ ] Can add matches/opponents
- [ ] PWA works (can install on mobile)
- [ ] Images upload correctly
- [ ] All features work as expected

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Firebase
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow verification steps

---

## Continuous Deployment

Both Vercel and Netlify support automatic deployments:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Preview deployments

---

## Troubleshooting

### Build Fails
- Check Node.js version (should be 20+)
- Run `npm install` locally first
- Check build logs in deployment platform

### Environment Variables Not Working
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check browser console for errors

### Firebase Connection Issues
- Verify environment variables are correct
- Check Firebase security rules
- Ensure Firestore and Storage are enabled

---

## Recommended: Vercel

**Why Vercel?**
- ✅ Free tier is generous
- ✅ Automatic deployments
- ✅ Great performance (CDN)
- ✅ Easy environment variable management
- ✅ Preview deployments for PRs
- ✅ Perfect for Vue/Vite apps

**Quick Start:**
```bash
npm i -g vercel
vercel login
vercel
```

That's it! Your app will be live in seconds.

