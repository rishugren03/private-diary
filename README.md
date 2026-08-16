# Memoria — Zero-Knowledge Personal Diary & Daily Thought Stream

> **"Your private digital memory. Capture thoughts whenever they happen."**

Memoria is a modern, privacy-first personal diary web application. Built with a **Zero-Knowledge Architecture**, your diary entries and thought streams are encrypted client-side using **AES-256-GCM** before ever touching the server or database. The server only stores encrypted ciphertext—your password never leaves your browser, and no one (not even the database admin) can read your thoughts.

---

## ✨ Features

- **🧠 Daily Thought Stream**: Record multiple timestamped thoughts throughout the day instead of just a single entry.
- **⚡ Quick Thought Composer**: Instant logging with mood selectors, tags, and `Ctrl + Enter` / `Cmd + Enter` keyboard shortcuts.
- **📅 Interactive Calendar & Timeline**: View entry counts, mood indicators, and navigate historical thoughts effortlessly.
- **🔍 Zero-Knowledge Client-Side Search**: Search across your entire timeline locally in IndexedDB without exposing plaintext data to any server.
- **🔒 AES-256-GCM + PBKDF2 Encryption**: Key derived client-side via Web Crypto API with 310,000 iterations.
- **💾 Dual Database Engine**: Connects to **MongoDB Atlas** cloud database, with automatic persistent local disk DB (`./backend/data/db`) fallback.
- **🎨 Glassmorphism UI & Modern Typography**: Crafted with **Plus Jakarta Sans**, sleek dark theme aesthetics, micro-interactions, and visual mood badges.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router v6, Lucide Icons, Vanilla CSS Design System, Web Crypto API, IndexedDB.
- **Backend**: Node.js, Express, Mongoose, MongoDB Atlas, `mongodb-memory-server` (local disk persistence), JWT Authentication, Helmet, Express Rate Limit.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/your-username/personal-diary.git
cd personal-diary

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xzoozxc.mongodb.net/personal-diary
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=30d
```

### 3. Run Locally

**Start Backend Server:**
```bash
cd backend
npm run dev
# Express server runs on http://localhost:5001
```

**Start Frontend Client:**
```bash
cd frontend
npm run dev
# Vite server runs on http://localhost:5173
```

---

## 🔐 Zero-Knowledge Security Model

```
               USER BROWSER
      ┌─────────────────────────────┐
      │  Passphrase + Server Salt   │
      │              ↓              │
      │  PBKDF2 (310,000 iterations)│
      │              ↓              │
      │    AES-256-GCM CryptoKey    │
      │    (Memory / SessionStorage)│
      │              ↓              │
      │  Encrypts Thought Array     │
      └──────────────┬──────────────┘
                     │ (Sends ONLY Ciphertext + IV)
                     ▼
             MONGODB ATLAS DATABASE
      ┌─────────────────────────────┐
      │  User { email, passwordHash}│
      │  Entry { date, iv, data }   │
      │  *Plaintext NEVER stored*   │
      └─────────────────────────────┘
```

---

## 📁 Project Structure

```
personal-diary/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Auth & Entry route handlers
│   │   ├── middleware/    # Auth & JWT verification
│   │   ├── models/        # User & Entry Mongoose schemas
│   │   ├── routes/        # API route definitions
│   │   └── index.js       # Express app & Mongo connection logic
│   └── data/db/           # Local persistent DB fallback
└── frontend/
    └── src/
        ├── components/    # ThoughtCard, Sidebar, UnlockModal, etc.
        ├── contexts/      # AuthContext & DiaryContext
        ├── lib/           # Web Crypto helpers & IndexedDB local DB
        └── pages/         # Today, CalendarPage, EntryView, Search, Settings
```

---

## 📜 License

MIT License. Free for personal and commercial use.
