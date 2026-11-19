# Seminar Registration System — Frontend (React + Vite)

React single-page app for participants, organizers, speakers and administrators.

## Setup
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```
Start the backend first (`npm run dev` in `backend/`, port 5009). In development Vite
proxies `/api` to `http://localhost:5000`, so no extra configuration is needed.

For production, copy `.env.example` to `.env`, set `VITE_API_URL` to your deployed API
(e.g. `https://your-api.onrender.com/api`), then `npm run build` and host `dist/`
(Netlify, Vercel, etc.). Configure the host to rewrite all routes to `index.html`.

## Features by role
- **Participant:** sign up, log in, browse/search/filter seminars, register, cancel,
  track status, view and print certificates.
- **Organizer:** create/edit/cancel seminars, manage sessions and speakers, approve or reject
  registrations, mark attendance (issues certificates), export or print participant lists, reports.
- **Speaker:** see assigned sessions, update topic, notes and timing.
- **Administrator:** manage all users (create organizers/speakers/admins, deactivate, reset
  passwords), all seminars, monitor registrations, system reports.
- **Anyone:** verify a certificate at `/verify`.

## Login & session handling
- Client-side validation with inline errors, show/hide password, Caps Lock warning.
- "Keep me logged in" stores the token in localStorage (7 days); otherwise sessionStorage
  (cleared when the browser closes).
- Auto-logout when the token expires, or when the server rejects it (password changed,
  account deactivated).
- Protected routes redirect to login and return you to the page you wanted afterwards;
  role-restricted pages show an access-denied screen.
- Demo account shortcuts appear on the login page in development only.

## Structure
```
src/api/          axios client with auth interceptor
src/context/      AuthContext, ToastContext
src/components/   Layout, ProtectedRoute, SeminarTicket, Modal, PasswordInput, ...
src/pages/        auth, seminars, student, organizer, speaker, admin
src/styles.css    design system and responsive/print styles
```
