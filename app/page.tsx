import { HeroSection }        from '@/components/sections/HeroSection'
import { HowItWorksSection }  from '@/components/sections/HowItWorksSection'
import { StatsSection }       from '@/components/sections/StatsSection'
import { FeaturedGigsSection} from '@/components/sections/FeaturedGigsSection'
import { CategoriesSection }  from '@/components/sections/CategoriesSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <StatsSection />
      <FeaturedGigsSection />
      <CategoriesSection />
      <TestimonialsSection />
    </>
  )
}
