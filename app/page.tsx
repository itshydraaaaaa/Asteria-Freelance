import { HeroSection }        from '@/components/sections/HeroSection'
import { HowItWorksSection }  from '@/components/sections/HowItWorksSection'
import { FeaturedGigsSection} from '@/components/sections/FeaturedGigsSection'
import { CategoriesSection }  from '@/components/sections/CategoriesSection'
import { db }                 from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let gigs: any[] = []
  try {
    gigs = await db.gig.findMany()
  } catch {}

  const categoryCounts: Record<string, number> = {}
  for (const g of gigs) {
    if (g.category) {
      const cat = g.category.trim()
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
  }

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturedGigsSection />
      <CategoriesSection categoryCounts={categoryCounts} />
    </>
  )
}
