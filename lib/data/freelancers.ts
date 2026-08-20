export type Badge = 'top' | 'rising' | 'verified'

export interface FreelancerProfile {
  id: string
  name: string
  initials: string
  skills: string[]
  rating: number
  reviewCount: number
  startingPrice: number
  deliveryDays: number
  bio: string
  badge: Badge
  category: string
  image?: string
}

export const freelancers: FreelancerProfile[] = [
  {
    id: 'f1',
    name: 'Yassine Khelifi',
    initials: 'YK',
    skills: ['Next.js', 'TypeScript', 'Python', 'OpenAI', 'PostgreSQL'],
    rating: 4.9,
    reviewCount: 28,
    startingPrice: 150,
    deliveryDays: 5,
    bio: 'Senior Full-Stack & AI Engineer with 7+ years architecting web platforms, SaaS apps, and escrow payment systems in Tunisia and MENA.',
    badge: 'top',
    category: 'Web Development',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'f2',
    name: 'Leila Ben Ali',
    initials: 'LB',
    skills: ['Figma', 'UI/UX', 'Mobile Design', 'Design Systems'],
    rating: 4.8,
    reviewCount: 19,
    startingPrice: 120,
    deliveryDays: 4,
    bio: 'UI/UX Designer specializing in mobile-first applications, design system tokens, and interactive Figma prototyping for fintech and tech startups.',
    badge: 'top',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'f3',
    name: 'Karim Ben Ammar',
    initials: 'KB',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
    rating: 4.9,
    reviewCount: 22,
    startingPrice: 180,
    deliveryDays: 6,
    bio: 'Machine Learning & NLP Specialist with expertise in predictive modeling, deep learning pipelines, and containerized FastAPI model deployments.',
    badge: 'verified',
    category: 'Data Science',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
]
