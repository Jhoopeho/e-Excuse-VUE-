# Excuse — Student Absence Management System (Vue SPA)

A responsive Vue 3 single-page application inspired by the provided reference design.

## Features

- Student views: Dashboard, Submit Excuse, My Requests, Profile, and Settings; teacher view: Review Requests.
- Sign-in screen before entering the app, with a demo-only browser session.
- Student and teacher demo roles; teachers can review, approve, and reject requests.
- Vue Router navigation without full-page reloads.
- CRUD for absence requests:
  - **Create:** Submit a request.
  - **Read:** View request list, filter/search, and inspect details.
  - **Update:** Edit a request's reason, date, and details.
  - **Delete:** Delete a request after confirmation.
- Profile editing and basic form validation.
- Request status filters and dashboard summaries that react to request data.
- Settings for notification preferences and dark mode.
- `localStorage` persistence so request/profile/settings data remains after refresh in the same browser.
- Responsive layout for desktop, tablet, and mobile.

## Requirements

- Node.js 18+ recommended
- npm

## Run locally

Open a terminal in this project folder and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

To test a production build:

```bash
npm run build
npm run preview
```

## Notes about this student demo

- Data is stored in the current browser using `localStorage`; it is not shared between browsers/devices and there is no backend/database. Teacher review sees the requests stored in that same browser.
- File selection validates the filename/type and size. Supporting files are stored locally in the browser's IndexedDB so the teacher review page can preview images and open PDFs; no file bytes are uploaded to a server.
- Demo sign-in accepts any valid email address and non-empty password; select a role on the sign-in screen. It does not authenticate real accounts. Role access, requests, and decisions are browser-only and are not secure or shared across devices; production authentication and multi-user staff workflows require a backend.
- Demo seed requests use dates from the reference image. You can edit/delete them and add your own requests.

## GitHub submission

Create a repository on GitHub, then from this folder run:

```bash
git init
git add .
git commit -m "Build Excuse student absence management SPA"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the URL with your own repository URL. Do not publish credentials or tokens.
