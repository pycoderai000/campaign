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
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

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
- Login page with toggle between Admin and Brand login
- Currently uses mock authentication (ready for backend integration)

### Data Management
- All data is currently stored in component state (ready for API integration)
- Mock data provided for demonstration

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

1. **Backend Integration**: Connect to your API endpoints
2. **Authentication**: Implement proper authentication with JWT or session management
3. **File Storage**: Integrate with cloud storage (AWS S3, Cloudinary, etc.)
4. **Real-time Updates**: Add WebSocket support for real-time metric updates
5. **Export Functionality**: Add Excel/CSV export for deliverables table
6. **Notifications**: Add notification system for status changes and comments
7. **Deploy to Production**: Follow the deployment guide to go live

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Chart library for metrics visualization
- **React Hook Form** - Form handling (ready for integration)

## License

MIT

