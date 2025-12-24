# Planyty Frontend

This is the frontend application for Planyty, a modern project management and collaboration tool.

## Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State Management:** React Context
- **API Communication:** Axios (for REST) and Socket.io Client (for real-time)

### Quick Start

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/yourusername/planyty-frontend.git
    cd planyty-frontend
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Create environment file** (`.env.local`):
    \`\`\`env
    VITE_API_URL=http://localhost:3001/api
    VITE_SOCKET_URL=http://localhost:3001
    \`\`\`

4.  **Start development server:**
    \`\`\`bash
    npm run dev
    \`\`\`

The application will be available at \`http://localhost:5173\`.

## Project Structure

\`\`\`
planyty-frontend/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── tasks/           # Task-specific components
│   │   └── ui/              # Basic UI components (Button, Input, Modal)
│   ├── contexts/            # React Context for state management
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components (Dashboard, Tasks, Chat, etc.)
│   ├── services/            # API and service functions
│   ├── utils/               # Utility functions and constants
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with Tailwind
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js

\`\`\`

## License

This project is licensed under the MIT License.
\`\`\`
