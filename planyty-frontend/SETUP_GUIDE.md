# Planyty Frontend - Complete Setup & Deployment Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Building for Production](#building-for-production)
7. [Deployment Options](#deployment-options)
8. [Troubleshooting](#troubleshooting)
9. [Architecture Overview](#architecture-overview)

---

## Quick Start

Get the Planyty frontend running in 5 minutes:

```bash
# Clone the repository
git clone https://github.com/yourusername/planyty-frontend.git
cd planyty-frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
echo "VITE_SOCKET_URL=http://localhost:3001" >> .env.local

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## System Requirements

Before installing Planyty Frontend, ensure your system meets these requirements:

| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 16.x | 18.x or higher |
| npm | 8.x | 9.x or higher |
| RAM | 2GB | 4GB or higher |
| Disk Space | 500MB | 1GB or higher |
| OS | Linux, macOS, Windows | Linux or macOS |

### Verify Installation

```bash
node --version    # Should be v16.0.0 or higher
npm --version     # Should be 8.0.0 or higher
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/planyty-frontend.git
cd planyty-frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- React 18 and React Router DOM
- Vite for fast development and building
- Tailwind CSS for styling
- Axios for API communication
- Socket.io Client for real-time features

### Step 3: Verify Installation

```bash
npm run build
```

If the build completes without errors, your installation is successful.

---

## Environment Configuration

### Create .env.local File

Create a `.env.local` file in the project root with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### Environment Variables Reference

| Variable | Purpose | Default | Required |
|---|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` | Yes |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - | No |
| `VITE_ANALYTICS_ENDPOINT` | Analytics service endpoint | - | No |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website ID | - | No |

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production domain
6. Copy the Client ID to `.env.local`

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

The server starts at `http://localhost:5173` with hot module replacement (HMR) enabled. Changes to your code are reflected instantly in the browser.

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── ProtectedRoute.jsx
│   ├── Loader.jsx
│   ├── tasks/           # Task-related components
│   │   ├── KanbanBoard.jsx
│   │   ├── TaskCard.jsx
│   │   └── TaskModal.jsx
│   └── ui/              # Basic UI components
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Modal.jsx
├── pages/               # Page components
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── Dashboard.jsx
│   ├── Tasks.jsx
│   ├── Chat.jsx
│   ├── Meetings.jsx
│   └── NotFound.jsx
├── contexts/            # React Context for state management
│   ├── AuthContext.jsx
│   ├── AppContext.jsx
│   └── SocketContext.jsx
├── hooks/               # Custom React hooks
│   ├── useAuth.js
│   ├── useWebSocket.js
│   └── useLocalStorage.js
├── services/            # API and service functions
│   ├── api.js
│   ├── authService.js
│   ├── workspaceService.js
│   ├── projectService.js
│   └── taskService.js
├── utils/               # Utility functions
│   ├── constants.js
│   ├── validators.js
│   └── helpers.js
├── App.jsx              # Main app component with routing
├── main.jsx             # React entry point
└── index.css            # Global styles with Tailwind
```

### Common Development Tasks

#### Add a New Page

1. Create component in `src/pages/MyPage.jsx`
2. Add route in `src/App.jsx`
3. Create corresponding service in `src/services/` if needed

#### Add a New Component

1. Create in `src/components/MyComponent.jsx`
2. Import and use in pages or other components
3. Keep components small and focused on a single responsibility

#### Add API Integration

1. Create service function in `src/services/myService.js`
2. Use the service in components via `useEffect` or event handlers
3. Handle loading and error states appropriately

#### Styling

Use Tailwind CSS utility classes. Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#FDF7E4',
      secondary: '#FAEED1',
      accent: '#DED0B6',
      dark: '#BBAB8C',
    },
  },
}
```

---

## Building for Production

### Create Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` directory:
- Minified JavaScript and CSS
- Tree-shaking to remove unused code
- Asset optimization and hashing for caching

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally at `http://localhost:4173` for testing before deployment.

### Build Output

```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── index-*.js       # Bundled JavaScript
│   └── index-*.css      # Bundled CSS
└── favicon.ico          # Favicon
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Beginners)

Vercel provides the easiest deployment experience with automatic deployments on every push.

**Steps:**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your Git repository
5. Vercel automatically detects the Vite project and configures the build settings.
6. Click "Deploy"

### Option 2: Netlify

Netlify is another excellent option for static site deployment.

**Steps:**

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" -> "Import an existing project"
4. Select your Git repository
5. **Build command:** `npm run build`
6. **Publish directory:** `dist`
7. Click "Deploy site"

### Option 3: Static Hosting (e.g., AWS S3, GitHub Pages)

For manual deployment to a static host:

1. Run the production build: `npm run build`
2. Upload the contents of the `dist/` folder to your hosting service.

---

## Troubleshooting

| Issue | Possible Cause | Solution |
|---|---|---|
| `npm install` fails | Node.js version mismatch | Ensure Node.js is 16.x or higher. Use `nvm` to manage versions. |
| API calls fail (CORS) | Backend not running or misconfigured | Ensure the backend server is running and accessible at `VITE_API_URL`. Check backend CORS settings. |
| Blank screen on load | Routing issue or missing assets | Check the browser console for errors. Ensure all assets are correctly referenced. |
| Styling issues | Tailwind not compiling | Ensure `index.css` is imported in `main.jsx` and `tailwind.config.js` is correctly configured. |

---

## Architecture Overview

The Planyty Frontend is a modern single-page application (SPA) built with the following stack:

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State Management:** React Context (for global state) and local component state
- **API Communication:** Axios (for REST) and Socket.io Client (for real-time)

The application follows a **Component-Based Architecture**, promoting reusability and maintainability.

### Data Flow

1. **User Action:** User interacts with a component (e.g., clicks a button).
2. **Component Logic:** The component calls a function from a service layer (e.g., `authService.login()`).
3. **Service Layer:** The service function uses Axios to make an API request to the backend.
4. **Backend Response:** The backend processes the request and sends a response.
5. **State Update:** The service layer updates the application state via a React Context (e.g., `AuthContext`).
6. **UI Re-render:** Components subscribed to the updated context automatically re-render to reflect the new state.

### Real-time Communication

Socket.io is used for features requiring real-time updates (e.g., chat, task assignment notifications).

1. **Connection:** `SocketContext` establishes a connection to the `VITE_SOCKET_URL`.
2. **Events:** Components listen for specific events (e.g., `task:updated`) and emit events (e.g., `chat:message`).
3. **State:** Real-time data is integrated into the application state, triggering UI updates.

---

**End of Document**
