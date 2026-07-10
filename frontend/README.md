# NIRIKSHA Inspection Workflow - Frontend

Government inspection intelligence platform - Inspection Workflow & Data Collection Module frontend application.

## Overview

This is the React frontend for the NIRIKSHA Inspection Workflow & Data Collection Module. It provides a modern, responsive interface for government inspectors to manage inspections, checklists, evidence, and offline synchronization.

## Features

- **Inspection Management**: Create, view, and manage inspections
- **Checklist Interface**: Interactive checklist responses with progress tracking
- **Evidence Collection**: Photo and document upload with preview
- **Offline Support**: First-class offline functionality with sync status
- **Real-time Updates**: Live compliance metrics and status updates
- **Responsive Design**: Mobile-first design for field inspections
- **Dark Mode**: Support for light and dark themes

## Technology Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: TailwindCSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   ├── inspection/     # Inspection-specific components
│   │   ├── checklist/      # Checklist components
│   │   ├── evidence/       # Evidence components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Inspections.jsx
│   │   ├── Checklist.jsx
│   │   ├── Evidence.jsx
│   │   └── Settings.jsx
│   ├── lib/                # Utility libraries
│   │   ├── api.js          # Axios client configuration
│   │   └── utils.js        # Utility functions
│   ├── hooks/              # Custom React hooks
│   │   ├── useInspection.js
│   │   ├── useChecklist.js
│   │   └── useEvidence.js
│   ├── services/           # API service functions
│   │   ├── inspection.js
│   │   ├── checklist.js
│   │   └── evidence.js
│   ├── store/              # Global state management
│   │   └── index.js
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Helper functions
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies
```

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pragati1466/Niriksha.git
   cd Niriksha/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## API Integration

The frontend connects to the NIRIKSHA backend API via the configured `VITE_API_URL`. The API client is configured in `src/lib/api.js` with:

- Automatic JWT token injection
- Request/response interceptors
- Error handling
- Automatic token refresh

## State Management

The application uses Zustand for global state management, accessible via the `useStore` hook:

```javascript
import useStore from '@/store'

function MyComponent() {
  const { user, setUser } = useStore()
  // ...
}
```

## Offline Support

The application supports offline functionality using:

- Service Workers for caching
- IndexedDB for local data storage
- Sync queue for offline changes
- Conflict resolution UI

## Styling

The application uses TailwindCSS for styling with a custom design system. Theme colors are defined in `src/index.css` using CSS custom properties.

## Component Library

The application uses a component library built on Radix UI primitives, located in `src/components/ui/`. These components follow the shadcn/ui pattern for consistency.

## Testing

Run tests using Vitest:
```bash
npm run test
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting via React.lazy()
- Image optimization
- Lazy loading of routes
- Memoization of expensive computations

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader support
- High contrast mode support

## License

Proprietary - All rights reserved.

## Support

For support, contact the NIRIKSHA development team.
