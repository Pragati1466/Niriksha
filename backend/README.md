# NIRIKSHA Backend API

Express.js backend for the NIRIKSHA inspection intelligence platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/niriksha"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
PORT=5000
```

3. Run database migrations:
```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma migrate dev` - Run database migrations

## API Documentation

### Authentication
- **POST** `/api/auth/signup` - Register new user
- **POST** `/api/auth/login` - Login user

### Inspections
- **GET** `/api/inspections` - List inspections (authenticated)
- **GET** `/api/inspections/:id` - Get inspection details
- **POST** `/api/inspections` - Create inspection (Admin/Supervisor only)
- **PUT** `/api/inspections/:id` - Update inspection
- **POST** `/api/inspections/:id/images` - Upload inspection image
- **PUT** `/api/inspections/:id/checklist` - Update checklist items
- **POST** `/api/inspections/:id/violations` - Record violation

### Users
- **GET** `/api/users` - List all users (Admin only)
- **GET** `/api/users/:id` - Get user details

### Departments
- **GET** `/api/departments` - List all departments
- **POST** `/api/departments` - Create department (Admin only)

### Sites
- **GET** `/api/sites` - List all sites
- **POST** `/api/sites` - Create site (Admin only)

### Templates
- **GET** `/api/templates` - List all templates
- **POST** `/api/templates` - Create template (Admin only)

### Reports
- **GET** `/api/reports/:inspectionId` - Get inspection report
- **POST** `/api/reports/:inspectionId` - Generate PDF report

### AI Services
- **POST** `/api/ai/verify-reality` - Verify checklist against images using Gemini
- **POST** `/api/ai/analyze-image` - Analyze single image

## Middleware

### Authentication
All protected routes require JWT authentication via the `authenticateToken` middleware.

### Role-Based Access
Some routes require specific roles via the `requireRole` middleware:
- `ADMIN` - Full system access
- `SUPERVISOR` - Review and manage inspections
- `INSPECTOR` - Conduct inspections

## Database

The application uses PostgreSQL with Prisma ORM. See `prisma/schema.prisma` for the complete database schema.

## File Uploads

Uploaded files are stored in the `uploads/` directory:
- Images: `uploads/images/`
- Reports: `uploads/reports/`

## AI Integration

The backend uses Google's Gemini 2.5 Flash for:
- Image analysis
- Reality verification (comparing checklist claims with visual evidence)
- Confidence scoring

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message"
}
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints
