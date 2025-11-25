# Quick Start Guide

Get your TT Performance Hub up and running in 5 minutes!

## Prerequisites
- Node.js 20+ installed (use `nvm install 20 && nvm use 20`)
- A Firebase account (free tier is fine)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Firebase Project
1. Visit https://console.firebase.google.com
2. Click "Add project" and follow the wizard
3. Add a web app to your project

### 3. Enable Firebase Services
In the Firebase Console:
- **Firestore**: Click "Create database" in "Firestore Database"
- **Storage**: Click "Get started" in "Storage"

### 4. Update Security Rules

**Firestore Rules** (Database > Rules tab):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Storage Rules** (Storage > Rules tab):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. Create .env File
Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Find these values in: Firebase Console > Project Settings > General > Your apps > SDK setup

### 6. Start the App
```bash
npm run dev
```

Open http://localhost:5173 and start tracking your matches! 🏓

## Next Steps
- Add your first opponent
- Record your first match
- Create skills you want to work on
- Upload match photos and videos

## Deployment
When ready to deploy:
```bash
npm run build
```

Deploy the `dist/` folder to:
- Firebase Hosting
- Vercel
- Netlify
- Or any static hosting service

## Need More Help?
See `SETUP.md` for detailed instructions or `README.md` for full documentation.

