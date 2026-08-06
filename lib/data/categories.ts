export interface Category {
  name: string
  slug: string
  count: number
  color: 'ast-primary' | 'ast-light' | 'ast-sky' | 'black'
}

export const categories: Category[] = [
  { name: 'Web Development', slug: 'web-development', count: 840, color: 'ast-primary' },
  { name: 'Design',          slug: 'design',          count: 620, color: 'ast-light'   },
  { name: 'Data Science',    slug: 'data-science',    count: 310, color: 'ast-sky'     },
  { name: 'Marketing',       slug: 'marketing',       count: 480, color: 'black'       },
  { name: 'Mobile',          slug: 'mobile',          count: 270, color: 'ast-primary' },
  { name: 'Writing',         slug: 'writing',         count: 390, color: 'ast-light'   },
  { name: 'Video & Audio',   slug: 'video-audio',     count: 215, color: 'ast-sky'     },
  { name: 'Business',        slug: 'business',        count: 180, color: 'black'       },
]
