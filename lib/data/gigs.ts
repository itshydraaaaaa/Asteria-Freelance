export interface Gig {
  id: string
  title: string
  description: string
  category: string
  price: number
  deliveryDays: number
  freelancerId: string
  tags: string[]
  featured: boolean
  image?: string
}

export const gigs: Gig[] = [
  // ── Yassine Khelifi (f1) — Full-Stack & Web Engineering
  {
    id: 'g1',
    title: 'Build a production-ready Next.js 14 & Prisma SaaS Platform',
    description: 'Get a fully deployed SaaS app with auth, escrow billing, real-time dashboards, and API routes. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL. Tailored for scalable startups.',
    category: 'Web Development',
    price: 350,
    deliveryDays: 7,
    freelancerId: 'f1',
    tags: ['Next.js', 'SaaS', 'TypeScript', 'Prisma', 'PostgreSQL'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g4',
    title: 'Full-Stack E-Commerce Marketplace with Secure Payments',
    description: 'Custom e-commerce application with product catalog, cart checkout, multi-vendor support, and admin analytics dashboard.',
    category: 'Web Development',
    price: 450,
    deliveryDays: 10,
    freelancerId: 'f1',
    tags: ['Next.js', 'E-Commerce', 'Stripe', 'Node.js'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g6',
    title: 'Production REST & GraphQL API Architecture with PostgreSQL',
    description: 'Secure, high-throughput backend APIs with JWT auth, role-based permissions, rate limiting, and automated Swagger API documentation.',
    category: 'Web Development',
    price: 220,
    deliveryDays: 5,
    freelancerId: 'f1',
    tags: ['Node.js', 'API', 'PostgreSQL', 'Docker'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },

  // ── Leila Ben Ali (f2) — UI/UX Design & Brand Systems
  {
    id: 'g2',
    title: 'Complete Mobile App UI/UX Design & Design System in Figma',
    description: 'High-fidelity 20+ screen mobile app design in Figma with interactive prototyping, micro-interactions, and a complete design tokens component library.',
    category: 'Design',
    price: 280,
    deliveryDays: 6,
    freelancerId: 'f2',
    tags: ['Figma', 'UI/UX', 'Mobile Design', 'Design Systems'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g5',
    title: 'Complete Startup Brand Identity & Logo System',
    description: 'Full brand identity including logo marks, typography scales, color harmony palette, icon sets, and brand guidelines manual in SVG, PDF, and AI formats.',
    category: 'Design',
    price: 190,
    deliveryDays: 4,
    freelancerId: 'f2',
    tags: ['Branding', 'Logo', 'Figma', 'Identity'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g7',
    title: 'Fintech & SaaS Dashboard UI Kit with Auto-Layout Components',
    description: 'Modern, pixel-perfect analytics web dashboard designed in Figma. Features dark & light mode tokens, responsive grids, and design-to-code handoff specs.',
    category: 'Design',
    price: 310,
    deliveryDays: 5,
    freelancerId: 'f2',
    tags: ['Dashboard', 'Figma', 'UI Kit', 'SaaS'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  },

  // ── Karim Ben Ammar (f3) — AI, NLP & Data Science
  {
    id: 'g3',
    title: 'Custom Machine Learning Model & Prediction Pipeline',
    description: 'End-to-end ML pipeline: data preprocessing, feature engineering, XGBoost/PyTorch training, model evaluation, and REST API deployment containerized in Docker.',
    category: 'Data Science',
    price: 490,
    deliveryDays: 9,
    freelancerId: 'f3',
    tags: ['Python', 'Machine Learning', 'PyTorch', 'FastAPI'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g8',
    title: 'NLP Sentiment Analysis & Multilingual Text Classification API',
    description: 'Production-grade sentiment analysis and text classification engine trained on Arabic, French, and English data with fast inference and batch evaluation.',
    category: 'Data Science',
    price: 360,
    deliveryDays: 6,
    freelancerId: 'f3',
    tags: ['NLP', 'Transformers', 'Python', 'FastAPI'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'g9',
    title: 'Automated Python Web Scraping & Data Extraction Pipeline',
    description: 'Robust, headless data scraping pipelines with anti-bot bypass, automated data cleaning, and direct SQL/CSV pipeline storage with scheduled daily runs.',
    category: 'Data Science',
    price: 180,
    deliveryDays: 3,
    freelancerId: 'f3',
    tags: ['Python', 'Scrapy', 'BeautifulSoup', 'Automation'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
  },
]
