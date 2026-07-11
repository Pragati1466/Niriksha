# NIRIKSHA - AI-Powered Inspection Intelligence Platform

NIRIKSHA is a production-ready web application for government and institutional inspections, featuring AI-powered reality verification using Gemini 2.5 Flash and LangGraph.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **AI Integration**: 
  - Google Gemini 2.5 Flash (@google/generative-ai)
  - LangGraph for reality verification

## Features

### Role-Based Access Control
- **Inspector**: Conduct inspections, upload evidence, complete checklists
- **Supervisor**: Review inspections, manage inspector trust scores, view analytics
- **Admin**: Manage users, departments, templates, and system settings

### Key Capabilities
- Multi-step inspection workflow with AI verification
- Image upload and AI-powered evidence analysis
- Checklist completion with compliance tracking
- Violation reporting and severity classification
- PDF report generation
- Real-time dashboard analytics
- Inspector trust score tracking
- Dark mode support

## Project Structure

```
niriksha/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   │   ├── auth/        # Authentication pages
│   │   │   ├── dashboards/  # Role-specific dashboards
│   │   │   ├── globals.css  # Global styles
│   │   │   ├── layout.tsx   # Root layout
│   │   │   └── page.tsx     # Home page
│   │   ├── components/
│   │   │   ├── shared/      # Shared components (Header, ThemeProvider)
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts (AuthContext)
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── .env.local
│
└── backend/                  # Express backend application
    ├── src/
    │   ├── controllers/     # Route controllers
    │   ├── middleware/      # Custom middleware (auth)
    │   ├── routes/          # API routes
    │   ├── utils/           # Utilities (Prisma client)
    │   └── index.ts         # Server entry point
    ├── prisma/
    │   └── schema.prisma    # Database schema
    ├── uploads/             # Uploaded files
    ├── package.json
    ├── tsconfig.json
    └── .env
```

## Database Schema

The application uses PostgreSQL with the following main entities:
- **User**: System users with roles (Inspector, Supervisor, Admin)
- **Department**: Organizational departments
- **Site**: Inspection locations
- **InspectionTemplate**: Checklist templates for inspections
- **Inspection**: Individual inspection records
- **InspectionImage**: Evidence images uploaded during inspections
- **InspectionChecklist**: Checklist item completion status
- **Violation**: Recorded violations with severity
- **Report**: Generated inspection reports
- **Review**: Supervisor reviews of inspections
- **TrustScore**: Inspector performance metrics

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/niriksha"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
PORT=5000
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Inspections
- `GET /api/inspections` - Get all inspections (filtered by role)
- `GET /api/inspections/:id` - Get inspection details
- `POST /api/inspections` - Create new inspection (Admin/Supervisor)
- `PUT /api/inspections/:id` - Update inspection
- `POST /api/inspections/:id/images` - Upload inspection image
- `PUT /api/inspections/:id/checklist` - Update checklist
- `POST /api/inspections/:id/violations` - Create violation

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user details

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department (Admin)

### Sites
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create site (Admin)

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template (Admin)

### Reports
- `GET /api/reports/:inspectionId` - Get inspection report
- `POST /api/reports/:inspectionId` - Generate PDF report

### AI
- `POST /api/ai/verify-reality` - AI verification of checklist vs images
- `POST /api/ai/analyze-image` - Analyze single image

## Usage

1. **Register**: Create an account via the signup page
2. **Login**: Authenticate with your credentials
3. **Navigate**: Based on your role, you'll be redirected to the appropriate dashboard
4. **Inspect** (Inspector): 
   - View assigned inspections
   - Complete checklists
   - Upload evidence images
   - Submit for AI verification
5. **Review** (Supervisor):
   - Review submitted inspections
   - Approve or reject inspections
   - Monitor inspector performance
6. **Manage** (Admin):
   - Create and manage users
   - Manage departments and sites
   - Configure inspection templates
   - System settings

## AI Verification

The application uses Gemini 2.5 Flash for AI-powered reality verification:
- Analyzes uploaded images against checklist claims
- Detects inconsistencies between reported status and visual evidence
- Provides confidence scores and flags suspicious items
- Helps supervisors identify potential fraud or errors

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## License

This project is proprietary and confidential.

## Support

For issues and questions, please contact the development team.
