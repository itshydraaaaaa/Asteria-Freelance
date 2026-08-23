export interface Category {
  name: string
  slug: string
  count?: number
  color: 'ast-primary' | 'ast-light' | 'ast-sky' | 'black'
}

export const categories: Category[] = [
  { name: 'Web Development', slug: 'web-development', color: 'ast-primary' },
  { name: 'Design',          slug: 'design',          color: 'ast-light'   },
  { name: 'Data Science',    slug: 'data-science',    color: 'ast-sky'     },
  { name: 'Marketing',       slug: 'marketing',       color: 'black'       },
  { name: 'Mobile',          slug: 'mobile',          color: 'ast-primary' },
  { name: 'Writing',         slug: 'writing',         color: 'ast-light'   },
  { name: 'Video & Audio',   slug: 'video-audio',     color: 'ast-sky'     },
  { name: 'Business',        slug: 'business',        color: 'black'       },
]
