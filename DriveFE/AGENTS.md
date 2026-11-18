# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

All commands should be run from `save_file_drive/`.

```
npm run dev       # Start Vite dev server (HMR enabled)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There are no tests configured in this project.

## Environment

The backend URL is configured via `.env`:

```
VITE_API_URL=http://192.168.1.50:8081
```

All API calls use `import.meta.env.VITE_API_URL` — update this when the backend address changes.

## Architecture

**Koderz Drive** is a React 19 + Vite SPA — a Google Drive-style file manager with a Spring Boot backend (separate repo/server).

### Layout & Routing (`src/App.jsx`)

The app uses React Router v7 with two layers:
- Public routes: `/` (LoginPage), `/register` (Register)
- Protected routes (wrapped by `PrivateRoutes`): everything else renders with a persistent `<TopNavbar>` + `<SideBar>` shell, and a `<div class="main-content">` area for page content

`PrivateRoutes` simply checks for a JWT `token` in `localStorage`; no token = redirect to `/`.

### Auth & Session (`src/components/Auth/`)

- Login POSTs to `VITE_API_URL/login`, receives `{ accessToken, refreshToken, user }` and stores them in `localStorage`
- Role is extracted from three places in priority order: `response.data.user.role`, `response.data.role`, and JWT payload (`role` / `roles` / `authorities`). Stored as `localStorage.userRole`
- Registration hardcodes `roles: "ROLE_USER"` — new users cannot self-register as admins
- Logout (in `UserMenu`) clears all four localStorage keys: `token`, `refreshToken`, `user`, `userRole`

### Navigation Shell

- **`SideBar`** (`src/components/SideBar/SideBar.jsx`): Always-visible left sidebar with logo, "New" button (navigates to `/home?modal=new`), and nav links. The "Dashboard" link is conditionally shown only when `userRole` includes `ADMIN`/`ROLE_ADMIN`/`admin`.
- **`TopNavbar`** (`src/components/TopNavbar/`): Contains `SearchFiles` (navigates to `/myfiles?search=<query>` on Enter) and `UserMenu` (avatar dropdown with sign-out).

### Pages (`src/components/Dashboard/`)

- **`HomePage`** (`/home`): Shows all files (root-level only — filters out items with `folderId`/`parentFolder`) and all folders in a grid. Right-click opens a `ContextMenu`; double-click on a folder navigates to `/myfiles?folderId=...`. Supports rename and delete with ownership checks.
- **`MyFiles`** (`/myfiles`): User's own files. Reads query params: `folderId` (folder contents), `folderName` (display), `search` (search results). Uses different API endpoints depending on context: `/files/my`, `/files?folderId=...` (with fallback to `/files/folder/:id`), or `/files/search?query=...`.
- **`UploadPage`** (`/upload`): Simple upload-only page; POSTs `multipart/form-data` to `VITE_API_URL/upload`.
- **`AdminDashboard`** (`/dashboard`): Admin-only. Fetches file activity log from `/activities` and delete history from `/deleteActivity`. Handles Spring `LocalDateTime` array format (`[year, month, day, hour, minute, second]`) for date display.

### NewModal (`src/components/SideBar/NewModal.jsx`)

Reusable modal with two modes:
1. **Folder mode** (default): Creates a folder via `POST /folders` (fallback `POST /folder/create?folderName=...`), then optionally uploads files to it
2. **Upload mode**: Uploads files directly to `POST /upload` (or `POST /upload?folderId=...` when `uploadFolderId` prop is set)

Used in both `HomePage` (triggered by `?modal=new` URL param) and `MyFiles` (for folder uploads).

### API Conventions

All authenticated requests send `Authorization: Bearer <token>` from `localStorage.getItem("token")`.

The backend API field names are not fully consistent — components defensively check multiple property aliases (e.g., file ID is `f.id || f._id || f.key`, file name is `f.fileName || f.name || f.filename || f.originalname`). When adding new API integrations, follow this pattern.

### Theming & Styling

- Global CSS variables are defined in `src/theme/theme.css` (loaded first in `main.jsx`). All colors use `--color-*` variables — reference `src/theme/THEME_COLORS.md` for the full palette (cream/white base with warm brown accents).
- Each component has a corresponding CSS file in `src/styles/`. There is no CSS module scoping — class names are global.
- `src/styles/animations.css` is imported globally in `App.jsx` for shared animation keyframes.
