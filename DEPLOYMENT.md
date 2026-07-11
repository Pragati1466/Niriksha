# NIRIKSHA Deployment Guide

This guide will help you deploy the NIRIKSHA AI inspection platform to make it accessible as a live website.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended for Frontend) + Railway (Backend)

**Frontend (Vercel):**
1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repository: `Pragati1466/Niriksha`
3. Set root directory to: `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (from Railway)
5. Click Deploy

**Backend (Railway):**
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `Pragati1466/Niriksha`
4. Set root directory to: `backend`
5. Add environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (Railway provides this)
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `JWT_SECRET`: Generate a random secret
   - `WATSONX_API_KEY`: Your IBM Watsonx API key (optional)
   - `PORT`: 3001
6. Click Deploy

### Option 2: Render (Full Stack)

**Backend (Render):**
1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Set root directory: `backend`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Add environment variables (same as above)
8. Click Deploy

**Frontend (Render):**
1. Create another web service
2. Set root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add `NEXT_PUBLIC_API_URL` environment variable
6. Click Deploy

### Option 3: GitHub Pages (Frontend Only - Limited)

1. Create `frontend/.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      - name: Build
        working-directory: ./frontend
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/out
```

2. Update `frontend/next.config.js`:
```javascript
module.exports = {
  output: 'export',
  images: { unoptimized: true }
}
```

3. Push to GitHub and it will auto-deploy to GitHub Pages

## 📋 Required Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:port/database
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=7d
WATSONX_API_KEY=your_watsonx_api_key (optional)
WATSONX_PROJECT_ID=your_project_id (optional)
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## 🐳 Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

## 🔧 Pre-Deployment Checklist

- [ ] Update all API keys in environment variables
- [ ] Set up PostgreSQL database
- [ ] Run database migrations: `npx prisma db push`
- [ ] Test all API endpoints locally
- [ ] Update CORS settings in backend for production domain
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure proper error handling
- [ ] Test authentication flow
- [ ] Verify AI services are working

## 🌐 Getting Your Live URLs

After deployment:

1. **Vercel**: `https://your-project.vercel.app`
2. **Railway**: `https://your-app.railway.app`
3. **Render**: `https://your-app.onrender.com`
4. **GitHub Pages**: `https://username.github.io/Niriksha`

## 🔗 Connecting Frontend to Backend

Update `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then rebuild and redeploy the frontend.

## 📝 Important Notes

- **Free tiers** have limitations (sleep time, bandwidth, etc.)
- **Database**: Use managed PostgreSQL (Railway, Render, Supabase)
- **API Keys**: Never commit them to GitHub
- **HTTPS**: Required for production deployments
- **Monitoring**: Set up logging and error tracking

## 🆘 Troubleshooting

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check environment variables

**API errors:**
- Verify backend is running
- Check CORS settings
- Ensure API keys are valid

**Database connection:**
- Verify DATABASE_URL is correct
- Check database is accessible
- Run migrations if needed

## 📞 Support

For issues:
- Check deployment platform logs
- Review GitHub Actions logs
- Test locally first
- Check environment variables

---

**Recommended**: Use Vercel for frontend + Railway for backend for the best free tier experience.
