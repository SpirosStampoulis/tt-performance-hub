# Quick Setup Guide

## 1. Install Node.js 20

```bash
nvm install 20
nvm use 20
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up Firebase

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Follow the setup wizard
4. In your project, click "Web" to add a web app

### Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in production mode (we'll add rules next)
4. Choose your location

### Enable Storage
1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Start in production mode

### Set Firestore Rules
Go to Firestore > Rules and replace with:
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

### Set Storage Rules
Go to Storage > Rules and replace with:
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

## 4. Configure Environment Variables

Create a `.env` file in the root directory with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find these values in:
Firebase Console > Project Settings > Your apps > Web app

## 5. Add PWA Icons (Optional but Recommended)

See `public/ICON_INSTRUCTIONS.md` for details on creating PWA icons.

## 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 7. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 8. Deploy (Optional)

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase connection errors
- Check your `.env` file has correct values
- Ensure Firestore and Storage are enabled in Firebase Console
- Verify security rules are set correctly

### Build errors
- Ensure you're using Node.js 20+: `node --version`
- Clear cache: `rm -rf node_modules/.vite`

## Need Help?

Refer to the main README.md for more detailed documentation.

