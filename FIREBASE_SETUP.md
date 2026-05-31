# Firebase Setup Guide for CET LMS

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it `cet-lms` (or whatever you prefer)
4. Disable Google Analytics (not needed)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In the Firebase console, go to **Build → Realtime Database**
2. Click "Create Database"
3. Choose your region (pick closest to you)
4. Start in **test mode** (we'll add proper rules after)

## Step 3: Enable Anonymous Authentication

1. Go to **Build → Authentication → Sign-in method**
2. Enable **Anonymous** authentication
3. Save

## Step 4: Get Your Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app name: `cet-lms-web`
5. Copy the `firebaseConfig` object

## Step 5: Update the Config

Edit `js/firebase.js` and replace the placeholder config:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",           // from Firebase console
  authDomain: "cet-lms-xxxxx.firebaseapp.com",
  databaseURL: "https://cet-lms-xxxxx-default-rtdb.firebaseio.com",
  projectId: "cet-lms-xxxxx",
  storageBucket: "cet-lms-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 6: Set RTDB Rules

Go to **Realtime Database → Rules** and paste the rules from `firebase-rules.json`:

```json
{
  "rules": {
    "cet": {
      "users": {
        "$uid": {
          "auth": {
            ".read": "auth !== null",
            ".write": "auth !== null"
          },
          "progress": {
            ".read": "auth !== null",
            ".write": "auth !== null"
          }
        }
      }
    }
  }
}
```

Click "Publish".

## Step 7: Commit & Push

```bash
cd /mnt/f/Projects/cet_app
git add -A
git commit -m "Add Firebase RTDB sync + login system"
git push origin main
```

GitHub Pages will auto-deploy within ~2 minutes.

## Data Structure in Firebase RTDB

```
cet/
  users/
    {username_slug}/
      auth/
        passHash: "sha256..."
        createdAt: 1234567890
        username: "El"
      progress/
        streak: 5
        answered: 42
        correct: 38
        subjectProgress: { ... }
        flashcardProgress: { ... }
        flashcardKnown: { ... }
        flashcardReview: { ... }
        readingProgress: { ... }
        bookmarkedSections: [ ... ]
        sessions: [ ... ]
        settings: { ... }
        _lastSync: 1234567890
```

## How Sync Works

1. **Login** → username + password (SHA-256 hashed with salt)
2. **Auto-login** → saved in localStorage, skips modal on return visits
3. **Real-time sync** → Firebase RTDB listener pushes changes instantly
4. **Debounced saves** → local changes batch-push to Firebase every 300ms
5. **Deep merge** → remote changes merge with local (objects merge, primitives overwrite)
6. **Offline fallback** → works without Firebase (local-only mode)
