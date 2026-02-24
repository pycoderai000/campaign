# Campaign Management System

A comprehensive Next.js application for managing brands, campaigns, and deliverables with admin and brand user dashboards.

## Features

### Admin Dashboard
- **Brand Management**: Create and manage brands
- **Campaign Management**: Create campaigns for brands with different types (LinkedIn, Instagram, YouTube, TikTok)
- **Deliverable Management**: Create deliverables with file uploads, captions, posting dates, and status tracking
- **Metrics Dashboard**: View campaign-level metrics with interactive graphs (updates every 3 days)
- **Excel-like Table View**: View all deliverables in a comprehensive table format

### Brand Dashboard
- **Campaign View**: View all campaigns under the brand
- **Deliverable Management**: 
  - View deliverables with files, captions, and posting dates
  - Change deliverable status
  - Add comments
  - Approve content
  - Edit deliverables (including adding live links)
- **Post-level Stats**: View individual post metrics (impressions, reach, likes, comments, engagement)
- **Campaign-level Stats**: View aggregated campaign metrics with graphs

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local, or [Neon](https://neon.tech) / [Supabase](https://supabase.com) / [Vercel Postgres](https://vercel.com/storage/postgres))
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables and set your database and auth secrets:
```bash
cp .env.example .env.local
```
Edit `.env.local` and set:
- `DATABASE_URL` – PostgreSQL connection string
- `NEXTAUTH_SECRET` – e.g. `openssl rand -base64 32`
- `NEXTAUTH_URL` – e.g. `http://localhost:3000` (or your production URL)

3. Run database migrations (create tables):
```bash
npm run db:push
```
Or generate and run migrations: `npm run db:generate` then `npm run db:migrate`.

4. Create the first user (admin). Either register via API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword","role":"admin"}'
```
The first user is always created as admin. Subsequent registrations require a valid role and, for brand users, a `brandId`.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000), go to **Login**, and sign in with the credentials you registered.

## Project Structure

```
├── app/
│   ├── admin/
│   │   └── dashboard/     # Admin dashboard
│   ├── brand/
│   │   └── dashboard/     # Brand dashboard
│   ├── login/             # Login page (Admin/Brand)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirects to login)
├── components/
│   ├── CampaignMetrics.tsx      # Campaign-level metrics with graphs
│   ├── CreateBrandForm.tsx      # Form to create brands
│   ├── CreateCampaignForm.tsx  # Form to create campaigns
│   ├── CreateDeliverableForm.tsx # Form to create deliverables
│   ├── DeliverablesTable.tsx   # Excel-like table for deliverables
│   ├── EditDeliverableForm.tsx # Form to edit deliverables
│   ├── MetricsChart.tsx        # Reusable chart component
│   ├── Modal.tsx               # Modal component
│   ├── PostMetrics.tsx         # Post-level metrics
│   └── Sidebar.tsx             # Navigation sidebar
├── types/
│   └── index.ts                # TypeScript type definitions
└── package.json
```

## Key Features Implementation

### Authentication
- **NextAuth.js** with Credentials provider; JWT session with `role` (admin | brand) and optional `brandId`.
- Login page: sign in with email/password; redirect to Admin or Brand dashboard based on user role.
- Middleware protects `/admin/*` (admin only) and `/brand/*` (brand only). Register at `POST /api/auth/register`.

### Backend & Data
- **PostgreSQL** + **Drizzle ORM** for brands, campaigns, deliverables, comments, notifications, file references.
- **REST API** under `/api`: brands, campaigns, deliverables (with comments), notifications, file upload.
- **File upload**: `POST /api/upload` stores files under `./uploads` and returns URLs; served at `/api/files/[...path]`.
- Admin and Brand dashboards load and mutate data via these APIs.

### Metrics & Analytics
- **Post-level metrics**: Impressions, Reach, Likes, Comments, Engagement
- **Campaign-level metrics**: Aggregated metrics from all posts in a campaign
- **Graphs**: Interactive line charts showing metrics over time (updates every 3 days)
- X-axis: Date
- Y-axis: Selected metric (Impressions, Reach, or Engagement)

### File Upload
- Supports single images, multiple images (carousel), and videos
- File validation based on post type

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com):

1. **Push your code to GitHub**
2. **Import your repository to Vercel**
3. **Deploy** - Vercel will automatically detect Next.js and configure everything

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Your app will be live at `https://your-project.vercel.app`

## Next Steps

1. **File Storage (production)**: Replace local `./uploads` with Vercel Blob or S3 and set env vars (see `docs/BACKEND_PLAN.md`).
2. **Real-time Updates**: Optional WebSocket or polling for notifications.
3. **Export**: Add Excel/CSV export for deliverables table.
4. **Deploy to Production**: Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in your host (e.g. Vercel) and run migrations.

## Technologies Used

- **Next.js 14** – React framework with App Router
- **TypeScript** – Type safety
- **Tailwind CSS** – Styling
- **Recharts** – Chart library for metrics visualization
- **React Hook Form** – Form handling
- **NextAuth.js** – Authentication (Credentials + JWT)
- **PostgreSQL** – Database
- **Drizzle ORM** – Type-safe DB access and migrations
- **Zod** – Request validation
- **bcryptjs** – Password hashing

## License

MIT

