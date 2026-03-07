# CollabNotes - Collaborative Note-Taking Web App

A premium, professional-grade collaborative note-taking application built with the MERN stack. Designed with a stunning "CollabNotes" branding, it features real-time concurrent editing, version history, and a secure invitation-based sharing system.

## 🚀 Key Features

- **Premium UI/UX**: Modern split-screen authentication and a clean, glassmorphism-inspired dashboard.
- **Real-Time Collaboration**: Concurrent multi-user editing powered by Socket.io.
- **Note Version History**: Track changes over time and restore previous versions of your notes.
- **Secure Invitation System**: Invite collaborators by email with a pending/acceptance invitation flow.
- **Rich Text Editing**: Advanced text formatting using TipTap.
- **Full-Text Search**: Instant search across all notes by title or content.
- **Soft-Delete System**: Trash system to prevent accidental data loss.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io.
- **Authentication**: JWT (JSON Web Tokens) with secure password hashing via Bcrypt.js.

---

## 💻 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- npm or yarn

### 1. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file based on the `.env.example`:
```bash
cp .env.example .env
```

**Required Environment Variables:**
- `PORT`: The port the server will run on (Default: `5000`).
- `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/collaborative-notes`).
- `JWT_SECRET`: A high-entropy random string used to sign auth tokens.
  - *Tip: Generate one using:* `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Start the backend server in development mode:
```bash
npm run dev
```

### 2. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```
Create a `.env` file from the template:
```bash
cp .env.example .env
```
**Environment Variables:**
- `VITE_API_URL`: `http://localhost:5000/api`
- `VITE_SOCKET_URL`: `http://localhost:5000`

Start the development app:
```bash
npm run dev
```

---

## 📝 Assumptions & Technical Decisions

To ensure a smooth assessment process, the following reasonable assumptions were made during development:

1. **Real-Time Strategy**: We've implemented a **"Last-Source-Wins"** synchronization model via Socket.io. This handles concurrent editing efficiently for typical team sizes while maintaining low latency.
2. **Intelligent Versioning**: Note history snapshots are created every **10 seconds** during active editing or **immediately** when a different user contributes. This balances database storage with a granular "Time Machine" experience.
3. **Invitation Security**: Notes aren't just "shared"; they follow a formal invite/accept lifecycle. This prevents unauthorized content from appearing in a user's dashboard without their consent.
4. **Search Performance**: The search feature assumes a MongoDB environment. While it works on basic Regex, it is optimized for **MongoDB Text Indexes** for faster query performance on large datasets.
5. **Soft-Delete Lifecycle**: Deleting a note marks it as `deleted: true`. This allows for future implementation of a "Restore from Trash" feature without permanent data loss.
6. **Unique Identity**: Users are uniquely identified by their email addresses. Registration requires a unique email.

---

## 🛠 Tech Stack Details
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.io.
- **Rich Text**: TipTap (ProseMirror based) for the highest quality editing experience.
