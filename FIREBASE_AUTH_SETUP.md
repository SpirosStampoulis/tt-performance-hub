# Firebase Authentication Setup Guide

## Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Get Started**
5. Click on **Sign-in method** tab
6. Click **Email/Password**
7. Enable it (toggle ON)
8. Click **Save**

## Step 2: Create Your User Account

1. In Firebase Console → Authentication → Users tab
2. Click **Add user**
3. Enter your email and password
4. Click **Add user**

**OR** you can create the account through the login form after deployment (if you enable "Allow users to sign up" in Email/Password settings)

## Step 3: Test Locally

1. Run `npm run dev`
2. You should see the login page
3. Enter your email and password
4. You should be logged in and see the dashboard

## Step 4: Deploy to Vercel

The authentication is now built into your app. When you deploy:

1. Push to Git
2. Deploy to Vercel
3. Your app will require login before accessing any page

## Security Notes

- All routes except `/login` are protected
- Users must be authenticated to access the app
- Logout button is in the sidebar (bottom)
- Session persists across page refreshes

## Troubleshooting

### "Invalid email or password"
- Check that the user exists in Firebase Console → Authentication → Users
- Verify email/password are correct

### Can't access after login
- Check browser console for errors
- Verify Firebase config in environment variables

### Login page shows but can't submit
- Check that Email/Password is enabled in Firebase
- Verify Firebase Auth is initialized correctly

