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
}

export const freelancers: FreelancerProfile[] = [
  { id: 'f1',  name: 'Layla Hassan',     initials: 'LH', skills: ['React','TypeScript','Node.js'],    rating: 4.9, reviewCount: 142, startingPrice: 80,  deliveryDays: 3, bio: 'Full-stack engineer specialized in modern web apps.', badge: 'top',      category: 'Web Development' },
  { id: 'f2',  name: 'Omar Nasser',      initials: 'ON', skills: ['Figma','UI/UX','Branding'],        rating: 4.8, reviewCount: 98,  startingPrice: 60,  deliveryDays: 2, bio: 'Creative designer with a focus on clean interfaces.',   badge: 'top',      category: 'Design' },
  { id: 'f3',  name: 'Sara El-Masri',    initials: 'SE', skills: ['Python','ML','TensorFlow'],        rating: 4.9, reviewCount: 76,  startingPrice: 120, deliveryDays: 5, bio: 'Data scientist building intelligent solutions.',         badge: 'verified', category: 'Data Science' },
  { id: 'f4',  name: 'Karim Youssef',    initials: 'KY', skills: ['SEO','Content','Analytics'],      rating: 4.7, reviewCount: 55,  startingPrice: 40,  deliveryDays: 2, bio: 'Digital marketer driving organic growth.',              badge: 'rising',   category: 'Marketing' },
  { id: 'f5',  name: 'Nadia Khalil',     initials: 'NK', skills: ['Flutter','React Native','iOS'],   rating: 4.8, reviewCount: 88,  startingPrice: 90,  deliveryDays: 7, bio: 'Mobile developer shipping polished apps.',              badge: 'top',      category: 'Mobile' },
  { id: 'f6',  name: 'Ahmed Farouk',     initials: 'AF', skills: ['Vue.js','Laravel','MySQL'],       rating: 4.6, reviewCount: 43,  startingPrice: 55,  deliveryDays: 4, bio: 'Backend specialist building robust APIs.',              badge: 'verified', category: 'Web Development' },
  { id: 'f7',  name: 'Yasmine Saleh',    initials: 'YS', skills: ['Illustrator','Logo','Print'],     rating: 4.9, reviewCount: 120, startingPrice: 45,  deliveryDays: 2, bio: 'Brand identity designer with global clients.',          badge: 'top',      category: 'Design' },
  { id: 'f8',  name: 'Hassan Mahmoud',   initials: 'HM', skills: ['Power BI','SQL','Excel'],        rating: 4.7, reviewCount: 62,  startingPrice: 70,  deliveryDays: 3, bio: 'Business intelligence expert turning data into insight.', badge: 'rising',   category: 'Data Science' },
  { id: 'f9',  name: 'Rania Ibrahim',    initials: 'RI', skills: ['Copywriting','Email','PPC'],      rating: 4.8, reviewCount: 91,  startingPrice: 35,  deliveryDays: 1, bio: 'Growth marketer with proven conversion strategies.',    badge: 'verified', category: 'Marketing' },
  { id: 'f10', name: 'Tariq Al-Amin',    initials: 'TA', skills: ['Swift','Kotlin','Firebase'],      rating: 4.7, reviewCount: 38,  startingPrice: 95,  deliveryDays: 5, bio: 'Native app developer for iOS and Android.',            badge: 'rising',   category: 'Mobile' },
  { id: 'f11', name: 'Mariam Zaki',      initials: 'MZ', skills: ['Next.js','Tailwind','Prisma'],    rating: 4.9, reviewCount: 107, startingPrice: 85,  deliveryDays: 3, bio: 'Modern web architect passionate about performance.',    badge: 'top',      category: 'Web Development' },
  { id: 'f12', name: 'Sami El-Rashid',   initials: 'SR', skills: ['Motion','After Effects','3D'],   rating: 4.8, reviewCount: 74,  startingPrice: 65,  deliveryDays: 4, bio: 'Motion designer creating cinematic brand experiences.',  badge: 'top',      category: 'Design' },
  { id: 'f13', name: 'Fatima Al-Zahra',  initials: 'FZ', skills: ['NLP','Computer Vision','PyTorch'],rating: 5.0, reviewCount: 29,  startingPrice: 150, deliveryDays: 7, bio: 'AI researcher solving real-world problems.',            badge: 'rising',   category: 'Data Science' },
  { id: 'f14', name: 'Bilal Qasim',      initials: 'BQ', skills: ['TikTok','Instagram','Strategy'],  rating: 4.6, reviewCount: 48,  startingPrice: 30,  deliveryDays: 1, bio: 'Social media specialist for MENA brands.',              badge: 'verified', category: 'Marketing' },
  { id: 'f15', name: 'Aya Mostafa',      initials: 'AM', skills: ['React Native','Expo','GraphQL'],  rating: 4.8, reviewCount: 65,  startingPrice: 80,  deliveryDays: 5, bio: 'Cross-platform developer focused on UX.',               badge: 'top',      category: 'Mobile' },
  { id: 'f16', name: 'Ziad El-Sayed',    initials: 'ZS', skills: ['Django','PostgreSQL','Docker'],   rating: 4.7, reviewCount: 83,  startingPrice: 70,  deliveryDays: 4, bio: 'Backend dev building scalable microservices.',          badge: 'verified', category: 'Web Development' },
  { id: 'f17', name: 'Hana Bouazza',     initials: 'HB', skills: ['Brand','Strategy','Naming'],      rating: 4.9, reviewCount: 56,  startingPrice: 100, deliveryDays: 3, bio: 'Brand strategist for MENA startups.',                   badge: 'rising',   category: 'Design' },
  { id: 'f18', name: 'Faris Al-Nasr',    initials: 'FN', skills: ['Spark','Hadoop','AWS'],           rating: 4.6, reviewCount: 33,  startingPrice: 110, deliveryDays: 5, bio: 'Data engineer building cloud pipelines.',               badge: 'verified', category: 'Data Science' },
  { id: 'f19', name: 'Lina Chaaban',     initials: 'LC', skills: ['Influencer','PR','Events'],       rating: 4.7, reviewCount: 41,  startingPrice: 50,  deliveryDays: 2, bio: 'PR specialist with a MENA media network.',             badge: 'rising',   category: 'Marketing' },
  { id: 'f20', name: 'Younes Benkaddour',initials: 'YB', skills: ['Unity','ARKit','Game Dev'],       rating: 4.8, reviewCount: 22,  startingPrice: 130, deliveryDays: 7, bio: 'Game & AR developer bringing ideas to life.',           badge: 'rising',   category: 'Mobile' },
]
