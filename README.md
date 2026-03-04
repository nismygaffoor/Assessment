# Collaborative Note-Taking Web App (MERN Stack)

A full-stack collaborative note-taking application built with MongoDB, Express, React, and Node.js (MERN), styled with Tailwind CSS.

## Features
- **JWT Authentication**: Secure login and registration.
- **Note Management**: Create, Read, Update, and Delete notes.
- **Collaboration**: Share notes with other users via email.
- **Full-Text Search**: Quickly find notes by title or content.
- **Rich Text Editor**: Powered by TipTap for a premium writing experience.
- **Responsive Design**: Modern UI that works on all devices.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Auth**: JSON Web Tokens (JWT), Bcrypt.js.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your MongoDB URI and JWT Secret.
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Assumptions & Notes
- Users are unique by email.
- Note collaborators must be registered users of the application.
- Full-text search requires a MongoDB text index (handled automatically by Mongoose).
