# TT Performance Hub

A comprehensive table tennis tracking application built specifically for Division I competitive players.

## Features

### 📊 Dashboard
- Quick overview of your stats, recent matches, and quick-action buttons
- Visual charts showing win rate trends and performance by division

### 🎯 Match Tracker
- Record every match with opponent, scores, division, and tournament name
- Upload multiple photos for each match with gallery view
- Embed YouTube videos or link to game footage
- Add detailed match notes
- Comprehensive statistics:
  - Win/loss record by division
  - Head-to-head records vs each opponent
  - Win percentage tracking
  - Serve/return statistics

### 👥 Opponent Database
- Build profiles for all players in your division and others
- Track playing styles (Aggressive, Defensive, Mixed)
- Add club/organization info
- View complete match history vs each opponent
- Head-to-head statistics at a glance
- Weakness analysis notes

### 📚 Skill Development Library
- Create a library of techniques you want to improve
- Categories: Serve, Return, Attack, Defense, Movement, Footwork, Tactics
- Link YouTube tutorials to each skill
- Add detailed coaching notes and tips
- Track difficulty levels (Beginner → Professional)
- Link related skills together

## Tech Stack

- **Frontend**: Vue 3 with Composition API
- **UI Framework**: Vuetify 3 (Material Design)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Backend**: Firebase (Firestore + Storage)
- **Charts**: Chart.js with vue-chartjs
- **Build Tool**: Vite
- **PWA**: Service Worker with offline support

## Setup Instructions

### Prerequisites
- Node.js 20+ (use nvm: `nvm install 20 && nvm use 20`)
- Firebase project

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd "TT Performance Hub"
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase configuration

4. Create `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Set up Firestore Security Rules (in Firebase Console):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Single-user app, adjust as needed
    }
  }
}
```

6. Set up Storage Security Rules (in Firebase Console):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Single-user app, adjust as needed
    }
  }
}
```

### Development

Start the development server:
```bash
npm run dev
```

### Build for Production

Build the app:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## PWA Setup

The app is configured as a Progressive Web App (PWA) and can be installed on mobile devices and desktops.

### Creating PWA Icons

1. Create a 512x512px icon for your app
2. Use a tool like https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator to generate all required icon sizes
3. Place the generated icons in the `public/` directory:
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

## Firestore Collections Structure

### matches
```javascript
{
  id: auto-generated,
  opponentId: string (reference to opponents collection),
  scores: [
    { set: number, myScore: number, oppScore: number }
  ],
  division: string,
  tournamentName: string,
  date: timestamp,
  photos: [urls],
  videoUrls: [urls],
  notes: string,
  serveStats: {
    successRate: number,
    returnPoints: number
  },
  createdAt: timestamp
}
```

### opponents
```javascript
{
  id: auto-generated,
  name: string,
  playingStyle: 'Aggressive' | 'Defensive' | 'Mixed',
  club: string,
  photoUrl: string,
  notes: string,
  weaknesses: string,
  createdAt: timestamp
}
```

### skills
```javascript
{
  id: auto-generated,
  name: string,
  category: 'Serve' | 'Return' | 'Attack' | 'Defense' | 'Movement' | 'Footwork' | 'Tactics',
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Professional',
  videoUrls: [urls],
  notes: string,
  relatedSkills: [skill_ids],
  createdAt: timestamp
}
```

## Features Roadmap

Completed:
- ✅ Dashboard with stats and quick actions
- ✅ Match tracking with scores and media
- ✅ Photo upload and gallery view
- ✅ YouTube video embeds
- ✅ Opponent database with profiles
- ✅ Head-to-head statistics
- ✅ Skill development library
- ✅ Serve/return statistics
- ✅ Weakness analysis
- ✅ Charts and visualizations
- ✅ PWA support with offline capability

Future enhancements:
- Training log integration
- Monthly goals with progress tracking
- Shot distribution maps
- Advanced analytics dashboard
- Export data to CSV/PDF
- Dark mode preferences saving
- Notification reminders for training

## License

This is a personal project. All rights reserved.
