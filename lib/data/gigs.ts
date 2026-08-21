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

export const gigs: Gig[] = []
