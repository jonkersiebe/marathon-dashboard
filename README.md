# Marathon Dashboard 🏃‍♂️

A premium, Apple-minimalist dashboard for marathon training, built with React, Vite, and Firebase. This dashboard helps runners track their progress, manage their training plan, and visualize their performance.

## ✨ Features

- **Personal Dashboard**: Real-time stats including weekly distance, longest run, and average pace.
- **Dynamic Training Plan**: A full 32-week marathon training plan (from Feb 2026 to Nov 2026) built in.
- **Check-off System**: Mark training sessions as completed with a dedicated duration popup.
- **Performance Visualization**: Weekly mileage charts using Recharts.
- **Secure Authentication**: Firebase Auth for personal accounts and data isolation.
- **Live Persistence**: Data is stored securely in Firebase Firestore.
- **Google Calendar Sync**: One-click synchronization of your entire training plan to your Google Calendar, complete with status emojis (🏃/✅) and training-type color coding.

## 🚀 Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Apple Minimal Design System)
- **Database/Auth**: Firebase (Firestore & Authentication)
- **APIs**: Google Calendar API (OAuth2)
- **Charts**: Recharts
- **Icons**: SF Pro Display inspired typography

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jonkersiebe/marathon-dashboard.git
   cd marathon-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (use `.env.example` as a template) and add your Firebase and Google credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🔐 Security Note

This project uses environment variables to keep sensitive Firebase and Google keys out of version control. Ensure your `.env` file is added to `.gitignore`.

## 📈 Roadmap

- [x] Base Layout & Design System
- [x] Firebase Integration (Auth & Firestore)
- [x] Dynamic Dashboard Stats
- [x] Weekly Mileage Chart
- [x] Complete 32-week Training Plan
- [x] Training Session Check-off with duration input
- [x] Google Calendar API Integration
- [ ] Progress sharing via Social Media
- [ ] Strava API Integration (Future)
