# NIRIKSHA Frontend

Next.js 15 frontend for the NIRIKSHA inspection intelligence platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── dashboards/        # Role-specific dashboards
│   │   ├── inspector/     # Inspector dashboard
│   │   ├── supervisor/    # Supervisor dashboard
│   │   └── admin/         # Admin dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects by role)
├── components/
│   ├── shared/            # Shared components
│   │   ├── header.tsx     # Application header
│   │   └── theme-provider.tsx  # Dark mode provider
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── textarea.tsx
│       ├── avatar.tsx
│       ├── dropdown-menu.tsx
│       └── dialog.tsx
├── contexts/
│   └── auth-context.tsx   # Authentication context
├── lib/
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript type definitions
```

## Features

### Authentication
- Login page with email/password
- Signup page with role selection
- JWT token storage in localStorage
- Role-based redirects

### Dashboards

#### Inspector Dashboard
- View assigned inspections
- Complete checklists
- Upload evidence images
- Submit for AI verification
- View completed inspections

#### Supervisor Dashboard
- Review pending inspections
- Approve/reject inspections
- View flagged items (AI-detected inconsistencies)
- Monitor inspector trust scores
- View analytics and trends

#### Admin Dashboard
- Manage users (create, view)
- Manage departments
- Manage inspection templates
- System settings

### UI Components
Built with shadcn/ui and Radix UI primitives for a modern, accessible interface.

### Dark Mode
Full dark mode support using next-themes.

## Styling

The application uses TailwindCSS for styling with custom theme configuration in `tailwind.config.js`.

## State Management

React Context API is used for:
- Authentication state (AuthContext)
- Theme state (ThemeProvider via next-themes)

## API Integration

All API calls use the `NEXT_PUBLIC_API_URL` environment variable. Authentication tokens are stored in localStorage and included in request headers.

## Type Safety

TypeScript is used throughout the application. Type definitions are in `src/types/index.ts` and mirror the Prisma schema.

## Responsive Design

For optimal user experience on desktop, tablet, and mobile devices.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.

